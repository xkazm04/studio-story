'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { AutoResizeTextarea } from '@/app/components/UI/AutoResizeTextarea';
import { AdvisorMessageBubble } from './AdvisorMessageBubble';
import { AdvisorTypingDots } from './AdvisorTypingDots';
import { AdvisorRateLimitBanner, AdvisorErrorBanner } from './AdvisorBanner';
import { AdvisorSuggestionCard } from './AdvisorSuggestionCard';
import { SlashCommandMenu } from './SlashCommandMenu';
import type { AdvisorVariant, GroupPosition } from './AdvisorMessageBubble';
import type { AgentMessage, AgentSuggestion, AdvisorError, MessageRating } from '../types';
import { advisorErrorLabel } from '../types';
import { useSlashCommands } from '../useSlashCommands';
import { parseSlashCommand } from '../slashCommands';

// ─── Message grouping ─────────────────────────────

/** Max time gap (ms) between consecutive same-role messages to be grouped. */
const GROUP_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

interface MessageMeta {
  groupPosition: GroupPosition;
  showTimestamp: boolean;
  dateSeparator: string | null;
}

function isSameDay(a: number, b: number): boolean {
  const dA = new Date(a);
  const dB = new Date(b);
  return dA.getFullYear() === dB.getFullYear()
    && dA.getMonth() === dB.getMonth()
    && dA.getDate() === dB.getDate();
}

function dateSeparatorLabel(timestamp: number): string {
  const now = new Date();
  const d = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Compute per-message grouping metadata for a list of messages.
 * Consecutive messages from the same role within GROUP_WINDOW_MS share a group.
 * Only the last message in each group shows a timestamp; others show on hover.
 */
function computeMessageGroups(messages: AgentMessage[]): MessageMeta[] {
  if (messages.length === 0) return [];

  const meta: MessageMeta[] = new Array(messages.length);
  let prevDayTs = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;

    // Date separator: show if first message or day boundary crossed
    let dateSeparator: string | null = null;
    if (i === 0 || !isSameDay(msg.timestamp, prevDayTs)) {
      dateSeparator = dateSeparatorLabel(msg.timestamp);
    }
    prevDayTs = msg.timestamp;

    // Group with previous?
    const groupsWithPrev = prev !== null
      && prev.role === msg.role
      && (msg.timestamp - prev.timestamp) < GROUP_WINDOW_MS
      && dateSeparator === null; // Don't group across day boundaries

    // Group with next?
    const groupsWithNext = next !== null
      && next.role === msg.role
      && (next.timestamp - msg.timestamp) < GROUP_WINDOW_MS
      && isSameDay(msg.timestamp, next.timestamp);

    let groupPosition: GroupPosition;
    if (groupsWithPrev && groupsWithNext) groupPosition = 'middle';
    else if (groupsWithPrev && !groupsWithNext) groupPosition = 'last';
    else if (!groupsWithPrev && groupsWithNext) groupPosition = 'first';
    else groupPosition = 'solo';

    // Show timestamp only on last message of a group (or solo)
    const showTimestamp = groupPosition === 'last' || groupPosition === 'solo';

    meta[i] = { groupPosition, showTimestamp, dateSeparator };
  }

  return meta;
}

// ─── Props ───────────────────────────────────────

export interface AdvisorConversationProps {
  variant: AdvisorVariant;

  // Data from useAdvisor
  messages: AgentMessage[];
  suggestions: AgentSuggestion[];
  isProcessing: boolean;
  processingStatus?: string | null;
  rateLimitedUntil: number | null;
  isThrottled: boolean;
  lastError: AdvisorError | null;
  isConnected: boolean;

  // Callbacks
  onSendMessage: (text: string) => void;
  onRetryLastMessage: () => void;
  onClearError: () => void;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  /** Called when user rates an agent message */
  onRateMessage?: (id: string, rating: MessageRating) => void;
  /** Called when user clicks regenerate after a negative rating */
  onRegenerateMessage?: (messageId: string) => void;

