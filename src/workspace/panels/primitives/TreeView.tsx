'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import type { HeaderAccent } from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, TreeNode } from './types';
import { SPACING, MOTION, BEAT_ANIMATIONS, getAccent } from '@/workspace/theme/tokens';

/** Row height used for max-height estimation (px) */
const ROW_HEIGHT = 28;
/** Cap to avoid excessively large max-height values */
const MAX_HEIGHT_CAP = 500;

/** Count all descendants (children, grandchildren, etc.) of a node */
function countDescendants(node: TreeNode): number {
  if (!node.children) return 0;
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
}

/** 3-level skeleton tree matching the real indent per level */
function TreeSkeleton() {
  const shimmerBar = (width: string, delay: number) => (
    <div
      className="h-4 overflow-hidden rounded bg-slate-800/40"
      style={{ width, animationDelay: `${delay}ms` }}
    >
      <div className="h-full w-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
    </div>
  );

  return (
    <div aria-busy="true" aria-live="polite" className={cn('space-y-2', SPACING.panelPadding)}>
      {/* Level 0 — branch 1 */}
      <div className="flex items-center gap-1.5">
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
        {shimmerBar('120px', 0)}
      </div>
      {/* Level 1 children */}
      <div style={{ marginLeft: 16 }} className="space-y-1.5">
        <div className="flex items-center gap-2 px-2">
          {shimmerBar('100px', 120)}
        </div>
        <div className="flex items-center gap-2 px-2">
          {shimmerBar('85px', 240)}
        </div>
        {/* Level 2 nested */}
        <div style={{ marginLeft: 16 }} className="space-y-1.5">
          <div className="flex items-center gap-2 px-2">
            {shimmerBar('75px', 360)}
          </div>
        </div>
      </div>

      {/* Level 0 — branch 2 */}
      <div className="flex items-center gap-1.5">
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
        {shimmerBar('105px', 480)}
      </div>
      {/* Level 1 children */}
      <div style={{ marginLeft: 16 }} className="space-y-1.5">
        <div className="flex items-center gap-2 px-2">
          {shimmerBar('95px', 600)}
        </div>
        <div className="flex items-center gap-2 px-2">
          {shimmerBar('110px', 720)}
        </div>
      </div>

      {/* Level 0 — branch 3 */}
      <div className="flex items-center gap-1.5">
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
        {shimmerBar('130px', 840)}
      </div>
    </div>
  );
}

interface TreeViewProps extends BasePrimitiveProps {
  nodes: TreeNode[];
  activeNodeId?: string;
  onNodeSelect?: (node: TreeNode) => void;
  defaultExpanded?: boolean;
}

export default function TreeView({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  nodes,
  activeNodeId,
  onNodeSelect,
  defaultExpanded,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  density,
}: TreeViewProps) {
  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      actions={actions}
      density={density}
    >
      {isLoading ? (
        <TreeSkeleton />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : nodes.length === 0 ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'No items'}
          description={emptyDescription}
        />
      ) : (
        <TreeContainer
          nodes={nodes}
          activeNodeId={activeNodeId}
          onNodeSelect={onNodeSelect}
          defaultExpanded={defaultExpanded ?? true}
          label={title}
          accent={headerAccent}
        />
      )}
    </PanelFrame>
  );
}

function TreeContainer({
  nodes,
  activeNodeId,
  onNodeSelect,
  defaultExpanded,
  label,
  accent,
}: {
  nodes: TreeNode[];
  activeNodeId?: string;
  onNodeSelect?: (node: TreeNode) => void;
  defaultExpanded: boolean;
  label: string;
  accent?: HeaderAccent;
}) {
  const treeRef = useRef<HTMLDivElement>(null);

  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = treeRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>('[role="treeitem"]')
      );
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      const current = items[currentIndex];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, items.length - 1);
        items[next].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        items[prev].focus();
      } else if (e.key === 'ArrowRight') {
        // If branch is collapsed, expand it; otherwise move to first child
        const expanded = current.getAttribute('aria-expanded');
        if (expanded === 'false') {
          e.preventDefault();
          current.click();
        } else if (expanded === 'true') {
          e.preventDefault();
          const next = Math.min(currentIndex + 1, items.length - 1);
          items[next].focus();
        }
      } else if (e.key === 'ArrowLeft') {
        // If branch is expanded, collapse it; otherwise move to parent
        const expanded = current.getAttribute('aria-expanded');
        if (expanded === 'true') {
          e.preventDefault();
          current.click();
        } else {
          // Move to parent treeitem
          e.preventDefault();
          const prev = Math.max(currentIndex - 1, 0);
          items[prev].focus();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        current.click();
      }
    },
    []
  );

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label={label}
      onKeyDown={handleTreeKeyDown}
      className={cn('overflow-auto space-y-0.5', SPACING.panelPadding)}
    >
      {nodes.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          activeNodeId={activeNodeId}
          onNodeSelect={onNodeSelect}
          defaultExpanded={defaultExpanded}
          accent={accent}
        />
      ))}
    </div>
  );
}

