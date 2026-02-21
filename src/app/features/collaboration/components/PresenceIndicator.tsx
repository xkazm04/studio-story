'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { CollaborationSession } from '@/app/types/Collaboration';
import { clsx } from 'clsx';

interface PresenceIndicatorProps {
  sessions: CollaborationSession[];
  maxAvatars?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const offsetClasses = {
  sm: '-ml-2',
  md: '-ml-2.5',
  lg: '-ml-3',
};

export function PresenceIndicator({
  sessions,
  maxAvatars = 5,
  size = 'md',
  showCount = true,
  className,
}: PresenceIndicatorProps) {
  const activeSessions = sessions.filter((s) => s.user_id);
  const displaySessions = activeSessions.slice(0, maxAvatars);
  const remainingCount = Math.max(0, activeSessions.length - maxAvatars);

  if (activeSessions.length === 0) {
    return (
      <div
        className={clsx(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
          'bg-slate-900/40 border border-slate-700/60 text-slate-400',
          className
        )}
        data-testid="presence-indicator-empty"
      >
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs">No active users</span>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex items-center gap-2', className)}
      data-testid="presence-indicator"
    >
      {/* Avatar Stack */}
      <div className="flex items-center">
        <AnimatePresence mode="popLayout">
          {displaySessions.map((session, index) => (
            <motion.div
              key={session.socket_id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={clsx(
                'relative flex items-center justify-center rounded-full',
                'border-2 border-slate-950 font-medium',
                'transition-transform hover:scale-110 hover:z-10',
                sizeClasses[size],
                index > 0 && offsetClasses[size]
              )}
              style={{
                backgroundColor: session.user_color || '#06b6d4',
                color: 'white',
              }}
              title={session.user_name || 'User'}
              data-testid={`presence-avatar-${session.user_id}`}
            >
              {session.user_avatar ? (
                <img
                  src={session.user_avatar}
                  alt={session.user_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="uppercase">
                  {session.user_name?.[0] || 'U'}
                </span>
              )}
              {/* Online indicator dot */}
              <div
                className={clsx(
                  'absolute -bottom-0.5 -right-0.5 rounded-full',
                  'bg-emerald-500 border-2 border-slate-950',
                  size === 'sm' && 'w-2 h-2',
                  size === 'md' && 'w-2.5 h-2.5',
                  size === 'lg' && 'w-3 h-3'
                )}
              />
            </motion.div>
          ))}

          {/* Remaining count badge */}
          {remainingCount > 0 && (
            <motion.div
              key="remaining"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={clsx(
                'flex items-center justify-center rounded-full',
                'bg-slate-700 border-2 border-slate-950',
                'text-slate-300 font-medium',
                sizeClasses[size],
                offsetClasses[size]
              )}
              title={`${remainingCount} more`}
              data-testid="presence-remaining-count"
            >
              +{remainingCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Count indicator */}
      {showCount && (
        <div
          className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-md',
            'bg-slate-900/40 border border-slate-700/60',
            'text-slate-300 text-xs font-medium'
          )}
          data-testid="presence-count"
        >
          <Users className="w-3 h-3" />
          <span>{activeSessions.length} online</span>
        </div>
      )}
    </div>
  );
}

// Compact presence indicator for headers
interface CompactPresenceProps {
  sessions: CollaborationSession[];
  className?: string;
}

export function CompactPresence({ sessions, className }: CompactPresenceProps) {
  const activeCount = sessions.filter((s) => s.user_id).length;

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-emerald-500/10 border border-emerald-500/30',
        'text-emerald-400 text-xs font-medium',
        className
      )}
      data-testid="compact-presence"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>{activeCount} online</span>
    </motion.div>
  );
}

// Individual user presence badge
interface UserPresenceBadgeProps {
  session: CollaborationSession;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserPresenceBadge({
  session,
  showName = true,
  size = 'md',
  className,
}: UserPresenceBadgeProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg',
        'bg-slate-900/40 border border-slate-700/60',
        'transition-colors hover:border-cyan-500/40',
        className
      )}
      data-testid={`user-presence-${session.user_id}`}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'relative flex items-center justify-center rounded-full',
          'font-medium border-2 border-slate-800',
          sizeClasses[size]
        )}
        style={{
          backgroundColor: session.user_color || '#06b6d4',
          color: 'white',
        }}
      >
        {session.user_avatar ? (
          <img
            src={session.user_avatar}
            alt={session.user_name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="uppercase">
            {session.user_name?.[0] || 'U'}
          </span>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
      </div>

      {/* Name and status */}
      {showName && (
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">
            {session.user_name || 'User'}
          </div>
          {session.active_view && (
            <div className="text-xs text-slate-400 truncate">
              Viewing: {session.active_view}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
