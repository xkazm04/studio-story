'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Swords,
  Coins,
  Landmark,
  Palette,
  Church,
  Eye,
  MapPin,
  Crown,
  Shield,
  BarChart3,
  History,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Faction } from '@/app/types/Faction';
import {
  FactionInfluence,
  InfluenceType,
  Territory,
  InfluenceSnapshot,
  INFLUENCE_TYPE_CONFIG,
  calculateTotalPower,
} from '@/lib/politics/PoliticsEngine';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface InfluenceTrackerProps {
  faction: Faction;
  influence: FactionInfluence | null;
  allInfluences: FactionInfluence[];
  onInfluenceChange?: (type: InfluenceType, value: number) => void;
  onAddTerritory?: (territory: Omit<Territory, 'id'>) => void;
  onRemoveTerritory?: (territoryId: string) => void;
  readOnly?: boolean;
}

type ViewMode = 'overview' | 'breakdown' | 'territories' | 'history';

// ============================================================================
// Constants
// ============================================================================

const INFLUENCE_ICONS: Record<InfluenceType, React.ReactNode> = {
  military: <Swords size={16} />,
  economic: <Coins size={16} />,
  political: <Landmark size={16} />,
  cultural: <Palette size={16} />,
  religious: <Church size={16} />,
  intelligence: <Eye size={16} />,
};

const STRATEGIC_IMPORTANCE_LABELS: Record<number, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Low',
  4: 'Moderate',
  5: 'Average',
  6: 'Notable',
  7: 'Significant',
  8: 'Major',
  9: 'Critical',
  10: 'Supreme',
};

// ============================================================================
// Sub-Components
// ============================================================================

interface InfluenceBarProps {
  type: InfluenceType;
  value: number;
  maxValue: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

const InfluenceBar: React.FC<InfluenceBarProps> = ({
  type,
  value,
  maxValue,
  onChange,
  readOnly = false,
}) => {
  const config = INFLUENCE_TYPE_CONFIG[type];
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: config.color }}>{INFLUENCE_ICONS[type]}</span>
          <span className="text-sm text-gray-300">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{value}</span>
          {!readOnly && onChange && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onChange(Math.max(0, value - 5))}
                className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              >
                <Minus size={10} />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + 5)}
                className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentage)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

interface PowerRankBadgeProps {
  rank: number;
  totalFactions: number;
}

const PowerRankBadge: React.FC<PowerRankBadgeProps> = ({ rank, totalFactions }) => {
  const isTopThree = rank <= 3;
  const rankColors: Record<number, string> = {
    1: 'from-amber-500 to-yellow-600',
    2: 'from-gray-400 to-slate-500',
    3: 'from-amber-700 to-orange-800',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        isTopThree
          ? `bg-gradient-to-r ${rankColors[rank] || 'from-gray-600 to-gray-700'}`
          : 'bg-gray-800 border border-gray-700'
      )}
    >
      <Crown
        size={16}
        className={isTopThree ? 'text-white' : 'text-gray-400'}
      />
      <span className={cn('text-sm font-medium', isTopThree ? 'text-white' : 'text-gray-300')}>
        Rank #{rank}
        <span className="text-xs opacity-70 ml-1">of {totalFactions}</span>
      </span>
    </div>
  );
};

interface TerritoryCardProps {
  territory: Territory;
  onRemove?: () => void;
  readOnly?: boolean;
}

