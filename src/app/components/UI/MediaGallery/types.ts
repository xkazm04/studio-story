export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface MediaGalleryProps {
  /** Array of media items to display */
  media: MediaItem[];
  /** Number of columns in grid (1-6) */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Gap spacing between items (in Tailwind units) */
  spacing?: 2 | 3 | 4 | 6 | 8;
  /** Enable pagination controls */
  pagination?: boolean;
  /** Items per page when pagination is enabled */
  itemsPerPage?: number;
  /** Color theme for borders and accents */
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'pink' | 'orange' | 'gray';
  /** Render custom actions for each media item */
  renderActions?: (item: MediaItem) => React.ReactNode;
  /** Callback when media item is clicked */
  onMediaClick?: (item: MediaItem) => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Enable keyboard navigation in modal */
  keyboardNavigation?: boolean;
  /** Custom className for container */
  className?: string;
}
