'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  Play,
  Pause,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
  X,
  Trophy,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { voiceMatcher, type AuditionConfig } from '@/lib/voice';
import type { Voice } from '@/app/types/Voice';

interface CastingComparerProps {
  characterId: string;
  characterName: string;
  voices: Voice[];
  onSelectWinner: (voiceId: string) => void;
  onClose: () => void;
  className?: string;
}

export default function CastingComparer({
  characterId,
  characterName,
  voices,
  onSelectWinner,
  onClose,
  className = '',
}: CastingComparerProps) {
  // Get auditions for comparison
  const auditions = useMemo(() => voiceMatcher.getAuditions(characterId), [characterId]);

  // State for A/B comparison
  const [sideA, setSideA] = useState<string | null>(auditions[0]?.voiceId || null);
  const [sideB, setSideB] = useState<string | null>(auditions[1]?.voiceId || null);
  const [playingLine, setPlayingLine] = useState<{ side: 'A' | 'B'; lineId: string } | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [comparisonNotes, setComparisonNotes] = useState('');

  // Get audition by voice ID
  const getAudition = useCallback((voiceId: string | null): AuditionConfig | undefined => {
    if (!voiceId) return undefined;
    return auditions.find(a => a.voiceId === voiceId);
  }, [auditions]);

  // Get voice by ID
  const getVoice = useCallback((voiceId: string | null): Voice | undefined => {
    if (!voiceId) return undefined;
    return voices.find(v => v.voice_id === voiceId);
  }, [voices]);

  const auditionA = getAudition(sideA);
  const auditionB = getAudition(sideB);
  const voiceA = getVoice(sideA);
  const voiceB = getVoice(sideB);

  // Get available voices for selection (not already selected on other side)
  const availableForA = auditions.filter(a => a.voiceId !== sideB);
  const availableForB = auditions.filter(a => a.voiceId !== sideA);

  // Handle play
  const handlePlay = useCallback((side: 'A' | 'B', lineId: string) => {
    if (playingLine?.side === side && playingLine?.lineId === lineId) {
      setPlayingLine(null);
    } else {
      setPlayingLine({ side, lineId });
      // Simulate playback
      setTimeout(() => setPlayingLine(null), 3000);
    }
  }, [playingLine]);

  // Navigate lines
  const maxLines = Math.max(
    auditionA?.lines.length || 0,
    auditionB?.lines.length || 0
  );

  const handlePrevLine = () => {
    setCurrentLineIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextLine = () => {
    setCurrentLineIndex(prev => Math.min(maxLines - 1, prev + 1));
  };

  // Handle winner selection
  const handleSelectWinner = (voiceId: string) => {
    onSelectWinner(voiceId);
  };

  // Render voice card
  const renderVoiceCard = (
    side: 'A' | 'B',
    audition: AuditionConfig | undefined,
    voice: Voice | undefined,
    available: AuditionConfig[],
    selected: string | null,
    setSelected: (id: string | null) => void
  ) => {
    const currentLine = audition?.lines[currentLineIndex];
    const isPlaying = playingLine?.side === side && playingLine?.lineId === currentLine?.id;

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${
          side === 'A' ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-purple-500/30 bg-purple-500/5'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              side === 'A' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
            }`}>
              Voice {side}
            </span>
            {audition?.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= audition.rating! ? 'text-amber-400 fill-current' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Voice selector */}
          <select
            value={selected || ''}
            onChange={(e) => setSelected(e.target.value || null)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
          >
            <option value="">Select voice...</option>
            {available.map((a) => {
              const v = getVoice(a.voiceId);
              return (
                <option key={a.voiceId} value={a.voiceId}>
                  {v?.name || a.voiceId}
                </option>
              );
            })}
          </select>
        </div>

        {/* Content */}
        {audition && voice ? (
          <div className="flex-1 flex flex-col p-4">
            {/* Voice info */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                side === 'A' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
              }`}>
                <Volume2 className={`w-5 h-5 ${
                  side === 'A' ? 'text-cyan-400' : 'text-purple-400'
                }`} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">{voice.name}</div>
                <div className="text-[10px] text-slate-500">
                  {voice.gender || 'Voice'}{voice.age_range ? ` • ${voice.age_range}` : ''}
                </div>
              </div>
            </div>

            {/* Current line */}
            {currentLine && (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-slate-500">
                    Line {currentLineIndex + 1} of {audition.lines.length}
                  </span>
                  {currentLine.emotion && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      side === 'A' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {currentLine.emotion}
                    </span>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${
                  side === 'A' ? 'border-cyan-500/20 bg-slate-900/60' : 'border-purple-500/20 bg-slate-900/60'
                }`}>
                  <p className="text-sm text-slate-200 mb-4">{currentLine.text}</p>

                  <button
                    onClick={() => handlePlay(side, currentLine.id)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isPlaying
                        ? side === 'A' ? 'bg-cyan-500 text-white' : 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Playing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Select winner button */}
            <Button
              variant="primary"
              className={`mt-4 w-full ${
                side === 'A' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}
              onClick={() => handleSelectWinner(audition.voiceId)}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Select as Winner
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-slate-500">Select a voice to compare</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Compare Voices
              </h2>
              <p className="text-sm text-slate-400">
                Casting for {characterName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main comparison area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Side A */}
          {renderVoiceCard('A', auditionA, voiceA, availableForA, sideA, setSideA)}

          {/* Divider */}
          <div className="w-px bg-slate-800 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-400">VS</span>
            </div>
          </div>

          {/* Side B */}
          {renderVoiceCard('B', auditionB, voiceB, availableForB, sideB, setSideB)}
        </div>

        {/* Line navigation */}
        {maxLines > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-slate-800">
            <button
              onClick={handlePrevLine}
              disabled={currentLineIndex === 0}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400">
              Line {currentLineIndex + 1} of {maxLines}
            </span>
            <button
              onClick={handleNextLine}
              disabled={currentLineIndex === maxLines - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Notes */}
        <div className="p-4 border-t border-slate-800">
          <textarea
            value={comparisonNotes}
            onChange={(e) => setComparisonNotes(e.target.value)}
            placeholder="Add comparison notes..."
            className="w-full h-16 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </motion.div>
    </div>
  );
}
