'use client';

/**
 * AdvisorOverlay --- Advisor dropdown panel + header trigger.
 *
 * The trigger button lives in the page header (rendered via WorkspaceHeader).
 * The dropdown panel opens below the header as an absolute overlay.
 * All text is minimum text-sm for readability.
 *
 * Multimodal integration:
 *   - Always-available mic button (no separate "connect voice" step)
 *   - Push-to-talk via Space key with auto-hide hint after 3 uses
 *   - Ghost text showing live voice transcription
 *   - Cross-modal interaction context badge
 *   - Text and voice both route through useMultimodalInput
 *
 * Responsive behavior:
 *   < 640px  -> Full-width bottom sheet (h-[70vh]) with drag handle to dismiss
 *   640-1024 -> 360px dropdown
 *   > 1024   -> 420px dropdown
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';
import { Bot, WifiOff, ChevronDown, Check, X, Mic, Volume2, PhoneOff, Sparkles, BookOpen, Users, Gauge, Link2, Music, Flame, Snowflake, Flower2, Wind } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AudioIOManager } from '@dzin/voice';
import { useAdvisor } from './useAdvisor';
import { useAdvisorVoice } from './useAdvisorVoice';
import type { ConnectionPhase } from '@/lib/useConnectionLifecycle';
import { useMultimodalInput } from './useMultimodalInput';
import { useProactiveMuse } from './useProactiveMuse';
import { useAgentStore } from './store/agentStore';
import { dispatchWorkspaceAction } from './dispatchWorkspaceAction';
import { AdvisorConversation, EffectTimeline } from './components';
import type { MuseInsight, MuseInsightCategory, EffectTriggerSource } from './types';

const PTT_HINT_STORAGE_KEY = 'advisor-ptt-hint-count';
const PTT_HINT_DISMISS_THRESHOLD = 3;

// ─── Viewport hook ───────────────────────────────

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  useEffect(() => {
    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafId); };
  }, []);
  return width;
}

// ─── Push-to-talk hint counter ───────────────────

function getPttHintCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(PTT_HINT_STORAGE_KEY) ?? '0', 10);
  } catch {
    return 0;
  }
}

function incrementPttHintCount(): void {
  if (typeof window === 'undefined') return;
  try {
    const count = getPttHintCount() + 1;
    localStorage.setItem(PTT_HINT_STORAGE_KEY, String(count));
  } catch {
    // ignore storage errors
  }
}

// ─── Muse Insight Card ──────────────────────────

const museInsightVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

const CATEGORY_CONFIG: Record<MuseInsightCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  plot: { icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  character: { icon: <Users className="w-3.5 h-3.5" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  pacing: { icon: <Gauge className="w-3.5 h-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  continuity: { icon: <Link2 className="w-3.5 h-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const PRIORITY_DOTS: Record<MuseInsight['priority'], string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
};

function MuseInsightCard({
  insight,
  onAccept,
  onDismiss,
}: {
  insight: MuseInsight;
  onAccept: (insight: MuseInsight) => void;
  onDismiss: (id: string) => void;
}) {
  const config = CATEGORY_CONFIG[insight.category];

  return (
    <motion.div
      layout
      variants={museInsightVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('border rounded-lg px-3 py-2 space-y-1 overflow-hidden', config.bg)}
    >
      <div className="flex items-center gap-2">
        <span className={config.color}>{config.icon}</span>
        <span className={cn('text-sm font-medium flex-1', config.color)}>{insight.title}</span>
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOTS[insight.priority])} />
        <div className="flex items-center gap-1 shrink-0">
          {insight.action && (
            <button
              onClick={() => onAccept(insight)}
              aria-label="Apply suggestion"
              className="text-emerald-400 hover:text-emerald-300 p-0.5"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDismiss(insight.id)}
            aria-label="Dismiss insight"
            className="text-slate-400 hover:text-slate-300 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-400 leading-snug line-clamp-2">{insight.description}</p>
    </motion.div>
  );
}

// ─── Waveform Ring (circular bars around mic during recording) ────

const WAVEFORM_BAR_COUNT = 10;
const WAVEFORM_ANGLES = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => (360 / WAVEFORM_BAR_COUNT) * i);

function WaveformRing({ audioRef }: { audioRef: React.RefObject<AudioIOManager | null> }) {
  const [barScales, setBarScales] = useState<number[]>(() => Array(WAVEFORM_BAR_COUNT).fill(0.3));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) return;
      const level = audioRef.current?.getAudioLevel() ?? 0;

      setBarScales(prev => prev.map((_, i) => {
        // Stagger: each bar responds with a slight phase offset
        const phase = (i / WAVEFORM_BAR_COUNT) * Math.PI * 2;
        const wave = Math.sin(Date.now() / 200 + phase) * 0.15;
        const target = 0.3 + (level * 0.7) + (level > 0.05 ? wave : 0);
        return Math.max(0.3, Math.min(1, target));
      }));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef]);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {WAVEFORM_ANGLES.map((angle, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-14px)`,
          }}
        >
          <div
            className="w-[2px] rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]"
            style={{
              height: '8px',
              transform: `scaleY(${barScales[i]})`,
              transition: 'transform 80ms ease-out',
              transformOrigin: 'center',
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Connection Progress Arc (determinate SVG ring for mic connecting state) ─

const ARC_R = 18;
const ARC_STROKE = 2;
const ARC_SIZE = (ARC_R + ARC_STROKE) * 2;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_R;

/** Maps connection phase to a target progress ratio (0–1). */
const PHASE_PROGRESS: Record<ConnectionPhase, number> = {
  idle: 0,
  token: 0.33,
  socket: 0.66,
  setup: 1,
};

