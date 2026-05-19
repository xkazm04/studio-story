'use client';

/**
 * useAdvisorVoice --- Voice mode hook for the advisor.
 *
 * Bridges GeminiLiveClient (ephemeral token, AUDIO mode) with
 * AudioIOManager and the existing agentStore/workspaceStore.
 *
 * The connection lifecycle (state machine, token refresh, idle disconnect,
 * auto-reconnect, cleanup) is delegated to useConnectionLifecycle.
 * This hook adds Gemini-specific wiring: tool calls, audio I/O,
 * push-to-talk, and transcription bridging.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { GeminiLiveClient } from '@dzin/voice';
import { AudioIOManager } from '@dzin/voice';
import { useAgentStore } from './store/agentStore';
import { dispatchWorkspaceAction } from './dispatchWorkspaceAction';
import type { AgentSuggestion } from './types';
import { TOOL_NAMES } from './types';
import { useConnectionLifecycle } from '@/lib/useConnectionLifecycle';
import type { TokenData } from '@/lib/useConnectionLifecycle';
import { extractData } from '@/app/utils/api';

type VoiceName = 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' | 'Puck';

/** Idle disconnect timeout: 2 minutes of no recording activity */
export const IDLE_DISCONNECT_MS = 2 * 60 * 1000;

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Check if the user is currently typing in an input element.
 * Returns true if Space should be treated as normal text input.
 */
function isTypingInInput(e: KeyboardEvent): boolean {
  const target = e.target;
  if (!target || !(target instanceof HTMLElement)) return false;

  // Standard form elements
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;

  // Content-editable elements
  if (target.getAttribute('contenteditable') === 'true') return true;
  if (target.getAttribute('contenteditable') === '') return true;

  // Rich text editors (TipTap, Lexical, etc.)
  if (target.getAttribute('role') === 'textbox') return true;
  if (target.hasAttribute('data-lexical-editor')) return true;

  return false;
}

export interface UseAdvisorVoiceOptions {
  /** Callback when voice input is transcribed (bridge to useMultimodalInput) */
  onTranscription?: (text: string) => void;
}

