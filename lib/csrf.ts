import { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * CSRF Protection for API routes
 * 
 * NextAuth provides CSRF protection for auth routes,
 * but we need it for other mutation endpoints too.
 */

const CSRF_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash CSRF token for storage
 */
export function hashCsrfToken(token: string): string {
  return crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex");
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string, hash: string): boolean {
  const expectedHash = hashCsrfToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(hash)
  );
}

/**
 * Get CSRF token from request
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  // Check header first (preferred)
  const headerToken = request.headers.get("x-csrf-token");
  if (headerToken) return headerToken;
  
  // Check cookie as fallback
  const cookieToken = request.cookies.get("csrf-token")?.value;
  if (cookieToken) return cookieToken;
  
  return null;
}

/**
 * Validate CSRF for mutation requests
 * Call this in POST, PUT, DELETE, PATCH handlers
 */
export function validateCsrf(request: NextRequest): boolean {
  const method = request.method;
  
  // Only check mutations
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true;
  }
  
  // Get token from request
  const token = getCsrfTokenFromRequest(request);
  if (!token) {
    return false;
  }
  
  // Get expected hash from session/cookie
  const expectedHash = request.cookies.get("csrf-token-hash")?.value;
  if (!expectedHash) {
    return false;
  }
  
  // Verify token
  return verifyCsrfToken(token, expectedHash);
}

/**
 * CSRF middleware wrapper
 * Use this for routes that need CSRF protection
 */
export function withCsrf(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    // Validate CSRF for mutations
    if (!validateCsrf(request)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid CSRF token",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return handler(request, ...args);
  };
}
