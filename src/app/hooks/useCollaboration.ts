import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WSMessage,
  WSMessageType,
  PresenceUpdate,
  CollaborationSession,
  getUserColor,
} from '../types/Collaboration';

interface UseCollaborationOptions {
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  enabled?: boolean;
}

interface CollaborationHookReturn {
  isConnected: boolean;
  sessions: CollaborationSession[];
  sendMessage: <T = any>(type: WSMessageType, payload: T) => void;
  disconnect: () => void;
  error: string | null;
}

/**
 * Hook for real-time collaboration via WebSocket
 * Provides presence tracking, cursor synchronization, and real-time operations
 */
export function useCollaboration({
  projectId,
  userId,
  userName,
  userAvatar,
  enabled = true,
}: UseCollaborationOptions): CollaborationHookReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userColor = getUserColor(userId);

  // Send WebSocket message
  const sendMessage = useCallback(
    <T = any>(type: WSMessageType, payload: T) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message: WSMessage<T> = {
          type,
          payload,
          timestamp: Date.now(),
          user_id: userId,
          message_id: crypto.randomUUID(),
        };
        wsRef.current.send(JSON.stringify(message));
      }
    },
    [userId]
  );

  // Handle incoming WebSocket messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'presence:join':
          case 'presence:update':
            const presenceUpdate = message.payload as PresenceUpdate;
            setSessions((prev) => {
              const existing = prev.find((s) => s.user_id === presenceUpdate.user_id);
              if (existing) {
                return prev.map((s) =>
                  s.user_id === presenceUpdate.user_id
                    ? {
                        ...s,
                        cursor_position: presenceUpdate.cursor_position,
                        active_view: presenceUpdate.active_view,
                        last_ping: new Date().toISOString(),
                      }
                    : s
                );
              } else {
                const newSession: CollaborationSession = {
                  id: crypto.randomUUID(),
                  project_id: projectId,
                  user_id: presenceUpdate.user_id,
                  socket_id: crypto.randomUUID(),
                  joined_at: new Date().toISOString(),
                  last_ping: new Date().toISOString(),
                  user_name: presenceUpdate.user_name,
                  user_avatar: presenceUpdate.user_avatar,
                  user_color: presenceUpdate.user_color,
                  cursor_position: presenceUpdate.cursor_position,
                  active_view: presenceUpdate.active_view,
                };
                return [...prev, newSession];
              }
            });
            break;

          case 'presence:leave':
            setSessions((prev) => prev.filter((s) => s.user_id !== message.user_id));
            break;

          case 'sync:response':
            // Sync state with server
            const syncData = message.payload as { sessions: CollaborationSession[] };
            setSessions(syncData.sessions || []);
            break;

          case 'error':
            setError(message.payload?.message || 'WebSocket error');
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    },
    [projectId]
  );

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!enabled || !projectId || !userId) return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}?projectId=${projectId}&userId=${userId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Send initial presence
        sendMessage('presence:join', {
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          user_color: userColor,
          status: 'online',
        } as PresenceUpdate);

        // Request state sync
        sendMessage('sync:request', { project_id: projectId });

        // Set up ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendMessage('presence:update', {
              user_id: userId,
              user_name: userName,
              user_avatar: userAvatar,
              user_color: userColor,
              status: 'online',
            } as PresenceUpdate);
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to connect');
    }
  }, [enabled, projectId, userId, userName, userAvatar, userColor, handleMessage, sendMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Send leave message
      sendMessage('presence:leave', {
        user_id: userId,
        user_name: userName,
        user_color: userColor,
        status: 'offline',
      } as PresenceUpdate);

      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    setIsConnected(false);
    setSessions([]);
  }, [userId, userName, userColor, sendMessage]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    sessions,
    sendMessage,
    disconnect,
    error,
  };
}
