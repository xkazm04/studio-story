/**
 * VoiceAssigner Component
 *
 * Character voice mapping interface for assigning TTS voices to characters.
 * Includes voice preview, emotion overrides, and narrator configuration.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  User,
  Users,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  Volume2,
  Settings,
  Sparkles,
  BookOpen,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  type VoiceConfig,
  type CharacterVoiceAssignment,
  type NarratorConfig,
  type VoiceSettings,
  PRESET_VOICES,
  DEFAULT_VOICE_SETTINGS,
} from '@/lib/audio';

// ============================================================================
// Types
// ============================================================================

interface Character {
  id: string;
  name: string;
  role?: string;
  imageUrl?: string;
}

interface VoiceAssignerProps {
  characters: Character[];
  assignments: CharacterVoiceAssignment[];
  narratorConfig: NarratorConfig | null;
  availableVoices?: VoiceConfig[];
  onAssign: (characterId: string, voiceId: string) => void;
  onUnassign: (characterId: string) => void;
  onNarratorChange: (voiceId: string, style: NarratorConfig['style']) => void;
  onPreviewVoice?: (voiceId: string, text: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const NARRATOR_STYLES: { value: NarratorConfig['style']; label: string; description: string }[] = [
  { value: 'neutral', label: 'Neutral', description: 'Clear and straightforward delivery' },
  { value: 'warm', label: 'Warm', description: 'Friendly and inviting tone' },
  { value: 'dramatic', label: 'Dramatic', description: 'Expressive and theatrical' },
  { value: 'mysterious', label: 'Mysterious', description: 'Intriguing and suspenseful' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic and engaging' },
];

const SAMPLE_TEXT = 'This is a sample of how this voice sounds when reading your story.';

// ============================================================================
// Sub-Components
// ============================================================================

interface VoiceCardProps {
  voice: VoiceConfig;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function VoiceCard({ voice, isSelected, isPlaying, onSelect, onPreview }: VoiceCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'w-full p-3 rounded-lg border text-left transition-all',
        isSelected
          ? 'bg-cyan-600/20 border-cyan-500/50'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Mic className={cn('w-3.5 h-3.5', isSelected ? 'text-cyan-400' : 'text-slate-500')} />
            <span className={cn('text-sm font-medium', isSelected ? 'text-cyan-300' : 'text-slate-200')}>
              {voice.name}
            </span>
            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
          </div>
          {voice.metadata && (
            <div className="flex items-center gap-2 mt-1">
              {voice.metadata.gender && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                  {voice.metadata.gender}
                </span>
              )}
              {voice.metadata.age && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                  {voice.metadata.age}
                </span>
              )}
              {voice.metadata.style?.slice(0, 2).map(style => (
                <span key={style} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  {style}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            isPlaying
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          )}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
      </div>
    </motion.button>
  );
}

interface CharacterRowProps {
  character: Character;
  assignment?: CharacterVoiceAssignment;
  isExpanded: boolean;
  onToggle: () => void;
  onAssign: (voiceId: string) => void;
  onUnassign: () => void;
  availableVoices: VoiceConfig[];
  onPreviewVoice: (voiceId: string) => void;
  playingVoiceId: string | null;
}

function CharacterRow({
  character,
  assignment,
  isExpanded,
  onToggle,
  onAssign,
  onUnassign,
  availableVoices,
  onPreviewVoice,
  playingVoiceId,
}: CharacterRowProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoices = useMemo(() => {
    if (!searchQuery) return availableVoices;
    const query = searchQuery.toLowerCase();
    return availableVoices.filter(
      v =>
        v.name.toLowerCase().includes(query) ||
        v.metadata?.gender?.toLowerCase().includes(query) ||
        v.metadata?.style?.some(s => s.toLowerCase().includes(query))
    );
  }, [availableVoices, searchQuery]);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
            {character.imageUrl ? (
              <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-200">{character.name}</div>
            {character.role && (
              <div className="text-[10px] text-slate-500">{character.role}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assignment ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-600/20">
              <Mic className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-300">{assignment.voiceConfig.name}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">No voice assigned</span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 bg-slate-900/50 border-t border-slate-700">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voices..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Voice Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredVoices.map(voice => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={assignment?.voiceId === voice.id}
                    isPlaying={playingVoiceId === voice.id}
                    onSelect={() => onAssign(voice.id)}
                    onPreview={() => onPreviewVoice(voice.id)}
                  />
                ))}
              </div>

              {/* Actions */}
              {assignment && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUnassign}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove Voice
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoiceSettingsEditorProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
}

