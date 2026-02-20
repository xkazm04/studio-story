// Real-time collaboration types

export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type CollaboratorStatus = 'active' | 'invited' | 'removed';
export type MessageType = 'text' | 'system' | 'mention' | 'file';
export type DocumentType = 'scene' | 'character' | 'beat' | 'project' | 'act' | 'faction' | 'relationship';
export type OperationType = 'insert' | 'delete' | 'replace' | 'format';

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by?: string;
  joined_at: string;
  last_active?: string;
  status: CollaboratorStatus;
  permissions?: CollaboratorPermissions;

  // Extended fields (joined from other tables)
  user_name?: string;
  user_avatar?: string;
  is_online?: boolean;
}

export interface CollaboratorPermissions {
  can_edit?: boolean;
  can_delete?: boolean;
  can_invite?: boolean;
  can_manage_roles?: boolean;
  can_export?: boolean;
  can_view_history?: boolean;
  allowed_sections?: string[]; // Which features they can access
}

export interface CollaborationSession {
  id: string;
  project_id: string;
  user_id: string;
  socket_id: string;
  joined_at: string;
  last_ping: string;
  cursor_position?: CursorPosition;
  active_view?: string;

  // Extended fields
  user_name?: string;
  user_avatar?: string;
  user_color?: string; // For visual presence indicators
}

export interface CursorPosition {
  x: number;
  y: number;
  element_id?: string;
  selection_start?: number;
  selection_end?: number;
}

export interface CollaborationMessage {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  message_type: MessageType;
  metadata?: MessageMetadata;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;

  // Extended fields
  user_name?: string;
  user_avatar?: string;
}

export interface MessageMetadata {
  mentions?: string[]; // User IDs mentioned
  attachments?: string[]; // File URLs
  reply_to?: string; // Message ID being replied to
  reactions?: Record<string, string[]>; // emoji -> user_ids
}

export interface DocumentVersion {
  id: string;
  project_id: string;
  document_type: DocumentType;
  document_id: string;
  version_number: number;
  content: string; // JSON snapshot
  created_by: string;
  created_at: string;
  change_summary?: string;
  metadata?: VersionMetadata;

  // Extended fields
  user_name?: string;
}

export interface VersionMetadata {
  diff?: any; // Structured diff
  tags?: string[];
  auto_saved?: boolean;
}

export interface OperationalTransform {
  id: string;
  project_id: string;
  document_type: DocumentType;
  document_id: string;
  user_id: string;
  operation: Operation;
  client_timestamp: number;
  server_timestamp: string;
  applied: boolean;
  sequence_number?: number;
}

export interface Operation {
  type: OperationType;
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  user_id: string;
}

export interface CollaborationLock {
  id: string;
  project_id: string;
  document_type: DocumentType;
  document_id: string;
  field_path?: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;

  // Extended fields
  user_name?: string;
}

// WebSocket message types
export type WSMessageType =
  | 'presence:join'
  | 'presence:leave'
  | 'presence:update'
  | 'cursor:move'
  | 'document:operation'
  | 'document:lock'
  | 'document:unlock'
  | 'chat:message'
  | 'chat:typing'
  | 'sync:request'
  | 'sync:response'
  | 'error';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
  user_id?: string;
  message_id?: string;
}

export interface PresenceUpdate {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_color: string;
  cursor_position?: CursorPosition;
  active_view?: string;
  status: 'online' | 'away' | 'offline';
}

export interface CollaborationState {
  sessions: CollaborationSession[];
  messages: CollaborationMessage[];
  active_locks: CollaborationLock[];
  pending_operations: OperationalTransform[];
}

// Role-based permission utilities
export const ROLE_PERMISSIONS: Record<CollaboratorRole, CollaboratorPermissions> = {
  owner: {
    can_edit: true,
    can_delete: true,
    can_invite: true,
    can_manage_roles: true,
    can_export: true,
    can_view_history: true,
  },
  admin: {
    can_edit: true,
    can_delete: true,
    can_invite: true,
    can_manage_roles: false,
    can_export: true,
    can_view_history: true,
  },
  editor: {
    can_edit: true,
    can_delete: false,
    can_invite: false,
    can_manage_roles: false,
    can_export: true,
    can_view_history: true,
  },
  viewer: {
    can_edit: false,
    can_delete: false,
    can_invite: false,
    can_manage_roles: false,
    can_export: true,
    can_view_history: false,
  },
};

export function hasPermission(
  role: CollaboratorRole,
  permission: keyof CollaboratorPermissions,
  customPermissions?: CollaboratorPermissions
): boolean {
  if (customPermissions && permission in customPermissions) {
    return customPermissions[permission] === true;
  }
  return ROLE_PERMISSIONS[role][permission] === true;
}

// User color assignment for presence indicators
export const USER_COLORS = [
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

export function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
}
