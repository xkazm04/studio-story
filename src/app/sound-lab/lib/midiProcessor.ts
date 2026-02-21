/**
 * MIDI Processor — Audio-to-MIDI extraction and resynthesis
 *
 * Wraps @spotify/basic-pitch (audio-to-MIDI), @tonejs/midi (MIDI file I/O),
 * and SpessaSynth (GM SoundFont playback). All heavy deps are lazy-loaded
 * to avoid SSR/TF.js issues.
 *
 * Singleton via getMidiProcessor().
 */

import type {
  MidiNote,
  MidiTrack,
  MidiExtractionResult,
  InstrumentSwap,
  VelocityCurve,
} from '../types';
import { GM_INSTRUMENTS } from '../types';

// ============ Velocity Curves ============

const VELOCITY_CURVES: Record<VelocityCurve, (v: number) => number> = {
  linear: (v) => v,
  soft: (v) => Math.sqrt(v / 127) * 127,
  hard: (v) => (v / 127) ** 2 * 127,
  compressed: (v) => 64 + (v - 64) * 0.5,
};

// ============ Helpers ============

// Classify a MIDI pitch into a track lane
function classifyPitch(pitch: number): 'bass' | 'harmony' | 'melody' {
  if (pitch < 48) return 'bass';      // below C3
  if (pitch < 72) return 'harmony';   // C3-B4
  return 'melody';                     // C5+
}

// Estimate tempo from note onset intervals
function estimateTempo(notes: { startTime: number }[]): number {
  if (notes.length < 3) return 120;

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(sorted.length, 200); i++) {
    const gap = sorted[i].startTime - sorted[i - 1].startTime;
    if (gap > 0.05 && gap < 2.0) intervals.push(gap);
  }

  if (intervals.length === 0) return 120;

  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const bpm = Math.round(60 / median);

  return Math.max(40, Math.min(240, bpm));
}

// Resample an AudioBuffer down to 22050Hz mono (basic-pitch requirement)
function resampleTo22050(audioBuffer: AudioBuffer): Float32Array {
  const sourceSr = audioBuffer.sampleRate;
  const sourceData = audioBuffer.getChannelData(0);
  const ratio = sourceSr / 22050;
  const outLen = Math.floor(sourceData.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    out[i] = sourceData[Math.floor(i * ratio)] ?? 0;
  }
  return out;
}

// ============ SoundFont Cache ============

// CDN URL for a freely licensed GM SoundFont (~6MB)
const SOUNDFONT_URL = 'https://cdn.jsdelivr.net/gh/nicerloop/free-soundfont@main/TimGM6mb.sf2';

let soundFontBuffer: ArrayBuffer | null = null;

async function loadSoundFont(): Promise<ArrayBuffer> {
  if (soundFontBuffer) return soundFontBuffer;
  const res = await fetch(SOUNDFONT_URL);
  if (!res.ok) throw new Error(`Failed to fetch SoundFont: ${res.status}`);
  soundFontBuffer = await res.arrayBuffer();
  return soundFontBuffer;
}

// ============ MidiProcessor Class ============

export class MidiProcessor {
  /**
   * Extract MIDI from an AudioBuffer via basic-pitch.
   * Returns grouped tracks (bass/harmony/melody), detected tempo, and duration.
   */
  async extractMidi(audioBuffer: AudioBuffer): Promise<MidiExtractionResult> {
    const {
      BasicPitch,
      noteFramesToTime,
      outputToNotesPoly,
      addPitchBendsToNoteEvents,
    } = await import('@spotify/basic-pitch');

    const resampled = resampleTo22050(audioBuffer);

    const bp = new BasicPitch(
      'https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json'
    );

    let allFrames: number[][] = [];
    let allOnsets: number[][] = [];
    let allContours: number[][] = [];

    await bp.evaluateModel(
      resampled,
      (frames, onsets, contours) => {
        allFrames = allFrames.concat(frames);
        allOnsets = allOnsets.concat(onsets);
        allContours = allContours.concat(contours);
      },
      () => {}
    );

    let noteEvents = outputToNotesPoly(allFrames, allOnsets, 0.5, 0.3, 5, true);
    noteEvents = addPitchBendsToNoteEvents(allContours, noteEvents);
    const notesWithTime = noteFramesToTime(noteEvents);

    const groups: Record<string, MidiNote[]> = {
      bass: [],
      harmony: [],
      melody: [],
    };

    for (const n of notesWithTime) {
      const lane = classifyPitch(n.pitchMidi);
      groups[lane].push({
        pitch: n.pitchMidi,
        startTime: n.startTimeSeconds,
        duration: n.durationSeconds,
        velocity: Math.round(n.amplitude * 127),
      });
    }

    const allNotes = notesWithTime.map((n) => ({ startTime: n.startTimeSeconds }));
    const tempo = estimateTempo(allNotes);
    const duration = audioBuffer.duration;

    const trackDefs: { name: string; channel: number; instrument: number; key: string }[] = [
      { name: 'Bass', channel: 0, instrument: 32, key: 'bass' },
      { name: 'Harmony', channel: 1, instrument: 0, key: 'harmony' },
      { name: 'Melody', channel: 2, instrument: 0, key: 'melody' },
    ];

    const tracks: MidiTrack[] = trackDefs
      .filter((d) => groups[d.key].length > 0)
      .map((d) => ({
        name: d.name,
        channel: d.channel,
        notes: groups[d.key],
        instrument: d.instrument,
      }));

    return { tracks, tempo, duration };
  }

