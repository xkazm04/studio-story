import { useMemo } from 'react';
import { ApiError, isApiError, isTimeoutError, isNetworkError } from '../types/ApiError';

export interface UserFriendlyError {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Hook that translates technical API errors into user-friendly messages
 * Provides a standardized way to handle errors across the application
 *
 * @param error - The error to handle (typically from React Query error state)
 * @returns UserFriendlyError object with title, message, and severity
 *
 * @example
 * ```tsx
 * const { data, error } = useApiGet('/api/users');
 * const errorMessage = useApiErrorHandler(error);
 *
 * if (errorMessage) {
 *   return <Alert severity={errorMessage.severity}>{errorMessage.message}</Alert>;
 * }
 * ```
 */
export function useApiErrorHandler(error: unknown): UserFriendlyError | null {
  return useMemo(() => {
    if (!error) return null;

    // Handle ApiError (HTTP errors with status codes)
    if (isApiError(error)) {
      return mapApiErrorToUserMessage(error);
    }

    // Handle TimeoutError
    if (isTimeoutError(error)) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please check your connection and try again.',
        severity: 'warning',
      };
    }

    // Handle Network errors
    if (isNetworkError(error)) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        severity: 'error',
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return {
        title: 'Unexpected Error',
        message: error.message || 'Something went wrong. Please try again.',
        severity: 'error',
      };
    }

    // Fallback for unknown error types
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
    };
  }, [error]);
}

/**
 * Maps HTTP status codes to user-friendly error messages
 * Provides context-appropriate titles and messages for common API errors
 */
function mapApiErrorToUserMessage(error: ApiError): UserFriendlyError {
  const { status, message, details } = error;

  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: message || 'The request contains invalid data. Please check your input and try again.',
        severity: 'warning',
      };

    case 401:
      return {
        title: 'Authentication Required',
        message: 'You need to be logged in to perform this action. Please sign in and try again.',
        severity: 'warning',
      };

    case 403:
      return {
        title: 'Access Denied',
        message: message || 'You don\'t have permission to access this resource.',
        severity: 'error',
      };

    case 404:
      return {
        title: 'Not Found',
        message: message || 'The requested resource could not be found.',
        severity: 'info',
      };

    case 409:
      return {
        title: 'Conflict',
        message: message || 'This action conflicts with existing data. Please refresh and try again.',
        severity: 'warning',
      };

    case 422:
      return {
        title: 'Validation Error',
        message: message || 'The data you provided is invalid. Please check the form and try again.',
        severity: 'warning',
      };

    case 429:
      return {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment and try again.',
        severity: 'warning',
      };

    case 500:
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again in a few moments.',
        severity: 'error',
      };

    case 502:
      return {
        title: 'Bad Gateway',
        message: 'The server is temporarily unavailable. Please try again in a few moments.',
        severity: 'error',
      };

    case 503:
      return {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        severity: 'error',
      };

    case 504:
      return {
        title: 'Gateway Timeout',
        message: 'The server took too long to respond. Please try again.',
        severity: 'error',
      };

    default:
      // Handle other 4xx client errors
      if (status >= 400 && status < 500) {
        return {
          title: 'Request Error',
          message: message || 'There was a problem with your request. Please try again.',
          severity: 'warning',
        };
      }

      // Handle other 5xx server errors
      if (status >= 500) {
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          severity: 'error',
        };
      }

      // Fallback for unexpected status codes
      return {
        title: 'Error',
        message: message || 'An unexpected error occurred. Please try again.',
        severity: 'error',
      };
  }
}

/**
 * Utility function to get error message without the hook
 * Useful for handling errors outside of React components
 */
export function getErrorMessage(error: unknown): UserFriendlyError | null {
  if (!error) return null;

  if (isApiError(error)) {
    return mapApiErrorToUserMessage(error);
  }

  if (isTimeoutError(error)) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please check your connection and try again.',
      severity: 'warning',
    };
  }

  if (isNetworkError(error)) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'error',
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Unexpected Error',
      message: error.message || 'Something went wrong. Please try again.',
      severity: 'error',
    };
  }

  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    severity: 'error',
  };
}
