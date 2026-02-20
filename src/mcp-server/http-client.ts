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
  constructor(private baseUrl: string) {}

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${path}`);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
          }
        }
      }

      const response = await fetch(url.toString());
      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return {
          success: false,
          error: this.buildErrorMessage(data, response.status),
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async post<T = unknown>(path: string, body: object): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return {
          success: false,
          error: this.buildErrorMessage(data, response.status),
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async put<T = unknown>(path: string, body: object): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return {
          success: false,
          error: this.buildErrorMessage(data, response.status),
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
      });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return {
          success: false,
          error: this.buildErrorMessage(data, response.status),
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
