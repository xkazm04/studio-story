import { ReactNode } from 'react';

export type CellEditMode = 'inline' | 'modal' | 'none';
export type ColumnType = 'text' | 'number' | 'boolean' | 'select' | 'custom';

export interface ColumnDefinition<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string; // e.g., 'w-1/4', 'w-24', 'flex-1'
  type?: ColumnType;
  editable?: boolean;
  editMode?: CellEditMode;
  sortable?: boolean;

  // Rendering
  render?: (value: unknown, row: T, index: number) => ReactNode;
  renderEdit?: (value: unknown, onChange: (value: unknown) => void, row: T) => ReactNode;

  // Select options (when type is 'select')
  options?: Array<{ label: string; value: string; disabled?: boolean }>;

  // Custom validation
  validate?: (value: unknown, row: T) => string | null;

  // Formatting
  format?: (value: unknown) => string;

  // Classes
  className?: string;
  headerClassName?: string;
}

export interface RowAction<T = Record<string, unknown>> {
  icon: ReactNode;
  label: string;
  onClick: (row: T, index: number) => void;
  variant?: 'default' | 'danger' | 'primary';
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface EditableDataTableProps<T = Record<string, unknown>> {
  // Data
  columns: ColumnDefinition<T>[];
  data: T[];

  // Row identification
  rowKey: keyof T | ((row: T) => string);

  // Editing
  onRowUpdate?: (row: T, updates: Partial<T>) => Promise<void> | void;
  onRowDelete?: (row: T) => Promise<void> | void;
  onRowAdd?: (newRow: Partial<T>) => Promise<void> | void;

  // Row actions
  actions?: RowAction<T>[];

  // Drag and drop
  draggable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => Promise<void> | void;

  // Selection
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;

  // Display options
  showIndex?: boolean;
  indexHeader?: string;
  showHeader?: boolean;
  showFooter?: boolean;

  // Empty state
  emptyMessage?: string;
  emptyIcon?: ReactNode;

  // Loading state
  loading?: boolean;
  loadingRows?: number;

  // Styling
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);

  // Row expansion
  expandable?: boolean;
  renderExpanded?: (row: T, index: number) => ReactNode;

  // Inline add form
  addable?: boolean;
  renderAddForm?: (onSave: (data: Partial<T>) => void, onCancel: () => void) => ReactNode;

  // Custom row behavior
  onRowClick?: (row: T, index: number) => void;
  highlightRow?: (row: T) => boolean;

  // Keyboard navigation
  keyboardNavigation?: boolean;

  // Undo/Redo
  undoable?: boolean;

  // Test IDs
  'data-testid'?: string;
}

export interface EditableRowState {
  isEditing: boolean;
  editValues: Record<string, unknown>;
  errors: Record<string, string>;
  isExpanded: boolean;
}
