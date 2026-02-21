'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitBranch,
  RefreshCw,
  Eye,
  Bell,
  Users,
  FileText,
  Folder,
  Film,
  Image as ImageIcon,
  Target,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { ImpactAnalysis, ImpactNode, EntityType, EntityReference } from '@/lib/coordination/types';

// ============================================================================
// Types
// ============================================================================

interface ImpactPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  impact: ImpactAnalysis | null;
  actionLabel?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

interface ImpactNodeCardProps {
  node: ImpactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================================================
// Entity Type Config
// ============================================================================

const entityTypeConfig: Record<
  EntityType,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  character: {
    icon: <Users className="w-3.5 h-3.5" />,
    label: 'Character',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  scene: {
    icon: <Film className="w-3.5 h-3.5" />,
    label: 'Scene',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  act: {
    icon: <Folder className="w-3.5 h-3.5" />,
    label: 'Act',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  beat: {
    icon: <Target className="w-3.5 h-3.5" />,
    label: 'Beat',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  faction: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: 'Faction',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  asset: {
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    label: 'Asset',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  relationship: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    label: 'Relationship',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  project: {
    icon: <FileText className="w-3.5 h-3.5" />,
    label: 'Project',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
  },
};

const actionConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  update: {
    icon: <RefreshCw className="w-3 h-3" />,
    label: 'Will be updated',
    color: 'text-blue-400',
  },
  review: {
    icon: <Eye className="w-3 h-3" />,
    label: 'May need review',
    color: 'text-amber-400',
  },
  regenerate: {
    icon: <RefreshCw className="w-3 h-3" />,
    label: 'May need regeneration',
    color: 'text-purple-400',
  },
  notify: {
    icon: <Bell className="w-3 h-3" />,
    label: 'Will be notified',
    color: 'text-slate-400',
  },
};

// ============================================================================
// Impact Node Card Component
// ============================================================================

function ImpactNodeCard({ node, isExpanded, onToggle }: ImpactNodeCardProps) {
  const config = entityTypeConfig[node.entity.type];
  const action = actionConfig[node.suggestedAction ?? 'notify'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'rounded-lg border transition-colors',
        config.bgColor,
        config.borderColor,
        'hover:border-opacity-60'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className={clsx('p-1.5 rounded-md', config.bgColor, config.color)}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx('text-sm font-medium', config.color)}>
              {node.entity.name || `${config.label} ${node.entity.id.slice(0, 8)}`}
            </span>
            {node.impactLevel === 'direct' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Direct
              </span>
            )}
          </div>
          <div className={clsx('flex items-center gap-1.5 mt-0.5', action.color)}>
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </div>
        </div>

        <ChevronDown
          className={clsx(
            'w-4 h-4 text-slate-500 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && node.dependencyPath.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <div className="text-xs text-slate-500 mb-1.5">Dependency path:</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {node.dependencyPath.map((id, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-800/50 rounded text-xs text-slate-400 font-mono">
                      {id.slice(0, 8)}...
                    </span>
                    {idx < node.dependencyPath.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Entity Badge Component
// ============================================================================

function EntityBadge({ entity }: { entity: EntityReference }) {
  const config = entityTypeConfig[entity.type];

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={config.color}>{config.icon}</div>
      <div>
        <div className={clsx('text-sm font-medium', config.color)}>
          {entity.name || config.label}
        </div>
        {entity.id && entity.id !== '*' && (
          <div className="text-xs text-slate-500 font-mono">
            {entity.id.slice(0, 12)}...
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Impact Summary Component
// ============================================================================

function ImpactSummary({ impact }: { impact: ImpactAnalysis }) {
  const grouped = useMemo(() => {
    const groups: Record<EntityType, ImpactNode[]> = {
      character: [],
      scene: [],
      act: [],
      beat: [],
      faction: [],
      asset: [],
      relationship: [],
      project: [],
    };

    for (const node of impact.affectedEntities) {
      groups[node.entity.type].push(node);
    }

    return Object.entries(groups).filter(([, nodes]) => nodes.length > 0);
  }, [impact.affectedEntities]);

  const directCount = impact.affectedEntities.filter(
    (n) => n.impactLevel === 'direct'
  ).length;
  const indirectCount = impact.totalAffected - directCount;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
        <div className="text-2xl font-bold text-slate-100">
          {impact.totalAffected}
        </div>
        <div className="text-xs text-slate-400">Total Affected</div>
      </div>
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <div className="text-2xl font-bold text-red-400">{directCount}</div>
        <div className="text-xs text-red-400/70">Direct Impact</div>
      </div>
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="text-2xl font-bold text-amber-400">{indirectCount}</div>
        <div className="text-xs text-amber-400/70">Indirect Impact</div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ImpactPreview({
  isOpen,
  onClose,
  onConfirm,
  impact,
  actionLabel = 'Confirm',
  title = 'Impact Preview',
  description,
  isLoading = false,
}: ImpactPreviewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'type' | 'impact'>('type');

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const groupedEntities = useMemo(() => {
    if (!impact) return [];

    if (groupBy === 'type') {
      const groups: Record<EntityType, ImpactNode[]> = {
        character: [],
        scene: [],
        act: [],
        beat: [],
        faction: [],
        asset: [],
        relationship: [],
        project: [],
      };

      for (const node of impact.affectedEntities) {
        groups[node.entity.type].push(node);
      }

      return Object.entries(groups)
        .filter(([, nodes]) => nodes.length > 0)
        .sort((a, b) => b[1].length - a[1].length);
    } else {
      const direct = impact.affectedEntities.filter(
        (n) => n.impactLevel === 'direct'
      );
      const indirect = impact.affectedEntities.filter(
        (n) => n.impactLevel === 'indirect'
      );

      return [
        ['Direct', direct] as [string, ImpactNode[]],
        ['Indirect', indirect] as [string, ImpactNode[]],
      ].filter(([, nodes]) => nodes.length > 0);
    }
  }, [impact, groupBy]);

  const hasSignificantImpact = impact && impact.totalAffected > 5;

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {hasSignificantImpact && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>This change affects multiple entities</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={hasSignificantImpact ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={isLoading}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={title}
      subtitle={
        description ||
        (impact
          ? `${impact.totalAffected} entities will be affected by this change`
          : undefined)
      }
      icon={<AlertTriangle />}
      footer={footer}
    >
      {impact ? (
        <div className="space-y-4">
          {/* Source Entity */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Source Entity
            </div>
            <EntityBadge entity={impact.sourceEntity} />
          </div>

          {/* Impact Summary */}
          <ImpactSummary impact={impact} />

          {/* Group Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Group by:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
              <button
                onClick={() => setGroupBy('type')}
                className={clsx(
                  'px-3 py-1 text-xs transition-colors',
                  groupBy === 'type'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-800/30 text-slate-400 hover:text-slate-300'
                )}
              >
                Entity Type
              </button>
              <button
                onClick={() => setGroupBy('impact')}
                className={clsx(
                  'px-3 py-1 text-xs transition-colors',
                  groupBy === 'impact'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-800/30 text-slate-400 hover:text-slate-300'
                )}
              >
                Impact Level
              </button>
            </div>
          </div>

          {/* Affected Entities */}
          <div className="space-y-4">
            {groupedEntities.map(([group, nodes]) => {
              const config =
                groupBy === 'type'
                  ? entityTypeConfig[group as EntityType]
                  : null;

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    {config && (
                      <div className={config.color}>{config.icon}</div>
                    )}
                    <span className="text-sm font-medium text-slate-300">
                      {groupBy === 'type'
                        ? `${config?.label}s`
                        : `${group} Impact`}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700/50 text-slate-400">
                      {nodes.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {nodes.map((node, idx) => (
                      <ImpactNodeCard
                        key={`${node.entity.type}-${node.entity.id}-${idx}`}
                        node={node}
                        isExpanded={expandedNodes.has(
                          `${node.entity.type}-${node.entity.id}`
                        )}
                        onToggle={() =>
                          toggleNode(`${node.entity.type}-${node.entity.id}`)
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {impact.totalAffected === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-slate-300 font-medium">
                No entities will be affected
              </div>
              <div className="text-sm text-slate-500">
                This change is isolated and won&apos;t impact other parts of your
                story
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      )}
    </Modal>
  );
}

export default ImpactPreview;
