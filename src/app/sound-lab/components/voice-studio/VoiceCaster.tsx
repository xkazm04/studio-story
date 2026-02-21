'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Users, Star, Play, Check, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { MOCK_CHARACTERS } from '../../data/mockAudioData';
import type { MockVoice, MockCharacter, VoiceMatchResult } from '../../types';

interface VoiceCasterProps {
  selectedVoice: MockVoice;
  previewText: string;
  voices: MockVoice[];
  onCastingsChange?: (castings: Record<string, string>) => void;
}

function computeMatches(character: MockCharacter, voices: MockVoice[]): VoiceMatchResult[] {
  return voices.map((voice) => {
    let score = 50;
    const reasons: string[] = [];

    if (voice.gender === character.gender) { score += 20; reasons.push('Gender match'); }
    else if (voice.gender === 'neutral') { score += 10; reasons.push('Neutral voice'); }

    if (voice.ageRange === character.ageRange) { score += 15; reasons.push('Age range match'); }

    const traitOverlap = character.traits.filter((t) =>
      voice.tags.some((tag) => tag.includes(t) || t.includes(tag))
    );
    score += traitOverlap.length * 8;
    if (traitOverlap.length > 0) reasons.push(`Traits: ${traitOverlap.join(', ')}`);

    if (character.archetype === 'villain' && voice.tags.includes('mysterious')) { score += 10; reasons.push('Villain fit'); }
    if (character.archetype === 'mentor' && voice.tags.includes('wise')) { score += 10; reasons.push('Mentor fit'); }
    if (character.archetype === 'hero' && (voice.tags.includes('authoritative') || voice.tags.includes('energetic'))) { score += 10; reasons.push('Hero fit'); }

    return { voice, score: Math.min(100, score), matchReasons: reasons };
  }).sort((a, b) => b.score - a.score);
}

function ScoreRing({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-orange-400' : 'text-slate-500';
  const stroke = score >= 80 ? '#34d399' : score >= 60 ? '#fb923c' : '#64748b';

  return (
    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={radius} fill="none"
          stroke={stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn('absolute text-[11px] font-bold', color)}>{score}</span>
    </div>
  );
}

function MatchCard({
  match,
  isCast,
  onCast,
  onPlay,
  isPlaying,
}: {
  match: VoiceMatchResult;
  isCast: boolean;
  onCast: () => void;
  onPlay: () => void;
  isPlaying: boolean;
}) {
  const [shortlisted, setShortlisted] = useState(false);

  return (
    <div className={cn(
      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-200',
      isCast
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : 'border-slate-800/50 bg-slate-900/30 hover:border-slate-700/80'
    )}>
      <ScoreRing score={match.score} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-200 truncate">{match.voice.name}</span>
          {isCast && <Check className="w-3 h-3 text-emerald-400" />}
        </div>
        <p className="text-[11px] text-slate-500 truncate">{match.matchReasons.slice(0, 2).join(' / ')}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setShortlisted(!shortlisted)}
          className={cn(
            'p-1 rounded transition-colors',
            shortlisted ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
          )}
        >
          <Star className="w-3 h-3" fill={shortlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={onPlay}
          className={cn(
            'p-1 rounded transition-colors',
            isPlaying ? 'text-orange-400' : 'text-slate-600 hover:text-slate-400'
          )}
          title="Preview voice"
        >
          {isPlaying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </button>
        {!isCast && (
          <button
            onClick={onCast}
            className="text-[11px] px-2 py-0.5 rounded bg-orange-600/80 hover:bg-orange-500 text-white font-medium transition-colors"
          >
            Cast
          </button>
        )}
      </div>
    </div>
  );
}

export default function VoiceCaster({ selectedVoice, previewText, voices, onCastingsChange }: VoiceCasterProps) {
  const [selectedCharId, setSelectedCharId] = useState(MOCK_CHARACTERS[0]!.id);
  const [castings, setCastings] = useState<Record<string, string>>({ c1: 'v1' });
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Notify parent of castings changes
  useEffect(() => {
    onCastingsChange?.(castings);
  }, [castings, onCastingsChange]);

  const selectedChar = MOCK_CHARACTERS.find((c) => c.id === selectedCharId)!;
  const matches = useMemo(() => computeMatches(selectedChar, voices), [selectedChar, voices]);

  const handlePlayPreview = useCallback(async (voiceId: string) => {
    const text = previewText.trim() || 'The shadows grow long as evening falls across the ancient kingdom.';
    setPlayingVoiceId(voiceId);

    try {
      const res = await fetch('/api/ai/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
        audio.play();
      } else {
        setPlayingVoiceId(null);
      }
    } catch {
      setPlayingVoiceId(null);
    }
  }, [previewText]);

  return (
    <div className="flex flex-col h-full">
      {/* Character Selector Ribbon */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800/50 overflow-x-auto shrink-0">
        {MOCK_CHARACTERS.map((char) => {
          const isSelected = char.id === selectedCharId;
          const hasCast = !!castings[char.id];
          const initials = char.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
          return (
            <button
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={cn(
                'flex flex-col items-center gap-1 shrink-0 transition-all duration-200',
                isSelected ? 'scale-105' : 'opacity-60 hover:opacity-80'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all relative',
                isSelected
                  ? 'border-orange-500 bg-orange-500/20 shadow-sm shadow-orange-500/20'
                  : 'border-slate-700 bg-slate-800'
              )}>
                <span className={cn('text-[11px] font-semibold', isSelected ? 'text-orange-400' : 'text-slate-400')}>
                  {initials}
                </span>
                {hasCast && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <span className={cn('text-[11px] font-medium', isSelected ? 'text-slate-200' : 'text-slate-500')}>
                {char.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Character Info */}
      <div className="px-3 py-2 border-b border-slate-800/30 bg-slate-900/30 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-200">{selectedChar.name}</span>
            <span className="text-[11px] text-slate-500 ml-2">{selectedChar.archetype} / {selectedChar.gender} / {selectedChar.ageRange}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="text-[11px] text-orange-400">AI Match</span>
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          {selectedChar.traits.map((t) => (
            <span key={t} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-800/60 text-slate-400">{t}</span>
          ))}
        </div>
      </div>

      {/* Match Results */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {matches.map((match) => (
          <MatchCard
            key={match.voice.id}
            match={match}
            isCast={castings[selectedCharId] === match.voice.id}
            onCast={() => setCastings((p) => ({ ...p, [selectedCharId]: match.voice.id }))}
            onPlay={() => handlePlayPreview(match.voice.id)}
            isPlaying={playingVoiceId === match.voice.id}
          />
        ))}
      </div>

      {/* Casting Summary */}
      <div className="shrink-0 px-3 py-2 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {Object.keys(castings).length}/{MOCK_CHARACTERS.length} characters cast
          </span>
          <div className="flex items-center gap-1">
            {Object.entries(castings).map(([charId, voiceId]) => {
              const voice = voices.find((v) => v.id === voiceId);
              if (!voice) return null;
              return (
                <span key={charId} className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {voice.name.split(' ')[0]}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
