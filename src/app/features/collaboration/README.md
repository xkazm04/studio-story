# Real-Time Collaborative Project Workspaces

## Overview

A comprehensive real-time collaboration system that enables multiple users to work simultaneously on story projects. The feature includes WebSocket-based communication, presence awareness, conflict-free editing, team chat, role-based permissions, and version history tracking.

## Key Features

### 🔄 Real-Time Communication
- **WebSocket Infrastructure**: Persistent bidirectional communication with automatic reconnection
- **Presence Tracking**: See who's online, their current view, and cursor position
- **Live Updates**: Changes propagate instantly to all connected collaborators

### 💬 Team Chat
- **In-App Messaging**: Send and receive messages in real-time
- **Message Management**: Edit and delete your own messages
- **Message History**: Paginated message history with timestamps
- **System Notifications**: Automated messages for important events

### 👥 Presence Indicators
- **Online Status**: Visual indicators showing active collaborators
- **User Avatars**: Color-coded avatars with initials or profile pictures
- **Activity Tracking**: See what section each user is viewing
- **Cursor Tracking**: Real-time cursor position synchronization (when implemented)

### 📝 Conflict-Free Editing
- **Operational Transforms**: Algorithm for resolving concurrent edits
- **Optimistic Updates**: Instant local updates with server reconciliation
- **Change Propagation**: Edits sync automatically across all clients

### 🔐 Role-Based Permissions
- **Owner**: Full control including role management
- **Admin**: Edit, delete, invite, and export capabilities
- **Editor**: Edit and export permissions
- **Viewer**: Read-only access with export capability
- **Custom Permissions**: Override default role permissions per user

### 📚 Version History
- **Document Snapshots**: Automatic versioning of all changes
- **Change Tracking**: View who made what changes and when
- **Version Restoration**: Roll back to previous versions (when implemented)
- **Diff Visualization**: See what changed between versions (when implemented)

## Architecture

### Component Structure

```
src/app/features/collaboration/
├── components/
│   ├── CollaborationPanel.tsx      # Main collaboration UI panel
│   ├── CollaborationChat.tsx       # Team chat component
│   ├── PresenceIndicator.tsx       # User presence indicators
│   └── VersionHistory.tsx          # Version history viewer (stub)
├── lib/
│   └── operationalTransform.ts     # OT engine for conflict-free editing
└── README.md
```

### API Endpoints

```
/api/collaboration/
├── ws/                # WebSocket connection info
├── collaborators/     # Manage project collaborators
├── sessions/          # Active collaboration sessions
├── messages/          # Team chat messages
└── versions/          # Document version history
```

### Database Schema

```sql
-- Core tables
project_collaborators       # Who has access to projects
collaboration_sessions      # Active WebSocket connections
collaboration_messages      # Team chat messages
document_versions          # Version history snapshots
operational_transforms     # OT operations log
collaboration_locks        # Optimistic locking
```

## Usage

### Basic Integration

```tsx
import { CollaborationPanel } from '@/app/features/collaboration/components/CollaborationPanel';
import { PresenceIndicator } from '@/app/features/collaboration/components/PresenceIndicator';
import { useCollaboration } from '@/app/hooks/useCollaboration';

function ProjectWorkspace() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const { isConnected, sessions } = useCollaboration({
    projectId: 'project-123',
    userId: 'user-456',
    userName: 'John Doe',
    enabled: true,
  });

  return (
    <div>
      {/* Header with presence indicator */}
      <header>
        <PresenceIndicator sessions={sessions} />
        <button onClick={() => setIsPanelOpen(true)}>
          Collaborate
        </button>
      </header>

      {/* Main collaboration panel */}
      <CollaborationPanel
        projectId="project-123"
        userId="user-456"
        userName="John Doe"
        userRole="editor"
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
```

### WebSocket Hook

```tsx
const {
  isConnected,      // Connection status
  sessions,         // Active user sessions
  sendMessage,      // Send WebSocket message
  disconnect,       // Manual disconnect
  error,           // Error state
} = useCollaboration({
  projectId: 'project-123',
  userId: 'user-456',
  userName: 'John Doe',
  userAvatar: 'https://...',
  enabled: true,
});

// Send custom message
sendMessage('cursor:move', {
  x: 100,
  y: 200,
  element_id: 'textarea-main',
});
```

### Operational Transforms

```tsx
import { OperationalTransformEngine, createOperation } from '@/app/features/collaboration/lib/operationalTransform';

// Initialize OT engine
const otEngine = new OperationalTransformEngine((op) => {
  // Send operation to server via WebSocket
  sendMessage('document:operation', op);
});

// Apply local edit
const handleTextChange = (oldText: string, newText: string, cursorPos: number) => {
  const operation = createOperation(oldText, newText, cursorPos);
  if (operation) {
    const updatedText = otEngine.applyLocal(oldText, operation);
    setText(updatedText);
  }
};

// Receive server operation
const handleServerOperation = (serverOp: TextOperation) => {
  const updatedText = otEngine.applyServer(text, serverOp);
  setText(updatedText);
};
```

### Checking Permissions

```tsx
import { hasPermission, ROLE_PERMISSIONS } from '@/app/types/Collaboration';

const userRole = 'editor';

if (hasPermission(userRole, 'can_edit')) {
  // Show edit UI
}

if (hasPermission(userRole, 'can_invite')) {
  // Show invite button
}

// With custom permissions
const customPerms = { can_edit: false, can_export: true };
if (hasPermission(userRole, 'can_edit', customPerms)) {
  // Custom override applied
}
```

