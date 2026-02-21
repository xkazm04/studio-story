'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  History,
  Settings,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/app/components/UI/Card';
import { IconButton } from '@/app/components/UI/Button';
import { CollaborationChat } from './CollaborationChat';
import { PresenceIndicator } from './PresenceIndicator';
import { UsersView } from './UsersView';
import { useCollaboration } from '@/app/hooks/useCollaboration';
import {
  CollaborationMessage,
  ProjectCollaborator,
  CollaboratorRole,
  hasPermission,
} from '@/app/types/Collaboration';
import { clsx } from 'clsx';

interface CollaborationPanelProps {
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: CollaboratorRole;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type PanelView = 'chat' | 'users' | 'history' | 'settings';

export function CollaborationPanel({
  projectId,
  userId,
  userName,
  userAvatar,
  userRole = 'editor',
  isOpen,
  onClose,
  className,
}: CollaborationPanelProps) {
  const [activeView, setActiveView] = useState<PanelView>('chat');
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);

  const { isConnected, sessions, sendMessage, error } = useCollaboration({
    projectId,
    userId,
    userName,
    userAvatar,
    enabled: isOpen,
  });

  // Fetch messages and collaborators
  useEffect(() => {
    if (!isOpen || !projectId) return;

    // Fetch messages
    fetch(`/api/collaboration/messages?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(console.error);

    // Fetch collaborators
    fetch(`/api/collaboration/collaborators?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => setCollaborators(data))
      .catch(console.error);
  }, [isOpen, projectId]);

  const handleSendMessage = async (message: string) => {
    try {
      const response = await fetch('/api/collaboration/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          user_id: userId,
          message,
          message_type: 'text',
        }),
      });

      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]);

      // Broadcast to other users
      sendMessage('chat:message', { message: newMessage });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newMessage: string) => {
    try {
      const response = await fetch('/api/collaboration/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          message: newMessage,
          user_id: userId,
        }),
      });

      const updated = await response.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m))
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(
        `/api/collaboration/messages?messageId=${messageId}&userId=${userId}`,
        { method: 'DELETE' }
      );

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const canInvite = hasPermission(userRole, 'can_invite');
  const canManageRoles = hasPermission(userRole, 'can_manage_roles');
  const canViewHistory = hasPermission(userRole, 'can_view_history');

  const views: { id: PanelView; icon: any; label: string; enabled: boolean }[] =
    [
      { id: 'chat', icon: MessageSquare, label: 'Chat', enabled: true },
      { id: 'users', icon: Users, label: 'Users', enabled: true },
      {
        id: 'history',
        icon: History,
        label: 'History',
        enabled: canViewHistory,
      },
      {
        id: 'settings',
        icon: Settings,
        label: 'Settings',
        enabled: canManageRoles,
      },
    ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={clsx(
            'fixed right-0 top-0 h-full w-[400px] z-50',
            'bg-slate-950/95 backdrop-blur-lg',
            'border-l border-slate-800/80',
            'shadow-2xl shadow-black/50',
            'flex flex-col',
            className
          )}
          data-testid="collaboration-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">
                Collaboration
              </h2>
            </div>
            <IconButton
              icon={<X />}
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close collaboration panel"
              data-testid="collaboration-close-btn"
            />
          </div>

          {/* Connection status */}
          {error && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Presence indicator */}
          <div className="px-4 py-2 border-b border-slate-800/80">
            <PresenceIndicator
              sessions={sessions}
              maxAvatars={8}
              size="sm"
              showCount
            />
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-800/80 overflow-x-auto">
            {views
              .filter((v) => v.enabled)
              .map((view) => {
                const Icon = view.icon;
                const isActive = activeView === view.id;

                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                      'text-xs font-medium transition-all',
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                    )}
                    data-testid={`collaboration-tab-${view.id}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {view.label}
                  </button>
                );
              })}
          </div>

          {/* View content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeView === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <CollaborationChat
                    projectId={projectId}
                    userId={userId}
                    userName={userName}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    isConnected={isConnected}
                    className="h-full"
                  />
                </motion.div>
              )}

              {activeView === 'users' && (
                <UsersView
                  sessions={sessions}
                  collaborators={collaborators}
                  canInvite={canInvite}
                  canManageRoles={canManageRoles}
                />
              )}

              {activeView === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <Card variant="glass" padding="md">
                    <CardHeader title="Version History" />
                    <CardContent>
                      <p className="text-sm text-slate-400">
                        Version history tracking will appear here. View and
                        restore previous versions of your collaborative work.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeView === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <Card variant="glass" padding="md">
                    <CardHeader title="Collaboration Settings" />
                    <CardContent>
                      <p className="text-sm text-slate-400">
                        Manage permissions, roles, and collaboration settings
                        here.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