function VoiceSettingsEditor({ settings, onChange }: VoiceSettingsEditorProps) {
  const handleChange = (key: keyof VoiceSettings, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Stability</span>
          <span className="text-[10px] text-slate-500">{Math.round(settings.stability * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.stability * 100}
          onChange={(e) => handleChange('stability', Number(e.target.value) / 100)}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Clarity</span>
          <span className="text-[10px] text-slate-500">{Math.round(settings.similarityBoost * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.similarityBoost * 100}
          onChange={(e) => handleChange('similarityBoost', Number(e.target.value) / 100)}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Style</span>
          <span className="text-[10px] text-slate-500">{Math.round(settings.style * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.style * 100}
          onChange={(e) => handleChange('style', Number(e.target.value) / 100)}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Speed</span>
          <span className="text-[10px] text-slate-500">{settings.speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="50"
          max="200"
          value={settings.speed * 100}
          onChange={(e) => handleChange('speed', Number(e.target.value) / 100)}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VoiceAssigner({
  characters,
  assignments,
  narratorConfig,
  availableVoices = PRESET_VOICES,
  onAssign,
  onUnassign,
  onNarratorChange,
  onPreviewVoice,
  isLoading = false,
  className,
}: VoiceAssignerProps) {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [showNarratorSettings, setShowNarratorSettings] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedNarratorStyle, setSelectedNarratorStyle] = useState<NarratorConfig['style']>(
    narratorConfig?.style || 'neutral'
  );

  // Get assignment map for quick lookup
  const assignmentMap = useMemo(() => {
    const map = new Map<string, CharacterVoiceAssignment>();
    assignments.forEach(a => map.set(a.characterId, a));
    return map;
  }, [assignments]);

  // Count assigned voices
  const assignedCount = assignments.length;
  const totalCount = characters.length;

  // Handle voice preview
  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voiceId);
    try {
      await onPreviewVoice?.(voiceId, SAMPLE_TEXT);
    } finally {
      setPlayingVoiceId(null);
    }
  }, [onPreviewVoice, playingVoiceId]);

  // Auto-assign voices based on character metadata
  const handleAutoAssign = useCallback(() => {
    characters.forEach(character => {
      if (assignmentMap.has(character.id)) return;

      // Simple matching based on role
      const role = character.role?.toLowerCase() || '';
      let matchedVoice: VoiceConfig | undefined;

      if (role.includes('hero') || role.includes('protagonist')) {
        matchedVoice = availableVoices.find(v => v.metadata?.style?.includes('heroic'));
      } else if (role.includes('villain') || role.includes('antagonist')) {
        matchedVoice = availableVoices.find(v => v.metadata?.style?.includes('menacing'));
      } else if (role.includes('narrator')) {
        matchedVoice = availableVoices.find(v => v.metadata?.style?.includes('narrative'));
      }

      // Default to first available voice
      if (!matchedVoice) {
        matchedVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
      }

      if (matchedVoice) {
        onAssign(character.id, matchedVoice.id);
      }
    });
  }, [characters, availableVoices, assignmentMap, onAssign]);

  return (
    <div className={cn('flex flex-col h-full bg-slate-950', className)}>
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-purple-600/20">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Voice Assignment</h2>
              <p className="text-xs text-slate-500">
                {assignedCount} of {totalCount} characters assigned
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoAssign}
              className="h-7 px-2 text-xs"
              disabled={isLoading}
            >
              <Wand2 className="w-3.5 h-3.5 mr-1" />
              Auto-Assign
            </Button>
          </div>
        </div>
      </div>

      {/* Narrator Section */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <button
          onClick={() => setShowNarratorSettings(!showNarratorSettings)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">Narrator Voice</div>
              <div className="text-[10px] text-slate-500">
                {narratorConfig ? narratorConfig.voiceConfig.name : 'Not configured'}
              </div>
            </div>
          </div>
          {showNarratorSettings ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {showNarratorSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Narrator Style */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400">Narration Style</span>
                  <div className="grid grid-cols-5 gap-1">
                    {NARRATOR_STYLES.map(style => (
                      <button
                        key={style.value}
                        onClick={() => {
                          setSelectedNarratorStyle(style.value);
                          if (narratorConfig) {
                            onNarratorChange(narratorConfig.voiceId, style.value);
                          }
                        }}
                        title={style.description}
                        className={cn(
                          'py-1.5 text-[9px] font-medium rounded transition-colors',
                          selectedNarratorStyle === style.value
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        )}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableVoices
                    .filter(v => v.metadata?.style?.includes('narrative') || v.metadata?.style?.includes('calm'))
                    .map(voice => (
                      <VoiceCard
                        key={voice.id}
                        voice={voice}
                        isSelected={narratorConfig?.voiceId === voice.id}
                        isPlaying={playingVoiceId === voice.id}
                        onSelect={() => onNarratorChange(voice.id, selectedNarratorStyle)}
                        onPreview={() => handlePreviewVoice(voice.id)}
                      />
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {characters.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No characters found</p>
              <p className="text-xs text-slate-600 mt-1">
                Add characters to your project to assign voices
              </p>
            </div>
          </div>
        ) : (
          characters.map(character => (
            <CharacterRow
              key={character.id}
              character={character}
              assignment={assignmentMap.get(character.id)}
              isExpanded={expandedCharacter === character.id}
              onToggle={() => setExpandedCharacter(
                expandedCharacter === character.id ? null : character.id
              )}
              onAssign={(voiceId) => onAssign(character.id, voiceId)}
              onUnassign={() => onUnassign(character.id)}
              availableVoices={availableVoices}
              onPreviewVoice={handlePreviewVoice}
              playingVoiceId={playingVoiceId}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="shrink-0 px-4 py-2 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-4">
            <span>{availableVoices.length} voices available</span>
            <span>{assignedCount} assigned</span>
          </div>
          {assignedCount < totalCount && (
            <span className="text-amber-400">
              {totalCount - assignedCount} characters need voices
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceAssigner;