## WebSocket Protocol

### Message Format

```typescript
interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
  user_id?: string;
  message_id?: string;
}
```

### Message Types

- `presence:join` - User joins project
- `presence:leave` - User leaves project
- `presence:update` - User activity update
- `cursor:move` - Cursor position update
- `document:operation` - Document edit operation
- `document:lock` - Request edit lock
- `document:unlock` - Release edit lock
- `chat:message` - Chat message
- `chat:typing` - User typing indicator
- `sync:request` - Request state sync
- `sync:response` - State sync response
- `error` - Error message

## Deployment Notes

### WebSocket Server

The current implementation provides HTTP endpoints and client-side WebSocket logic. For production, you'll need to set up a WebSocket server:

**Option 1: Separate WebSocket Server**
- Deploy a Node.js WebSocket server (using `ws` or `socket.io`)
- Set `NEXT_PUBLIC_WS_URL` environment variable
- Handle WebSocket connections and message routing

**Option 2: Next.js API Routes (Limited)**
- Use Server-Sent Events (SSE) for one-way communication
- Combine with HTTP polling for bidirectional needs
- Not recommended for high-frequency updates

**Option 3: Third-Party Service**
- Use services like Pusher, Ably, or Supabase Realtime
- Integrate with existing API endpoints
- Simplifies deployment but adds dependency

### Environment Variables

```env
# WebSocket server URL
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Or for production
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
```

### Database Migration

Run the Supabase migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# Execute: db/migrations/017_add_collaboration_tables_supabase.sql
```

## Performance Considerations

### Optimization Strategies

1. **Message Batching**: Group multiple operations into single WebSocket message
2. **Throttling**: Limit cursor update frequency (e.g., max 10 per second)
3. **Compression**: Use message compression for large payloads
4. **Presence Debouncing**: Update presence status every 30 seconds, not on every action
5. **Session Cleanup**: Automatically remove stale sessions after 10 minutes
6. **Lock Expiration**: Auto-expire document locks after 5 minutes

### Monitoring

- Track active WebSocket connections
- Monitor message throughput
- Log operational transform conflicts
- Track session duration and user activity

## Security

### Implemented Security Features

1. **Row Level Security (RLS)**: Database policies enforce user permissions
2. **Role-Based Access Control**: Four-tier permission system
3. **Message Ownership**: Users can only edit/delete their own messages
4. **Project Membership**: Only collaborators can access project data
5. **Soft Deletes**: Messages are marked deleted, not removed

### Recommendations

1. **Authentication**: Integrate with your auth system (Supabase Auth, Auth0, etc.)
2. **Rate Limiting**: Implement rate limits on API endpoints and WebSocket messages
3. **Input Validation**: Sanitize all user input (messages, document content)
4. **XSS Protection**: Use React's built-in XSS protection, avoid `dangerouslySetInnerHTML`
5. **CSRF Tokens**: Implement CSRF protection for state-changing operations
6. **Audit Logging**: Log all permission changes and sensitive operations

## Testing

### Manual Testing Checklist

- [ ] Multiple users can connect to same project simultaneously
- [ ] Presence indicators show correct online/offline status
- [ ] Chat messages send and receive in real-time
- [ ] User can edit and delete their own messages
- [ ] Role permissions correctly restrict actions
- [ ] WebSocket reconnects after connection loss
- [ ] Operations transform correctly with concurrent edits
- [ ] Version history captures document changes
- [ ] Lock system prevents conflicting edits

### Automated Tests (TODO)

```bash
# Unit tests
npm run test src/app/features/collaboration

# Integration tests
npm run test:integration collaboration

# E2E tests
npm run test:e2e collaboration-flow
```

## Future Enhancements

### Planned Features

1. **Cursor Tracking**: Show real-time cursor positions of all users
2. **Selection Highlighting**: Highlight text selected by other users
3. **Collaborative Drawing**: Real-time collaborative canvas/whiteboard
4. **Voice/Video Chat**: Integrate WebRTC for audio/video communication
5. **Presence Awareness**: Show what each user is actively editing
6. **Conflict Resolution UI**: Visual diff tool for resolving merge conflicts
7. **Offline Support**: Queue operations when offline, sync when reconnected
8. **Mobile Optimization**: Responsive design for mobile collaboration

### Subscription Tiers

**Free Tier**
- Up to 3 collaborators per project
- Basic chat (100 messages history)
- 7-day version history

**Pro Tier** ($9.99/month)
- Up to 10 collaborators per project
- Unlimited chat history
- 30-day version history
- Role management

**Enterprise Tier** ($49.99/month)
- Unlimited collaborators
- Full version history
- Advanced permissions
- Priority support
- Export work streams
- API access

## Troubleshooting

### Common Issues

**WebSocket won't connect**
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify WebSocket server is running
- Check firewall/proxy settings

**Messages not syncing**
- Verify both users are online and connected
- Check network connectivity
- Review browser console for errors

**Stale presence indicators**
- Session cleanup runs every 10 minutes
- Manually refresh by reconnecting

**Permission errors**
- Verify user role in `project_collaborators` table
- Check RLS policies in Supabase

## Support

For issues or questions:
- Review this documentation
- Check implementation logs in database
- Review browser console and network tab
- Contact development team

## License

Proprietary - Part of Story Project Management System
