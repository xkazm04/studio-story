import type { LucideIcon } from 'lucide-react';
import type { HeaderAccent } from '../shared/PanelFrame';
import type { PanelDensity } from '@/workspace/types';

export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'image' | 'badge' | 'date' | 'number' | 'avatar';
  displayIn?: ('card' | 'list-item' | 'detail' | 'tree-node')[];
  truncate?: boolean;
  className?: string;
  /** When true, the DataList header renders a clickable sort toggle for this field */
  sortable?: boolean;
  /** When true, this field appears as a faceted filter in the filter bar */
  filterable?: boolean;
}

export interface BaseAdapterProps {
  onClose?: () => void;
  density?: PanelDensity;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  /** Called when a context menu action is selected. Receives actionId and the entity. */
  onContextMenuAction?: (actionId: string, entity: unknown) => void;
}

export interface BasePrimitiveProps {
  title: string;
  icon: LucideIcon;
  headerAccent?: HeaderAccent;
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onTriggerPrompt?: (text: string, label?: string) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  density?: PanelDensity;
}

export interface TreeNode {
  id: string;
  label: string;
  icon?: LucideIcon;
  children?: TreeNode[];
  meta?: string;
}

export interface DetailSection {
  title: string;
  subtitle?: string;
  fields: DetailField[];
}

export interface DetailField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'readonly' | 'textarea';
  editable?: boolean;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: string;
}

// ─── Multi-Select & Bulk Actions ─────────────────────────

export interface BulkAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'danger';
}