  // Slots / customization
  /** Content rendered between suggestions and messages (e.g. muse insights) */
  beforeMessages?: React.ReactNode;
  /** Extra buttons rendered after the send button (e.g. mic button) */
  inputSlotRight?: React.ReactNode;
  /** Extra inline element next to send button (e.g. context badge) */
  inputSlotLeft?: React.ReactNode;
  /** Custom empty state when no messages and not connected */
  emptyState?: React.ReactNode;
  /** Placeholder text for the input */
  inputPlaceholder?: string;
  /** Disable the input (e.g. when disconnected in panel mode) */
  inputDisabled?: boolean;
  /** Ghost text overlay for live voice transcription */
  ghostText?: string;
  /** Additional className for the scroll container */
  scrollClassName?: string;
  /** Max messages to render (most recent N). Default: all */
  maxVisibleMessages?: number;
  /** Max suggestions to render. Default: all */
  maxVisibleSuggestions?: number;
  /** Called when input text changes (for external state sync) */
  onInputChange?: (text: string) => void;
  /** Externally controlled input value. When provided, component is controlled. */
  inputValue?: string;
  /** Custom send handler that receives the raw text, bypassing the default trim+send.
   *  Return true to clear the input, false to keep it. */
  onCustomSend?: (text: string) => boolean;
}

// ─── Component ───────────────────────────────────