function ConnectionProgressArc({ phase, failed }: { phase: ConnectionPhase; failed: boolean }) {
  const progress = PHASE_PROGRESS[phase];
  const offset = ARC_CIRCUMFERENCE * (1 - progress);

  return (
    <svg
      className="absolute inset-0 -rotate-90 pointer-events-none"
      width={ARC_SIZE}
      height={ARC_SIZE}
      viewBox={`0 0 ${ARC_SIZE} ${ARC_SIZE}`}
      aria-hidden="true"
    >
      {/* Background track */}
      <circle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_R}
        fill="none"
        stroke="rgb(71 85 105)"
        strokeWidth={ARC_STROKE}
        opacity={0.3}
      />
      {/* Progress arc */}
      <motion.circle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_R}
        fill="none"
        strokeWidth={ARC_STROKE}
        strokeLinecap="round"
        strokeDasharray={ARC_CIRCUMFERENCE}
        animate={{
          strokeDashoffset: offset,
          stroke: failed
            ? 'rgb(248 113 113)'           // red-400 on failure
            : progress < 0.5
              ? 'rgb(71 85 105)'            // slate-600 at start
              : 'rgb(34 211 238)',          // cyan-400 as progress fills
        }}
        transition={{ strokeDashoffset: { duration: 0.4, ease: 'easeOut' }, stroke: { duration: 0.3 } }}
      />
    </svg>
  );
}

// ─── Always-available Mic Button ─────────────────

type MicState = 'disconnected' | 'connecting' | 'connected' | 'recording' | 'speaking';

const MIC_SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 };

const MIC_STYLES: Record<MicState, {
  backgroundColor: string;
  color: string;
  scale: number;
  boxShadow: string;
}> = {
  disconnected: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: 'rgb(100 116 139)',     // slate-500
    scale: 1,
    boxShadow: '0 0 0px transparent',
  },
  connecting: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: 'rgb(34 211 238 / 0.6)', // cyan-400/60
    scale: 1,
    boxShadow: '0 0 0px transparent',
  },
  connected: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: 'rgb(34 211 238)',       // cyan-400
    scale: 1,
    boxShadow: '0 0 0px transparent',
  },
  recording: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: 'rgb(248 113 113)',      // red-400
    scale: 1.05,
    boxShadow: '0 0 12px rgba(248,113,113,0.4)',
  },
  speaking: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: 'rgb(34 211 238)',       // cyan-400
    scale: 1,
    boxShadow: '0 0 0px transparent',
  },
};

