/**
 * HTTP Client for Story Next.js API
 * Provides typed methods for calling internal APIs from MCP tools
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class StoryHttpClient {
  private timeoutMs: number;

  constructor(private baseUrl: string, timeoutMs = 15_000) {
    this.timeoutMs = timeoutMs;
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: object,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    try {
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
          }
        }
      }

      const init: RequestInit = {
        method,
        signal: AbortSignal.timeout(this.timeoutMs),
      };
      if (body) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), init);
      const raw = await response.json() as Record<string, unknown>;

      // Detect standardized API envelope ({ success, data?, error? })
      if (typeof raw === 'object' && raw !== null && 'success' in raw) {
        if (!raw.success) {
          const err = raw.error as { code?: string; message?: string; details?: unknown } | undefined;
          return {
            success: false,
            error: err
              ? [err.code, err.message].filter(Boolean).join(': ')
              : `HTTP ${response.status}`,
          };
        }
        return { success: true, data: raw.data as T };
      }

      // Legacy format fallback
      if (!response.ok) {
        return {
          success: false,
          error: this.buildErrorMessage(raw, response.status),
        };
      }

      return { success: true, data: raw as T };
    } catch (error) {
      return {
        success: false,
        error: this.buildConnectionError(error, url.toString()),
      };
    }
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T = unknown>(path: string, body: object): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  async put<T = unknown>(path: string, body: object): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private buildConnectionError(error: unknown, url: string): string {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return `Request to ${url} timed out after ${this.timeoutMs}ms — is the dev server running? (npm run dev)`;
    }
    if (error instanceof TypeError) {
      // fetch throws TypeError for network failures (ECONNREFUSED, DNS, etc.)
      return `Cannot reach Story API at ${url} — ${error.message}. Is the dev server running? (npm run dev)`;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return `Request to ${url} was aborted`;
    }
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private buildErrorMessage(data: Record<string, unknown>, status: number): string {
    const parts: string[] = [];
    if (data.error) parts.push(String(data.error));
    if (data.message && data.message !== data.error) parts.push(String(data.message));
    if (!parts.length) parts.push(`HTTP ${status}`);

    // Include details field (from handleDatabaseError)
    if (data.details && typeof data.details === 'object') {
      const details = data.details as Record<string, unknown>;
      if (details.code) parts.push(`Code: ${details.code}`);
      if (details.hint) parts.push(`Hint: ${details.hint}`);
    }

    // Include debug info (legacy format)
    if (data.debug && typeof data.debug === 'object') {
      const debug = data.debug as Record<string, unknown>;
      if (debug.message) parts.push(`Detail: ${debug.message}`);
      if (debug.code) parts.push(`Code: ${debug.code}`);
    }

    return parts.join('. ');
  }
}
