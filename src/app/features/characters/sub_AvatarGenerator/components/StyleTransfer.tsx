/**
 * StyleTransfer - Apply style from one character to others
 * Design: Clean Manuscript style with cyan accents
 *
 * Enables transferring visual style from a reference character to target characters
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Image,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Settings,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  CharacterStyleProfile,
  StyleDefinition,
} from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

export interface StyleTransferProps {
  characters: CharacterStyleProfile[];
  styleDefinition?: StyleDefinition;
  onTransfer?: (
    sourceId: string,
    targetIds: string[],
    settings: TransferSettings
  ) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export interface TransferSettings {
  preserveIdentity: boolean;
  transferStrength: number;  // 0-100
  includeColors: boolean;
  includeLighting: boolean;
  includeArtStyle: boolean;
}

type TransferMode = 'single' | 'batch';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TRANSFER_SETTINGS: TransferSettings = {
  preserveIdentity: true,
  transferStrength: 75,
  includeColors: true,
  includeLighting: true,
  includeArtStyle: true,
};

const TRANSFER_STRENGTH_PRESETS = [
  { value: 25, label: 'Subtle', description: 'Light style hints' },
  { value: 50, label: 'Moderate', description: 'Balanced transfer' },
  { value: 75, label: 'Strong', description: 'Clear style match' },
  { value: 100, label: 'Full', description: 'Complete style copy' },
];

// ============================================================================
// Subcomponents
// ============================================================================

interface CharacterSelectCardProps {
  character: CharacterStyleProfile;
  isSelected: boolean;
  isSource: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const CharacterSelectCard: React.FC<CharacterSelectCardProps> = ({
  character,
  isSelected,
  isSource,
  onClick,
  disabled = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'relative flex flex-col items-center p-2 rounded-lg border transition-all',
        isSelected
          ? isSource
            ? 'bg-purple-500/20 border-purple-500/40 ring-2 ring-purple-500/30'
            : 'bg-cyan-500/20 border-cyan-500/40 ring-2 ring-cyan-500/30'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 mb-2">
        {character.avatarUrl ? (
          <img
            src={character.thumbnailUrl || character.avatarUrl}
            alt={character.characterName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={20} />
          </div>
        )}
      </div>

      {/* Name */}
      <span className={cn(
        'font-mono text-[10px] text-center truncate w-full',
        isSelected
          ? isSource ? 'text-purple-400' : 'text-cyan-400'
          : 'text-slate-400'
      )}>
        {character.characterName}
      </span>

      {/* Selection indicator */}
      {isSelected && (
        <div className={cn(
          'absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center',
          isSource ? 'bg-purple-500' : 'bg-cyan-500'
        )}>
          <Check size={10} className="text-white" />
        </div>
      )}

      {/* Source badge */}
      {isSource && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5
                        bg-purple-500 rounded text-[8px] font-mono text-white">
          SOURCE
        </div>
      )}
    </motion.button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const StyleTransfer: React.FC<StyleTransferProps> = ({
  characters,
  styleDefinition,
  onTransfer,
  disabled = false,
  compact = false,
}) => {
  const [sourceCharacterId, setSourceCharacterId] = useState<string | null>(null);
  const [targetCharacterIds, setTargetCharacterIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<TransferSettings>(DEFAULT_TRANSFER_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>('batch');
  const [isTransferring, setIsTransferring] = useState(false);

  // Get source character
  const sourceCharacter = useMemo(() => {
    return characters.find(c => c.characterId === sourceCharacterId);
  }, [characters, sourceCharacterId]);

  // Get target characters
  const targetCharacters = useMemo(() => {
    return characters.filter(c => targetCharacterIds.has(c.characterId));
  }, [characters, targetCharacterIds]);

  // Available targets (excluding source)
  const availableTargets = useMemo(() => {
    return characters.filter(c => c.characterId !== sourceCharacterId);
  }, [characters, sourceCharacterId]);

  // Handle source selection
  const handleSourceSelect = useCallback((characterId: string) => {
    if (characterId === sourceCharacterId) {
      setSourceCharacterId(null);
    } else {
      setSourceCharacterId(characterId);
      // Remove from targets if it was selected as target
      setTargetCharacterIds(prev => {
        const next = new Set(prev);
        next.delete(characterId);
        return next;
      });
    }
  }, [sourceCharacterId]);

  // Handle target selection
  const handleTargetSelect = useCallback((characterId: string) => {
    if (characterId === sourceCharacterId) return;

    setTargetCharacterIds(prev => {
      const next = new Set(prev);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }
      return next;
    });
  }, [sourceCharacterId]);

  // Select all available targets
  const selectAllTargets = useCallback(() => {
    setTargetCharacterIds(new Set(availableTargets.map(c => c.characterId)));
  }, [availableTargets]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setTargetCharacterIds(new Set());
  }, []);

  // Update a setting
  const updateSetting = <K extends keyof TransferSettings>(
    key: K,
    value: TransferSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Execute transfer
  const executeTransfer = useCallback(async () => {
    if (!sourceCharacterId || targetCharacterIds.size === 0 || !onTransfer) return;

    setIsTransferring(true);
    try {
      await onTransfer(
        sourceCharacterId,
        Array.from(targetCharacterIds),
        settings
      );
    } finally {
      setIsTransferring(false);
    }
  }, [sourceCharacterId, targetCharacterIds, settings, onTransfer]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              style_transfer
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source mini-select */}
          <div className="flex-1">
            <select
              value={sourceCharacterId || ''}
              onChange={(e) => setSourceCharacterId(e.target.value || null)}
              disabled={disabled}
              className="w-full px-2 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded
                         font-mono text-xs text-slate-300
                         focus:outline-none focus:ring-1 focus:ring-purple-500/50
                         disabled:opacity-50"
            >
              <option value="">Select source</option>
              {characters.map(c => (
                <option key={c.characterId} value={c.characterId}>
                  {c.characterName}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight size={14} className="text-slate-500" />

          {/* Target count */}
          <div className="px-2 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded
                          font-mono text-xs text-slate-400">
            {targetCharacterIds.size} targets
          </div>

          {/* Transfer button */}
          <button
            onClick={executeTransfer}
            disabled={disabled || !sourceCharacterId || targetCharacterIds.size === 0 || isTransferring}
            className="px-2 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30
                       text-cyan-400 font-mono text-xs transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            style_transfer
          </h3>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded transition-colors',
            showSettings
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/60'
          )}
        >
          <Settings size={12} />
          <span className="font-mono text-[10px]">Settings</span>
          {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Transfer Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 space-y-4"
          >
            {/* Transfer Strength */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] text-slate-500 uppercase">
                  transfer_strength
                </label>
                <span className="font-mono text-xs text-slate-300">
                  {settings.transferStrength}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.transferStrength}
                onChange={(e) => updateSetting('transferStrength', Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
              />
              <div className="flex justify-between mt-1">
                {TRANSFER_STRENGTH_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSetting('transferStrength', preset.value)}
                    disabled={disabled}
                    className={cn(
                      'px-2 py-0.5 rounded font-mono text-[9px] transition-colors',
                      settings.transferStrength === preset.value
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preserve Identity Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-slate-300 block">Preserve Identity</span>
                <span className="font-mono text-[9px] text-slate-500">
                  Maintain unique character features
                </span>
              </div>
              <button
                onClick={() => updateSetting('preserveIdentity', !settings.preserveIdentity)}
                disabled={disabled}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  settings.preserveIdentity ? 'bg-cyan-500' : 'bg-slate-600'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                  settings.preserveIdentity ? 'left-5' : 'left-1'
                )} />
              </button>
            </div>

            {/* Transfer Options */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'includeColors' as const, label: 'Colors' },
                { key: 'includeLighting' as const, label: 'Lighting' },
                { key: 'includeArtStyle' as const, label: 'Art Style' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateSetting(key, !settings[key])}
                  disabled={disabled}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-1.5 rounded border transition-colors',
                    settings[key]
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                  )}
                >
                  <Check size={10} className={settings[key] ? 'opacity-100' : 'opacity-0'} />
                  <span className="font-mono text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-[10px] text-purple-400 uppercase">
            select_source
          </label>
          <span className="font-mono text-[10px] text-slate-500">
            Style to copy from
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
          {characters.map((character) => (
            <CharacterSelectCard
              key={character.characterId}
              character={character}
              isSelected={character.characterId === sourceCharacterId}
              isSource={true}
              onClick={() => handleSourceSelect(character.characterId)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Transfer Arrow */}
      {sourceCharacter && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-4">
            {/* Source preview */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 border-2 border-purple-500">
                {sourceCharacter.avatarUrl ? (
                  <img
                    src={sourceCharacter.thumbnailUrl || sourceCharacter.avatarUrl}
                    alt={sourceCharacter.characterName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={20} />
                  </div>
                )}
              </div>
              <span className="font-mono text-[9px] text-purple-400 mt-1">
                {sourceCharacter.characterName}
              </span>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <ArrowRight size={24} className="text-cyan-400" />
              <span className="font-mono text-[9px] text-slate-500 mt-1">
                {settings.transferStrength}%
              </span>
            </div>

            {/* Target count */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-slate-800/60 border-2 border-dashed border-cyan-500/50
                              flex items-center justify-center">
                <span className="font-mono text-xl text-cyan-400">
                  {targetCharacterIds.size}
                </span>
              </div>
              <span className="font-mono text-[9px] text-cyan-400 mt-1">
                targets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Target Selection */}
      {sourceCharacter && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-[10px] text-cyan-400 uppercase">
              select_targets
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllTargets}
                disabled={disabled}
                className="font-mono text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={clearAllSelections}
                disabled={disabled}
                className="font-mono text-[10px] text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
            {availableTargets.map((character) => (
              <CharacterSelectCard
                key={character.characterId}
                character={character}
                isSelected={targetCharacterIds.has(character.characterId)}
                isSource={false}
                onClick={() => handleTargetSelect(character.characterId)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* No source selected message */}
      {!sourceCharacter && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Sparkles size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-sm mb-1">Select a source character</p>
          <p className="font-mono text-xs text-slate-600">
            Choose a character whose style you want to transfer
          </p>
        </div>
      )}

      {/* Warning if full transfer without preserve identity */}
      {settings.transferStrength === 100 && !settings.preserveIdentity && (
        <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
          <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-xs text-yellow-400">
              Full strength without identity preservation
            </p>
            <p className="font-mono text-[10px] text-yellow-400/70">
              Target characters may lose their unique features
            </p>
          </div>
        </div>
      )}

      {/* Transfer Button */}
      <button
        onClick={executeTransfer}
        disabled={disabled || !sourceCharacterId || targetCharacterIds.size === 0 || isTransferring}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
          'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
          'font-mono text-sm transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isTransferring ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Transferring Style...</span>
          </>
        ) : (
          <>
            <Wand2 size={16} />
            <span>
              Transfer Style to {targetCharacterIds.size} Character{targetCharacterIds.size !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default StyleTransfer;
