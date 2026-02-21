'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mic,
  Play,
  Pause,
  Star,
  StarOff,
  Plus,
  Check,
  X,
  ChevronRight,
  Sparkles,
  ListPlus,
  Volume2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import {
  voiceMatcher,
  type VoiceMatch,
  type AuditionConfig,
  type AuditionLine,
} from '@/lib/voice';
import type { Character } from '@/app/types/Character';
import type { Voice } from '@/app/types/Voice';

interface AuditionPanelProps {
  characters: Character[];
  voices: Voice[];
  selectedCharacterId?: string;
  onSelectCharacter: (characterId: string) => void;
  onCastVoice: (characterId: string, voiceId: string) => void;
  className?: string;
}

export default function AuditionPanel({
  characters,
  voices,
  selectedCharacterId,
  onSelectCharacter,
  onCastVoice,
  className = '',
}: AuditionPanelProps) {
  // State
  const [showMatches, setShowMatches] = useState(true);
  const [auditions, setAuditions] = useState<Map<string, AuditionConfig[]>>(new Map());
  const [playingLine, setPlayingLine] = useState<string | null>(null);
  const [customLineText, setCustomLineText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Get selected character
  const selectedCharacter = useMemo(
    () => characters.find(c => c.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  // Get voice matches for selected character
  const matches = useMemo(() => {
    if (!selectedCharacter) return [];
    return voiceMatcher.findMatches(selectedCharacter, voices, 6);
  }, [selectedCharacter, voices]);

  // Get auditions for selected character
  const characterAuditions = useMemo(() => {
    if (!selectedCharacterId) return [];
    return auditions.get(selectedCharacterId) || voiceMatcher.getAuditions(selectedCharacterId);
  }, [selectedCharacterId, auditions]);

  // Get casting for selected character
  const casting = useMemo(() => {
    if (!selectedCharacterId) return undefined;
    return voiceMatcher.getCasting(selectedCharacterId);
  }, [selectedCharacterId]);

  // Handle creating audition
  const handleCreateAudition = useCallback((voice: Voice) => {
    if (!selectedCharacter) return;

    const audition = voiceMatcher.createAudition(selectedCharacter, voice);
    setAuditions(prev => {
      const next = new Map(prev);
      const list = next.get(selectedCharacter.id) || [];
      next.set(selectedCharacter.id, [...list, audition]);
      return next;
    });
  }, [selectedCharacter]);

  // Handle adding custom line
  const handleAddCustomLine = useCallback(() => {
    if (!customLineText.trim() || !selectedCharacter) return;

    // Add custom line to all current auditions
    setAuditions(prev => {
      const next = new Map(prev);
      const list = next.get(selectedCharacter.id) || [];
      const updated = list.map(audition => ({
        ...audition,
        lines: [
          ...audition.lines,
          {
            id: `custom_${Date.now()}`,
            text: customLineText.trim(),
            context: 'Custom audition line',
          },
        ],
      }));
      next.set(selectedCharacter.id, updated);
      return next;
    });

    setCustomLineText('');
    setShowCustomInput(false);
  }, [customLineText, selectedCharacter]);

  // Handle playing line
  const handlePlayLine = useCallback((lineId: string) => {
    if (playingLine === lineId) {
      setPlayingLine(null);
    } else {
      setPlayingLine(lineId);
      // Simulate playback duration
      setTimeout(() => setPlayingLine(null), 3000);
    }
  }, [playingLine]);

  // Handle rating audition
  const handleRateAudition = useCallback((voiceId: string, rating: number) => {
    if (!selectedCharacterId) return;
    voiceMatcher.rateAudition(selectedCharacterId, voiceId, rating);
    // Trigger refresh
    setAuditions(prev => new Map(prev));
  }, [selectedCharacterId]);

  // Handle casting
  const handleCast = useCallback((voiceId: string) => {
    if (!selectedCharacterId) return;
    voiceMatcher.castVoice(selectedCharacterId, voiceId);
    onCastVoice(selectedCharacterId, voiceId);
  }, [selectedCharacterId, onCastVoice]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback((voiceId: string) => {
    if (voiceMatcher.isFavorite(voiceId)) {
      voiceMatcher.removeFavorite(voiceId);
    } else {
      voiceMatcher.addFavorite(voiceId);
    }
    // Trigger refresh
    setAuditions(prev => new Map(prev));
  }, []);

  // Handle shortlist
  const handleShortlist = useCallback((voiceId: string) => {
    if (!selectedCharacterId) return;
    const shortlist = voiceMatcher.getShortlist(selectedCharacterId);
    if (shortlist.includes(voiceId)) {
      voiceMatcher.removeFromShortlist(selectedCharacterId, voiceId);
    } else {
      voiceMatcher.addToShortlist(selectedCharacterId, voiceId);
    }
    setAuditions(prev => new Map(prev));
  }, [selectedCharacterId]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Character List */}
      <div className="w-64 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Characters
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {characters.map(character => {
            const isSelected = character.id === selectedCharacterId;
            const hasCasting = !!voiceMatcher.getCasting(character.id);

            return (
              <button
                key={character.id}
                onClick={() => onSelectCharacter(character.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                  {character.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">
                    {character.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {character.type || 'Character'}
                  </div>
                </div>
                {hasCasting && (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                {isSelected && (
                  <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCharacter ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Casting: {selectedCharacter.name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedCharacter.type || 'Character'} •{' '}
                    {characterAuditions.length} auditions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMatches(!showMatches)}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    {showMatches ? 'Hide' : 'Show'} Suggestions
                  </Button>
                </div>
              </div>

              {/* Current Casting */}
              {casting && (
                <div className="mt-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">
                        Cast: {voices.find(v => v.voice_id === casting)?.name || 'Unknown'}
                      </span>
                    </div>
                    <button
                      onClick={() => voiceMatcher.removeCasting(selectedCharacterId!)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Voice Matches */}
              <AnimatePresence>
                {showMatches && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Suggested Voices
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {matches.map((match) => {
                        const isFavorite = voiceMatcher.isFavorite(match.voice.voice_id);
                        const isShortlisted = voiceMatcher.getShortlist(selectedCharacterId!).includes(match.voice.voice_id);
                        const hasAudition = characterAuditions.some(a => a.voiceId === match.voice.voice_id);

                        return (
                          <div
                            key={match.voice.voice_id}
                            className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-sm font-medium text-slate-200">
                                  {match.voice.name}
                                </div>
                                <div className={`text-xs font-medium ${getScoreColor(match.score)}`}>
                                  {match.score}% match
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleFavorite(match.voice.voice_id)}
                                  className={`p-1 rounded ${
                                    isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleShortlist(match.voice.voice_id)}
                                  className={`p-1 rounded ${
                                    isShortlisted ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  <ListPlus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {match.reasons.slice(0, 2).map((reason, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>

                            <Button
                              variant={hasAudition ? 'ghost' : 'secondary'}
                              size="sm"
                              className="w-full"
                              onClick={() => handleCreateAudition(match.voice)}
                              disabled={hasAudition}
                            >
                              {hasAudition ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  Auditioned
                                </>
                              ) : (
                                <>
                                  <Mic className="w-3.5 h-3.5 mr-1.5" />
                                  Audition
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Auditions */}
              {characterAuditions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-400" />
                      Auditions
                    </h3>
                    <button
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line
                    </button>
                  </div>

                  {/* Custom line input */}
                  <AnimatePresence>
                    {showCustomInput && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                          <input
                            type="text"
                            value={customLineText}
                            onChange={(e) => setCustomLineText(e.target.value)}
                            placeholder="Enter custom audition line..."
                            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLine()}
                          />
                          <button
                            onClick={handleAddCustomLine}
                            disabled={!customLineText.trim()}
                            className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowCustomInput(false)}
                            className="p-1.5 rounded bg-slate-800 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Audition list */}
                  <div className="space-y-3">
                    {characterAuditions.map((audition) => {
                      const voice = voices.find(v => v.voice_id === audition.voiceId);
                      if (!voice) return null;

                      return (
                        <div
                          key={audition.voiceId}
                          className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Volume2 className="w-5 h-5 text-purple-400" />
                              <div>
                                <div className="text-sm font-medium text-slate-200">
                                  {voice.name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {audition.lines.length} lines •{' '}
                                  {audition.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Rating stars */}
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRateAudition(audition.voiceId, star)}
                                    className={`p-0.5 ${
                                      audition.rating && star <= audition.rating
                                        ? 'text-amber-400'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                ))}
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleCast(audition.voiceId)}
                                disabled={casting === audition.voiceId}
                              >
                                {casting === audition.voiceId ? 'Cast' : 'Select'}
                              </Button>
                            </div>
                          </div>

                          {/* Lines */}
                          <div className="space-y-2">
                            {audition.lines.map((line) => (
                              <div
                                key={line.id}
                                className="flex items-start gap-3 p-2 rounded bg-slate-900/60"
                              >
                                <button
                                  onClick={() => handlePlayLine(line.id)}
                                  className={`p-1.5 rounded-full flex-shrink-0 ${
                                    playingLine === line.id
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {playingLine === line.id ? (
                                    <Pause className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-300">{line.text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500">
                                      {line.context}
                                    </span>
                                    {line.emotion && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                        {line.emotion}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {characterAuditions.length === 0 && !showMatches && (
                <div className="text-center py-12">
                  <Mic className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    No Auditions Yet
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Start by viewing voice suggestions or adding voices manually
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setShowMatches(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Show Suggestions
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Select a Character
              </h3>
              <p className="text-sm text-slate-500">
                Choose a character to start the casting process
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
