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
import { Bot, WifiOff, ChevronDown, Send, Check, X, Zap, Mic, Volume2, PhoneOff, AlertCircle, RotateCcw, Clock, Sparkles, BookOpen, Users, Gauge, Link2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useAdvisor } from './useAdvisor';
import { useAdvisorVoice } from './useAdvisorVoice';
import { useMultimodalInput } from './useMultimodalInput';
import { useProactiveMuse } from './useProactiveMuse';
import { useAgentStore } from './store/agentStore';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import type { AgentMessage, AgentSuggestion, MuseInsight, MuseInsightCategory } from './types';

const PTT_HINT_STORAGE_KEY = 'advisor-ptt-hint-count';
const PTT_HINT_DISMISS_THRESHOLD = 3;

// ─── Relative time formatter ─────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

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

// ─── Message Bubble ──────────────────────────────

const messageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
};

function MessageBubble({ message, onRetry }: { message: AgentMessage; onRetry?: () => void }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.isError;
  const isRetry = !!message.retryInfo;

  return (
    <motion.div
      className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
      variants={messageVariants}
      initial="initial"
      animate="animate"
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser && 'bg-blue-600/20 text-blue-200 border border-blue-500/20',
          isError && 'bg-red-500/10 text-red-300 border border-red-500/20',
          isRetry && 'bg-amber-500/10 text-amber-300 border border-amber-500/20 italic',
          !isUser && !isSystem && !isError && !isRetry && 'bg-slate-800/60 text-slate-300 border border-slate-700/40 shadow-sm',
          isSystem && !isRetry && 'bg-slate-900/40 text-slate-400 italic text-sm border border-slate-800/30',
        )}
      >
        {isError && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{message.content}</span>
          </div>
        )}
        {isRetry && (
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
            <span>{message.content}</span>
          </div>
        )}
        {!isError && !isRetry && (
          <>
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-cyan-400/70 animate-pulse rounded-sm align-text-bottom" />
            )}
          </>
        )}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry failed message"
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
      <span className="mt-0.5 text-xs text-slate-500 px-1">
        {formatRelativeTime(message.timestamp)}
      </span>
    </motion.div>
  );
}

// ─── Typing Indicator ───────────────────────────

const dotVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] },
};

function TypingIndicator({ status }: { status: string | null }) {
  return (
    <motion.div
      className="flex flex-col items-start gap-1 px-1"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
    >
      {status && (
        <span className="text-xs text-slate-400 px-2">{status}</span>
      )}
      <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-slate-400"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Rate Limit Banner ──────────────────────────

function useCountdown(targetMs: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetMs) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) return;
      return requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [targetMs]);
  return remaining;
}

function RateLimitBanner({ readyAt }: { readyAt: number | null }) {
  const seconds = useCountdown(readyAt);
  if (!readyAt || seconds <= 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-sm text-amber-300 flex items-center gap-2"
    >
      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="flex-1">Rate limited &mdash; ready in {seconds}s</span>
    </motion.div>
  );
}

// ─── Error Banner ────────────────────────────────

function ErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-retry countdown for transient errors
  useEffect(() => {
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAutoRetry = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-sm text-red-300 flex items-center gap-2"
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="flex-1 truncate">{error}</span>
      {countdown !== null && (
        <span className="text-xs text-red-400/70 shrink-0">
          retry in {countdown}s
        </span>
      )}
      <button
        onClick={() => { cancelAutoRetry(); onRetry(); }}
        aria-label="Retry now"
        className="text-red-400 hover:text-red-300 transition-colors shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => { cancelAutoRetry(); onDismiss(); }}
        aria-label="Dismiss error"
        className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ─── Compact Suggestion ─────────────────────────

const suggestionVariants = {
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

function CompactSuggestion({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: AgentSuggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      variants={suggestionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-amber-500/6 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden"
    >
      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-sm text-amber-200/80 leading-snug flex-1 line-clamp-2">{suggestion.content}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        {suggestion.action && (
          <button
            onClick={() => onAccept(suggestion.id)}
            aria-label="Accept suggestion"
            className="text-emerald-400 hover:text-emerald-300 p-1"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
          className="text-slate-400 hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Muse Insight Card ──────────────────────────

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
      variants={suggestionVariants}
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

// ─── Always-available Mic Button ─────────────────

function MicButton({
  voiceState,
  isRecording,
  isSpeaking,
  onToggle,
}: {
  voiceState: 'disconnected' | 'connecting' | 'connected';
  isRecording: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}) {
  // 5 visual states for the mic button
  if (isSpeaking) {
    // State 5: AI is speaking
    return (
      <button
        onClick={onToggle}
        aria-label="AI is speaking"
        className="p-1.5 rounded transition-colors text-cyan-400"
      >
        <Volume2 className="w-4 h-4 animate-pulse" />
      </button>
    );
  }

  if (isRecording) {
    // State 4: Recording active
    return (
      <button
        onClick={onToggle}
        aria-label="Stop recording"
        className="p-1.5 rounded transition-colors text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.3)]"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  if (voiceState === 'connecting') {
    // State 2: Connecting
    return (
      <button
        onClick={onToggle}
        aria-label="Connecting voice"
        disabled
        className="p-1.5 rounded transition-colors text-cyan-400/60 animate-pulse cursor-wait"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  if (voiceState === 'connected') {
    // State 3: Connected, ready for push-to-talk or click
    return (
      <button
        onClick={onToggle}
        aria-label="Start recording"
        className="p-1.5 rounded transition-colors text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  // State 1: Disconnected (default)
  return (
    <button
      onClick={onToggle}
      aria-label="Start voice input"
      className="p-1.5 rounded transition-colors text-slate-500 hover:text-slate-400 hover:bg-slate-800/60"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}

// ─── Header Trigger Button (exported for WorkspaceHeader) ────

export function AdvisorHeaderButton({
  onClick,
  isOpen,
  isConnected,
  isVoiceActive,
  isRecording,
  isSpeaking,
  suggestionCount,
}: {
  onClick: () => void;
  isOpen: boolean;
  isConnected: boolean;
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
        <Bot className={cn(
          'w-4 h-4',
          isVoiceActive ? 'text-purple-400' : isConnected ? 'text-emerald-400' : 'text-slate-400'
        )} />
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
  } = useAdvisor();

  const {
    voiceConnectionState,
    isRecording,
    isSpeaking,
    selectedVoice,
    pushToTalkEnabled,
    connectVoice,
    disconnectVoice,
    startRecording,
    stopRecording,
    sendText: sendVoiceText,
    setSelectedVoice,
    liveClientRef,
  } = useAdvisorVoice();

  // Wire multimodal input: bridges voice transcriptions and text to the same pipeline
  const multimodal = useMultimodalInput(liveClientRef);

  // Pass transcription callback to voice hook via separate effect
  // (useAdvisorVoice accepts onTranscription via options, but we wire via ref pattern)
  const transcriptionHandlerRef = useRef(multimodal.handleTranscription);
  useEffect(() => {
    transcriptionHandlerRef.current = multimodal.handleTranscription;
  }, [multimodal.handleTranscription]);

  // Proactive Muse --- background story analysis
  useProactiveMuse();
  const museInsights = useAgentStore((s) => s.museInsights);
  const dismissMuseInsight = useAgentStore((s) => s.dismissMuseInsight);
  const activeMuseInsights = museInsights.filter((i: MuseInsight) => !i.dismissed);

  const acceptMuseInsight = useCallback((insight: MuseInsight) => {
    if (!insight.action) {
      dismissMuseInsight(insight.id);
      return;
    }
    const { payload } = insight.action;
    const store = useWorkspaceStore.getState();
    const action = (payload as { action?: string }).action ?? 'replace';
    const panels = (payload as { panels?: Array<{ type: string; role?: string; density?: string; dataSlice?: Record<string, unknown> }> }).panels ?? [];
    const layout = (payload as { layout?: string }).layout;

    const directives = panels.map((p) => ({
      type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
      role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
      density: p.density as 'micro' | 'compact' | 'full' | undefined,
      dataSlice: p.dataSlice as { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string } | undefined,
    }));

    switch (action) {
      case 'replace':
        store.replaceAllPanels(directives, layout as Parameters<typeof store.replaceAllPanels>[1]);
        break;
      case 'show':
        store.showPanels(directives);
        break;
    }

    dismissMuseInsight(insight.id);
  }, [dismissMuseInsight]);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [ghostText, setGhostText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    const liveClient = liveClientRef.current;
    if (!liveClient) return;

    const unsub = liveClient.onInputTranscription((text: string) => {
      setGhostText(text);
      // Bridge to multimodal input
      transcriptionHandlerRef.current(text);
      // Clear ghost text after a short delay
      setTimeout(() => setGhostText(''), 2000);
    });

    return unsub;
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

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isProcessing, isOpen]);

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
      // Cmd+. (or Ctrl+.) toggles the overlay
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      // Escape closes when open
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Unified text submission: routes through multimodal input pipeline
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    // Route through multimodal pipeline for intent resolution
    multimodal.handleTextInput(text);

    // If voice is connected, the multimodal hook already sends to Gemini Live.
    // If not connected, fall back to HTTP advisor for LLM-requiring messages.
    if (!isVoiceActive && isTextConnected) {
      sendMessage(text);
    }

    setInput('');
  }, [input, isVoiceActive, isTextConnected, sendMessage, multimodal]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mic button toggle handler
  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      // Auto-connect will be triggered by startRecording if disconnected
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ─── Panel content (shared between mobile bottom sheet and desktop dropdown) ───

  const panelContent = (
    <>
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-slate-900/60">
        <Bot className={cn('w-4 h-4', isVoiceActive ? 'text-purple-500' : 'text-emerald-500')} />
        <span className="text-sm font-semibold text-slate-200">
          {isVoiceActive ? 'Voice Advisor' : 'Workspace Advisor'}
        </span>
        <div className="flex-1" />

        {isVoiceActive && (
          <span className="text-sm font-medium text-purple-400 bg-purple-500/10 rounded px-2 py-0.5">
            VOICE
          </span>
        )}

        <div className={cn(
          'w-2 h-2 rounded-full',
          isAnyConnected ? (isVoiceActive ? 'bg-purple-500' : 'bg-emerald-500') : isTextConnecting ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
        )} />

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

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-3 pt-2 space-y-1.5">
          <AnimatePresence mode="popLayout">
            {suggestions.slice(0, 3).map((s) => (
              <CompactSuggestion
                key={s.id}
                suggestion={s}
                onAccept={acceptSuggestion}
                onDismiss={dismissSuggestion}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Muse Insights --- proactive creative suggestions */}
      {activeMuseInsights.length > 0 && (
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
      )}

      {/* Messages */}
      <div ref={scrollRef} aria-live="polite" aria-relevant="additions" className={cn('overflow-y-auto p-3 space-y-2', isMobile ? 'flex-1 min-h-0' : 'max-h-[50vh] sm:max-h-[400px]')}>
        {messages.length === 0 && activeMuseInsights.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            {isAnyConnected ? 'Observing workspace...' : 'Connect to start using the advisor'}
          </p>
        )}
        {messages.slice(-20).map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRetry={msg.isError ? retryLastMessage : undefined}
          />
        ))}
        <AnimatePresence>
          {isProcessing && (
            <TypingIndicator status={processingStatus} />
          )}
        </AnimatePresence>
      </div>

      {/* Rate limit & error banners */}
      <AnimatePresence>
        {isThrottled && <RateLimitBanner readyAt={rateLimitedUntil} />}
      </AnimatePresence>
      <AnimatePresence>
        {lastError && (
          <ErrorBanner
            error={lastError}
            onRetry={retryLastMessage}
            onDismiss={clearError}
          />
        )}
      </AnimatePresence>

      {/* Unified input area with always-available mic */}
      <div className="border-t border-slate-800/50 p-3 space-y-1.5">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ghostText || (isVoiceActive ? 'Type or hold Space...' : 'Ask the advisor...')}
              aria-label="Message to advisor"
              aria-describedby="advisor-input-hint"
              className={cn(
                'w-full bg-slate-900/60 border border-slate-800/50 rounded-md px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-slate-700/60 focus:ring-2 focus:ring-slate-700/30 focus:shadow-[0_0_0_3px_rgba(100,116,139,0.08)]',
                ghostText ? 'placeholder-cyan-400/50' : 'placeholder-slate-500',
              )}
            />
            {/* Ghost text overlay for live transcription */}
            {ghostText && !input && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cyan-400/50 pointer-events-none truncate max-w-[90%]">
                {ghostText}
              </span>
            )}
          </div>
          <span id="advisor-input-hint" className="sr-only">
            Press Enter to send your message
          </span>

          {/* Interaction context badge */}
          {hasMultiSourceContext && (
            <span className="shrink-0 text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 py-0.5">
              {contextSources!.size} inputs
            </span>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className={cn(
              'p-1.5 rounded transition-colors shrink-0',
              input.trim()
                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                : 'text-slate-500 cursor-not-allowed',
            )}
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Always-available mic button */}
          <MicButton
            voiceState={voiceConnectionState}
            isRecording={isRecording}
            isSpeaking={isSpeaking}
            onToggle={handleMicToggle}
          />
        </div>

        {/* Push-to-talk hint */}
        {pushToTalkEnabled && pttHintVisible && isOpen && (
          <p className="text-xs text-slate-500 px-1" data-testid="ptt-hint">
            Hold Space to talk
          </p>
        )}
      </div>
    </>
  );

  return (
    <div ref={panelRef} className="relative">
      {/* Header trigger button */}
      <AdvisorHeaderButton
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        isConnected={isTextConnected}
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