export function useAdvisorVoice(options?: UseAdvisorVoiceOptions) {
  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const audioRef = useRef<AudioIOManager | null>(null);
  const audioUnsubRef = useRef<(() => void) | null>(null);

  // Push-to-talk state
  const [pushToTalkEnabled, setPushToTalkEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Puck');

  // Ref mirrors for use in callbacks (avoids stale closures)
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const addMessage = useAgentStore((s) => s.addMessage);
  const addSuggestion = useAgentStore((s) => s.addSuggestion);

  // Store onTranscription in a ref so it doesn't cause reconnections
  const onTranscriptionRef = useRef(options?.onTranscription);
  useEffect(() => {
    onTranscriptionRef.current = options?.onTranscription;
  }, [options?.onTranscription]);

  // ─── Tool Call Handler (shared with HTTP mode logic) ──

  const handleToolCalls = useCallback((calls: Array<{ id: string; name: string; args: Record<string, unknown> }>) => {
    const liveClient = liveClientRef.current;

    for (const call of calls) {
      switch (call.name) {
        case TOOL_NAMES.COMPOSE_WORKSPACE: {
          const { reasoning, ...workspacePayload } = call.args as {
            action: string;
            layout?: string;
            panels?: string | Array<{ type: string; role?: string; props?: Record<string, unknown> }>;
            reasoning?: string;
          };

          dispatchWorkspaceAction(workspacePayload);
          liveClient?.respondToToolCall(call.id, call.name, { success: true });

          if (reasoning) {
            addMessage({
              id: nextId('msg'),
              role: 'system',
              content: reasoning,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case TOOL_NAMES.SUGGEST_ACTION: {
          const { content, compose_on_accept } = call.args as {
            content: string;
            compose_on_accept?: string;
          };

          let composePayload: Record<string, unknown> | undefined;
          if (compose_on_accept) {
            try {
              composePayload = typeof compose_on_accept === 'string'
                ? JSON.parse(compose_on_accept)
                : compose_on_accept;
            } catch { /* ignore */ }
          }

          const suggestion: AgentSuggestion = {
            id: nextId('sug'),
            content,
            action: composePayload
              ? { type: TOOL_NAMES.COMPOSE_WORKSPACE, payload: composePayload }
              : undefined,
            timestamp: Date.now(),
            dismissed: false,
          };

          addSuggestion(suggestion);
          liveClient?.respondToToolCall(call.id, call.name, { success: true });
          break;
        }

        default:
          liveClient?.respondToToolCall(call.id, call.name, { error: `Unknown tool: ${call.name}` });
          break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMessage, addSuggestion]);

  // ─── Connection Lifecycle ─────────────────────────────

  const lifecycle = useConnectionLifecycle<GeminiLiveClient, VoiceName>({
    fetchToken: async (voice) => {
      const res = await fetch('/api/agents/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = extractData<{ token: string; voice: string; expiresIn?: number; expiresAt?: string }>(await res.json());
      const tokenData: TokenData = { token: data.token };
      if (data.expiresAt) {
        tokenData.expiresAt = new Date(data.expiresAt).getTime();
      } else if (data.expiresIn) {
        tokenData.expiresInMs = data.expiresIn * 1000;
      }
      return tokenData;
    },

    createClient: (voice) => {
      const client = new GeminiLiveClient();
      liveClientRef.current = client;

      client.onMessage((text) => {
        addMessage({
          id: nextId('msg'),
          role: 'agent',
          content: text,
          timestamp: Date.now(),
        });
      });

      client.onToolCall(handleToolCalls);

      client.onInputTranscription((text) => {
        onTranscriptionRef.current?.(text);
      });

      // Create audio manager alongside the client
      const audio = new AudioIOManager();
      audioRef.current = audio;

      client.onAudio((base64Pcm) => {
        audio.playAudioChunk(base64Pcm);
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 500);
      });

      return client;
    },

    connectClient: (client, token, voice) => {
      client.connect({ ephemeralToken: token, audioMode: true, voice });
    },

    destroyClient: (client) => {
      client.disconnect();
      liveClientRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      audioUnsubRef.current?.();
      audioUnsubRef.current = null;
      setIsSpeaking(false);
      setIsRecording(false);
    },

    subscribeToState: (client, handler) => {
      client.onStateChange(handler);
    },

    subscribeToReady: (client, handler) => {
      client.onSetupComplete(handler);
    },

    idleTimeoutMs: IDLE_DISCONNECT_MS,
    autoReconnect: true,
  });

  // ─── Connect Voice ─────────────────────────────

  const connectVoice = useCallback(async (voice?: VoiceName) => {
    if (lifecycle.connectionStateRef.current !== 'disconnected') return;

    const voiceToUse = voice ?? selectedVoice;
    if (voice) setSelectedVoice(voice);

    try {
      await lifecycle.connect(voiceToUse);

      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: `Voice mode connected (${voiceToUse}). Tap the mic or hold Space to talk.`,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[voice] Connection failed:', error);
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: `Voice connection failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        timestamp: Date.now(),
      });
    }
  }, [selectedVoice, addMessage, lifecycle]);

  // ─── Recording Toggle ─────────────────────────

  const startRecording = useCallback(async () => {
    // Clear idle timer when recording starts
    lifecycle.resetIdleTimer();

    // Auto-connect: if disconnected, connect first then record after setup
    if (lifecycle.connectionStateRef.current === 'disconnected') {
      lifecycle.onReadyRef.current = () => {
        const audio = audioRef.current;
        const client = liveClientRef.current;
        if (audio && client?.isConnected) {
          audio.startCapture().then(() => {
            audioUnsubRef.current = audio.onAudioChunk((base64Pcm) => {
              client.sendAudio(base64Pcm);
            });
            setIsRecording(true);
          }).catch(() => {
            // Mic access failed after auto-connect
          });
        }
      };
      connectVoice();
      return;
    }

    const audio = audioRef.current;
    const liveClient = liveClientRef.current;
    if (!audio || !liveClient?.isConnected || isRecording) return;

    try {
      await audio.startCapture();

      audioUnsubRef.current = audio.onAudioChunk((base64Pcm) => {
        liveClient.sendAudio(base64Pcm);
      });

      setIsRecording(true);
    } catch (error) {
      console.error('[voice] Mic access failed:', error);
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: 'Microphone access denied. Please allow microphone access.',
        timestamp: Date.now(),
      });
    }
  }, [isRecording, addMessage, connectVoice, lifecycle]);

  const stopRecording = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isRecording) return;

    audio.stopCapture();
    audioUnsubRef.current?.();
    audioUnsubRef.current = null;
    setIsRecording(false);

    // Start idle disconnect timer
    lifecycle.startIdleTimer();
  }, [isRecording, lifecycle]);

  // ─── Disconnect Voice ─────────────────────────

  const disconnectVoice = useCallback(() => {
    stopRecording();
    lifecycle.disconnect();
  }, [stopRecording, lifecycle]);

  // ─── Send Text (fallback while in voice mode) ─

  const sendText = useCallback((text: string) => {
    const liveClient = liveClientRef.current;
    if (!liveClient?.isConnected) return;

    addMessage({
      id: nextId('msg'),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    liveClient.send(text);
  }, [addMessage]);

  // ─── Push-to-talk Keyboard Handler ────────────

  useEffect(() => {
    if (!pushToTalkEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (e.repeat) return;
      if (isTypingInInput(e)) return;

      e.preventDefault();
      startRecording();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (isRecordingRef.current) {
        stopRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [pushToTalkEnabled, startRecording, stopRecording]);

  return {
    // State
    voiceConnectionState: lifecycle.connectionState,
    voiceConnectionPhase: lifecycle.connectionPhase,
    isRecording,
    isSpeaking,
    selectedVoice,
    pushToTalkEnabled,

    // Actions
    connectVoice,
    disconnectVoice,
    startRecording,
    stopRecording,
    sendText,
    setSelectedVoice,
    setPushToTalkEnabled,

    // Refs for external wiring
    liveClientRef,
    audioRef,
  };
}
