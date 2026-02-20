import { NextResponse } from 'next/server';

/**
 * HTTP Status Code Constants
 * Use these constants instead of magic numbers for better maintainability
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Common API Constants
 */
export const API_CONSTANTS = {
  MAX_SUGGESTIONS_LIMIT: 5,
  DEFAULT_CONFIDENCE: 0.7,
  FALLBACK_CONFIDENCE: 0.6,
  DEFAULT_PACING_CONFIDENCE: 0.5,
  MAX_CONTENT_LENGTH: 500,
  GROQ_DEFAULT_CONFIDENCE: 0.80,
  GEMINI_DEFAULT_CONFIDENCE: 0.85,
  GEMINI_TEMPERATURE: 0.4,
  GEMINI_TOP_K: 32,
  GEMINI_MAX_OUTPUT_TOKENS: 2048,
  GROQ_TEMPERATURE: 0.4,
  GROQ_MAX_TOKENS: 2048,
  ANALYSIS_TIMEOUT_MS: 120000,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Logger utility (can be extended with proper logging service)
 */
export const logger = {
  error: (context: string, error: unknown, additionalInfo?: Record<string, unknown>) => {
    // In production, this should use a proper logging service
    // For now, we'll use a structured approach instead of console.error
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${context}:`, error, additionalInfo || '');
    }
    // TODO: Add proper logging service integration (e.g., Sentry, DataDog)
  },

  warn: (context: string, message: string, additionalInfo?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${context}:`, message, additionalInfo || '');
    }
  },

  info: (context: string, message: string, additionalInfo?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${context}:`, message, additionalInfo || '');
    }
  },
};

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  message?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const responseBody: ErrorResponse = { error };
  if (message) {
    responseBody.message = message;
  }
  if (details) {
    responseBody.details = details;
  }
  return NextResponse.json(responseBody, { status });
}

/**
 * Handles Supabase database errors.
 * Includes Supabase error details in response so MCP tools get actionable messages.
 */
export function handleDatabaseError(
  operation: string,
  error: unknown,
  context?: string
): NextResponse<ErrorResponse> {
  const contextStr = context ? `${context} - ${operation}` : operation;
  logger.error(contextStr, error);

  // Extract Supabase error details for the response
  const supaErr = error as Record<string, unknown> | null;
  const detail = supaErr?.message || supaErr?.details || 'Database operation failed';
  const code = supaErr?.code ? ` [${supaErr.code}]` : '';

  return createErrorResponse(
    `Failed to ${operation}`,
    500,
    `${detail}${code}`,
    { code: supaErr?.code, hint: supaErr?.hint }
  );
}

/**
 * Handles unexpected errors with proper logging
 */
export function handleUnexpectedError(
  endpoint: string,
  error: unknown
): NextResponse<ErrorResponse> {
  logger.error(`Unexpected error in ${endpoint}`, error);

  return createErrorResponse(
    'Internal server error',
    500,
    error instanceof Error ? error.message : 'An unexpected error occurred'
  );
}

/**
 * Validates required parameters and returns error response if missing
 */
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): NextResponse<ErrorResponse> | null {
  const missing = required.filter(param => !params[param]);

  if (missing.length > 0) {
    return createErrorResponse(
      'Missing required parameters',
      400,
      `The following parameters are required: ${missing.join(', ')}`
    );
  }

  return null;
}

/**
 * Wrapper for try-catch blocks in API routes
 */
export async function apiHandler<T>(
  endpoint: string,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    return handleUnexpectedError(endpoint, error);
  }
}

/**
 * Type definitions for common API contexts
 */
export interface ActInfo {
  id?: string;
  name?: string;
  description?: string;
  order?: number;
}

export interface BeatInfo {
  id?: string;
  name?: string;
  description?: string;
  type?: 'act' | 'story';
  order?: number;
}

export interface SceneInfo {
  id?: string;
  name?: string;
  description?: string;
  location?: string;
}

export interface TraitInfo {
  id?: string;
  trait?: string;
  description?: string;
}

export interface ProjectContextData {
  projectId: string;
  projectName?: string;
  name?: string;
  description?: string;
  projectDescription?: string;
  genre?: string;
  currentAct?: ActInfo;
  currentBeat?: BeatInfo;
  beats?: BeatInfo[];
  scenes?: SceneInfo[];
  characterName?: string;
  traits?: TraitInfo[];
  sceneName?: string;
  sceneDescription?: string;
}

/**
 * Type definitions for Ollama responses
 */
export interface OllamaGenerateResponse {
  response: string;
  model: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}
