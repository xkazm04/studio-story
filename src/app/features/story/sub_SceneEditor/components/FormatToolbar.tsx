/**
 * FormatToolbar
 * Mode selection and format-specific tools for scene editor
 * Supports screenplay, prose, and comic script modes
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Film,
  BookOpen,
  LayoutGrid,
  ChevronDown,
  Type,
  MessageSquare,
  Clapperboard,
  User,
  Megaphone,
  ArrowRight,
  AlignCenter,
  Heading1,
  Quote,
  Lightbulb,
  Image,
  Zap,
  FileText,
  Settings,
  Keyboard,
  Check,
} from 'lucide-react';

export type FormatMode = 'screenplay' | 'prose' | 'comic';

export interface FormatSettings {
  // Screenplay settings
  screenplayAutoFormat: boolean;
  screenplayShowLineNumbers: boolean;

  // Prose settings
  proseDialogueStyle: 'american' | 'british';
  proseIndentParagraphs: boolean;
  proseSceneBreak: '***' | '* * *' | '---' | '###';

  // Comic settings
  comicNumberingStyle: 'continuous' | 'per-page';
  comicDefaultPanels: number;
}

interface FormatToolbarProps {
  mode: FormatMode;
  onModeChange: (mode: FormatMode) => void;
  onInsertElement: (element: string) => void;
  settings: FormatSettings;
  onSettingsChange: (settings: Partial<FormatSettings>) => void;
}

// Format mode configurations
const FORMAT_MODES = [
  {
    id: 'screenplay' as FormatMode,
    label: 'Screenplay',
    icon: Film,
    description: 'Fountain syntax with industry-standard formatting',
  },
  {
    id: 'prose' as FormatMode,
    label: 'Prose',
    icon: BookOpen,
    description: 'Novel conventions with chapters and dialogue',
  },
  {
    id: 'comic' as FormatMode,
    label: 'Comic',
    icon: LayoutGrid,
    description: 'Panel/page structure with visual cues',
  },
];

// Screenplay elements
const SCREENPLAY_ELEMENTS = [
  { id: 'scene_heading', label: 'Scene Heading', icon: Clapperboard, shortcut: 'Ctrl+1' },
  { id: 'action', label: 'Action', icon: Type, shortcut: 'Ctrl+2' },
  { id: 'character', label: 'Character', icon: User, shortcut: 'Ctrl+3' },
  { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, shortcut: 'Ctrl+4' },
  { id: 'parenthetical', label: 'Parenthetical', icon: Quote, shortcut: 'Ctrl+5' },
  { id: 'transition', label: 'Transition', icon: ArrowRight, shortcut: 'Ctrl+6' },
  { id: 'centered', label: 'Centered', icon: AlignCenter, shortcut: 'Ctrl+7' },
];

// Prose elements
const PROSE_ELEMENTS = [
  { id: 'chapter', label: 'Chapter', icon: Heading1, shortcut: 'Ctrl+1' },
  { id: 'scene_break', label: 'Scene Break', icon: AlignCenter, shortcut: 'Ctrl+2' },
  { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, shortcut: 'Ctrl+3' },
  { id: 'thought', label: 'Thought', icon: Lightbulb, shortcut: 'Ctrl+I' },
  { id: 'quote', label: 'Block Quote', icon: Quote, shortcut: 'Ctrl+Q' },
];

// Comic elements
const COMIC_ELEMENTS = [
  { id: 'page', label: 'New Page', icon: FileText, shortcut: 'Ctrl+1' },
  { id: 'panel', label: 'New Panel', icon: Image, shortcut: 'Ctrl+2' },
  { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, shortcut: 'Ctrl+3' },
  { id: 'caption', label: 'Caption', icon: Type, shortcut: 'Ctrl+4' },
  { id: 'sfx', label: 'Sound Effect', icon: Zap, shortcut: 'Ctrl+5' },
  { id: 'splash', label: 'Splash Page', icon: Megaphone, shortcut: 'Ctrl+Shift+S' },
];

export default function FormatToolbar({
  mode,
  onModeChange,
  onInsertElement,
  settings,
  onSettingsChange,
}: FormatToolbarProps) {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentMode = FORMAT_MODES.find(m => m.id === mode) || FORMAT_MODES[0];
  const elements = mode === 'screenplay'
    ? SCREENPLAY_ELEMENTS
    : mode === 'prose'
      ? PROSE_ELEMENTS
      : COMIC_ELEMENTS;

  const handleElementClick = useCallback((elementId: string) => {
    onInsertElement(elementId);
  }, [onInsertElement]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-800/70">
      {/* Mode Selector */}
      <div className="relative">
        <button
          onClick={() => setShowModeDropdown(!showModeDropdown)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
            'bg-slate-800/80 border border-slate-700/50 hover:border-cyan-500/30',
            'text-slate-300 hover:text-cyan-400'
          )}
        >
          <currentMode.icon className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">{currentMode.label}</span>
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform',
            showModeDropdown && 'rotate-180'
          )} />
        </button>

        <AnimatePresence>
          {showModeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
            >
              {FORMAT_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onModeChange(m.id);
                    setShowModeDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
                    'hover:bg-slate-700/50',
                    m.id === mode && 'bg-cyan-500/10'
                  )}
                >
                  <m.icon className={cn(
                    'w-4 h-4 mt-0.5',
                    m.id === mode ? 'text-cyan-400' : 'text-slate-400'
                  )} />
                  <div>
                    <div className={cn(
                      'text-sm font-medium',
                      m.id === mode ? 'text-cyan-400' : 'text-slate-200'
                    )}>
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500">{m.description}</div>
                  </div>
                  {m.id === mode && (
                    <Check className="w-3.5 h-3.5 text-cyan-400 ml-auto mt-0.5" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700" />

      {/* Element Buttons */}
      <div className="flex items-center gap-1">
        {elements.map((element) => (
          <button
            key={element.id}
            onClick={() => handleElementClick(element.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all',
              'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
            title={`${element.label} (${element.shortcut})`}
          >
            <element.icon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline font-mono uppercase tracking-wide">
              {element.label}
            </span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Shortcuts Button */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all',
          showShortcuts
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        )}
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-3.5 h-3.5" />
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all',
          showSettings
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        )}
        title="Format settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {/* Shortcuts Panel */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-24 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="text-xs font-mono uppercase tracking-wide text-cyan-400 mb-3">
              {currentMode.label} Shortcuts
            </div>
            <div className="space-y-2">
              {elements.map((element) => (
                <div key={element.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{element.label}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-cyan-400 font-mono">
                    {element.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-4 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="text-xs font-mono uppercase tracking-wide text-cyan-400 mb-3">
              {currentMode.label} Settings
            </div>

            {mode === 'screenplay' && (
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Auto-format elements</span>
                  <input
                    type="checkbox"
                    checked={settings.screenplayAutoFormat}
                    onChange={(e) => onSettingsChange({ screenplayAutoFormat: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Show line numbers</span>
                  <input
                    type="checkbox"
                    checked={settings.screenplayShowLineNumbers}
                    onChange={(e) => onSettingsChange({ screenplayShowLineNumbers: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                  />
                </label>
              </div>
            )}

            {mode === 'prose' && (
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Dialogue style</span>
                  <select
                    value={settings.proseDialogueStyle}
                    onChange={(e) => onSettingsChange({ proseDialogueStyle: e.target.value as 'american' | 'british' })}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="american">American "..."</option>
                    <option value="british">British '...'</option>
                  </select>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Indent paragraphs</span>
                  <input
                    type="checkbox"
                    checked={settings.proseIndentParagraphs}
                    onChange={(e) => onSettingsChange({ proseIndentParagraphs: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Scene break</span>
                  <select
                    value={settings.proseSceneBreak}
                    onChange={(e) => onSettingsChange({ proseSceneBreak: e.target.value as '***' | '* * *' | '---' | '###' })}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="***">***</option>
                    <option value="* * *">* * *</option>
                    <option value="---">---</option>
                    <option value="###">###</option>
                  </select>
                </label>
              </div>
            )}

            {mode === 'comic' && (
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Panel numbering</span>
                  <select
                    value={settings.comicNumberingStyle}
                    onChange={(e) => onSettingsChange({ comicNumberingStyle: e.target.value as 'continuous' | 'per-page' })}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="per-page">Per page (1, 2, 3...)</option>
                    <option value="continuous">Continuous</option>
                  </select>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Default panels/page</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={settings.comicDefaultPanels}
                    onChange={(e) => onSettingsChange({ comicDefaultPanels: parseInt(e.target.value) || 6 })}
                    className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </label>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
