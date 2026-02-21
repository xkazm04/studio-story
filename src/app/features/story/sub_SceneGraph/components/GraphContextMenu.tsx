/**
 * GraphContextMenu Component
 * Right-click context menu for scene graph operations
 *
 * Features:
 * - Node operations (edit, duplicate, delete, set as start)
 * - Edge operations (remove connection)
 * - Canvas operations (add new scene, fit view, export)
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Copy,
  Trash2,
  Link,
  Unlink,
  Play,
  Plus,
  GitBranch,
  Target,
  Maximize,
  Download,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuTarget {
  type: 'node' | 'edge' | 'canvas';
  nodeId?: string;
  edgeId?: string;
  sourceId?: string;
  targetId?: string;
}

export interface NodeMenuActions {
  onEdit?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onSetAsStart?: (nodeId: string) => void;
  onCreateChoice?: (nodeId: string) => void;
  onNavigateTo?: (nodeId: string) => void;
}

export interface EdgeMenuActions {
  onRemoveConnection?: (edgeId: string) => void;
  onEditCondition?: (edgeId: string) => void;
}

export interface CanvasMenuActions {
  onAddScene?: (position: ContextMenuPosition) => void;
  onFitView?: () => void;
  onExport?: () => void;
  onToggleHeatmap?: () => void;
  onShowAnalytics?: () => void;
}

interface GraphContextMenuProps {
  position: ContextMenuPosition | null;
  target: ContextMenuTarget | null;
  nodeData?: {
    label: string;
    isFirst: boolean;
    isOrphaned: boolean;
    isDeadEnd: boolean;
    choiceCount: number;
  };
  nodeActions?: NodeMenuActions;
  edgeActions?: EdgeMenuActions;
  canvasActions?: CanvasMenuActions;
  onClose: () => void;
}

// ============================================================================
// Menu Item Component
// ============================================================================

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  success?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  danger = false,
  success = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors rounded',
        disabled && 'opacity-50 cursor-not-allowed',
        danger && !disabled && 'text-red-400 hover:bg-red-500/10',
        success && !disabled && 'text-emerald-400 hover:bg-emerald-500/10',
        !danger && !success && !disabled && 'text-slate-300 hover:bg-slate-700/50'
      )}
    >
      <span className={cn(
        'w-4 h-4',
        danger && 'text-red-400',
        success && 'text-emerald-400',
        !danger && !success && 'text-slate-400'
      )}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-500 rounded border border-slate-700">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

const MenuDivider: React.FC = () => (
  <div className="my-1 h-px bg-slate-700/50" />
);

// ============================================================================
// Main Component
// ============================================================================

export function GraphContextMenu({
  position,
  target,
  nodeData,
  nodeActions,
  edgeActions,
  canvasActions,
  onClose,
}: GraphContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<ContextMenuPosition | null>(null);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!position || !menuRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust if menu goes off right edge
    if (x + rect.width > viewportWidth - 16) {
      x = viewportWidth - rect.width - 16;
    }

    // Adjust if menu goes off bottom edge
    if (y + rect.height > viewportHeight - 16) {
      y = viewportHeight - rect.height - 16;
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position || !target) return null;

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 min-w-48 py-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl"
        style={{
          left: adjustedPosition?.x ?? position.x,
          top: adjustedPosition?.y ?? position.y,
        }}
      >
        {/* Node Context Menu */}
        {target.type === 'node' && target.nodeId && (
          <>
            {/* Node Header */}
            {nodeData && (
              <div className="px-3 py-2 border-b border-slate-700/50">
                <p className="text-xs font-medium text-slate-200 truncate max-w-40">
                  {nodeData.label}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {nodeData.isFirst && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      START
                    </span>
                  )}
                  {nodeData.isOrphaned && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                      ORPHAN
                    </span>
                  )}
                  {nodeData.isDeadEnd && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                      DEAD END
                    </span>
                  )}
                  {nodeData.choiceCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                      {nodeData.choiceCount} choices
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Node Actions */}
            <div className="py-1">
              <MenuItem
                icon={<Edit3 className="w-full h-full" />}
                label="Edit Scene"
                shortcut="E"
                onClick={() => handleAction(() => nodeActions?.onEdit?.(target.nodeId!))}
              />
              <MenuItem
                icon={<Target className="w-full h-full" />}
                label="Navigate To"
                shortcut="Enter"
                onClick={() => handleAction(() => nodeActions?.onNavigateTo?.(target.nodeId!))}
              />
              <MenuItem
                icon={<GitBranch className="w-full h-full" />}
                label="Add Choice"
                shortcut="C"
                onClick={() => handleAction(() => nodeActions?.onCreateChoice?.(target.nodeId!))}
              />
            </div>

            <MenuDivider />

            <div className="py-1">
              <MenuItem
                icon={<Copy className="w-full h-full" />}
                label="Duplicate"
                shortcut="D"
                onClick={() => handleAction(() => nodeActions?.onDuplicate?.(target.nodeId!))}
              />
              <MenuItem
                icon={<Play className="w-full h-full" />}
                label="Set as Start"
                onClick={() => handleAction(() => nodeActions?.onSetAsStart?.(target.nodeId!))}
                disabled={nodeData?.isFirst}
                success
              />
            </div>

            <MenuDivider />

            <div className="py-1">
              <MenuItem
                icon={<Trash2 className="w-full h-full" />}
                label="Delete Scene"
                shortcut="Del"
                onClick={() => handleAction(() => nodeActions?.onDelete?.(target.nodeId!))}
                danger
                disabled={nodeData?.isFirst}
              />
            </div>
          </>
        )}

        {/* Edge Context Menu */}
        {target.type === 'edge' && target.edgeId && (
          <div className="py-1">
            <MenuItem
              icon={<Edit3 className="w-full h-full" />}
              label="Edit Condition"
              onClick={() => handleAction(() => edgeActions?.onEditCondition?.(target.edgeId!))}
            />
            <MenuDivider />
            <MenuItem
              icon={<Unlink className="w-full h-full" />}
              label="Remove Connection"
              onClick={() => handleAction(() => edgeActions?.onRemoveConnection?.(target.edgeId!))}
              danger
            />
          </div>
        )}

        {/* Canvas Context Menu */}
        {target.type === 'canvas' && (
          <div className="py-1">
            <MenuItem
              icon={<Plus className="w-full h-full" />}
              label="Add New Scene"
              shortcut="N"
              onClick={() => handleAction(() => canvasActions?.onAddScene?.(position))}
            />
            <MenuDivider />
            <MenuItem
              icon={<Maximize className="w-full h-full" />}
              label="Fit View"
              shortcut="0"
              onClick={() => handleAction(canvasActions?.onFitView)}
            />
            <MenuItem
              icon={<MoreHorizontal className="w-full h-full" />}
              label="Toggle Heatmap"
              onClick={() => handleAction(canvasActions?.onToggleHeatmap)}
            />
            <MenuItem
              icon={<Target className="w-full h-full" />}
              label="Show Analytics"
              onClick={() => handleAction(canvasActions?.onShowAnalytics)}
            />
            <MenuDivider />
            <MenuItem
              icon={<Download className="w-full h-full" />}
              label="Export Graph"
              onClick={() => handleAction(canvasActions?.onExport)}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Hook for managing context menu state
// ============================================================================

export interface UseContextMenuReturn {
  menuPosition: ContextMenuPosition | null;
  menuTarget: ContextMenuTarget | null;
  showMenu: (position: ContextMenuPosition, target: ContextMenuTarget) => void;
  hideMenu: () => void;
  handleContextMenu: (
    event: React.MouseEvent,
    target: ContextMenuTarget
  ) => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [menuTarget, setMenuTarget] = useState<ContextMenuTarget | null>(null);

  const showMenu = useCallback((position: ContextMenuPosition, target: ContextMenuTarget) => {
    setMenuPosition(position);
    setMenuTarget(target);
  }, []);

  const hideMenu = useCallback(() => {
    setMenuPosition(null);
    setMenuTarget(null);
  }, []);

  const handleContextMenu = useCallback((
    event: React.MouseEvent,
    target: ContextMenuTarget
  ) => {
    event.preventDefault();
    event.stopPropagation();
    showMenu({ x: event.clientX, y: event.clientY }, target);
  }, [showMenu]);

  return {
    menuPosition,
    menuTarget,
    showMenu,
    hideMenu,
    handleContextMenu,
  };
}

export default GraphContextMenu;