export function AdvisorConversation({
  variant,
  messages,
  suggestions,
  isProcessing,
  processingStatus,
  rateLimitedUntil,
  isThrottled,
  lastError,
  isConnected,
  onSendMessage,
  onRetryLastMessage,
  onClearError,
  onAcceptSuggestion,
  onDismissSuggestion,
  onRateMessage,
  onRegenerateMessage,
  beforeMessages,
  inputSlotRight,
  inputSlotLeft,
  emptyState,
  inputPlaceholder,
  inputDisabled = false,
  ghostText,
  scrollClassName,
  maxVisibleMessages,
  maxVisibleSuggestions,
  onInputChange,
  inputValue,
  onCustomSend,
}: AdvisorConversationProps) {
  // Internal input state (uncontrolled mode)
  const [internalInput, setInternalInput] = useState('');
  const input = inputValue ?? internalInput;
  const setInput = useCallback(
    (val: string) => {
      if (inputValue === undefined) setInternalInput(val);
      onInputChange?.(val);
    },
    [inputValue, onInputChange],
  );

  // Ref tracking current input value for slash command hook
  const inputValueRef = useRef(input);
  inputValueRef.current = input;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Slash command autocomplete
  const slash = useSlashCommands(inputValueRef, setInput, {
    onSendMessage,
  });

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isProcessing]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    // Check if input is a slash command and execute it
    const parsed = parseSlashCommand(text);
    if (parsed) {
      slash.executeCommand(parsed.command);
      return;
    }

    if (onCustomSend) {
      const shouldClear = onCustomSend(text);
      if (shouldClear) setInput('');
      return;
    }

    if (!isConnected) return;
    onSendMessage(text);
    setInput('');
  }, [input, isConnected, onSendMessage, onCustomSend, setInput, slash]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Let slash command menu handle navigation keys first
    if (slash.onKeyDown(e)) return;

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = maxVisibleMessages
    ? messages.slice(-maxVisibleMessages)
    : messages;

  const visibleSuggestions = maxVisibleSuggestions
    ? suggestions.slice(0, maxVisibleSuggestions)
    : suggestions;

  const messageMeta = useMemo(
    () => computeMessageGroups(visibleMessages),
    [visibleMessages],
  );

  const isOverlay = variant === 'overlay';
  const isPanel = variant === 'panel';

  return (
    <>
      {/* Suggestions */}
      {visibleSuggestions.length > 0 && (
        <div className={cn(
          isOverlay && 'px-3 pt-2 space-y-1.5',
          isPanel && 'space-y-1.5 pb-2 border-b border-slate-800/40',
        )}>
          <AnimatePresence mode="popLayout">
            {visibleSuggestions.map((s) => (
              <AdvisorSuggestionCard
                key={s.id}
                suggestion={s}
                variant={variant}
                onAccept={onAcceptSuggestion}
                onDismiss={onDismissSuggestion}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Slot: before messages (e.g. muse insights) */}
      {beforeMessages}

      {/* Messages */}
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-relevant="additions"
        className={cn(
          'overflow-y-auto p-3',
          isOverlay && 'max-h-[50vh] sm:max-h-[400px]',
          isPanel && 'flex-1',
          scrollClassName,
        )}
      >
        {/* Empty state */}
        {messages.length === 0 && emptyState}

        {visibleMessages.map((msg, i) => {
          const meta = messageMeta[i];
          // Tighter spacing within groups, normal spacing between groups
          const isGroupedWithPrev = meta?.groupPosition === 'middle' || meta?.groupPosition === 'last';
          return (
            <React.Fragment key={msg.id}>
              {meta?.dateSeparator && (
                <div className="flex items-center gap-3 py-2 first:pt-0" role="separator">
                  <div className="flex-1 h-px bg-slate-800/60" />
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {meta.dateSeparator}
                  </span>
                  <div className="flex-1 h-px bg-slate-800/60" />
                </div>
              )}
              <div className={isGroupedWithPrev ? 'mt-0.5' : i > 0 ? 'mt-2' : undefined}>
                <AdvisorMessageBubble
                  message={msg}
                  variant={variant}
                  onRetry={msg.isError ? onRetryLastMessage : undefined}
                  groupPosition={meta?.groupPosition ?? 'solo'}
                  showTimestamp={meta?.showTimestamp ?? true}
                  onRate={onRateMessage}
                  onRegenerate={onRegenerateMessage}
                />
              </div>
            </React.Fragment>
          );
        })}
        <AnimatePresence>
          {isProcessing && (
            <AdvisorTypingDots variant={variant} status={processingStatus} />
          )}
        </AnimatePresence>
      </div>

      {/* Rate limit & error banners */}
      <AnimatePresence>
        {isThrottled && <AdvisorRateLimitBanner readyAt={rateLimitedUntil} />}
      </AnimatePresence>
      <AnimatePresence>
        {lastError && (
          <AdvisorErrorBanner
            error={lastError}
            errorLabel={advisorErrorLabel(lastError)}
            onRetry={onRetryLastMessage}
            onDismiss={onClearError}
          />
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={cn(
        'relative border-t border-slate-800/50',
        isOverlay && 'p-3 space-y-1.5',
        isPanel && 'shrink-0 p-2',
      )}>
        {/* Floating transcription bubble */}
        <AnimatePresence>
          {ghostText && !input && (
            <motion.div
              key="transcription-bubble"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-full right-3 mb-2 z-10 bg-cyan-500/8 border border-cyan-500/20 rounded-lg px-3 py-1.5 max-w-[80%] pointer-events-none"
            >
              <motion.span
                className="flex flex-wrap gap-x-1 text-sm text-cyan-300/90"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {ghostText.split(/\s+/).filter(Boolean).map((word, i) => (
                  <motion.span
                    key={`${i}-${word}`}
                    variants={{
                      hidden: { opacity: 0, y: 4 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.span>
              {/* Tail triangle pointing toward mic button */}
              <span className="absolute -bottom-1.5 right-4 w-3 h-3 bg-cyan-500/8 border-b border-r border-cyan-500/20 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slash command autocomplete menu */}
        {slash.isMenuOpen && (
          <SlashCommandMenu
            commands={slash.filteredCommands}
            selectedIndex={slash.selectedIndex}
            onSelect={slash.selectCommand}
            onHover={slash.setSelectedIndex}
            variant={variant}
          />
        )}

        <div className={cn('relative flex items-end', isOverlay && 'gap-2', isPanel && 'gap-1.5')}>
          <div className="relative flex-1">
            <AutoResizeTextarea
              maxLines={3}
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                slash.onInputChange(val);
              }}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder ?? (isConnected ? 'Type / for commands...' : 'Connect to chat')}
              disabled={inputDisabled}
              aria-label="Message to advisor"
              aria-activedescendant={slash.isMenuOpen ? `slash-cmd-${slash.selectedIndex}` : undefined}
              aria-describedby={`advisor-${variant}-input-hint`}
              className={cn(
                'w-full bg-slate-900/60 border border-slate-800/50 text-sm leading-5 text-slate-300 outline-none focus:border-slate-700/60',
                isOverlay && 'rounded-md px-3 py-1.5 focus:ring-2 focus:ring-slate-700/30 focus:shadow-[0_0_0_3px_rgba(100,116,139,0.08)]',
                isPanel && 'rounded px-2 py-1',
                isOverlay ? 'placeholder-slate-500' : 'placeholder-slate-600',
                inputDisabled && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>
          <span id={`advisor-${variant}-input-hint`} className="sr-only">
            Press Enter to send your message
          </span>

          {/* Slot: left of send (e.g. context badge) */}
          {inputSlotLeft}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || (inputDisabled && !onCustomSend)}
            aria-label="Send message"
            className={cn(
              'rounded transition-colors shrink-0',
              isOverlay && 'p-1.5',
              isPanel && 'p-1',
              input.trim() && !inputDisabled
                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                : isPanel
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-500 cursor-not-allowed',
            )}
          >
            <Send className={cn(isOverlay && 'w-4 h-4', isPanel && 'w-3.5 h-3.5')} />
          </button>

          {/* Slot: right of send (e.g. mic button) */}
          {inputSlotRight}
        </div>
      </div>
    </>
  );
}