interface TreeBranchProps {
  node: TreeNode;
  depth: number;
  activeNodeId?: string;
  onNodeSelect?: (node: TreeNode) => void;
  defaultExpanded: boolean;
  accent?: HeaderAccent;
}

function TreeBranch({ node, depth, activeNodeId, onNodeSelect, defaultExpanded, accent }: TreeBranchProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;
  const NodeIcon = node.icon;
  const accentStyles = getAccent(accent);

  if (!hasChildren) {
    // Leaf node rendered inline (top-level leaf without parent)
    return (
      <LeafNode
        node={node}
        isActive={activeNodeId === node.id}
        onSelect={() => onNodeSelect?.(node)}
        accent={accent}
      />
    );
  }

  // Estimate max-height from descendant count
  const descendantCount = countDescendants(node);
  const estimatedMaxHeight = Math.min(descendantCount * ROW_HEIGHT, MAX_HEIGHT_CAP);

  return (
    <div>
      {/* Branch header — entire row is clickable */}
      <button
        type="button"
        role="treeitem"
        aria-expanded={expanded}
        tabIndex={-1}
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-1.5 min-h-[28px] px-1.5 text-sm font-medium cursor-pointer rounded',
          'text-slate-300 hover:text-slate-200 hover:bg-slate-800/30',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
          MOTION.hoverDuration,
        )}
      >
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 shrink-0 text-slate-500 transition-transform',
            MOTION.hoverDuration,
            expanded && 'rotate-90'
          )}
        />
        {NodeIcon && <NodeIcon className={cn('w-3.5 h-3.5 shrink-0', accentStyles.headerIcon)} />}
        <span className="truncate">{node.label}</span>
        {node.meta != null && (
          <span className="text-slate-400 font-normal text-sm ml-auto">{node.meta}</span>
        )}
      </button>

      {/* Children with depth-scaled indent */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: estimatedMaxHeight, opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={BEAT_ANIMATIONS.standard}
            className="overflow-hidden"
          >
            <div
              role="group"
              className="relative space-y-0.5 pt-1 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-slate-700/50 before:to-transparent"
              style={{ marginLeft: (depth + 1) * 16 }}
            >
              {node.children!.map((child) =>
                child.children && child.children.length > 0 ? (
                  <TreeBranch
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    activeNodeId={activeNodeId}
                    onNodeSelect={onNodeSelect}
                    defaultExpanded={defaultExpanded}
                    accent={accent}
                  />
                ) : (
                  <LeafNode
                    key={child.id}
                    node={child}
                    isActive={activeNodeId === child.id}
                    onSelect={() => onNodeSelect?.(child)}
                    accent={accent}
                  />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LeafNodeProps {
  node: TreeNode;
  isActive: boolean;
  onSelect: () => void;
  accent?: HeaderAccent;
}

function LeafNode({ node, isActive, onSelect, accent }: LeafNodeProps) {
  const NodeIcon = node.icon;
  const accentStyles = getAccent(accent);

  return (
    <button
      type="button"
      role="treeitem"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-1.5 px-1.5 min-h-[28px] rounded text-sm text-left transition-all',
        MOTION.hoverDuration,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
        isActive
          ? cn(accentStyles.bg, 'border', accentStyles.border, accentStyles.headerIcon)
          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
      )}
    >
      {NodeIcon && <NodeIcon className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{node.label}</span>
      {node.meta != null && (
        <span className="text-slate-500 text-xs ml-auto">{node.meta}</span>
      )}
    </button>
  );
}