  /**
   * Resynthesize a MIDI extraction result through SpessaSynth.
   * Applies instrument swaps, transposition, and velocity curves.
   * Returns a stop() handle to kill all playing notes.
   */
  async resynthesize(
    ctx: AudioContext,
    result: MidiExtractionResult,
    swaps: InstrumentSwap[],
    globalTransposition: number,
    globalVelocityCurve: VelocityCurve
  ): Promise<{ stop: () => void }> {
    const { SpessaSynthProcessor, SoundBankLoader } = await import('spessasynth_core');
    const sfBuffer = await loadSoundFont();
    const soundBank = SoundBankLoader.fromArrayBuffer(sfBuffer);

    const synth = new SpessaSynthProcessor(ctx.sampleRate, { enableEffects: true });
    await synth.processorInitialized;
    synth.soundBankManager.addSoundBank(soundBank, 'gm');

    const curveFn = VELOCITY_CURVES[globalVelocityCurve];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Set up programs for each track
    for (let ti = 0; ti < result.tracks.length; ti++) {
      const track = result.tracks[ti];
      const swap = swaps.find((s) => s.trackIndex === ti);
      const program = swap ? swap.newInstrument : track.instrument;
      synth.programChange(track.channel, program);
    }

    // Connect synth to AudioContext via ScriptProcessorNode
    const bufferSize = 4096;
    const scriptNode = ctx.createScriptProcessor(bufferSize, 0, 2);
    scriptNode.onaudioprocess = (e) => {
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      const reverbL = new Float32Array(bufferSize);
      const reverbR = new Float32Array(bufferSize);
      const chorusL = new Float32Array(bufferSize);
      const chorusR = new Float32Array(bufferSize);
      synth.renderAudio([outL, outR], [reverbL, reverbR], [chorusL, chorusR]);
      // Mix in reverb and chorus
      for (let i = 0; i < bufferSize; i++) {
        outL[i] += reverbL[i] + chorusL[i];
        outR[i] += reverbR[i] + chorusR[i];
      }
    };
    scriptNode.connect(ctx.destination);

    // Schedule notes via setTimeout (real-time playback)
    for (let ti = 0; ti < result.tracks.length; ti++) {
      const track = result.tracks[ti];
      const swap = swaps.find((s) => s.trackIndex === ti);
      const trackTranspose = swap?.transposition ?? 0;
      const trackCurve = swap?.velocityCurve
        ? VELOCITY_CURVES[swap.velocityCurve]
        : curveFn;

      for (const note of track.notes) {
        const pitch = Math.max(0, Math.min(127, note.pitch + globalTransposition + trackTranspose));
        const velocity = Math.max(1, Math.min(127, Math.round(trackCurve(note.velocity))));

        // Schedule noteOn
        const onTimeout = setTimeout(() => {
          synth.noteOn(track.channel, pitch, velocity);
        }, note.startTime * 1000);
        timeouts.push(onTimeout);

        // Schedule noteOff
        const offTimeout = setTimeout(() => {
          synth.noteOff(track.channel, pitch);
        }, (note.startTime + note.duration) * 1000);
        timeouts.push(offTimeout);
      }
    }

    return {
      stop: () => {
        for (const t of timeouts) clearTimeout(t);
        timeouts.length = 0;
        try {
          scriptNode.disconnect();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (scriptNode as any).onaudioprocess = null;
        } catch { /* already disconnected */ }
      },
    };
  }

