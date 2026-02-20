/**
 * Rate Limiter Implementation
 * Throttles API calls to prevent overwhelming the backend
 * with configurable requests per second limit
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

/**
 * RateLimiter class manages API request throttling with queue-based system
 */
export class RateLimiter {
  private maxRequestsPerSecond: number;
  private requestTimestamps: number[] = [];
  private queue: QueuedRequest<unknown>[] = [];
  private isProcessing: boolean = false;
  private queueWarningThreshold: number;

  constructor(maxRequestsPerSecond: number = 10, queueWarningThreshold: number = 20) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.queueWarningThreshold = queueWarningThreshold;
  }

  /**
   * Calculate time until next request can be made
   * Returns 0 if request can proceed immediately
   */
  private getTimeUntilNextRequest(): number {
    const now = Date.now();
    const windowStart = now - 1000; // 1 second sliding window

    // Clean up old timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    // If we haven't hit the limit, request can proceed immediately
    if (this.requestTimestamps.length < this.maxRequestsPerSecond) {
      return 0;
    }

    // Calculate when the oldest request in the window will expire
    const oldestTimestamp = this.requestTimestamps[0];
    const timeUntilSlotAvailable = oldestTimestamp + 1000 - now;

    return Math.max(0, timeUntilSlotAvailable);
  }

  /**
   * Record that a request was made at the current time
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Get current queue length for monitoring
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has exceeded warning threshold
   */
  private checkQueueWarning(): void {
    if (this.queue.length >= this.queueWarningThreshold) {
      console.warn(
        `[RateLimiter] Queue length has reached ${this.queue.length} pending requests. ` +
        `Consider reducing API call frequency or increasing rate limit.`
      );
    }
  }

  /**
   * Process the next request in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const delay = this.getTimeUntilNextRequest();

      if (delay > 0) {
        // Need to wait before processing next request
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const queuedRequest = this.queue.shift();
      if (!queuedRequest) {
        break;
      }

      this.recordRequest();

      try {
        const result = await queuedRequest.execute();
        queuedRequest.resolve(result);
      } catch (error) {
        queuedRequest.reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute a request with rate limiting applied
   * Returns a promise that resolves when the request completes
   */
  public async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    const delay = this.getTimeUntilNextRequest();

    // If we can execute immediately, do so
    if (delay === 0 && this.queue.length === 0) {
      this.recordRequest();
      return requestFn();
    }

    // Otherwise, add to queue
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.checkQueueWarning();
      this.processQueue();
    });
  }

  /**
   * Update the rate limit configuration
   */
  public setMaxRequestsPerSecond(maxRequestsPerSecond: number): void {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
  }

  /**
   * Update the queue warning threshold
   */
  public setQueueWarningThreshold(threshold: number): void {
    this.queueWarningThreshold = threshold;
  }

  /**
   * Get current configuration
   */
  public getConfig(): { maxRequestsPerSecond: number; queueWarningThreshold: number } {
    return {
      maxRequestsPerSecond: this.maxRequestsPerSecond,
      queueWarningThreshold: this.queueWarningThreshold,
    };
  }
}

/**
 * Global rate limiter instance
 * Configured via environment variable or defaults to 10 req/s
 */
const getDefaultRateLimit = (): number => {
  if (typeof window !== 'undefined') {
    const envLimit = process.env.NEXT_PUBLIC_API_RATE_LIMIT;
    if (envLimit) {
      const parsed = parseInt(envLimit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return 10; // Default to 10 requests per second
};

export const rateLimiter = new RateLimiter(getDefaultRateLimit());

/**
 * Creates a rate-limited version of apiFetch
 * Wraps the original function and applies rate limiting before execution
 */
export function createRateLimitedApiFetch<T, P = unknown>(
  apiFetchFn: (params: P) => Promise<T>
): (params: P) => Promise<T> {
  return (params: P) => {
    return rateLimiter.execute(() => apiFetchFn(params));
  };
}

/**
 * React hook for managing rate limiter configuration
 * Allows dynamic adjustment of rate limiting settings
 */
export function useRateLimiterConfig() {
  const getConfig = () => rateLimiter.getConfig();

  const setMaxRequestsPerSecond = (maxRequestsPerSecond: number) => {
    rateLimiter.setMaxRequestsPerSecond(maxRequestsPerSecond);
  };

  const setQueueWarningThreshold = (threshold: number) => {
    rateLimiter.setQueueWarningThreshold(threshold);
  };

  const getQueueLength = () => rateLimiter.getQueueLength();

  return {
    getConfig,
    setMaxRequestsPerSecond,
    setQueueWarningThreshold,
    getQueueLength,
  };
}
