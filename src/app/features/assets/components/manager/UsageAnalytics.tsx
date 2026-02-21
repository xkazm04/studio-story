'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  Film,
  MapPin,
  Flag,
  Folder,
  Clock,
  Package,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUsageAnalytics, UsageEntityType } from '@/lib/assets';
import type { Asset } from '@/app/types/Asset';

interface UsageAnalyticsProps {
  assets: Asset[] | undefined;
  onSelectAsset?: (assetId: string) => void;
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
  character: 'bg-cyan-500',
  scene: 'bg-purple-500',
  beat: 'bg-amber-500',
  project: 'bg-blue-500',
  faction: 'bg-red-500',
  location: 'bg-green-500',
};

/**
 * UsageAnalytics - Dashboard for asset usage patterns
 *
 * Displays analytics on how assets are used across the application,
 * including distribution charts, top used assets, and orphan stats.
 */
export function UsageAnalytics({
  assets,
  onSelectAsset,
  className,
}: UsageAnalyticsProps) {
  const { analytics, isLoading, refresh } = useUsageAnalytics(assets);

  const maxDistributionValue = useMemo(() => {
    if (!analytics) return 0;
    return Math.max(...Object.values(analytics.usageDistribution));
  }, [analytics]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-2 text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={clsx('flex flex-col items-center justify-center p-8', className)}>
        <BarChart3 className="w-12 h-12 text-slate-400 mb-3 opacity-40" />
        <p className="text-sm text-slate-400">No analytics data available</p>
      </div>
    );
  }

  const usageRate = analytics.totalAssets > 0
    ? Math.round(((analytics.totalAssets - analytics.orphanCount) / analytics.totalAssets) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx('flex flex-col h-full overflow-auto', className)}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-100">Usage Analytics</h2>
              <p className="text-xs text-slate-400">Asset utilization overview</p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Total Assets</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{analytics.totalAssets}</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">References</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{analytics.totalReferences}</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Orphans</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{analytics.orphanCount}</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Usage Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{usageRate}%</p>
        </div>
      </div>

      {/* Usage distribution */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Usage by Entity Type</h3>
        <div className="space-y-3">
          {(Object.keys(analytics.usageDistribution) as UsageEntityType[]).map(entityType => {
            const count = analytics.usageDistribution[entityType];
            const percentage = maxDistributionValue > 0
              ? (count / maxDistributionValue) * 100
              : 0;
            const Icon = entityTypeIcons[entityType];

            return (
              <div key={entityType} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-300">
                      {entityTypeLabels[entityType]}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{count}</span>
                </div>
                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={clsx('h-full rounded-full', entityTypeColors[entityType])}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orphan age breakdown */}
      {analytics.orphanCount > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Orphan Age Distribution</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-lg font-bold text-green-400">
                {analytics.unusedDuration.lessThan7Days}
              </p>
              <p className="text-xs text-green-400/70">&lt; 7 days</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-lg font-bold text-amber-400">
                {analytics.unusedDuration.lessThan30Days}
              </p>
              <p className="text-xs text-amber-400/70">7-30 days</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-lg font-bold text-red-400">
                {analytics.unusedDuration.moreThan30Days}
              </p>
              <p className="text-xs text-red-400/70">30+ days</p>
            </div>
          </div>
        </div>
      )}

      {/* Top used assets */}
      {analytics.topUsedAssets.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Most Used Assets</h3>
          <div className="space-y-2">
            {analytics.topUsedAssets.slice(0, 5).map((asset, index) => (
              <button
                key={asset.assetId}
                onClick={() => onSelectAsset?.(asset.assetId)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition-colors text-left"
              >
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{asset.assetName}</p>
                </div>
                <span className="text-sm font-medium text-cyan-400">{asset.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently used assets */}
      {analytics.recentlyUsedAssets.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recently Used</h3>
          <div className="space-y-2">
            {analytics.recentlyUsedAssets.slice(0, 5).map(asset => (
              <button
                key={asset.assetId}
                onClick={() => onSelectAsset?.(asset.assetId)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{asset.assetName}</p>
                </div>
                <span className="text-xs text-slate-500">{formatTime(asset.lastUsed)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UsageAnalytics;
