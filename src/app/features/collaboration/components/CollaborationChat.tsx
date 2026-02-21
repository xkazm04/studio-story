'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, User, Trash2, Edit2 } from 'lucide-react';
import { CollaborationMessage, MessageType } from '@/app/types/Collaboration';
import { Button, IconButton } from '@/app/components/UI/Button';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

interface CollaborationChatProps {
  projectId: string;
  userId: string;
  userName: string;
  messages: CollaborationMessage[];
  onSendMessage: (message: string, type?: MessageType) => void;
  onEditMessage?: (messageId: string, newMessage: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isConnected: boolean;
  className?: string;
}

export function CollaborationChat({
  projectId,
  userId,
  userName,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  isConnected,
  className,
}: CollaborationChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) return;

    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEdit = (message: CollaborationMessage) => {
    setEditingId(message.id);
    setEditValue(message.message);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim() && onEditMessage) {
      onEditMessage(editingId, editValue.trim());
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-slate-950/50 rounded-lg border border-slate-800/80',
        className
      )}
      data-testid="collaboration-chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Team Chat</h3>
        </div>
        {!isConnected && (
          <span className="text-xs text-amber-400">Reconnecting...</span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
            const isOwn = message.user_id === userId;
            const isEditing = editingId === message.id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'flex gap-2 group',
                  isOwn && 'flex-row-reverse'
                )}
                data-testid={`chat-message-${message.id}`}
              >
                {/* Avatar */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium"
                  title={message.user_name || 'User'}
                >
                  {message.user_avatar ? (
                    <img
                      src={message.user_avatar}
                      alt={message.user_name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="uppercase">
                      {message.user_name?.[0] || 'U'}
                    </span>
                  )}
                </div>

                {/* Message content */}
                <div
                  className={clsx(
                    'flex-1 min-w-0 flex flex-col gap-1',
                    isOwn && 'items-end'
                  )}
                >
                  {/* User name and timestamp */}
                  <div
                    className={clsx(
                      'flex items-center gap-2 text-xs',
                      isOwn && 'flex-row-reverse'
                    )}
                  >
                    <span className="font-medium text-slate-300">
                      {isOwn ? 'You' : message.user_name || 'User'}
                    </span>
                    <span className="text-slate-500">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.edited_at && (
                      <span className="text-slate-500 italic">(edited)</span>
                    )}
                  </div>

                  {/* Message bubble */}
                  {isEditing ? (
                    <div className="w-full max-w-md space-y-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={clsx(
                          'w-full px-3 py-2 rounded-lg resize-none',
                          'bg-slate-900 border border-slate-700',
                          'text-sm text-slate-200',
                          'focus:outline-none focus:ring-2 focus:ring-cyan-500/60'
                        )}
                        rows={2}
                        autoFocus
                        data-testid="chat-edit-input"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          data-testid="chat-edit-cancel-btn"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="xs"
                          onClick={handleSaveEdit}
                          data-testid="chat-edit-save-btn"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'relative px-3 py-2 rounded-lg max-w-md break-words',
                        'text-sm leading-relaxed',
                        isOwn
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                          : 'bg-slate-900/70 border border-slate-700/80 text-slate-200'
                      )}
                    >
                      {message.message_type === 'system' ? (
                        <span className="italic text-slate-400">
                          {message.message}
                        </span>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.message}</p>
                      )}

                      {/* Action buttons (show on hover for own messages) */}
                      {isOwn && message.message_type !== 'system' && (
                        <div
                          className={clsx(
                            'absolute -top-2 right-2 flex gap-1',
                            'opacity-0 group-hover:opacity-100 transition-opacity'
                          )}
                        >
                          {onEditMessage && (
                            <IconButton
                              icon={<Edit2 />}
                              size="xs"
                              variant="secondary"
                              onClick={() => handleEdit(message)}
                              aria-label="Edit message"
                              data-testid="chat-edit-btn"
                            />
                          )}
                          {onDeleteMessage && (
                            <IconButton
                              icon={<Trash2 />}
                              size="xs"
                              variant="danger"
                              onClick={() => onDeleteMessage(message.id)}
                              aria-label="Delete message"
                              data-testid="chat-delete-btn"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2.5 border-t border-slate-800/80">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected ? 'Type a message...' : 'Connecting...'
            }
            disabled={!isConnected}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg resize-none',
              'bg-slate-900/70 border border-slate-700/80',
              'text-sm text-slate-200 placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/60',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[40px] max-h-[120px]'
            )}
            rows={1}
            data-testid="chat-input"
          />
          <Button
            size="md"
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected}
            icon={<Send className="w-4 h-4" />}
            className="px-3"
            data-testid="chat-send-btn"
          >
            Send
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
