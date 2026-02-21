/**
 * ThemeManager
 * Theme hierarchy management with primary/secondary/motif organization
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/app/components/UI';
import {
  Layers,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Hash,
  Palette,
  Tag,
  Star,
  Sparkles,
  Circle,
  GripVertical,
  Search,
  Check,
} from 'lucide-react';
import {
  type Theme,
  type ThemeLevel,
  ThemeTracker,
} from '@/lib/themes/ThemeTracker';

interface ThemeManagerProps {
  themes: Theme[];
  onAddTheme: (theme: Omit<Theme, 'id'>) => void;
  onUpdateTheme: (themeId: string, updates: Partial<Theme>) => void;
  onRemoveTheme: (themeId: string) => void;
  compact?: boolean;
}

// Theme level configuration
const THEME_LEVELS: Record<ThemeLevel, {
  label: string;
  description: string;
  icon: typeof Star;
  color: string;
}> = {
  primary: {
    label: 'Primary Theme',
    description: 'Core theme that defines the story',
    icon: Star,
    color: '#f59e0b',
  },
  secondary: {
    label: 'Secondary Theme',
    description: 'Supporting theme that enriches the narrative',
    icon: Sparkles,
    color: '#8b5cf6',
  },
  motif: {
    label: 'Motif',
    description: 'Recurring element or symbol',
    icon: Circle,
    color: '#22c55e',
  },
};

// Preset theme colors
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

// Common theme keywords
const COMMON_KEYWORDS: Record<string, string[]> = {
  'Love': ['romance', 'affection', 'devotion', 'passion', 'heart'],
  'Redemption': ['forgiveness', 'second chance', 'salvation', 'atonement'],
  'Identity': ['self-discovery', 'belonging', 'authenticity', 'masks'],
  'Power': ['corruption', 'authority', 'control', 'influence'],
  'Freedom': ['liberty', 'escape', 'independence', 'choice'],
  'Justice': ['fairness', 'revenge', 'law', 'morality'],
  'Survival': ['endurance', 'perseverance', 'adaptation', 'resilience'],
  'Loss': ['grief', 'sacrifice', 'letting go', 'mortality'],
  'Growth': ['change', 'maturity', 'learning', 'transformation'],
  'Truth': ['deception', 'secrets', 'revelation', 'honesty'],
};

// Add/Edit theme dialog
function ThemeDialog({
  theme,
  onSave,
  onClose,
  existingThemes,
}: {
  theme?: Theme;
  onSave: (theme: Omit<Theme, 'id'> | Theme) => void;
  onClose: () => void;
  existingThemes: Theme[];
}) {
  const [name, setName] = useState(theme?.name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [level, setLevel] = useState<ThemeLevel>(theme?.level || 'secondary');
  const [parentId, setParentId] = useState(theme?.parentId || '');
  const [keywords, setKeywords] = useState<string[]>(theme?.keywords || []);
  const [color, setColor] = useState(theme?.color || PRESET_COLORS[0]);
  const [newKeyword, setNewKeyword] = useState('');

  const parentOptions = existingThemes.filter(t =>
    t.id !== theme?.id && t.level !== 'motif'
  );

  const suggestedKeywords = useMemo(() => {
    const lowerName = name.toLowerCase();
    for (const [themeName, themeKeywords] of Object.entries(COMMON_KEYWORDS)) {
      if (lowerName.includes(themeName.toLowerCase())) {
        return themeKeywords.filter(k => !keywords.includes(k));
      }
    }
    return [];
  }, [name, keywords]);

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const themeData = {
      ...(theme?.id ? { id: theme.id } : {}),
      name: name.trim(),
      description: description.trim(),
      level,
      parentId: parentId || undefined,
      keywords,
      color,
    };

    onSave(themeData as Theme | Omit<Theme, 'id'>);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-medium text-slate-100">
              {theme ? 'Edit Theme' : 'Add Theme'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Theme Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Redemption, Love, Identity..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 placeholder-slate-500
                focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How does this theme manifest in your story?"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 placeholder-slate-500
                focus:outline-none focus:border-cyan-500/50 resize-none"
              rows={2}
            />
          </div>

          {/* Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Theme Level</label>
            <div className="grid grid-cols-3 gap-1">
              {(Object.entries(THEME_LEVELS) as [ThemeLevel, typeof THEME_LEVELS.primary][]).map(([levelKey, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={levelKey}
                    onClick={() => setLevel(levelKey)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors',
                      level === levelKey
                        ? 'border-current bg-slate-700/50'
                        : 'border-transparent hover:bg-slate-700/30'
                    )}
                    style={{ color: level === levelKey ? info.color : '#94a3b8' }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{info.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent theme (for secondary/motif) */}
          {level !== 'primary' && parentOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Parent Theme (optional)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                  text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">No parent</option>
                {parentOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Keywords */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Keywords</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="default" size="sm" icon={<Hash className="w-2.5 h-2.5" />} className="gap-1">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-0.5 hover:text-red-400"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
                placeholder="Add keyword..."
                className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded-lg
                  text-xs text-slate-200 placeholder-slate-500
                  focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={() => addKeyword(newKeyword)}
                disabled={!newKeyword.trim()}
                className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Suggested keywords */}
            {suggestedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-slate-500 mr-1">Suggestions:</span>
                {suggestedKeywords.slice(0, 5).map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => addKeyword(keyword)}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Color</label>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform',
                    color === presetColor && 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                  )}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              name.trim()
                ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            {theme ? 'Save Changes' : 'Add Theme'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Individual theme card
function ThemeCard({
  theme,
  children,
  onEdit,
  onDelete,
  expanded,
  onToggle,
}: {
  theme: Theme;
  children?: Theme[];
  onEdit: () => void;
  onDelete: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const levelInfo = THEME_LEVELS[theme.level];
  const LevelIcon = levelInfo.icon;
  const hasChildren = children && children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-colors group',
          'bg-slate-800/50 hover:bg-slate-800'
        )}
        style={{ borderColor: `${theme.color}30` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className="p-0.5 rounded hover:bg-slate-700 text-slate-400"
          >
            <ChevronRight className={cn(
              'w-3.5 h-3.5 transition-transform',
              expanded && 'rotate-90'
            )} />
          </button>
        ) : (
          <div className="w-4.5" />
        )}

        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: theme.color }}
        />

        {/* Theme info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">{theme.name}</span>
            <LevelIcon
              className="w-3 h-3 flex-shrink-0"
              style={{ color: levelInfo.color }}
            />
          </div>
          {theme.keywords.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {theme.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="text-[10px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400"
                >
                  {keyword}
                </span>
              ))}
              {theme.keywords.length > 3 && (
                <span className="text-[10px] text-slate-500">
                  +{theme.keywords.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-6 space-y-1"
          >
            {children!.map((child) => (
              <ThemeCard
                key={child.id}
                theme={child}
                onEdit={onEdit}
                onDelete={onDelete}
                expanded={false}
                onToggle={() => {}}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ThemeManager({
  themes,
  onAddTheme,
  onUpdateTheme,
  onRemoveTheme,
  compact = false,
}: ThemeManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<ThemeLevel | 'all'>('all');

  // Organize themes by level
  const themesByLevel = useMemo(() => {
    const result: Record<ThemeLevel, Theme[]> = {
      primary: [],
      secondary: [],
      motif: [],
    };

    themes.forEach(theme => {
      if (levelFilter === 'all' || theme.level === levelFilter) {
        if (!searchQuery || theme.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          result[theme.level].push(theme);
        }
      }
    });

    return result;
  }, [themes, levelFilter, searchQuery]);

  // Get child themes for a parent
  const getChildThemes = useCallback((parentId: string) => {
    return themes.filter(t => t.parentId === parentId);
  }, [themes]);

  const toggleExpanded = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setShowDialog(true);
  };

  const handleSave = (themeData: Omit<Theme, 'id'> | Theme) => {
    if ('id' in themeData) {
      onUpdateTheme(themeData.id, themeData);
    } else {
      onAddTheme(themeData);
    }
    setEditingTheme(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTheme(null);
  };

  // Stats
  const stats = {
    total: themes.length,
    primary: themesByLevel.primary.length,
    secondary: themesByLevel.secondary.length,
    motifs: themesByLevel.motif.length,
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>{stats.total} themes</span>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact theme list */}
        <div className="flex flex-wrap gap-1">
          {themes.slice(0, 6).map((theme) => (
            <span
              key={theme.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: `${theme.color}20`,
                color: theme.color,
              }}
            >
              {theme.name}
            </span>
          ))}
          {themes.length > 6 && (
            <span className="text-xs text-slate-500">+{themes.length - 6} more</span>
          )}
        </div>

        {/* Dialog */}
        <AnimatePresence>
          {showDialog && (
            <ThemeDialog
              theme={editingTheme || undefined}
              onSave={handleSave}
              onClose={handleCloseDialog}
              existingThemes={themes}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-200">Themes</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${THEME_LEVELS.primary.color}20`, color: THEME_LEVELS.primary.color }}
            >
              {stats.primary} primary
            </span>
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${THEME_LEVELS.secondary.color}20`, color: THEME_LEVELS.secondary.color }}
            >
              {stats.secondary} secondary
            </span>
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${THEME_LEVELS.motif.color}20`, color: THEME_LEVELS.motif.color }}
            >
              {stats.motifs} motifs
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Theme
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
              text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as ThemeLevel | 'all')}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
            text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All levels</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="motif">Motifs</option>
        </select>
      </div>

      {/* Theme lists by level */}
      <div className="space-y-4">
        {(['primary', 'secondary', 'motif'] as ThemeLevel[]).map((level) => {
          const levelThemes = themesByLevel[level];
          if (levelThemes.length === 0 && levelFilter !== 'all' && levelFilter !== level) {
            return null;
          }

          const levelInfo = THEME_LEVELS[level];
          const LevelIcon = levelInfo.icon;

          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center gap-2">
                <LevelIcon className="w-4 h-4" style={{ color: levelInfo.color }} />
                <span className="text-xs font-medium text-slate-300">
                  {levelInfo.label}s
                </span>
                <span className="text-xs text-slate-500">({levelThemes.length})</span>
              </div>

              {levelThemes.length > 0 ? (
                <div className="space-y-1">
                  {levelThemes.filter(t => !t.parentId).map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      children={getChildThemes(theme.id)}
                      onEdit={() => handleEdit(theme)}
                      onDelete={() => onRemoveTheme(theme.id)}
                      expanded={expandedThemes.has(theme.id)}
                      onToggle={() => toggleExpanded(theme.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2 px-3 bg-slate-800/30 rounded-lg">
                  No {level} themes defined yet
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {themes.length === 0 && (
        <div className="text-center py-8">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No themes defined yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Add themes to track thematic elements throughout your story
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="mt-4 px-4 py-2 rounded-lg text-sm bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Add Your First Theme
          </button>
        </div>
      )}

      {/* Dialog */}
      <AnimatePresence>
        {showDialog && (
          <ThemeDialog
            theme={editingTheme || undefined}
            onSave={handleSave}
            onClose={handleCloseDialog}
            existingThemes={themes}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Theme badge for use in scene lists
export function ThemeBadge({ theme }: { theme: Theme }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
      style={{
        backgroundColor: `${theme.color}20`,
        color: theme.color,
      }}
    >
      {theme.name}
    </span>
  );
}
