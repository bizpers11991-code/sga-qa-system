import type { VercelResponse } from '@vercel/node';
import { sendErrorNotification } from './teams.js';

/**
 * Enhanced Error Handling System
 *
 * This module provides:
 * 1. Custom error classes for different error types
 * 2. Standardized error response format
 * 3. Error serialization for consistent API responses
 * 4. Request ID tracking for debugging
 * 5. Context-aware error logging
 */

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT_ERROR', true, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter: number, details?: Record<string, any>) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      429,
      'RATE_LIMIT_EXCEEDED',
      true,
      { retryAfter, ...details }
    );
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, details?: Record<string, any>) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, ...details }
    );
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Database errors (503)
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 503, 'DATABASE_ERROR', false, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// ============================================================================
// Error Response Serialization
// ============================================================================

export interface ErrorResponse {
  error: string;
  code: string;
  requestId?: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Serialize an error for API response
 * Removes sensitive information in production
 */
export const serializeError = (
  error: Error | AppError,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse => {
  const isProduction = process.env.NODE_ENV === 'production';

  const response: ErrorResponse = {
    error: error.message,
    code: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
    requestId,
  };

  if (error instanceof AppError && error.details) {
    response.details = error.details;
  }

  // Only include stack traces in development
  if (!isProduction && includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// ============================================================================
// Request ID Generation
// ============================================================================

/**
 * Generate a unique request ID for debugging
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Enhanced Error Handler
// ============================================================================

interface ApiErrorParams {
  res?: VercelResponse;
  error: any;
  title: string;
  context?: Record<string, any>;
  statusCode?: number;
  requestId?: string;
}

/**
 * Enhanced error handler with improved logging and response formatting
 */
export const handleApiError = async ({
  res,
  error,
  title,
  context = {},
  statusCode,
  requestId,
}: ApiErrorParams): Promise<VercelResponse | void> => {
  // Generate request ID if not provided
  const errorRequestId = requestId || generateRequestId();

  // Determine status code
  let responseStatusCode = statusCode;
  if (!responseStatusCode) {
    if (error instanceof AppError) {
      responseStatusCode = error.statusCode;
    } else {
      responseStatusCode = 500;
    }
  }

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Enhanced logging context
  const logContext = {
    requestId: errorRequestId,
    errorCode: error instanceof AppError ? error.code : 'UNKNOWN',
    statusCode: responseStatusCode,
    isOperational: error instanceof AppError ? error.isOperational : false,
    ...context,
  };

  // Log to server console for Vercel logs
  console.error(`[API Error] ${title}:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    context: logContext,
  });

  // Send notification for non-operational errors or critical errors
  const shouldNotify =
    responseStatusCode >= 500 ||
    (error instanceof AppError && !error.isOperational);

  if (shouldNotify) {
    try {
      await sendErrorNotification(title, error, logContext);
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }

  // Prevent sending response if headers are already sent or if no response object is provided
  if (!res || res.headersSent) {
    return;
  }

  // Send standardized error response
  const errorResponse = serializeError(error, errorRequestId, process.env.NODE_ENV !== 'production');

  return res.status(responseStatusCode).json(errorResponse);
};

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if an error is an operational error (expected error that we can handle)
 */
export const isOperationalError = (error: any): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Check if an error is a specific type
 */
export const isErrorOfType = <T extends AppError>(
  error: any,
  errorClass: new (...args: any[]) => T
): error is T => {
  return error instanceof errorClass;
};

// ============================================================================
// Error Logging with Breadcrumbs
// ============================================================================

interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// In-memory breadcrumb storage (per request)
const breadcrumbs = new Map<string, Breadcrumb[]>();

/**
 * Add a breadcrumb for debugging
 */
export const addBreadcrumb = (
  requestId: string,
  category: string,
  message: string,
  level: Breadcrumb['level'] = 'info',
  data?: Record<string, any>
): void => {
  const breadcrumb: Breadcrumb = {
    timestamp: new Date().toISOString(),
    category,
    message,
    level,
    data,
  };

  if (!breadcrumbs.has(requestId)) {
    breadcrumbs.set(requestId, []);
  }

  const requestBreadcrumbs = breadcrumbs.get(requestId)!;
  requestBreadcrumbs.push(breadcrumb);

  // Keep only last 50 breadcrumbs per request
  if (requestBreadcrumbs.length > 50) {
    requestBreadcrumbs.shift();
  }
};

/**
 * Get breadcrumbs for a request
 */
export const getBreadcrumbs = (requestId: string): Breadcrumb[] => {
  return breadcrumbs.get(requestId) || [];
};

/**
 * Clear breadcrumbs for a request
 */
export const clearBreadcrumbs = (requestId: string): void => {
  breadcrumbs.delete(requestId);
};

// ============================================================================
// Error Categories for Monitoring
// ============================================================================

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

/**
 * Categorize an error for monitoring purposes
 */
export const categorizeError = (error: any): ErrorCategory => {
  if (error instanceof AuthenticationError) {
    return ErrorCategory.AUTHENTICATION;
  }
  if (error instanceof AuthorizationError) {
    return ErrorCategory.AUTHORIZATION;
  }
  if (error instanceof ValidationError) {
    return ErrorCategory.VALIDATION;
  }
  if (error instanceof DatabaseError) {
    return ErrorCategory.DATABASE;
  }
  if (error instanceof ExternalServiceError) {
    return ErrorCategory.EXTERNAL_SERVICE;
  }
  if (error instanceof RateLimitError) {
    return ErrorCategory.RATE_LIMIT;
  }
  if (error instanceof AppError) {
    return ErrorCategory.BUSINESS_LOGIC;
  }
  if (error instanceof Error) {
    return ErrorCategory.SYSTEM;
  }
  return ErrorCategory.UNKNOWN;
};

// ============================================================================
// Async Error Wrapper
// ============================================================================

/**
 * Wrap async functions to automatically catch and handle errors
 */
export const asyncHandler = (
  fn: (req: any, res: any) => Promise<any>
) => {
  return (req: any, res: any) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      const requestId = (req as any).requestId || generateRequestId();
      handleApiError({
        res,
        error,
        title: 'Unhandled Error',
        requestId,
      });
    });
  };
};
