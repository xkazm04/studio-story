# Relationship Map Feature

A comprehensive visual relationship mapping feature using React Flow that renders characters and factions as interactive nodes and their relationships as edges.

## Features

### Core Functionality
- **Interactive Node Graph**: Visual representation of characters and factions as draggable nodes
- **Relationship Edges**: Connections between entities showing relationship types
- **Drag & Drop**: Reposition nodes with automatic position persistence
- **Edge Editing**: Change relationship types on-the-fly with inline editor
- **Relationship Filtering**: Toggle visibility of relationships by type
- **Real-time Sync**: All changes sync with API automatically

### UI Innovations
- **Glassmorphism Design**: Filter panel with frosted glass effect
- **Smooth Animations**: Fade-in animations for nodes and edges
- **Particle Effects**: Hover effects on edges with animated particles
- **Interactive Minimap**: Bird's-eye view of the entire relationship network
- **Dynamic Shadows**: Depth-based shadows on selected nodes
- **Pulse Animations**: Visual feedback for selected elements

## File Structure

```
src/app/features/relationships/
├── types/
│   └── index.ts                      # TypeScript interfaces and enums
├── lib/
│   └── relationshipApi.ts            # API functions for data fetching
├── components/
│   ├── CharacterNode.tsx             # Character node component
│   ├── FactionNode.tsx               # Faction node component
│   ├── RelationshipEdge.tsx          # Custom edge component
│   ├── RelationshipTypeFilter.tsx    # Filter panel component
│   └── RelationshipMapCanvas.tsx     # Main React Flow canvas
└── RelationshipMap.tsx               # Feature wrapper component
```

## Components

### RelationshipMap (Main Component)
The main feature wrapper that handles:
- Data fetching and error handling
- State management for nodes and edges
- Debounced position updates
- Loading and error states

**Props:**
- `projectId: string` - The project ID to load relationships for

**Usage:**
```tsx
import RelationshipMap from '@/app/features/relationships/RelationshipMap';

<RelationshipMap projectId={project.id} />
```

### RelationshipMapCanvas
The React Flow canvas that renders the graph:
- Manages node and edge state
- Handles drag events
- Applies filters
- Configures custom node and edge types

### CharacterNode
Custom node component for characters:
- Displays character avatar or default icon
- Shows character name and type
- Has connection handles on all sides
- Animated hover effects

### FactionNode
Custom node component for factions:
- Displays faction logo or default shield icon
- Shows faction name and description
- Color-coded based on faction theme
- Larger than character nodes for hierarchy

### RelationshipEdge
Custom edge component with:
- Colored labels based on relationship type
- Edit button to change relationship type
- Delete button to remove relationship
- Particle effects on hover
- Inline editor panel

### RelationshipTypeFilter
Glassmorphic filter panel with:
- Checkbox list of all relationship types
- Select/deselect all functionality
- Active filter count display
- Color-coded indicators

## Relationship Types

```typescript
enum RelationshipType {
  ALLY = 'ALLY',           // Green
  ENEMY = 'ENEMY',         // Red
  FAMILY = 'FAMILY',       // Purple
  FRIEND = 'FRIEND',       // Blue
  RIVAL = 'RIVAL',         // Orange
  ROMANTIC = 'ROMANTIC',   // Pink
  BUSINESS = 'BUSINESS',   // Indigo
  MENTOR = 'MENTOR',       // Teal
  NEUTRAL = 'NEUTRAL',     // Gray
  UNKNOWN = 'UNKNOWN'      // Light Gray
}
```

## API Integration

### Endpoints Used
- `GET /characters?project_id={id}` - Fetch all characters
- `GET /factions?project_id={id}` - Fetch all factions
- `GET /relationships?project_id={id}` - Fetch character relationships
- `GET /faction_relationships?project_id={id}` - Fetch faction relationships
- `PUT /relationships/{id}` - Update character relationship
- `PUT /faction_relationships/{id}` - Update faction relationship
- `DELETE /relationships/{id}` - Delete character relationship
- `DELETE /faction_relationships/{id}` - Delete faction relationship

### Position Persistence
Node positions are stored in localStorage with the key:
```
relationship-map-positions-{projectId}
```

Position updates are debounced (500ms) to reduce API calls.

## Keyboard Shortcuts

React Flow provides built-in shortcuts:
- **Space + Drag**: Pan the canvas
- **Scroll**: Zoom in/out
- **Ctrl/Cmd + Scroll**: Zoom faster
- **Backspace/Delete**: Delete selected node/edge

## Styling

### Global Animations
Custom animations are defined in `globals.css`:
- `fadeIn` - Fade and scale animation for nodes/edges
- `pulse` - Pulsing opacity for selected elements
- `float` - Vertical floating animation
- `shimmer` - Shimmer effect for loading states

### Glassmorphism
Filter panel uses:
```css
backdrop-blur-xl bg-white/10 border border-white/20
```

## Future Enhancements

1. **Force-Directed Layout**: Automatic positioning using physics simulation
2. **Relationship Strength**: Visual indication of relationship intensity
3. **Multi-Selection**: Select and move multiple nodes at once
4. **Export/Import**: Save and load custom layouts
5. **Search**: Find specific characters or factions
6. **Clustering**: Group related nodes automatically
7. **Timeline Mode**: View relationships at different story points
8. **3D Mode**: Three-dimensional graph visualization

## Performance Considerations

- **Dynamic Import**: Component is lazy-loaded for better initial load time
- **Memoization**: Node and edge components use `React.memo`
- **Debouncing**: Position updates are debounced to reduce API calls
- **Virtual Rendering**: React Flow handles large graphs efficiently
- **Cached Data**: React Query caches API responses

## Troubleshooting

### Nodes not appearing
- Check that characters/factions exist in the project
- Verify API endpoints are returning data
- Check browser console for errors

### Positions not persisting
- Ensure localStorage is enabled
- Check browser storage quota
- Verify projectId is consistent

### Performance issues
- Reduce number of active filters
- Collapse minimap if not needed
- Use force-directed layout for large graphs

## Integration Example

Add to your application layout:

```tsx
import dynamic from 'next/dynamic';

const RelationshipMap = dynamic(
  () => import('@/app/features/relationships/RelationshipMap'),
  { ssr: false }
);

function YourComponent() {
  const { selectedProject } = useProjectStore();

  return (
    <div className="h-screen">
      {selectedProject && (
        <RelationshipMap projectId={selectedProject.id} />
      )}
    </div>
  );
}
```

## Dependencies

- `reactflow` - Core graph visualization library
- `framer-motion` - Animation utilities
- `lucide-react` - Icon components
- `@tanstack/react-query` - Data fetching and caching

## License

Part of the Story application.
