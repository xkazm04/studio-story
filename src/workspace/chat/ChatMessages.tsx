'use client';

import React, { useEffect, useRef } from 'react';
import Markdown from 'markdown-to-jsx';
import type { ChatMessage } from '@dzin/core';
import { ToolCallCard } from './ToolCallCard';

// ---------------------------------------------------------------------------
// Relative Time Helper
// ---------------------------------------------------------------------------

function relativeTime(timestamp: number): string {
  const delta = Math.floor((Date.now() - timestamp) / 1000);
  if (delta < 5) return 'just now';
  if (delta < 60) return `${delta}s ago`;
  const mins = Math.floor(delta / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Markdown Options
// ---------------------------------------------------------------------------

const markdownOverrides = {
  overrides: {
    pre: {
      component: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLPreElement>) => (
        <pre data-dzin-chat-code-block="" {...props}>
          {children}
        </pre>
      ),
    },
    code: {
      component: ({
        children,
        className,
        ...props
      }: React.HTMLAttributes<HTMLElement>) => {
        // If inside a <pre>, don't add inline-code attribute
        if (className && typeof className === 'string' && className.startsWith('lang-')) {
          return (
            <code data-language={className.replace('lang-', '')} {...props}>
              {children}
            </code>
          );
        }
        return (
          <code data-dzin-chat-inline-code="" {...props}>
            {children}
          </code>
        );
      },
    },
  },
};

// ---------------------------------------------------------------------------
// MessageItem
// ---------------------------------------------------------------------------

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem = React.memo(
  function MessageItem({ message }: MessageItemProps) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const label = isUser ? 'You' : isSystem ? 'System' : 'Jinn';

    return (
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-semibold ${
              isUser
                ? 'text-slate-300'
                : isSystem
                  ? 'text-yellow-400'
                  : 'text-cyan-400'
            }`}
          >
            {label}
          </span>
          <span className="text-[10px] text-slate-600">
            {relativeTime(message.timestamp)}
          </span>
          {message.isStreaming && (
            <span className="text-[10px] text-cyan-500 animate-pulse">
              typing...
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-slate-200 leading-relaxed">
          {isUser || isSystem ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown options={markdownOverrides}>{message.content}</Markdown>
          )}
        </div>

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    // Skip re-render for completed (non-streaming) messages with same id
    if (
      prev.message.id === next.message.id &&
      !prev.message.isStreaming &&
      !next.message.isStreaming &&
      prev.message.content === next.message.content &&
      prev.message.toolCalls === next.message.toolCalls
    ) {
      return true;
    }
    return false;
  }
);

// ---------------------------------------------------------------------------
// ChatMessages
// ---------------------------------------------------------------------------

interface ChatMessagesProps {
  messages: ChatMessage[];
}

/**
 * Flat message list with auto-scroll to bottom on new messages.
 * User messages render as plain text; assistant messages render via Markdown.
 */
export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div
      data-dzin-chat-messages=""
      className="flex-1 overflow-y-auto min-h-0"
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-600 text-sm">
          Start a conversation with Jinn...
        </div>
      )}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
