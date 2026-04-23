/**
 * Global Error Handler for API Routes
 * 
 * Provides consistent error handling across all API endpoints
 * Prevents error information leakage
 * Logs errors for monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { z } from "zod";

export interface APIError {
  success: false;
  error: string;
  code?: string;
  requestId?: string;
  details?: any;
}

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
} as const;

/**
 * Map error types to HTTP status codes
 */
function getStatusCode(error: any): number {
  if (error.message === "UNAUTHORIZED") return 401;
  if (error.message === "FORBIDDEN") return 403;
  if (error.message === "NOT_FOUND") return 404;
  if (error.message === "CONFLICT") return 409;
  if (error.message === "RATE_LIMIT_EXCEEDED") return 429;
  if (error instanceof z.ZodError) return 400;
  if (error.message?.includes("validation")) return 400;
  return 500;
}

/**
 * Map error types to error codes
 */
function getErrorCode(error: any): string {
  if (error.message === "UNAUTHORIZED") return ERROR_CODES.UNAUTHORIZED;
  if (error.message === "FORBIDDEN") return ERROR_CODES.FORBIDDEN;
  if (error.message === "NOT_FOUND") return ERROR_CODES.NOT_FOUND;
  if (error.message === "RATE_LIMIT_EXCEEDED") return ERROR_CODES.RATE_LIMIT;
  if (error instanceof z.ZodError) return ERROR_CODES.VALIDATION_ERROR;
  return ERROR_CODES.INTERNAL_ERROR;
}

/**
 * Get user-friendly error message
 * Never expose internal details in production
 */
function getUserMessage(error: any, isDevelopment: boolean): string {
  const statusCode = getStatusCode(error);
  
  // Use custom message if provided
  if (error.userMessage) {
    return error.userMessage;
  }
  
  // Standard messages
  switch (statusCode) {
    case 401:
      return "Authentication required";
    case 403:
      return "Insufficient permissions";
    case 404:
      return "Resource not found";
    case 409:
      return "Resource conflict";
    case 429:
      return "Too many requests, please try again later";
    case 400:
      if (error instanceof z.ZodError) {
        return "Validation failed";
      }
      return "Invalid request";
    case 500:
      // Never expose internal errors in production
      return isDevelopment ? error.message : "Internal server error";
    default:
      return "An error occurred";
  }
}

/**
 * Get error details for response
 * Only include in development or for validation errors
 */
function getErrorDetails(error: any, isDevelopment: boolean): any {
  // Always include Zod validation errors
  if (error instanceof z.ZodError) {
    return error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }
  
  // Include stack trace in development
  if (isDevelopment && error.stack) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  
  return undefined;
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const requestId = request.headers.get("x-request-id") || `req_${Date.now()}`;
    const isDevelopment = process.env.NODE_ENV === "development";
    
    try {
      return await handler(request, ...args);
    } catch (error: any) {
      const statusCode = getStatusCode(error);
      const errorCode = getErrorCode(error);
      const userMessage = getUserMessage(error, isDevelopment);
      const details = getErrorDetails(error, isDevelopment);
      
      // Log error for monitoring
      logger.error("API error", error, {
        requestId,
        path: request.nextUrl.pathname,
        method: request.method,
        statusCode,
        errorCode,
        userId: (request as any).user?.id,
      });
      
      // Build error response
      const errorResponse: APIError = {
        success: false,
        error: userMessage,
        code: errorCode,
        requestId,
      };
      
      if (details) {
        errorResponse.details = details;
      }
      
      return NextResponse.json(errorResponse, {
        status: statusCode,
        headers: {
          "X-Request-ID": requestId,
        },
      });
    }
  };
}

/**
 * Create custom error with user message
 */
export class APIException extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "APIException";
  }
}

/**
 * Throw validation error
 */
export function throwValidationError(message: string, details?: any): never {
  const error = new Error("VALIDATION_ERROR");
  (error as any).userMessage = message;
  (error as any).details = details;
  throw error;
}

/**
 * Throw not found error
 */
export function throwNotFound(resource: string = "Resource"): never {
  const error = new Error("NOT_FOUND");
  (error as any).userMessage = `${resource} not found`;
  throw error;
}

/**
 * Throw conflict error
 */
export function throwConflict(message: string): never {
  const error = new Error("CONFLICT");
  (error as any).userMessage = message;
  throw error;
}
