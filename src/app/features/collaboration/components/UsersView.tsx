'use client';

import { motion } from 'framer-motion';
import {
  UserPlus,
  Crown,
  Shield,
  Edit,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Button, IconButton } from '@/app/components/UI/Button';
import { UserPresenceBadge } from './PresenceIndicator';
import {
  ProjectCollaborator,
  CollaboratorRole,
  CollaborationSession,
} from '@/app/types/Collaboration';
import { clsx } from 'clsx';

const ROLE_ICONS: Record<CollaboratorRole, React.ComponentType<{ className?: string }>> = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
};

const ROLE_COLORS: Record<CollaboratorRole, string> = {
  owner: 'text-amber-400',
  admin: 'text-purple-400',
  editor: 'text-cyan-400',
  viewer: 'text-slate-400',
};

interface UsersViewProps {
  sessions: CollaborationSession[];
  collaborators: ProjectCollaborator[];
  canInvite: boolean;
  canManageRoles: boolean;
}

export function UsersView({
  sessions,
  collaborators,
  canInvite,
  canManageRoles,
}: UsersViewProps) {
  return (
    <motion.div
      key="users"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto p-4 space-y-3"
    >
      {/* Invite button */}
      {canInvite && (
        <Button
          size="sm"
          variant="secondary"
          icon={<UserPlus />}
          fullWidth
          data-testid="invite-collaborator-btn"
        >
          Invite Collaborators
        </Button>
      )}

      {/* Online users */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Online ({sessions.length})
        </h3>
        <div className="space-y-2">
          {sessions.map((session) => (
            <UserPresenceBadge
              key={session.socket_id}
              session={session}
              showName
              size="md"
            />
          ))}
        </div>
      </div>

      {/* All collaborators */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          All Collaborators ({collaborators.length})
        </h3>
        <div className="space-y-2">
          {collaborators.map((collab) => {
            const RoleIcon = ROLE_ICONS[collab.role];
            const isOnline = sessions.some(
              (s) => s.user_id === collab.user_id
            );

            return (
              <div
                key={collab.id}
                className={clsx(
                  'flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg',
                  'bg-slate-900/40 border border-slate-700/60',
                  'transition-colors hover:border-cyan-500/40'
                )}
                data-testid={`collaborator-${collab.user_id}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {collab.user_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">
                      {collab.user_name || 'User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <RoleIcon
                        className={clsx(
                          'w-3 h-3',
                          ROLE_COLORS[collab.role]
                        )}
                      />
                      <span
                        className={clsx(
                          'text-xs capitalize',
                          ROLE_COLORS[collab.role]
                        )}
                      >
                        {collab.role}
                      </span>
                    </div>
                  </div>
                </div>
                {canManageRoles && (
                  <IconButton
                    icon={<ChevronRight />}
                    size="xs"
                    variant="ghost"
                    aria-label="Manage user"
                    data-testid={`manage-user-${collab.user_id}-btn`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export { ROLE_ICONS, ROLE_COLORS };
