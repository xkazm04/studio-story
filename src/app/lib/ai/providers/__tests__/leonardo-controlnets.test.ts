/**
 * Unit Tests for Leonardo Controlnet Payload Construction
 *
 * Tests that the Leonardo provider correctly handles controlnet parameters
 * in generation payloads.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the payload construction logic by extracting it.
// The actual LeonardoProvider.startGenerationAPI is private, so we test via
// the public generateSceneIllustration method by mocking fetch.

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mock rate limiter and cost tracker to avoid side effects
vi.mock('../../rate-limiter', () => ({
  getRateLimiter: () => ({
    tryAcquire: () => true,
    getStatus: () => ({ remaining: 10, limit: 10, resetAt: Date.now() + 60000, isLimited: false }),
  }),
}));

vi.mock('../../cost-tracker', () => ({
  getCostTracker: () => ({
    trackRequest: () => {},
    trackRateLimitHit: () => {},
  }),
}));

import { LeonardoProvider } from '../leonardo';
import type { ControlnetRef } from '../../prompt-assembly';

describe('Leonardo startGenerationAPI with controlnets', () => {
  let provider: LeonardoProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new LeonardoProvider({ apiKey: 'test-key' });
  });

  it('accepts optional controlnets parameter and includes them in payload', async () => {
    // Mock successful generation start
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sdGenerationJob: { generationId: 'gen-123' } }),
    });

    const controlnets: ControlnetRef[] = [
      { initImageId: 'img-1', initImageType: 'UPLOADED', preprocessorId: 133, strengthType: 'Mid' },
    ];

    await provider.generateSceneIllustration('test prompt', 1024, 768, controlnets);

    // Verify fetch was called with controlnets in the payload
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(payload.controlnets).toBeDefined();
    expect(payload.controlnets).toHaveLength(1);
    expect(payload.controlnets[0].initImageId).toBe('img-1');
    expect(payload.controlnets[0].preprocessorId).toBe(133);
  });

  it('omits styleUUID when controlnets are present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sdGenerationJob: { generationId: 'gen-456' } }),
    });

    const controlnets: ControlnetRef[] = [
      { initImageId: 'style-1', initImageType: 'UPLOADED', preprocessorId: 67, strengthType: 'High' },
    ];

    await provider.generateSceneIllustration('test prompt', 1024, 768, controlnets);

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(options.body);

    // styleUUID should NOT be present when controlnets are provided
    expect(payload.styleUUID).toBeUndefined();
    expect(payload.controlnets).toBeDefined();
  });

  it('sends num_images=4 for scene illustration', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sdGenerationJob: { generationId: 'gen-789' } }),
    });

    await provider.generateSceneIllustration('test prompt', 1024, 768, []);

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(payload.num_images).toBe(4);
  });

  it('keeps styleUUID when controlnets array is empty', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sdGenerationJob: { generationId: 'gen-000' } }),
    });

    await provider.generateSceneIllustration('test prompt', 1024, 768, []);

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(options.body);

    // With empty controlnets, styleUUID should be present
    expect(payload.styleUUID).toBeDefined();
    expect(payload.controlnets).toBeUndefined();
  });

  it('returns generationId from response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sdGenerationJob: { generationId: 'gen-result-123' } }),
    });

    const result = await provider.generateSceneIllustration('test prompt', 1024, 768, []);
    expect(result.generationId).toBe('gen-result-123');
  });
});
