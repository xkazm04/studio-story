/**
 * useNarrationBatch — Behavioral tests for TTS batch generation
 *
 * Tests: correct API calls per line, multi-take support,
 * progress tracking, and error recovery.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNarrationBatch } from '../useNarrationBatch';
import type { ScriptLine, VoiceSettings } from '../../types';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockFetch = vi.fn() as Mock;

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

const baseSettings: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.5,
  style: 0.5,
  speed: 1,
};

const makeLines = (count: number): ScriptLine[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `line-${i + 1}`,
    character: `CHAR_${i + 1}`,
    voiceId: `voice-${i + 1}`,
    text: `Line ${i + 1} text`,
    emotion: '',
    delivery: '',
    status: 'pending' as const,
  }));

function mockTTSSuccess() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      audioUrl: 'https://example.com/audio.mp3',
      duration: 2.5,
    }),
  });
}

function mockTTSFailure(message = 'TTS generation failed') {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: false,
      error: message,
    }),
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useNarrationBatch', () => {
  it('generateAll with 3 lines calls TTS endpoint 3 times with correct voice_ids', async () => {
    mockTTSSuccess();
    const { result } = renderHook(() => useNarrationBatch());

    // Set up 3 lines
    act(() => {
      result.current.setLines(makeLines(3));
    });

    await act(async () => {
      await result.current.generateAll(baseSettings);
    });

    // Should have called fetch 3 times (once per line)
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Check each call has correct voice_id
    for (let i = 0; i < 3; i++) {
      const call = mockFetch.mock.calls[i];
      expect(call[0]).toBe('/api/ai/audio/tts');
      const body = JSON.parse(call[1].body);
      expect(body.voice_id).toBe(`voice-${i + 1}`);
      expect(body.text).toBe(`Line ${i + 1} text`);
    }
  });

  it('generateAll with takesCount=2 calls TTS 6 times for 3 lines', async () => {
    mockTTSSuccess();
    const { result } = renderHook(() => useNarrationBatch());

    act(() => {
      result.current.setLines(makeLines(3));
    });

    await act(async () => {
      await result.current.generateAll(baseSettings, { takesCount: 2 });
    });

    // 3 lines x 2 takes = 6 TTS calls
    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it('progress updates from {current:0,total:3} to {current:3,total:3}', async () => {
    const progressStates: Array<{ current: number; total: number }> = [];

    // Track each fetch call to capture progress
    let callCount = 0;
    mockFetch.mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({
          success: true,
          audioUrl: `https://example.com/audio-${callCount}.mp3`,
          duration: 2.5,
        }),
      };
    });

    const { result } = renderHook(() => useNarrationBatch());

    act(() => {
      result.current.setLines(makeLines(3));
    });

    // Capture initial progress
    progressStates.push({ ...result.current.progress });

    await act(async () => {
      await result.current.generateAll(baseSettings);
    });

    // After completion, progress should show all done
    expect(result.current.progress.done).toBe(3);
    expect(result.current.progress.total).toBe(3);
  });

  it('failed TTS call sets line status to error and continues remaining lines', async () => {
    let callIndex = 0;
    mockFetch.mockImplementation(async () => {
      callIndex++;
      if (callIndex === 2) {
        // Second call fails
        return {
          ok: true,
          json: async () => ({
            success: false,
            error: 'Voice quota exceeded',
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          audioUrl: `https://example.com/audio-${callIndex}.mp3`,
          duration: 2.5,
        }),
      };
    });

    const { result } = renderHook(() => useNarrationBatch());

    act(() => {
      result.current.setLines(makeLines(3));
    });

    await act(async () => {
      await result.current.generateAll(baseSettings);
    });

    // All 3 lines should have been attempted
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Line 1: done, Line 2: error, Line 3: done
    const lines = result.current.lines;
    expect(lines[0].status).toBe('done');
    expect(lines[1].status).toBe('error');
    expect(lines[1].error).toBe('Voice quota exceeded');
    expect(lines[2].status).toBe('done');
  });
});
