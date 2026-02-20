import { useQuery, useMutation, UseMutationOptions } from "@tanstack/react-query";
import { USE_MOCK_DATA, API_BASE_URL as CONFIG_API_BASE_URL } from '../config/api';
import { ApiError, TimeoutError, isApiError, isTimeoutError, isNetworkError } from '../types/ApiError';
import { rateLimiter, useRateLimiterConfig } from './rateLimiter';

// API configuration
export const API_BASE_URL = CONFIG_API_BASE_URL;
export { USE_MOCK_DATA };

// Re-export error types and type guards for convenient access
export { ApiError, TimeoutError, isApiError, isTimeoutError, isNetworkError };

// Re-export rate limiter and configuration hook for external access
export { rateLimiter, useRateLimiterConfig };

interface ApiRequest {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: HeadersInit;
  timeout?: number; // Optional timeout in milliseconds
  signal?: AbortSignal; // Optional external abort signal for request cancellation
}

/**
 * Internal fetch implementation with typed error handling
 * Throws ApiError for HTTP errors with status codes
 * Throws TimeoutError for request timeouts
 * Preserves network errors for proper handling
 * Note: This is the internal implementation; use apiFetch for rate-limited requests
 *
 * Memory Management & Event Listener Cleanup:
 * - Uses AbortController to properly cancel in-flight requests
 * - Supports external AbortSignal for component unmount cancellation
 * - Clears timeout using clearTimeout to prevent memory leaks
 * - AbortController signals are properly cleaned up by the browser
 * - When components unmount, React Query automatically aborts ongoing queries
 * - This ensures no lingering listeners or incomplete network requests
 * - Prevents race conditions and "state update on unmounted component" warnings
 */
const apiFetchInternal = async <T>({
  url,
  method = "GET",
  body,
  headers = {},
  timeout,
  signal: externalSignal,
}: ApiRequest): Promise<T> => {
  try {
    // Setup internal controller for timeout, or use external signal if no timeout
    const controller = new AbortController();
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    // Combine external signal with internal timeout controller
    // If external signal is already aborted (React Strict Mode re-render),
    // abort immediately and bail out to avoid unnecessary fetch
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
        if (timeoutId) clearTimeout(timeoutId);
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // Clear timeout if request completes - prevents memory leak
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        // Attempt to parse error response body for additional details
        let errorDetails: Record<string, any> | undefined;
        let errorMessage = response.statusText || 'Request failed';

        try {
          const errorBody = await response.json();
          errorDetails = errorBody;
          // Use server-provided message if available
          if (errorBody.message) {
            errorMessage = errorBody.message;
          } else if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // If response body is not JSON or can't be parsed, use status text
        }

        // Log for debugging
        if (response.status === 404) {
          console.log("No data found at:", url);
        }

        // Throw typed ApiError with status, message, and details
        throw new ApiError(response.status, errorMessage, errorDetails);
      }

      return await response.json();
    } catch (error) {
      // Clear timeout if error occurs
      if (timeoutId) clearTimeout(timeoutId);

      // Check if this is an abort error (timeout or external abort)
      if (error instanceof Error && error.name === 'AbortError') {
        // Only throw timeout error if timeout was actually set
        if (timeout) {
          throw new TimeoutError(`Request timeout after ${timeout}ms`);
        }
        // Otherwise it was aborted externally (e.g., component unmount)
        throw error;
      }

      // Re-throw if already an ApiError
      if (isApiError(error)) {
        throw error;
      }

      // Network errors or other fetch failures
      throw error;
    }
  } catch (error) {
    // Silently propagate abort errors — these are expected during
    // component unmount, React Strict Mode re-renders, and navigation
    if (error instanceof DOMException && error.name === 'AbortError') {
      return Promise.reject(error);
    }

    // Log real errors for debugging
    if (isApiError(error)) {
      console.error(`API Error [${error.status}]:`, error.message, error.details);
    } else if (isTimeoutError(error)) {
      console.error('Timeout Error:', error.message);
    } else if (isNetworkError(error)) {
      console.error('Network Error:', error);
    } else {
      console.error('API fetch error:', error);
    }

    // Reject with the error (React Query will catch this)
    return Promise.reject(error);
  }
};

/**
 * Rate-limited fetch wrapper for API calls
 * Automatically throttles requests to prevent API overuse
 * All API calls should use this function
 */
export const apiFetch = async <T>(params: ApiRequest): Promise<T> => {
  return rateLimiter.execute(() => apiFetchInternal<T>(params));
};

/**
 * React Query hook for GET requests with typed error handling
 * Errors are typed as ApiError and available in the error state
 * Automatically cancels requests when component unmounts or query is disabled
 */
export const useApiGet = <T>(url: string, enabled: boolean = true) => {
  return useQuery<T, ApiError>({
    queryKey: [url],
    queryFn: async ({ signal }) => await apiFetch<T>({ url, signal }),
    enabled,
    staleTime: 5 * 60 * 1000, // Cache data for 5 mins
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (isApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
  });
};

/**
 * React Query mutation hook with typed error handling
 * Errors are typed as ApiError and available in the error state
 */
export const useApiMutation = <TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables, unknown>
) => {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...options,
  });
};
