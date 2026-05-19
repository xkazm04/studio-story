/**
 * Tests for async write buffer in signal-store.
 *
 * Verifies that appendSignal/appendIntentSignal/appendImprovement buffer in
 * memory and flush asynchronously, and that reads merge buffered + persisted data.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Signal, IntentSignal, ImprovementRecord } from '../signal-types';

// Mock fs at module level so the store uses our mocked version
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue(''),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    promises: {
      ...actual.promises,
      mkdir: vi.fn().mockResolvedValue(undefined),
      appendFile: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Import after mocking
import {
  appendSignal,
  getSignals,
  appendIntentSignal,
  getIntentSignals,
  appendImprovement,
  getImprovements,
  flushSignalBuffers,
  shutdownSignalStore,
  savePatterns,
  saveIntentPatterns,
  getSignalHealth,
  _internals,
} from '../signal-store';

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'tool_error',
    severity: 'medium',
    category: 'tooling',
    fingerprint: 'abc123',
    toolName: 'test_tool',
    errorMessage: 'test error',
    executionId: 'exec-1',
    timestamp: Date.now(),
    resolved: false,
    ...overrides,
  };
}

function makeIntentSignal(overrides: Partial<IntentSignal> = {}): IntentSignal {
  return {
    id: `int-${Date.now()}`,
    type: 'intent_signal',
    toolChain: ['create_character', 'create_trait'],
    fingerprint: 'intent-abc',
    entityTypes: ['character', 'trait'],
    executionId: 'exec-1',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeImprovement(overrides: Partial<ImprovementRecord> = {}): ImprovementRecord {
  return {
    id: `imp-${Date.now()}`,
    executionId: 'exec-1',
    patternFingerprints: ['fp1'],
    startedAt: Date.now(),
    success: true,
    ...overrides,
  };
}

describe('signal-store async write buffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clear internal buffers and directory cache
    _internals.buffers.clear();
    _internals.resetDirCache();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await shutdownSignalStore();
  });

  describe('appendSignal', () => {
    it('does not call appendFileSync (buffered instead)', () => {
      appendSignal(makeSignal());
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    it('buffers signals in memory', () => {
      appendSignal(makeSignal());
      appendSignal(makeSignal());

      // Signals should be in the buffer, not on disk
      expect(fs.appendFileSync).not.toHaveBeenCalled();
      let totalBuffered = 0;
      for (const lines of _internals.buffers.values()) {
        totalBuffered += lines.length;
      }
      expect(totalBuffered).toBeGreaterThanOrEqual(2);
    });

    it('increments event count in health', () => {
      const before = getSignalHealth().eventCount;
      appendSignal(makeSignal());
      expect(getSignalHealth().eventCount).toBe(before + 1);
    });
  });

  describe('appendIntentSignal', () => {
    it('buffers without sync writes', () => {
      appendIntentSignal(makeIntentSignal());
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('appendImprovement', () => {
    it('buffers without sync writes', () => {
      appendImprovement(makeImprovement());
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('flushSignalBuffers', () => {
    it('writes buffered signals to disk via async appendFile', async () => {
      const sig = makeSignal();
      appendSignal(sig);

      await flushSignalBuffers();

      expect(fs.promises.appendFile).toHaveBeenCalledTimes(1);
      const [, data] = (fs.promises.appendFile as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(data).toContain(sig.id);
      expect((data as string).endsWith('\n')).toBe(true);
    });

    it('batches multiple signals into one write', async () => {
      appendSignal(makeSignal({ id: 'sig-a' }));
      appendSignal(makeSignal({ id: 'sig-b' }));
      appendSignal(makeSignal({ id: 'sig-c' }));

      await flushSignalBuffers();

      expect(fs.promises.appendFile).toHaveBeenCalledTimes(1);
      const [, data] = (fs.promises.appendFile as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(data).toContain('sig-a');
      expect(data).toContain('sig-b');
      expect(data).toContain('sig-c');
    });

    it('clears buffer after flush', async () => {
      appendSignal(makeSignal());
      await flushSignalBuffers();

      // Second flush should be a no-op
      await flushSignalBuffers();
      expect(fs.promises.appendFile).toHaveBeenCalledTimes(1);
    });

    it('creates signals directory via async mkdir', async () => {
      appendSignal(makeSignal());
      await flushSignalBuffers();

      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('signals'),
        { recursive: true },
      );
    });
  });

  describe('threshold flush', () => {
    it('triggers flush when buffer reaches threshold', async () => {
      vi.useRealTimers();

      // Append signals up to threshold (10)
      for (let i = 0; i < 10; i++) {
        appendSignal(makeSignal({ id: `sig-${i}` }));
      }

      // Allow the async flush triggered by threshold to settle
      await new Promise(r => setTimeout(r, 50));

      expect(fs.promises.appendFile).toHaveBeenCalled();
    });
  });

  describe('read merges buffer', () => {
    it('getSignals includes buffered signals not yet flushed', () => {
      const sig = makeSignal({ id: 'buffered-sig', timestamp: Date.now() });
      appendSignal(sig);

      // File doesn't exist yet — only buffer has data
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const signals = getSignals();

      expect(signals).toHaveLength(1);
      expect(signals[0].id).toBe('buffered-sig');
    });

    it('getSignals merges persisted + buffered signals', () => {
      const persisted = makeSignal({ id: 'persisted', timestamp: Date.now() - 1000 });
      const buffered = makeSignal({ id: 'buffered', timestamp: Date.now() });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(persisted) + '\n');

      appendSignal(buffered);
      const signals = getSignals();

      expect(signals).toHaveLength(2);
      expect(signals.map(s => s.id)).toContain('persisted');
      expect(signals.map(s => s.id)).toContain('buffered');
    });

    it('getIntentSignals includes buffered intent signals', () => {
      const sig = makeIntentSignal({ id: 'buf-intent', timestamp: Date.now() });
      appendIntentSignal(sig);

      vi.mocked(fs.existsSync).mockReturnValue(false);
      const signals = getIntentSignals();

      expect(signals).toHaveLength(1);
      expect(signals[0].id).toBe('buf-intent');
    });

    it('getImprovements includes buffered improvements', () => {
      const rec = makeImprovement({ id: 'buf-imp' });
      appendImprovement(rec);

      vi.mocked(fs.existsSync).mockReturnValue(false);
      const records = getImprovements();

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('buf-imp');
    });

    it('getSignals respects since filter on buffered signals', () => {
      const old = makeSignal({ id: 'old', timestamp: 1000 });
      const recent = makeSignal({ id: 'recent', timestamp: Date.now() });

      appendSignal(old);
      appendSignal(recent);

      vi.mocked(fs.existsSync).mockReturnValue(false);
      const signals = getSignals(Date.now() - 5000);

      expect(signals).toHaveLength(1);
      expect(signals[0].id).toBe('recent');
    });
  });

  describe('shutdownSignalStore', () => {
    it('flushes remaining buffers on shutdown', async () => {
      appendSignal(makeSignal({ id: 'shutdown-sig' }));
      await shutdownSignalStore();

      expect(fs.promises.appendFile).toHaveBeenCalled();
      const [, data] = (fs.promises.appendFile as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(data).toContain('shutdown-sig');
    });
  });

  describe('savePatterns uses async write', () => {
    it('calls fs.promises.writeFile instead of writeFileSync', () => {
      savePatterns([]);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe('saveIntentPatterns uses async write', () => {
    it('calls fs.promises.writeFile instead of writeFileSync', () => {
      saveIntentPatterns([]);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });
});
