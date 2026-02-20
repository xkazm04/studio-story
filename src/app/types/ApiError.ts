/**
 * Custom error class for API-related errors
 * Provides structured error information including HTTP status codes and optional details
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, any>;

  constructor(status: number, message: string, details?: Record<string, any>) {
    super(message);

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);

    this.name = 'ApiError';
    this.status = status;
    this.details = details;

    // Captures stack trace, excluding constructor call from it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError.constructor);
    }
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    Object.setPrototypeOf(this, TimeoutError.prototype);
    this.name = 'TimeoutError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError.constructor);
    }
  }
}

/**
 * Type guard to check if an error is a TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Type guard to check if an error is a network error
 * Network errors typically occur when fetch fails due to no internet connection,
 * CORS issues, or other network-level problems
 */
export function isNetworkError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  // Early return for ApiError and TimeoutError
  if (isApiError(error) || isTimeoutError(error)) {
    return false;
  }

  // At this point, error is guaranteed to be Error (but not ApiError or TimeoutError)
  const errorMessage = (error as Error).message;
  const errorName = (error as Error).name;

  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('Network') ||
    errorMessage.includes('NetworkError') ||
    errorName === 'NetworkError'
  );
}
