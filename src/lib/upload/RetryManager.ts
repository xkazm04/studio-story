/**
 * RetryManager - Automatic retry with exponential backoff
 *
 * Handles failed upload retries with configurable backoff strategy,
 * maximum attempts, and failure tracking.
 */

// Types
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, randomness factor
}

export interface RetryState {
  id: string;
  attempts: number;
  lastAttempt?: number;
  nextRetry?: number;
  lastError?: string;
  status: 'pending' | 'retrying' | 'success' | 'exhausted';
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.2,
};

const STORAGE_KEY = 'story-retry-states';

/**
 * RetryManager class
 */
class RetryManager {
  private static instance: RetryManager;
  private config: RetryConfig;
  private states: Map<string, RetryState> = new Map();
  private activeRetries: Map<string, AbortController> = new Map();

  private constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadPersistedStates();
  }

  static getInstance(config?: Partial<RetryConfig>): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager(config);
    }
    return RetryManager.instance;
  }

  /**
   * Load persisted retry states
   */
  private loadPersistedStates(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.states = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load retry states:', error);
    }
  }

  /**
   * Persist retry states
   */
  private persistStates(): void {
    try {
      const data = Object.fromEntries(this.states);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist retry states:', error);
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  calculateDelay(attempt: number): number {
    // Exponential backoff
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter
    const jitter = cappedDelay * this.config.jitterFactor * (Math.random() * 2 - 1);

    return Math.round(cappedDelay + jitter);
  }

  /**
   * Execute a function with retry logic
   */
  async withRetry<T>(
    id: string,
    fn: (signal: AbortSignal) => Promise<T>,
    onRetry?: (attempt: number, delay: number, error: string) => void
  ): Promise<RetryResult<T>> {
    // Initialize state
    let state = this.states.get(id) || {
      id,
      attempts: 0,
      status: 'pending' as const,
    };

    // Create abort controller
    const abortController = new AbortController();
    this.activeRetries.set(id, abortController);

    try {
      while (state.attempts < this.config.maxAttempts) {
        state.attempts++;
        state.lastAttempt = Date.now();
        state.status = 'retrying';
        this.states.set(id, state);
        this.persistStates();

        try {
          // Execute the function
          const data = await fn(abortController.signal);

          // Success!
          state.status = 'success';
          this.states.set(id, state);
          this.persistStates();

          return {
            success: true,
            data,
            attempts: state.attempts,
          };
        } catch (error) {
          // Check if aborted
          if (abortController.signal.aborted) {
            throw new Error('Retry cancelled');
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          state.lastError = errorMessage;

          // Check if we should retry
          if (state.attempts >= this.config.maxAttempts) {
            state.status = 'exhausted';
            this.states.set(id, state);
            this.persistStates();

            return {
              success: false,
              error: errorMessage,
              attempts: state.attempts,
            };
          }

          // Calculate delay for next retry
          const delay = this.calculateDelay(state.attempts);
          state.nextRetry = Date.now() + delay;
          this.states.set(id, state);
          this.persistStates();

          // Notify callback
          if (onRetry) {
            onRetry(state.attempts, delay, errorMessage);
          }

          // Wait before retry
          await this.sleep(delay, abortController.signal);
        }
      }

      // Should not reach here, but handle edge case
      return {
        success: false,
        error: state.lastError || 'Max attempts reached',
        attempts: state.attempts,
      };
    } finally {
      this.activeRetries.delete(id);
    }
  }

  /**
   * Sleep with abort support
   */
  private sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
      });
    });
  }

  /**
   * Cancel an active retry
   */
  cancel(id: string): void {
    const controller = this.activeRetries.get(id);
    if (controller) {
      controller.abort();
      this.activeRetries.delete(id);
    }

    const state = this.states.get(id);
    if (state) {
      state.status = 'exhausted';
      this.states.set(id, state);
      this.persistStates();
    }
  }

  /**
   * Cancel all active retries
   */
  cancelAll(): void {
    for (const [id, controller] of this.activeRetries) {
      controller.abort();
      const state = this.states.get(id);
      if (state) {
        state.status = 'exhausted';
      }
    }
    this.activeRetries.clear();
    this.persistStates();
  }

  /**
   * Get retry state
   */
  getState(id: string): RetryState | undefined {
    return this.states.get(id);
  }

  /**
   * Get all retry states
   */
  getAllStates(): RetryState[] {
    return Array.from(this.states.values());
  }

  /**
   * Reset retry state for an ID
   */
  resetState(id: string): void {
    this.states.delete(id);
    this.persistStates();
  }

  /**
   * Clear all retry states
   */
  clearStates(): void {
    this.states.clear();
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if retry is in progress
   */
  isRetrying(id: string): boolean {
    return this.activeRetries.has(id);
  }

  /**
   * Get remaining attempts for an ID
   */
  getRemainingAttempts(id: string): number {
    const state = this.states.get(id);
    if (!state) return this.config.maxAttempts;
    return Math.max(0, this.config.maxAttempts - state.attempts);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

// Helper function for one-off retries
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let attempts = 0;
  let lastError: string | undefined;

  while (attempts < fullConfig.maxAttempts) {
    attempts++;

    try {
      const data = await fn();
      return { success: true, data, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      if (attempts >= fullConfig.maxAttempts) {
        return { success: false, error: lastError, attempts };
      }

      // Wait before retry
      const delay =
        fullConfig.baseDelay * Math.pow(fullConfig.backoffMultiplier, attempts - 1);
      const cappedDelay = Math.min(delay, fullConfig.maxDelay);
      const jitter = cappedDelay * fullConfig.jitterFactor * (Math.random() * 2 - 1);

      await new Promise((resolve) => setTimeout(resolve, cappedDelay + jitter));
    }
  }

  return { success: false, error: lastError, attempts };
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();

// Export class for testing
export { RetryManager };