  /**
   * Render the resynthesized result to an offline AudioBuffer.
   * Uses SpessaSynth offline rendering in a loop.
   */
  async renderToBuffer(
    result: MidiExtractionResult,
    swaps: InstrumentSwap[],
    globalTransposition: number,
    globalVelocityCurve: VelocityCurve
  ): Promise<AudioBuffer> {
    const { SpessaSynthProcessor, SoundBankLoader } = await import('spessasynth_core');
    const sfBuffer = await loadSoundFont();
    const soundBank = SoundBankLoader.fromArrayBuffer(sfBuffer);

    const sampleRate = 44100;
    const tailSeconds = 2;
    const totalSamples = Math.ceil((result.duration + tailSeconds) * sampleRate);

    const synth = new SpessaSynthProcessor(sampleRate, { enableEffects: true });
    await synth.processorInitialized;
    synth.soundBankManager.addSoundBank(soundBank, 'gm');

    const curveFn = VELOCITY_CURVES[globalVelocityCurve];

    // Build a schedule of events sorted by time
    type MidiEvent = { time: number; type: 'on' | 'off'; channel: number; pitch: number; velocity: number };
    const events: MidiEvent[] = [];

    for (let ti = 0; ti < result.tracks.length; ti++) {
      const track = result.tracks[ti];
      const swap = swaps.find((s) => s.trackIndex === ti);
      const program = swap ? swap.newInstrument : track.instrument;
      const trackTranspose = swap?.transposition ?? 0;
      const trackCurve = swap?.velocityCurve
        ? VELOCITY_CURVES[swap.velocityCurve]
        : curveFn;

      synth.programChange(track.channel, program);

      for (const note of track.notes) {
        const pitch = Math.max(0, Math.min(127, note.pitch + globalTransposition + trackTranspose));
        const velocity = Math.max(1, Math.min(127, Math.round(trackCurve(note.velocity))));

        events.push({ time: note.startTime, type: 'on', channel: track.channel, pitch, velocity });
        events.push({ time: note.startTime + note.duration, type: 'off', channel: track.channel, pitch, velocity: 0 });
      }
    }

    events.sort((a, b) => a.time - b.time);

    // Render in chunks
    const chunkSize = 128;
    const outL = new Float32Array(totalSamples);
    const outR = new Float32Array(totalSamples);
    const reverbL = new Float32Array(chunkSize);
    const reverbR = new Float32Array(chunkSize);
    const chorusL = new Float32Array(chunkSize);
    const chorusR = new Float32Array(chunkSize);
    const chunkL = new Float32Array(chunkSize);
    const chunkR = new Float32Array(chunkSize);

    let eventIdx = 0;
    let rendered = 0;

    while (rendered < totalSamples) {
      const currentTimeSec = rendered / sampleRate;
      const toRender = Math.min(chunkSize, totalSamples - rendered);

      // Process any MIDI events that should fire before this chunk
      while (eventIdx < events.length && events[eventIdx].time <= currentTimeSec) {
        const evt = events[eventIdx];
        if (evt.type === 'on') {
          synth.noteOn(evt.channel, evt.pitch, evt.velocity);
        } else {
          synth.noteOff(evt.channel, evt.pitch);
        }
        eventIdx++;
      }

      // Clear chunk buffers
      chunkL.fill(0);
      chunkR.fill(0);
      reverbL.fill(0);
      reverbR.fill(0);
      chorusL.fill(0);
      chorusR.fill(0);

      synth.renderAudio(
        [chunkL, chunkR],
        [reverbL, reverbR],
        [chorusL, chorusR],
        0,
        toRender,
      );

      // Copy to output with reverb/chorus mixed in
      for (let i = 0; i < toRender; i++) {
        outL[rendered + i] = chunkL[i] + reverbL[i] + chorusL[i];
        outR[rendered + i] = chunkR[i] + reverbR[i] + chorusR[i];
      }

      rendered += toRender;
    }

    // Create AudioBuffer from rendered data
    const audioCtx = new OfflineAudioContext(2, totalSamples, sampleRate);
    const audioBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
    audioBuffer.getChannelData(0).set(outL);
    audioBuffer.getChannelData(1).set(outR);

    return audioBuffer;
  }

  /**
   * Create a standard MIDI file from extraction results.
   * Returns raw bytes as an ArrayBuffer.
   */
  createMidiFile(result: MidiExtractionResult): ArrayBuffer {
    const { Midi } = require('@tonejs/midi') as typeof import('@tonejs/midi');
    const midi = new Midi();
    midi.header.setTempo(result.tempo);

    for (const track of result.tracks) {
      const t = midi.addTrack();
      t.name = track.name;
      t.channel = track.channel;

      for (const note of track.notes) {
        t.addNote({
          midi: note.pitch,
          time: note.startTime,
          duration: note.duration,
          velocity: note.velocity / 127,
        });
      }
    }

    const arr = midi.toArray();
    const buf = new ArrayBuffer(arr.byteLength);
    new Uint8Array(buf).set(arr);
    return buf;
  }

  /** Look up a GM instrument name by program number. */
  getInstrumentName(program: number): string {
    return GM_INSTRUMENTS[program] ?? 'Unknown';
  }

  /** Get all instruments in a GM family (each family = 8 consecutive programs). */
  getInstrumentsInFamily(familyIndex: number): { program: number; name: string }[] {
    const start = familyIndex * 8;
    const instruments: { program: number; name: string }[] = [];
    for (let i = start; i < start + 8 && i < 128; i++) {
      instruments.push({ program: i, name: GM_INSTRUMENTS[i] ?? 'Unknown' });
    }
    return instruments;
  }
}

// ============ Singleton ============

let instance: MidiProcessor | null = null;

export function getMidiProcessor(): MidiProcessor {
  if (!instance) instance = new MidiProcessor();
  return instance;
}
