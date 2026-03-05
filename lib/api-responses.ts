/**
 * Standardized API response utilities
 * Provides consistent error and success responses across all API routes
 */

import { NextResponse } from 'next/server';

export interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface APISuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  // Authentication & Authorization
  INVALID_ACCESS_CODE: 'Invalid access code. Please check your code and try again.',
  ACCESS_CODE_EXPIRED: 'This access code has expired. Please contact your instructor for a new code.',
  ACCESS_CODE_ALREADY_USED: 'This access code has already been used. Each code can only be used once.',
  UNAUTHORIZED: 'You need to be logged in to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  INVALID_ADMIN_KEY: 'Invalid admin authentication key.',
  
  // Validation
  MISSING_FIELD: 'Required field is missing',
  INVALID_INPUT: 'The input provided is not valid. Please check your data and try again.',
  INVALID_ANSWER_FORMAT: 'Your answer format is not recognized. Please enter a valid mathematical expression.',
  INVALID_PROBLEM_ID: 'The problem you are trying to access does not exist.',
  INVALID_STEP_NUMBER: 'Invalid step number. Please check your progress and try again.',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'You are making too many requests. Please wait a moment and try again.',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts. Please wait 15 minutes before trying again.',
  
  // Math Validation
  MATH_VALIDATION_FAILED: 'Unable to validate your answer. Please check your mathematical expression.',
  INCORRECT_ANSWER: 'Your answer is not correct. Would you like a hint?',
  
  // AI Tutor
  AI_SERVICE_UNAVAILABLE: 'The AI tutor is temporarily unavailable. Please try again in a moment.',
  AI_QUOTA_EXCEEDED: 'The AI service quota has been exceeded. Please try again later.',
  INVALID_CHAT_MESSAGE: 'Please enter a valid message to chat with the AI tutor.',
  
  // Database
  DATABASE_ERROR: 'A database error occurred. Please try again. If the problem persists, contact support.',
  SAVE_FAILED: 'Failed to save your progress. Please try again.',
  FETCH_FAILED: 'Failed to load data. Please refresh the page and try again.',
  
  // Survey
  SURVEY_ALREADY_COMPLETED: 'You have already completed this survey.',
  INVALID_SURVEY_RESPONSE: 'Invalid survey response. Please ensure all required fields are filled.',
  
  // Admin
  CODE_GENERATION_FAILED: 'Failed to generate access codes. Please try again.',
  DATA_EXPORT_FAILED: 'Failed to export data. Please try again.',
  
  // General
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again. If the problem persists, contact support.',
  NOT_FOUND: 'The requested resource was not found.',
  METHOD_NOT_ALLOWED: 'This request method is not allowed.',
  SERVER_ERROR: 'A server error occurred. Our team has been notified.',
} as const;

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  code?: string,
  details?: any
): NextResponse<APIError> {
  const error: APIError = {
    error: 'Error',
    message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    error.code = code;
  }

  if (details && process.env.NODE_ENV !== 'production') {
    // Only include details in development
    error.details = details;
  }

  return NextResponse.json(error, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HttpStatus.OK
): NextResponse<APISuccess<T>> {
  const response: APISuccess<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create validation error response
 */
export function createValidationError(
  field: string,
  message: string = ErrorMessages.INVALID_INPUT
): NextResponse<APIError> {
  return createErrorResponse(
    message,
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_ERROR',
    { field }
  );
}

/**
 * Create authentication error response
 */
export function createAuthError(
  message: string = ErrorMessages.UNAUTHORIZED
): NextResponse<APIError> {
  return createErrorResponse(
    message,
    HttpStatus.UNAUTHORIZED,
    'AUTH_ERROR'
  );
}

/**
 * Create authorization error response
 */
export function createForbiddenError(
  message: string = ErrorMessages.FORBIDDEN
): NextResponse<APIError> {
  return createErrorResponse(
    message,
    HttpStatus.FORBIDDEN,
    'FORBIDDEN_ERROR'
  );
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse<APIError> {
  return createErrorResponse(
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    'NOT_FOUND'
  );
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(
  resetTime?: number
): NextResponse<APIError> {
  const response = createErrorResponse(
    ErrorMessages.RATE_LIMIT_EXCEEDED,
    HttpStatus.TOO_MANY_REQUESTS,
    'RATE_LIMIT_EXCEEDED'
  );

  if (resetTime) {
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
  }

  return response;
}

/**
 * Create internal server error response
 */
export function createServerError(
  error?: Error,
  userMessage: string = ErrorMessages.INTERNAL_ERROR
): NextResponse<APIError> {
  return createErrorResponse(
    userMessage,
    HttpStatus.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR',
    error ? { message: error.message, stack: error.stack } : undefined
  );
}

/**
 * Create service unavailable error response
 */
export function createServiceUnavailableError(
  service: string
): NextResponse<APIError> {
  return createErrorResponse(
    `${service} is temporarily unavailable. Please try again later.`,
    HttpStatus.SERVICE_UNAVAILABLE,
    'SERVICE_UNAVAILABLE'
  );
}
