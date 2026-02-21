'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  ChevronRight,
  Users,
  Film,
  MapPin,
  Flag,
  Folder,
  Clock,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAssetUsage, useUsageLocations, UsageEntityType, AssetUsageLocation } from '@/lib/assets';
import { Button, IconButton } from '@/app/components/UI/Button';

interface UsagePanelProps {
  assetId: string | null;
  assetName?: string;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

const entityTypeIcons: Record<UsageEntityType, typeof Users> = {
  character: Users,
  scene: Film,
  beat: Clock,
  project: Folder,
  faction: Flag,
  location: MapPin,
};

const entityTypeLabels: Record<UsageEntityType, string> = {
  character: 'Characters',
  scene: 'Scenes',
  beat: 'Beats',
  project: 'Projects',
  faction: 'Factions',
  location: 'Locations',
};

const entityTypeColors: Record<UsageEntityType, string> = {
  character: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  scene: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  beat: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  project: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  faction: 'text-red-400 bg-red-500/10 border-red-500/30',
  location: 'text-green-400 bg-green-500/10 border-green-500/30',
};

/**
 * UsagePanel - Displays where an asset is used throughout the application
 *
 * Shows reference counts by entity type, lists all usage locations,
 * and provides navigation links to each usage.
 */
export function UsagePanel({
  assetId,
  assetName,
  onClose,
  onNavigate,
  className,
}: UsagePanelProps) {
  const summary = useAssetUsage(assetId);
  const { locations, buildPath } = useUsageLocations(assetId);
  const [expandedType, setExpandedType] = useState<UsageEntityType | null>(null);

  if (!assetId) {
    return (
      <div className={clsx('p-4 text-center text-slate-400', className)}>
        <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Select an asset to view usage</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={clsx('p-4 text-center text-slate-400', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700/50 rounded w-3/4 mx-auto mb-2" />
          <div className="h-3 bg-slate-700/50 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  const handleNavigate = (location: AssetUsageLocation) => {
    const path = buildPath(location);
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Default navigation
      window.location.href = path;
    }
  };

  // Group locations by entity type
  const locationsByType = locations.reduce<Record<UsageEntityType, AssetUsageLocation[]>>(
    (acc, loc) => {
      if (!acc[loc.entityType]) {
        acc[loc.entityType] = [];
      }
      acc[loc.entityType].push(loc);
      return acc;
    },
    {} as Record<UsageEntityType, AssetUsageLocation[]>
  );

  const activeEntityTypes = Object.entries(summary.usageByType)
    .filter(([, count]) => count > 0)
    .map(([type]) => type as UsageEntityType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex flex-col', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <Link2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-100">Asset Usage</h3>
            {assetName && (
              <p className="text-xs text-slate-400 truncate max-w-[180px]">{assetName}</p>
            )}
          </div>
        </div>
        {onClose && (
          <IconButton
            icon={<X className="w-4 h-4" />}
            size="xs"
            variant="ghost"
            onClick={onClose}
            aria-label="Close usage panel"
          />
        )}
      </div>

      {/* Summary stats */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">Total References</span>
          <span
            className={clsx(
              'text-lg font-bold',
              summary.isOrphan ? 'text-amber-400' : 'text-cyan-400'
            )}
          >
            {summary.totalReferences}
          </span>
        </div>

        {summary.isOrphan && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Orphan Asset</p>
              <p className="text-xs text-amber-400/70">
                This asset is not used anywhere. Consider removing it.
              </p>
            </div>
          </div>
        )}

        {!summary.isOrphan && summary.lastUsedAt && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Last tracked: {new Date(summary.lastUsedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Usage by type */}
      {activeEntityTypes.length > 0 && (
        <div className="flex-1 overflow-auto">
          <div className="p-2">
            {activeEntityTypes.map(entityType => {
              const Icon = entityTypeIcons[entityType];
              const count = summary.usageByType[entityType];
              const typeLocations = locationsByType[entityType] || [];
              const isExpanded = expandedType === entityType;

              return (
                <div key={entityType} className="mb-2">
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : entityType)}
                    className={clsx(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                      entityTypeColors[entityType],
                      'hover:bg-opacity-20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {entityTypeLabels[entityType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{count}</span>
                      <ChevronRight
                        className={clsx(
                          'w-4 h-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {typeLocations.map(location => (
                            <button
                              key={location.id}
                              onClick={() => handleNavigate(location)}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition-colors group"
                            >
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm text-slate-200 truncate">
                                  {location.entityName}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {location.fieldType.replace(/_/g, ' ')}
                                  {location.projectName && ` • ${location.projectName}`}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeEntityTypes.length === 0 && !summary.isOrphan && (
        <div className="flex-1 flex items-center justify-center p-4 text-slate-400">
          <div className="text-center">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tracked usages</p>
            <p className="text-xs text-slate-500">
              Usage will appear when asset is assigned
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UsagePanel;