const MIC_ARIA: Record<MicState, string> = {
  disconnected: 'Start voice input',
  connecting: 'Connecting voice',
  connected: 'Start recording',
  recording: 'Stop recording',
  speaking: 'AI is speaking',
};

function deriveMicState(
  voiceState: 'disconnected' | 'connecting' | 'connected',
  isRecording: boolean,
  isSpeaking: boolean,
): MicState {
  if (isSpeaking) return 'speaking';
  if (isRecording) return 'recording';
  return voiceState;
}

function MicButton({
  voiceState,
  connectionPhase,
  isRecording,
  isSpeaking,
  onToggle,
  audioRef,
}: {
  voiceState: 'disconnected' | 'connecting' | 'connected';
  connectionPhase: ConnectionPhase;
  isRecording: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  audioRef: React.RefObject<AudioIOManager | null>;
}) {
  const state = deriveMicState(voiceState, isRecording, isSpeaking);
  const style = MIC_STYLES[state];
  const showMic = state !== 'speaking';

  // Track connection failure: if we were connecting and suddenly go disconnected
  const [arcFailed, setArcFailed] = useState(false);
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (prevStateRef.current === 'connecting' && state === 'disconnected') {
      setArcFailed(true);
      const timer = setTimeout(() => setArcFailed(false), 800);
      return () => clearTimeout(timer);
    }
    if (state === 'connecting') {
      setArcFailed(false);
    }
    prevStateRef.current = state;
  }, [state]);

  const showArc = state === 'connecting' || arcFailed;

  return (
    <motion.button
      layoutId="mic-button"
      onClick={onToggle}
      disabled={state === 'connecting'}
      aria-label={MIC_ARIA[state]}
      className={cn('relative rounded', state === 'connecting' && 'cursor-wait')}
      style={{ width: ARC_SIZE, height: ARC_SIZE }}
      animate={style}
      transition={MIC_SPRING}
      whileHover={state === 'disconnected' ? { color: 'rgb(148 163 184)', backgroundColor: 'rgba(30,41,59,0.6)' }
        : state === 'connected' ? { color: 'rgb(103 232 249)', backgroundColor: 'rgba(6,182,212,0.1)' }
        : undefined}
    >
      {/* Determinate progress arc for connecting state */}
      <AnimatePresence>
        {showArc && (
          <motion.div
            key="progress-arc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ConnectionProgressArc
              phase={arcFailed ? 'idle' : connectionPhase}
              failed={arcFailed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waveform ring for recording state */}
      {state === 'recording' && <WaveformRing audioRef={audioRef} />}

      {/* Icon crossfade */}
      <AnimatePresence mode="wait" initial={false}>
        {showMic ? (
          <motion.span
            key="mic"
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={MIC_SPRING}
          >
            <Mic className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="speaker"
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={MIC_SPRING}
          >
            <Volume2 className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Connection Ring (animated state indicator around Bot icon) ────

type RingState = 'disconnected' | 'connecting' | 'connected' | 'voice';

const RING_STYLES: Record<RingState, { borderColor: string; boxShadow: string; scale: number }> = {
  disconnected: { borderColor: 'rgb(71 85 105)', boxShadow: '0 0 0px transparent', scale: 1 },
  connecting:   { borderColor: 'rgb(245 158 11)', boxShadow: '0 0 8px rgba(245,158,11,0.3)', scale: 1.05 },
  connected:    { borderColor: 'rgb(16 185 129)', boxShadow: '0 0 4px rgba(16,185,129,0.2)', scale: 1 },
  voice:        { borderColor: 'rgb(168 85 247)', boxShadow: '0 0 6px rgba(168,85,247,0.25)', scale: 1 },
};

function ConnectionRing({ state, size = 24, children }: { state: RingState; size?: number; children: React.ReactNode }) {
  const style = RING_STYLES[state];
  const isPulsing = state === 'connecting';
  const isBreathing = state === 'voice';

  return (
    <motion.div
      className="relative flex items-center justify-center rounded-full"
      style={{ width: size, height: size, borderWidth: state === 'disconnected' ? 1 : 2, borderStyle: 'solid' }}
      animate={{
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        scale: isPulsing ? [1, 1.1, 1] : isBreathing ? [1, 1.04, 1] : style.scale,
      }}
      transition={
        isPulsing
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } as const
          : isBreathing
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } as const
            : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }
      key={state}
    >
      {children}
    </motion.div>
  );
}

// ─── Voice Persona Picker ────────────────────────

type VoiceName = 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' | 'Puck';

interface VoicePersona {
  name: VoiceName;
  label: string;
  gradient: string;
  icon: React.ReactNode;
}

const VOICE_PERSONAS: VoicePersona[] = [
  { name: 'Aoede', label: 'Warm', gradient: 'from-amber-400 to-orange-500', icon: <Music className="w-3 h-3" /> },
  { name: 'Charon', label: 'Dramatic', gradient: 'from-slate-400 to-indigo-500', icon: <Flame className="w-3 h-3" /> },
  { name: 'Fenrir', label: 'Bold', gradient: 'from-red-400 to-rose-600', icon: <Wind className="w-3 h-3" /> },
  { name: 'Kore', label: 'Gentle', gradient: 'from-emerald-400 to-teal-500', icon: <Flower2 className="w-3 h-3" /> },
  { name: 'Puck', label: 'Playful', gradient: 'from-cyan-400 to-blue-500', icon: <Snowflake className="w-3 h-3" /> },
];

function VoicePersonaPicker({
  selectedVoice,
  voiceConnectionState,
  onSelect,
}: {
  selectedVoice: VoiceName;
  voiceConnectionState: 'disconnected' | 'connecting' | 'connected';
  onSelect: (voice: VoiceName) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-800/30 overflow-x-auto">
      {VOICE_PERSONAS.map((persona) => {
        const isSelected = persona.name === selectedVoice;
        return (
          <button
            key={persona.name}
            onClick={() => onSelect(persona.name)}
            disabled={voiceConnectionState === 'connecting'}
            aria-label={`Select ${persona.name} voice (${persona.label})`}
            aria-pressed={isSelected}
            className={cn(
              'relative shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
              'bg-gradient-to-br',
              persona.gradient,
              isSelected
                ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-slate-950 scale-110'
                : 'opacity-60 hover:opacity-90 hover:scale-105',
              voiceConnectionState === 'connecting' && 'cursor-wait',
            )}
            title={`${persona.name} — ${persona.label}`}
          >
            <span className="text-white drop-shadow-sm">{persona.icon}</span>
          </button>
        );
      })}
      <span className="text-xs text-slate-500 shrink-0 ml-1">{selectedVoice}</span>
    </div>
  );
}

function deriveRingState(isConnected: boolean, isConnecting: boolean, isVoiceActive: boolean): RingState {
  if (isVoiceActive) return 'voice';
  if (isConnected) return 'connected';
  if (isConnecting) return 'connecting';
  return 'disconnected';
}

// ─── Header Trigger Button (exported for WorkspaceHeader) ────

export function AdvisorHeaderButton({
  onClick,
  isOpen,
  isConnected,
  isConnecting,
  isVoiceActive,
  isRecording,
  isSpeaking,
  suggestionCount,
}: {
  onClick: () => void;
  isOpen: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isVoiceActive: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  suggestionCount: number;
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '\u2318' : 'Ctrl';

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Toggle advisor panel"
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all',
          'border',
          isVoiceActive
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/15'
            : isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300',
        )}
      >
        {isRecording && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <ConnectionRing state={deriveRingState(isConnected, isConnecting, isVoiceActive)} size={22}>
          <Bot className={cn(
            'w-3.5 h-3.5',
            isVoiceActive ? 'text-purple-400' : isConnected ? 'text-emerald-400' : 'text-slate-400'
          )} />
        </ConnectionRing>
        <span>
          {isRecording ? 'Listening...'
            : isSpeaking ? 'Speaking...'
              : isVoiceActive ? 'Voice Advisor'
                : isConnected ? 'Advisor'
                  : 'Advisor'}
        </span>
        {suggestionCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
            {suggestionCount}
          </span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {/* Shortcut hint on hover */}
      <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        <kbd className="rounded bg-slate-800/90 border border-slate-700/50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
          {modKey}+.
        </kbd>
      </span>
    </div>
  );
}

// ─── Main Overlay (dropdown panel) ───────────────

export default function AdvisorOverlay() {
  const {
    connectionState,
    messages,
    suggestions,
    isProcessing,
    processingStatus,
    rateLimitedUntil,
    isThrottled,
    lastError,
    connect: connectText,
    disconnect: disconnectText,
    sendMessage,
    retryLastMessage,
    clearError,
    acceptSuggestion,
    dismissSuggestion,
    rateMessage,
    regenerateResponse,
  } = useAdvisor();

  const {
    voiceConnectionState,
    voiceConnectionPhase,
    isRecording,
    isSpeaking,
    selectedVoice,
    pushToTalkEnabled,
    connectVoice,
    disconnectVoice,
    startRecording,
    stopRecording,
    setSelectedVoice,
    liveClientRef,
    audioRef,
  } = useAdvisorVoice();

  // Wire multimodal input: bridges voice transcriptions and text to the same pipeline
  const multimodal = useMultimodalInput(liveClientRef);

  // Pass transcription callback to voice hook via separate effect
  const transcriptionHandlerRef = useRef(multimodal.handleTranscription);
  useEffect(() => {
    transcriptionHandlerRef.current = multimodal.handleTranscription;
  }, [multimodal.handleTranscription]);

  // Proactive Muse --- background story analysis
  useProactiveMuse();
  const museInsights = useAgentStore((s) => s.museInsights);
  const dismissMuseInsight = useAgentStore((s) => s.dismissMuseInsight);
  const activeMuseInsights = museInsights.filter((i: MuseInsight) => !i.dismissed);

  const pushEffect = useAgentStore((s) => s.pushEffect);
  const acceptMuseInsight = useCallback((insight: MuseInsight) => {
    if (!insight.action) {
      dismissMuseInsight(insight.id);
      return;
    }
    const trigger: EffectTriggerSource = { kind: 'muse_insight', insightId: insight.id, category: insight.category };
    const { action, before, after } = dispatchWorkspaceAction(insight.action.payload as Record<string, unknown>);
    pushEffect(trigger, action, insight.description, before, after);
    dismissMuseInsight(insight.id);
  }, [dismissMuseInsight, pushEffect]);

  const [isOpen, setIsOpen] = useState(false);
  const [ghostText, setGhostText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const viewportWidth = useViewportWidth();

  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;

  const isTextConnected = connectionState === 'connected';
  const isTextConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';
  const isVoiceActive = voiceConnectionState === 'connected';
  const isVoiceConnecting = voiceConnectionState === 'connecting';
  const isAnyConnected = isTextConnected || isVoiceActive;

  // Track push-to-talk usage for hint auto-hide
  const [pttHintVisible, setPttHintVisible] = useState(() => getPttHintCount() < PTT_HINT_DISMISS_THRESHOLD);

  // Wire voice transcriptions to ghost text display
  const ghostDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const liveClient = liveClientRef.current;
    if (!liveClient) return;

    const unsub = liveClient.onInputTranscription((text: string) => {
      setGhostText(text);
      // Bridge to multimodal input
      transcriptionHandlerRef.current(text);
      // Debounce: clear ghost text after 3s of no new transcription
      if (ghostDismissTimer.current) clearTimeout(ghostDismissTimer.current);
      ghostDismissTimer.current = setTimeout(() => setGhostText(''), 3000);
    });

    return () => {
      unsub();
      if (ghostDismissTimer.current) clearTimeout(ghostDismissTimer.current);
    };
  }, [liveClientRef, liveClientRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track push-to-talk usage to auto-hide hint
  useEffect(() => {
    if (!isRecording) return;
    incrementPttHintCount();
    if (getPttHintCount() >= PTT_HINT_DISMISS_THRESHOLD) {
      setPttHintVisible(false);
    }
  }, [isRecording]);

  // Get interaction context for badge
  const interactionCtx = multimodal.getInteractionContext();
  const contextSources = interactionCtx
    ? new Set(interactionCtx.fragments.map((f) => f.source))
    : null;
  const hasMultiSourceContext = contextSources !== null && contextSources.size >= 2;

  // Auto-open when suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [suggestions.length, isOpen]);

  // Close on outside click (desktop/tablet only --- mobile uses drag)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isMobile]);

  // Global keyboard shortcuts: Cmd+. to toggle, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Custom send: routes through multimodal pipeline, falls back to HTTP advisor
  const handleCustomSend = useCallback((text: string): boolean => {
    multimodal.handleTextInput(text);

    if (!isVoiceActive && isTextConnected) {
      sendMessage(text);
    }

    return true; // clear input
  }, [isVoiceActive, isTextConnected, sendMessage, multimodal]);

  // Mic button toggle handler
  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Voice persona switch handler
  const handleVoiceSelect = useCallback((voice: VoiceName) => {
    if (voice === selectedVoice) return;
    setSelectedVoice(voice);

    if (voiceConnectionState === 'connected') {
      disconnectVoice();
      setTimeout(() => connectVoice(voice), 200);
    }
  }, [selectedVoice, voiceConnectionState, setSelectedVoice, disconnectVoice, connectVoice]);

  // ─── Muse insights slot (rendered between suggestions and messages) ───

  const museInsightsSlot = activeMuseInsights.length > 0 ? (
    <div className="px-3 pt-2 space-y-1.5">
      <div className="flex items-center gap-1.5 px-1 pb-0.5">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">Creative Insights</span>
        <span className="text-xs text-slate-500">{activeMuseInsights.length}</span>
      </div>
      <AnimatePresence mode="popLayout">
        {activeMuseInsights.slice(0, 4).map((insight) => (
          <MuseInsightCard
            key={insight.id}
            insight={insight}
            onAccept={acceptMuseInsight}
            onDismiss={dismissMuseInsight}
          />
        ))}
      </AnimatePresence>
    </div>
  ) : null;

  // ─── Panel content (shared between mobile bottom sheet and desktop dropdown) ───

  const panelContent = (
    <>
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-slate-900/60">
        <ConnectionRing state={deriveRingState(isAnyConnected, isTextConnecting || isVoiceConnecting, isVoiceActive)} size={24}>
          <Bot className={cn('w-4 h-4', isVoiceActive ? 'text-purple-500' : isAnyConnected ? 'text-emerald-500' : 'text-slate-400')} />
        </ConnectionRing>
        <span className="text-sm font-semibold text-slate-200">
          {isVoiceActive ? 'Voice Advisor' : 'Workspace Advisor'}
        </span>
        <div className="flex-1" />

        {isVoiceActive && (
          <span className="text-sm font-medium text-purple-400 bg-purple-500/10 rounded px-2 py-0.5">
            VOICE
          </span>
        )}

        {!isAnyConnected && !isTextConnecting && (
          <button
            onClick={connectText}
            aria-label="Connect to advisor"
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Connect
          </button>
        )}
        {isTextConnected && !isVoiceActive && (
          <button
            onClick={disconnectText}
            aria-label="Disconnect from advisor"
            className="text-slate-400 hover:text-red-400 p-1"
          >
            <WifiOff className="w-4 h-4" />
          </button>
        )}
        {isVoiceActive && (
          <button
            onClick={disconnectVoice}
            aria-label="Disconnect voice"
            className="text-slate-400 hover:text-red-400 p-1 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Voice persona picker */}
      <VoicePersonaPicker
        selectedVoice={selectedVoice as VoiceName}
        voiceConnectionState={voiceConnectionState}
        onSelect={handleVoiceSelect}
      />

      {/* Shared conversation core */}
      <AdvisorConversation
        variant="overlay"
        messages={messages}
        suggestions={suggestions}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        rateLimitedUntil={rateLimitedUntil}
        isThrottled={isThrottled}
        lastError={lastError}
        isConnected={isAnyConnected}
        onSendMessage={sendMessage}
        onRetryLastMessage={retryLastMessage}
        onClearError={clearError}
        onAcceptSuggestion={acceptSuggestion}
        onDismissSuggestion={dismissSuggestion}
        onRateMessage={rateMessage}
        onRegenerateMessage={regenerateResponse}
        onCustomSend={handleCustomSend}
        maxVisibleMessages={20}
        maxVisibleSuggestions={3}
        ghostText={ghostText}
        inputPlaceholder={isVoiceActive ? 'Type or hold Space...' : 'Ask the advisor...'}
        beforeMessages={museInsightsSlot}
        scrollClassName={isMobile ? 'flex-1 min-h-0' : undefined}
        emptyState={
          messages.length === 0 && activeMuseInsights.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              {isAnyConnected ? 'Observing workspace...' : 'Connect to start using the advisor'}
            </p>
          ) : undefined
        }
        inputSlotLeft={
          hasMultiSourceContext ? (
            <span className="shrink-0 text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 py-0.5">
              {contextSources!.size} inputs
            </span>
          ) : undefined
        }
        inputSlotRight={
          <MicButton
            voiceState={voiceConnectionState}
            connectionPhase={voiceConnectionPhase}
            isRecording={isRecording}
            isSpeaking={isSpeaking}
            onToggle={handleMicToggle}
            audioRef={audioRef}
          />
        }
      />

      {/* Effect attribution timeline */}
      <EffectTimeline maxVisible={3} className="px-3 py-1.5" />

      {/* Push-to-talk hint (below input, overlay-only) */}
      {pushToTalkEnabled && pttHintVisible && isOpen && (
        <p className="text-xs text-slate-500 px-4 pb-1.5 -mt-1" data-testid="ptt-hint">
          Hold Space to talk
        </p>
      )}
    </>
  );

  return (
    <div ref={panelRef} className="relative">
      {/* Header trigger button */}
      <AdvisorHeaderButton
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        isConnected={isTextConnected}
        isConnecting={isTextConnecting}
        isVoiceActive={isVoiceActive}
        isRecording={isRecording}
        isSpeaking={isSpeaking}
        suggestionCount={suggestions.length + activeMuseInsights.length}
      />

      {/* Mobile full-screen modal */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: () => setIsOpen(false), allowOutsideClick: true }}>
            <div>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Advisor panel"
                className="fixed inset-0 z-50 flex flex-col bg-slate-950 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Mobile close button */}
                <div className="flex items-center justify-end px-3 pt-3 pb-1 shrink-0">
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close advisor"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {panelContent}
              </motion.div>
            </div>
          </FocusTrap>
        )}
      </AnimatePresence>

      {/* Desktop/tablet dropdown */}
      <AnimatePresence>
        {isOpen && !isMobile && (
          <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: () => setIsOpen(false), allowOutsideClick: true }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Advisor panel"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'absolute top-full mt-1 right-0 bg-gradient-to-b from-slate-950/[0.97] to-slate-950/95 border border-slate-800/60 rounded-lg shadow-[0_20px_70px_-12px_rgba(0,0,0,0.8),0_0_30px_-5px_rgba(16,185,129,0.12)] backdrop-blur-xl overflow-hidden z-50',
                isTablet ? 'w-[360px]' : 'w-[420px]',
              )}
            >
              {/* Top highlight */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600/40 to-transparent" />
              {panelContent}
            </motion.div>
          </FocusTrap>
        )}
      </AnimatePresence>
    </div>
  );
}