const TerritoryCard: React.FC<TerritoryCardProps> = ({ territory, onRemove, readOnly }) => {
  const importanceLabel = STRATEGIC_IMPORTANCE_LABELS[territory.strategic_importance] || 'Unknown';
  const importanceColor =
    territory.strategic_importance >= 8
      ? 'text-red-400'
      : territory.strategic_importance >= 5
        ? 'text-amber-400'
        : 'text-gray-400';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-cyan-400" />
          <span className="font-medium text-white">{territory.name}</span>
        </div>
        {!readOnly && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <Minus size={14} />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className={cn('px-2 py-0.5 rounded-full bg-gray-700', importanceColor)}>
          {importanceLabel}
        </span>
        {territory.resource_type && (
          <span className="px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400">
            {territory.resource_type}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400">
          +{territory.influence_value} influence
        </span>
      </div>
      {territory.contested_by && territory.contested_by.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <Shield size={12} />
          <span>Contested by {territory.contested_by.length} faction(s)</span>
        </div>
      )}
    </div>
  );
};

interface HistoryChartProps {
  history: InfluenceSnapshot[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const recentHistory = history.slice(-20);
  const maxInfluence = Math.max(...recentHistory.map((h) => h.total_influence), 1);

  if (recentHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        No history data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-32 flex items-end gap-1">
        {recentHistory.map((snapshot, index) => {
          const height = (snapshot.total_influence / maxInfluence) * 100;
          const isLatest = index === recentHistory.length - 1;

          return (
            <motion.div
              key={snapshot.timestamp}
              className="flex-1 group relative"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <div
                className={cn(
                  'w-full h-full rounded-t',
                  isLatest ? 'bg-cyan-500' : 'bg-purple-600/60'
                )}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs whitespace-nowrap">
                  <div className="text-white font-medium">{snapshot.total_influence}</div>
                  <div className="text-gray-400">
                    {new Date(snapshot.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {recentHistory.length > 0 &&
            new Date(recentHistory[0].timestamp).toLocaleDateString()}
        </span>
        <span>
          {recentHistory.length > 0 &&
            new Date(recentHistory[recentHistory.length - 1].timestamp).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

interface AddTerritoryFormProps {
  onAdd: (territory: Omit<Territory, 'id'>) => void;
  onCancel: () => void;
  factionId: string;
}

const AddTerritoryForm: React.FC<AddTerritoryFormProps> = ({ onAdd, onCancel, factionId }) => {
  const [name, setName] = useState('');
  const [influenceValue, setInfluenceValue] = useState(10);
  const [strategicImportance, setStrategicImportance] = useState(5);
  const [resourceType, setResourceType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      controller_id: factionId,
      influence_value: influenceValue,
      strategic_importance: strategicImportance,
      resource_type: resourceType.trim() || undefined,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 space-y-4"
    >
      <div>
        <label className="block text-sm text-gray-300 mb-1">Territory Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Northern Plains"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Influence Value</label>
          <input
            type="number"
            value={influenceValue}
            onChange={(e) => setInfluenceValue(Number(e.target.value))}
            min={1}
            max={100}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Strategic Importance</label>
          <select
            value={strategicImportance}
            onChange={(e) => setStrategicImportance(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {Object.entries(STRATEGIC_IMPORTANCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {value} - {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Resource Type (Optional)</label>
        <input
          type="text"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          placeholder="e.g., Iron, Gold, Timber"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Add Territory
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const InfluenceTracker: React.FC<InfluenceTrackerProps> = ({
  faction,
  influence,
  allInfluences,
  onInfluenceChange,
  onAddTerritory,
  onRemoveTerritory,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showAddTerritory, setShowAddTerritory] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState(true);

  // Calculate derived values
  const totalPower = useMemo(() => {
    if (!influence) return 0;
    return calculateTotalPower(influence);
  }, [influence]);

  const maxInfluenceValue = useMemo(() => {
    if (!influence) return 100;
    return Math.max(
      ...Object.values(influence.influence_breakdown),
      50
    );
  }, [influence]);

  const territoryInfluence = useMemo(() => {
    if (!influence) return 0;
    return influence.territories.reduce((sum, t) => sum + t.influence_value, 0);
  }, [influence]);

  const recentTrend = useMemo(() => {
    if (!influence || influence.influence_history.length < 2) return 'stable';
    const recent = influence.influence_history.slice(-5);
    const oldest = recent[0].total_influence;
    const newest = recent[recent.length - 1].total_influence;
    const change = newest - oldest;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }, [influence]);

  const handleAddTerritory = (territory: Omit<Territory, 'id'>) => {
    onAddTerritory?.(territory);
    setShowAddTerritory(false);
  };

  if (!influence) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="text-center text-gray-500">
          <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
          <p>No influence data available for {faction.name}</p>
          {!readOnly && (
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Initialize Influence Tracking
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-purple-400" size={20} />
              Influence Tracker
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{faction.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {recentTrend === 'up' && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp size={16} />
                <span>Rising</span>
              </div>
            )}
            {recentTrend === 'down' && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <TrendingDown size={16} />
                <span>Declining</span>
              </div>
            )}
            {recentTrend === 'stable' && (
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Minus size={16} />
                <span>Stable</span>
              </div>
            )}
            <PowerRankBadge rank={influence.power_rank || 1} totalFactions={allInfluences.length} />
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-800">
        {(['overview', 'breakdown', 'territories', 'history'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              viewMode === mode
                ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            )}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Total Power Display */}
              <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl p-6 border border-purple-500/20">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1">{totalPower}</div>
                  <div className="text-sm text-gray-400">Total Power</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{influence.territories.length}</div>
                    <div className="text-xs text-gray-500">Territories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{territoryInfluence}</div>
                    <div className="text-xs text-gray-500">Land Influence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{influence.influence_history.length}</div>
                    <div className="text-xs text-gray-500">Events</div>
                  </div>
                </div>
              </div>

              {/* Quick Breakdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedBreakdown(!expandedBreakdown)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-medium text-gray-300">Influence Breakdown</span>
                  {expandedBreakdown ? (
                    <ChevronUp size={16} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-3 overflow-hidden"
                    >
                      {(Object.keys(influence.influence_breakdown) as InfluenceType[]).map((type) => (
                        <InfluenceBar
                          key={type}
                          type={type}
                          value={influence.influence_breakdown[type]}
                          maxValue={maxInfluenceValue}
                          onChange={
                            !readOnly && onInfluenceChange
                              ? (value) => onInfluenceChange(type, value)
                              : undefined
                          }
                          readOnly={readOnly}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Breakdown */}
          {viewMode === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {(Object.keys(influence.influence_breakdown) as InfluenceType[]).map((type) => {
                const config = INFLUENCE_TYPE_CONFIG[type];
                const value = influence.influence_breakdown[type];
                const percentage = totalPower > 0 ? Math.round((value / totalPower) * 100) : 0;

                return (
                  <div
                    key={type}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <span style={{ color: config.color }}>{INFLUENCE_ICONS[type]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{config.label}</div>
                          <div className="text-xs text-gray-500">{percentage}% of total power</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{value}</div>
                        {!readOnly && onInfluenceChange && (
                          <div className="flex gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => onInfluenceChange(type, Math.max(0, value - 5))}
                              className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => onInfluenceChange(type, value + 5)}
                              className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              +5
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ backgroundColor: config.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (value / maxInfluenceValue) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Territories */}
          {viewMode === 'territories' && (
            <motion.div
              key="territories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Territory Summary */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {influence.territories.length} controlled{' '}
                  {influence.territories.length === 1 ? 'territory' : 'territories'}
                </div>
                {!readOnly && onAddTerritory && (
                  <button
                    type="button"
                    onClick={() => setShowAddTerritory(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm transition-colors"
                  >
                    <Plus size={14} />
                    Add Territory
                  </button>
                )}
              </div>

              {/* Add Territory Form */}
              <AnimatePresence>
                {showAddTerritory && (
                  <AddTerritoryForm
                    factionId={faction.id}
                    onAdd={handleAddTerritory}
                    onCancel={() => setShowAddTerritory(false)}
                  />
                )}
              </AnimatePresence>

              {/* Territory List */}
              {influence.territories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No territories controlled</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {influence.territories.map((territory) => (
                    <TerritoryCard
                      key={territory.id}
                      territory={territory}
                      onRemove={
                        !readOnly && onRemoveTerritory
                          ? () => onRemoveTerritory(territory.id)
                          : undefined
                      }
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}

              {/* Territory Stats */}
              {influence.territories.length > 0 && (
                <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-white">{territoryInfluence}</div>
                      <div className="text-xs text-gray-500">Total Influence</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round(
                          influence.territories.reduce((sum, t) => sum + t.strategic_importance, 0) /
                            influence.territories.length
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Avg Importance</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {influence.territories.filter((t) => t.contested_by?.length).length}
                      </div>
                      <div className="text-xs text-gray-500">Contested</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* History */}
          {viewMode === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <History size={16} />
                <span>Power Over Time</span>
              </div>

              <HistoryChart history={influence.influence_history} />

              {/* Recent Events */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Changes</h4>
                {influence.influence_history.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recorded history yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {influence.influence_history
                      .slice(-10)
                      .reverse()
                      .map((snapshot, index) => (
                        <div
                          key={snapshot.timestamp + index}
                          className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg"
                        >
                          <div>
                            <div className="text-sm text-white">
                              Power: {snapshot.total_influence}
                            </div>
                            {snapshot.triggered_by && (
                              <div className="text-xs text-gray-500">{snapshot.triggered_by}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Enhancement */}
      {!readOnly && (
        <div className="p-4 border-t border-gray-800">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/30 hover:to-cyan-600/30 border border-purple-500/30 text-purple-300 rounded-lg transition-colors"
          >
            <Sparkles size={16} />
            Suggest Influence Changes Based on Story Events
          </button>
        </div>
      )}
    </div>
  );
};

export default InfluenceTracker;
