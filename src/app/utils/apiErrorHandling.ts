import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/app/utils/logger';

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
 * Standardized API response envelope.
 * All routes wrapped with withApiHandler return this shape.
 */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a standardized success response wrapped in the API envelope.
 */
export function successResponse<T>(data: T, status = HTTP_STATUS.OK): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Creates a standardized error response wrapped in the API envelope.
 */
export function createErrorResponse(
  code: string,
  status: number,
  message?: string,
  details?: unknown
): NextResponse<ApiEnvelope<never>> {
  const envelope: ApiEnvelope<never> = {
    success: false,
    error: {
      code,
      message: message || code,
      ...(details !== undefined && { details }),
    },
  };
  return NextResponse.json(envelope, { status });
}

/**
 * Handles Supabase database errors.
 * Includes Supabase error details in response so MCP tools get actionable messages.
 */
export function handleDatabaseError(
  operation: string,
  error: unknown,
  context?: string
): NextResponse<ApiEnvelope<never>> {
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
): NextResponse<ApiEnvelope<never>> {
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
): NextResponse<ApiEnvelope<never>> | null {
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
 * Wraps a JSON NextResponse in the standardized API envelope.
 *
 * - Success (2xx): `{ success: true, data: <original body> }`
 * - Error (4xx/5xx): `{ success: false, error: { code, message, details? } }`
 * - Non-JSON or already-enveloped responses pass through unchanged.
 */
async function wrapInEnvelope(response: NextResponse): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return response;
  }

  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    return response;
  }

  // Already in envelope format — pass through
  if (body && typeof body === 'object' && !Array.isArray(body) && 'success' in (body as Record<string, unknown>)) {
    return response;
  }

  const status = response.status;

  if (status >= 200 && status < 300) {
    return NextResponse.json({ success: true, data: body }, { status });
  }

  // Transform legacy error shape into envelope
  const err = body as Record<string, unknown> | null;
  return NextResponse.json({
    success: false,
    error: {
      code: String(err?.error || `HTTP_${status}`),
      message: String(err?.message || err?.error || 'Request failed'),
      ...(err?.details !== undefined && { details: err.details }),
    },
  }, { status });
}

/**
 * Wraps a Next.js API route handler with:
 * 1. Standardized error catching and logging
 * 2. Automatic API envelope wrapping (`{ success, data?, error? }`)
 *
 * The handler is a normal async function that either returns a NextResponse or
 * throws.  The wrapper catches any thrown error, logs it via `logger.apiError`
 * with structured context (method, URL), and returns an envelope JSON error
 * response.
 *
 * Works for both collection routes and dynamic `[id]` routes — the generic
 * signature preserves the original handler's parameter types so Next.js type
 * checking is unaffected.
 *
 * @example
 * // Collection route
 * export const GET = withApiHandler('GET /api/acts', async (request) => {
 *   const data = await fetchActs(request);
 *   return NextResponse.json(data);
 * });
 *
 * // Dynamic route
 * export const GET = withApiHandler('GET /api/acts/[id]', async (request, ctx) => {
 *   const { id } = await ctx.params;
 *   return NextResponse.json(await fetchAct(id));
 * });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withApiHandler<T extends (request: NextRequest, ...rest: any[]) => Promise<NextResponse>>(
  endpoint: string,
  handler: T,
): T {
  const wrapped = async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handler as any)(...args);
      return wrapInEnvelope(response);
    } catch (error) {
      const request = args[0] as NextRequest;
      logger.apiError(endpoint, error, {
        method: request.method,
        url: request.url,
      });
      return createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    }
  };
  return wrapped as T;
}

/** Alias — use whichever name reads better at the call-site. */
export const withApiResponse = withApiHandler;

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
