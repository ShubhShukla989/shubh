import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitConfig, DEFAULT_RATE_LIMIT } from "./rateLimit";
import { logger } from "./logger";

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  return request.ip || "unknown";
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Wrap API handler with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const clientIP = getClientIP(request);
    const result = checkRateLimit(clientIP, config);
    
    // Add rate limit headers
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    headers.set("X-RateLimit-Remaining", result.remaining.toString());
    headers.set("X-RateLimit-Reset", result.resetTime.toString());
    headers.set("X-Request-ID", requestId); // For tracing
    
    if (!result.allowed) {
      logger.warn("Rate limit exceeded", {
        requestId,
        clientIP,
        path: request.nextUrl.pathname,
        method: request.method,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: config.message || "Too many requests, please try again later",
          requestId,
        },
        {
          status: 429,
          headers,
        }
      );
    }
    
    // Call the actual handler
    const response = await handler(request, ...args);
    
    // Add rate limit headers and request ID to successful response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}
