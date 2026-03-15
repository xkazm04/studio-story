'use client';

/**
 * useAdvisorVoice --- Voice mode hook for the advisor.
 *
 * Bridges GeminiLiveClient (ephemeral token, AUDIO mode) with
 * AudioIOManager and the existing agentStore/workspaceStore.
 *
 * Features:
 * - Auto-connect on first voice interaction (no separate activation step)
 * - Push-to-talk via Space key (when no text input is focused)
 * - Idle disconnect after 2 min silence (prevents WebSocket drain)
 * - onTranscription callback for wiring to useMultimodalInput
 *
 * Tool calls (compose_workspace, suggest_action) work the same
 * as in HTTP mode --- handled via useAdvisor's shared handlers.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { GeminiLiveClient } from './GeminiLiveClient';
import { AudioIOManager } from './AudioIOManager';
import { useAgentStore } from './store/agentStore';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import type { AgentSuggestion } from './types';

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
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioRef = useRef<AudioIOManager | null>(null);
  const audioUnsubRef = useRef<(() => void) | null>(null);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);

  // Auto-connect state
  const pendingRecordAfterConnectRef = useRef(false);

  // Idle disconnect timer
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push-to-talk state
  const [pushToTalkEnabled, setPushToTalkEnabled] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceConnectionState, setVoiceConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Puck');

  // Keep a ref to track isRecording for keyup handler (avoids stale closure)
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Keep a ref to voiceConnectionState for push-to-talk handler
  const voiceConnectionStateRef = useRef(voiceConnectionState);
  useEffect(() => {
    voiceConnectionStateRef.current = voiceConnectionState;
  }, [voiceConnectionState]);

  const addMessage = useAgentStore((s) => s.addMessage);
  const addSuggestion = useAgentStore((s) => s.addSuggestion);

  // Store onTranscription in a ref so it doesn't cause reconnections
  const onTranscriptionRef = useRef(options?.onTranscription);
  useEffect(() => {
    onTranscriptionRef.current = options?.onTranscription;
  }, [options?.onTranscription]);

  // ─── Tool Call Handler (shared with HTTP mode logic) ──

  const handleToolCalls = useCallback((calls: Array<{ id: string; name: string; args: Record<string, unknown> }>) => {
    const liveClient = clientRef.current;

    for (const call of calls) {
      switch (call.name) {
        case 'compose_workspace': {
          const { action, layout, panels: panelsJson, reasoning } = call.args as {
            action: string;
            layout?: string;
            panels?: string | Array<{ type: string; role?: string; props?: Record<string, unknown> }>;
            reasoning?: string;
          };

          let panels: Array<{ type: string; role?: string; props?: Record<string, unknown> }> = [];
          if (panelsJson) {
            try {
              panels = typeof panelsJson === 'string' ? JSON.parse(panelsJson) : panelsJson;
            } catch {
              panels = [];
            }
          }

          const store = useWorkspaceStore.getState();
          const directives = panels.map((p) => ({
            type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
            role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
            props: p.props,
          }));

          switch (action) {
            case 'replace':
              store.replaceAllPanels(directives, layout as Parameters<typeof store.replaceAllPanels>[1]);
              break;
            case 'show':
              store.showPanels(directives);
              break;
            case 'hide':
              store.hidePanels(panels.map((p) => p.type) as Parameters<typeof store.hidePanels>[0]);
              break;
            case 'clear':
              store.clearPanels();
              break;
          }

          // Respond to the tool call so Gemini can continue
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

        case 'suggest_action': {
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
              ? { type: 'compose_workspace', payload: composePayload }
              : undefined,
            timestamp: Date.now(),
            dismissed: false,
          };

          addSuggestion(suggestion);
          liveClient?.respondToToolCall(call.id, call.name, { success: true });
          break;
        }

        default:
          // Unknown tool --- respond with error
          liveClient?.respondToToolCall(call.id, call.name, { error: `Unknown tool: ${call.name}` });
          break;
      }
    }
  }, [addMessage, addSuggestion]);

  // ─── Connect Voice ─────────────────────────────

  const connectVoice = useCallback(async (voice?: VoiceName) => {
    if (voiceConnectionState !== 'disconnected') return;
    setVoiceConnectionState('connecting');

    const voiceToUse = voice ?? selectedVoice;
    if (voice) setSelectedVoice(voice);

    try {
      // Fetch ephemeral token from server
      const res = await fetch('/api/agents/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voiceToUse }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { token: string; voice: string; expiresIn?: number; expiresAt?: string };
      tokenExpiresAtRef.current = data.expiresAt
        ? new Date(data.expiresAt).getTime()
        : Date.now() + (data.expiresIn ?? 1800) * 1000;

      // Create Live client
      const liveClient = new GeminiLiveClient();
      clientRef.current = liveClient;

      // Wire handlers
      liveClient.onStateChange((state) => {
        if (state === 'connected') setVoiceConnectionState('connected');
        else if (state === 'disconnected') {
          setVoiceConnectionState('disconnected');
          fetch('/api/agents/live-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voice: voiceToUse }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((fresh: { token: string; expiresIn?: number; expiresAt?: string }) => {
              tokenExpiresAtRef.current = fresh.expiresAt
                ? new Date(fresh.expiresAt).getTime()
                : Date.now() + (fresh.expiresIn ?? 1800) * 1000;
              liveClient.connect({ ephemeralToken: fresh.token, audioMode: true, voice: voiceToUse });
            })
            .catch(() => {
              // keep disconnected state if refresh fails
            });
        }
        else if (state === 'connecting' || state === 'reconnecting') setVoiceConnectionState('connecting');
      });

      liveClient.onMessage((text) => {
        addMessage({
          id: nextId('msg'),
          role: 'agent',
          content: text,
          timestamp: Date.now(),
        });
      });

      liveClient.onToolCall(handleToolCalls);

      // Wire inputTranscription to onTranscription callback
      liveClient.onInputTranscription((text) => {
        onTranscriptionRef.current?.(text);
      });

      // Wire audio output
      const audio = new AudioIOManager();
      audioRef.current = audio;

      liveClient.onAudio((base64Pcm) => {
        audio.playAudioChunk(base64Pcm);
        setIsSpeaking(true);
        // Reset speaking state after a short delay (audio buffer drains)
        setTimeout(() => setIsSpeaking(false), 500);
      });

      // On setup complete, check if we should auto-start recording
      liveClient.onSetupComplete(() => {
        if (pendingRecordAfterConnectRef.current) {
          pendingRecordAfterConnectRef.current = false;
          // Trigger recording after connection is established
          const audioMgr = audioRef.current;
          if (audioMgr && liveClient.isConnected) {
            audioMgr.startCapture().then(() => {
              audioUnsubRef.current = audioMgr.onAudioChunk((base64Pcm) => {
                liveClient.sendAudio(base64Pcm);
              });
              setIsRecording(true);
            }).catch(() => {
              // Mic access failed after auto-connect
            });
          }
        }
      });

      // Connect with ephemeral token
      liveClient.connect({ ephemeralToken: data.token, audioMode: true, voice: voiceToUse });

      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
      const expiresAt = tokenExpiresAtRef.current;
      if (expiresAt) {
        const refreshIn = Math.max(5000, expiresAt - Date.now() - 5 * 60 * 1000);
        tokenRefreshTimerRef.current = setTimeout(() => {
          fetch('/api/agents/live-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voice: voiceToUse }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((fresh: { token: string; expiresIn?: number; expiresAt?: string }) => {
              tokenExpiresAtRef.current = fresh.expiresAt
                ? new Date(fresh.expiresAt).getTime()
                : Date.now() + (fresh.expiresIn ?? 1800) * 1000;
            })
            .catch(() => {
              // ignore refresh failures; reconnect path will request another token
            });
        }, refreshIn);
      }

      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: `Voice mode connected (${voiceToUse}). Tap the mic or hold Space to talk.`,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[voice] Connection failed:', error);
      pendingRecordAfterConnectRef.current = false;
      setVoiceConnectionState('disconnected');
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: `Voice connection failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        timestamp: Date.now(),
      });
    }
  }, [voiceConnectionState, selectedVoice, addMessage, handleToolCalls]);

  // ─── Recording Toggle ─────────────────────────

  const startRecording = useCallback(async () => {
    // Clear idle timer when recording starts
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Auto-connect: if disconnected, connect first then record after setup
    if (voiceConnectionStateRef.current === 'disconnected') {
      pendingRecordAfterConnectRef.current = true;
      connectVoice();
      return;
    }

    const audio = audioRef.current;
    const liveClient = clientRef.current;
    if (!audio || !liveClient?.isConnected || isRecording) return;

    try {
      await audio.startCapture();

      // Send mic audio chunks to Gemini
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
  }, [isRecording, addMessage, connectVoice]);

  const stopRecording = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isRecording) return;

    audio.stopCapture();
    audioUnsubRef.current?.();
    audioUnsubRef.current = null;
    setIsRecording(false);

    // Start idle disconnect timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      // Disconnect voice after idle period
      clientRef.current?.disconnect();
      clientRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      setVoiceConnectionState('disconnected');
      setIsSpeaking(false);
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    }, IDLE_DISCONNECT_MS);
  }, [isRecording]);

  // ─── Disconnect Voice ─────────────────────────

  const disconnectVoice = useCallback(() => {
    // Clear idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    stopRecording();
    clientRef.current?.disconnect();
    clientRef.current = null;
    audioRef.current?.destroy();
    audioRef.current = null;
    setVoiceConnectionState('disconnected');
    setIsSpeaking(false);
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  }, [stopRecording]);

  // ─── Send Text (fallback while in voice mode) ─

  const sendText = useCallback((text: string) => {
    const liveClient = clientRef.current;
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
      if (e.repeat) return; // Ignore held key repeats
      if (isTypingInInput(e)) return; // Don't interfere with text inputs

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

  // ─── Cleanup on unmount ───────────────────────

  useEffect(() => {
    return () => {
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      audioRef.current?.destroy();
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    // State
    voiceConnectionState,
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
    liveClientRef: clientRef,
  };
}
