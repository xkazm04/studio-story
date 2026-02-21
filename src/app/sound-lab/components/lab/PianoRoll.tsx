'use client';

import { useRef, useEffect } from 'react';
import type { MidiExtractionResult } from '../../types';

const TRACK_COLORS = ['#22d3ee', '#a78bfa', '#f97316', '#34d399', '#fb7185'];
const MIN_PITCH = 24;  // C1
const MAX_PITCH = 96;  // C7
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface PianoRollProps {
  extraction: MidiExtractionResult;
  playbackTime?: number;
  height?: number;
}

export default function PianoRoll({ extraction, playbackTime = 0, height = 160 }: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const { duration, tracks } = extraction;

    // Find actual pitch range
    let lo = MAX_PITCH, hi = MIN_PITCH;
    for (const track of tracks) {
      for (const note of track.notes) {
        if (note.pitch < lo) lo = note.pitch;
        if (note.pitch > hi) hi = note.pitch;
      }
    }
    // Add padding
    lo = Math.max(MIN_PITCH, lo - 4);
    hi = Math.min(MAX_PITCH, hi + 4);
    const pitchRange = hi - lo || 1;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Draw pitch grid lines (every octave C)
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
    ctx.lineWidth = 0.5;
    for (let p = lo; p <= hi; p++) {
      if (p % 12 === 0) {
        const y = h - ((p - lo) / pitchRange) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Label
        const octave = Math.floor(p / 12) - 1;
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(`C${octave}`, 2, y - 2);
      }
    }

    // Draw beat grid lines
    if (extraction.tempo > 0) {
      const beatDuration = 60 / extraction.tempo;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
      for (let t = 0; t < duration; t += beatDuration) {
        const x = (t / duration) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    // Draw notes
    for (let ti = 0; ti < tracks.length; ti++) {
      const color = TRACK_COLORS[ti % TRACK_COLORS.length];
      ctx.fillStyle = color;

      for (const note of tracks[ti].notes) {
        const x = (note.startTime / duration) * w;
        const noteW = Math.max(2, (note.duration / duration) * w);
        const y = h - ((note.pitch - lo + 1) / pitchRange) * h;
        const noteH = Math.max(2, h / pitchRange);
        const alpha = 0.3 + (note.velocity / 127) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, noteW, noteH - 1);
      }
    }
    ctx.globalAlpha = 1;

    // Playback position
    if (playbackTime > 0 && playbackTime < duration) {
      const px = (playbackTime / duration) * w;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }, [extraction, playbackTime, height]);

  return (
    <div className="rounded-md overflow-hidden border border-slate-800/40">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block"
      />
      {/* Track legend */}
      <div className="flex items-center gap-3 px-2 py-1 bg-slate-900/60">
        {extraction.tracks.map((track, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length] }}
            />
            <span className="text-[9px] text-slate-400">
              {track.name} ({track.notes.length})
            </span>
          </div>
        ))}
        <span className="text-[9px] text-slate-500 ml-auto">
          {Math.round(extraction.tempo)} BPM | {extraction.duration.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
