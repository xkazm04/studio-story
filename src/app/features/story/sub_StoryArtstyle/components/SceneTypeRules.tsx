/**
 * SceneTypeRules Component
 *
 * UI for managing scene-type specific style rules that apply
 * contextual visual modifications based on scene content.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collapse, NORMAL } from '@/lib/animations';
import {
  Clapperboard,
  MessageSquare,
  Heart,
  Search,
  Smile,
  Frown,
  Swords,
  Clock,
  Cloud,
  Lightbulb,
  ArrowRight,
  Map as MapIcon,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import { Slider } from '@/app/components/UI/Slider';
import {
  styleVariationManager,
  type SceneType,
  type SceneTypeRule,
  DEFAULT_SCENE_TYPE_RULES,
} from '@/lib/style/StyleVariationManager';

// ============================================================================
// Types
// ============================================================================

interface SceneTypeRulesProps {
  configId: string;
  selectedSceneTypes?: SceneType[];
  onSceneTypesChange?: (types: SceneType[]) => void;
  onRuleUpdate?: (sceneType: SceneType, rule: SceneTypeRule) => void;
  disabled?: boolean;
}

// ============================================================================
// Scene Type Icons & Colors
// ============================================================================

const SCENE_TYPE_ICONS: Record<SceneType, React.ReactNode> = {
  action: <Clapperboard className="w-4 h-4" />,
  dialogue: <MessageSquare className="w-4 h-4" />,
  romance: <Heart className="w-4 h-4" />,
  mystery: <Search className="w-4 h-4" />,
  comedy: <Smile className="w-4 h-4" />,
  tragedy: <Frown className="w-4 h-4" />,
  battle: <Swords className="w-4 h-4" />,
  flashback: <Clock className="w-4 h-4" />,
  dream: <Cloud className="w-4 h-4" />,
  revelation: <Lightbulb className="w-4 h-4" />,
  transition: <ArrowRight className="w-4 h-4" />,
  establishing: <MapIcon className="w-4 h-4" />,
};

const SCENE_TYPE_COLORS: Record<SceneType, string> = {
  action: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  dialogue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  romance: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  mystery: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  comedy: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  tragedy: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  battle: 'text-red-400 bg-red-500/20 border-red-500/30',
  flashback: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  dream: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
  revelation: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  transition: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  establishing: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
};

const ALL_SCENE_TYPES: SceneType[] = [
  'action',
  'dialogue',
  'romance',
  'mystery',
  'comedy',
  'tragedy',
  'battle',
  'flashback',
  'dream',
  'revelation',
  'transition',
  'establishing',
];

// ============================================================================
// Sub-Components
// ============================================================================

interface SceneTypeCardProps {
  sceneType: SceneType;
  rule: SceneTypeRule;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onUpdate: (updates: Partial<SceneTypeRule>) => void;
  onReset: () => void;
  disabled?: boolean;
}

function SceneTypeCard({
  sceneType,
  rule,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onToggleEnabled,
  onUpdate,
  onReset,
  disabled,
}: SceneTypeCardProps) {
  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all',
      isSelected
        ? 'border-cyan-500/50 bg-cyan-500/5'
        : 'border-slate-700 bg-slate-800/30',
      !rule.enabled && 'opacity-50'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onToggleExpand}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-300"
          disabled={disabled}
          aria-label={isExpanded ? 'Collapse rule' : 'Expand rule'}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={onSelect}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 flex-1',
            'hover:opacity-80 transition-opacity',
            'disabled:cursor-not-allowed'
          )}
        >
          <span className={cn('p-1.5 rounded', SCENE_TYPE_COLORS[sceneType])}>
            {SCENE_TYPE_ICONS[sceneType]}
          </span>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-200">{rule.name}</div>
            <div className="text-sm text-slate-400">Priority: {rule.priority}</div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {/* Enable/Disable toggle */}
          <button
            onClick={onToggleEnabled}
            disabled={disabled}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors',
              rule.enabled
                ? 'text-emerald-400 hover:bg-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-700'
            )}
            aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
          >
            {rule.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={collapse}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={NORMAL}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
              {/* Description */}
              <p className="text-sm text-slate-400 pt-2">{rule.description}</p>

              {/* Color Modifications */}
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Color Modifications</Label>
                <Slider
                  label="Saturation"
                  value={rule.colorMods.saturation}
                  onChange={(v) => onUpdate({
                    colorMods: { ...rule.colorMods, saturation: v }
                  })}
                  min={-50}
                  max={50}
                  showSign
                  colorValue
                  disabled={disabled}
                />
                <Slider
                  label="Brightness"
                  value={rule.colorMods.brightness}
                  onChange={(v) => onUpdate({
                    colorMods: { ...rule.colorMods, brightness: v }
                  })}
                  min={-50}
                  max={50}
                  showSign
                  colorValue
                  disabled={disabled}
                />
                <Slider
                  label="Contrast"
                  value={rule.colorMods.contrast}
                  onChange={(v) => onUpdate({
                    colorMods: { ...rule.colorMods, contrast: v }
                  })}
                  min={-50}
                  max={50}
                  showSign
                  colorValue
                  disabled={disabled}
                />
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <Label className="text-sm text-slate-400">Priority (higher overrides lower)</Label>
                <Slider
                  value={rule.priority}
                  onChange={(v) => onUpdate({ priority: v })}
                  min={0}
                  max={5}
                  disabled={disabled}
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-1">
                <Label className="text-sm text-slate-400">Style Keywords</Label>
                <div className="flex flex-wrap gap-1">
                  {rule.keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-sm rounded bg-slate-700 text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Composition Hints */}
              <div className="space-y-1">
                <Label className="text-sm text-slate-400">Composition Hints</Label>
                <div className="flex flex-wrap gap-1">
                  {rule.compositionHints.map((hint, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-sm rounded bg-purple-500/20 text-purple-300"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-2">
                <Button
                  onClick={onReset}
                  disabled={disabled}
                  variant="ghost"
                  size="xs"
                  className="w-full"
                  icon={<RotateCcw className="w-3 h-3" />}
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SceneTypeRules({
  configId,
  selectedSceneTypes = [],
  onSceneTypesChange,
  onRuleUpdate,
  disabled = false,
}: SceneTypeRulesProps) {
  const [expandedType, setExpandedType] = useState<SceneType | null>(null);
  const [localRules, setLocalRules] = useState<Map<SceneType, SceneTypeRule>>(() => {
    const config = styleVariationManager.getConfig(configId);
    return config?.sceneTypeRules || new Map<SceneType, SceneTypeRule>(DEFAULT_SCENE_TYPE_RULES.map(r => [r.sceneType, r]));
  });

  const handleToggleSelect = useCallback((sceneType: SceneType) => {
    const isSelected = selectedSceneTypes.includes(sceneType);
    const newSelection = isSelected
      ? selectedSceneTypes.filter(t => t !== sceneType)
      : [...selectedSceneTypes, sceneType];
    onSceneTypesChange?.(newSelection);
  }, [selectedSceneTypes, onSceneTypesChange]);

  const handleToggleExpand = useCallback((sceneType: SceneType) => {
    setExpandedType(prev => prev === sceneType ? null : sceneType);
  }, []);

  const handleToggleEnabled = useCallback((sceneType: SceneType) => {
    const rule = localRules.get(sceneType);
    if (!rule) return;

    const updated = { ...rule, enabled: !rule.enabled };
    const newMap = new Map<SceneType, SceneTypeRule>(localRules);
    newMap.set(sceneType, updated);
    setLocalRules(newMap);

    styleVariationManager.updateSceneTypeRule(configId, sceneType, { enabled: updated.enabled });
    onRuleUpdate?.(sceneType, updated);
  }, [configId, localRules, onRuleUpdate]);

  const handleRuleUpdate = useCallback((sceneType: SceneType, updates: Partial<SceneTypeRule>) => {
    const rule = localRules.get(sceneType);
    if (!rule) return;

    const updated = { ...rule, ...updates };
    const newMap = new Map<SceneType, SceneTypeRule>(localRules);
    newMap.set(sceneType, updated);
    setLocalRules(newMap);

    styleVariationManager.updateSceneTypeRule(configId, sceneType, updates);
    onRuleUpdate?.(sceneType, updated);
  }, [configId, localRules, onRuleUpdate]);

  const handleResetRule = useCallback((sceneType: SceneType) => {
    const defaultRule = DEFAULT_SCENE_TYPE_RULES.find(r => r.sceneType === sceneType);
    if (!defaultRule) return;

    const newMap = new Map<SceneType, SceneTypeRule>(localRules);
    newMap.set(sceneType, defaultRule);
    setLocalRules(newMap);

    styleVariationManager.updateSceneTypeRule(configId, sceneType, defaultRule);
    onRuleUpdate?.(sceneType, defaultRule);
  }, [configId, localRules, onRuleUpdate]);

  // Sort rules by priority
  const sortedRules = useMemo(() => {
    return ALL_SCENE_TYPES.map(type => ({
      type,
      rule: localRules.get(type) || DEFAULT_SCENE_TYPE_RULES.find(r => r.sceneType === type)!,
    })).sort((a, b) => b.rule.priority - a.rule.priority);
  }, [localRules]);

  // Get active rules summary
  const activeRulesSummary = useMemo(() => {
    const activeTypes = selectedSceneTypes
      .map(type => localRules.get(type) || DEFAULT_SCENE_TYPE_RULES.find(r => r.sceneType === type))
      .filter((r): r is SceneTypeRule => r !== undefined && r.enabled)
      .sort((a, b) => b.priority - a.priority);

    if (activeTypes.length === 0) return null;

    return {
      rules: activeTypes,
      combinedMods: {
        saturation: activeTypes.reduce((sum, r) => sum + r.colorMods.saturation, 0),
        brightness: activeTypes.reduce((sum, r) => sum + r.colorMods.brightness, 0),
        contrast: activeTypes.reduce((sum, r) => sum + r.colorMods.contrast, 0),
      },
      keywords: [...new Set(activeTypes.flatMap(r => r.keywords))],
    };
  }, [selectedSceneTypes, localRules]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Clapperboard className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-slate-200">Scene Type Rules</span>
        {selectedSceneTypes.length > 0 && (
          <span className="ml-auto px-2 py-0.5 text-sm rounded-full bg-cyan-500/20 text-cyan-400">
            {selectedSceneTypes.length} active
          </span>
        )}
      </div>

      {/* Quick Select */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_SCENE_TYPES.map(type => {
          const rule = localRules.get(type);
          const isSelected = selectedSceneTypes.includes(type);

          return (
            <button
              key={type}
              onClick={() => handleToggleSelect(type)}
              disabled={disabled || !rule?.enabled}
              className={cn(
                'flex items-center gap-1 px-2 py-1 min-h-[44px] rounded-md border text-sm transition-all',
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : cn(SCENE_TYPE_COLORS[type], 'hover:opacity-80'),
                (!rule?.enabled || disabled) && 'opacity-40 cursor-not-allowed'
              )}
            >
              {SCENE_TYPE_ICONS[type]}
              <span className="hidden sm:inline">{type}</span>
            </button>
          );
        })}
      </div>

      {/* Active Rules Summary */}
      {activeRulesSummary && (
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-cyan-400">Active Rules Effect</span>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-slate-400">Saturation:</span>{' '}
              <span className={activeRulesSummary.combinedMods.saturation >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {activeRulesSummary.combinedMods.saturation >= 0 ? '+' : ''}{activeRulesSummary.combinedMods.saturation}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Brightness:</span>{' '}
              <span className={activeRulesSummary.combinedMods.brightness >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {activeRulesSummary.combinedMods.brightness >= 0 ? '+' : ''}{activeRulesSummary.combinedMods.brightness}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Contrast:</span>{' '}
              <span className={activeRulesSummary.combinedMods.contrast >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {activeRulesSummary.combinedMods.contrast >= 0 ? '+' : ''}{activeRulesSummary.combinedMods.contrast}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {activeRulesSummary.keywords.slice(0, 6).map((kw, i) => (
              <span key={i} className="px-1.5 py-0.5 text-sm rounded bg-cyan-500/20 text-cyan-300">
                {kw}
              </span>
            ))}
            {activeRulesSummary.keywords.length > 6 && (
              <span className="text-sm text-cyan-400">+{activeRulesSummary.keywords.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-2">
        <div className="text-sm text-slate-400">All Scene Types (sorted by priority)</div>
        {sortedRules.map(({ type, rule }) => (
          <SceneTypeCard
            key={type}
            sceneType={type}
            rule={rule}
            isSelected={selectedSceneTypes.includes(type)}
            isExpanded={expandedType === type}
            onSelect={() => handleToggleSelect(type)}
            onToggleExpand={() => handleToggleExpand(type)}
            onToggleEnabled={() => handleToggleEnabled(type)}
            onUpdate={(updates) => handleRuleUpdate(type, updates)}
            onReset={() => handleResetRule(type)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
