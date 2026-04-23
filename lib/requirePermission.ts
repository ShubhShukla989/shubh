import { requireAuth, AuthSession, handleAuthError } from "./requireAuth";
import { hasPermission, isSuperAdmin } from "./permissions";
import { NextResponse } from "next/server";
import { logger } from "./logger";

// Permission cache - in-memory for performance
const permissionCache = new Map<number, { permissions: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user permissions with caching
 * Avoids DB query on every request
 */
async function getCachedPermissions(userId: number): Promise<string[]> {
  const now = Date.now();
  const cached = permissionCache.get(userId);
  
  // Return cached if valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }
  
  // Check if super admin (they have all permissions)
  const isAdmin = await isSuperAdmin(userId);
  
  let permissions: string[];
  if (isAdmin) {
    // Super admin has all permissions
    permissions = ["*"]; // Wildcard for all permissions
  } else {
    // Fetch from database
    const { getUserPermissions } = await import("./permissions");
    permissions = await getUserPermissions(userId);
  }
  
  // Cache the result
  permissionCache.set(userId, {
    permissions,
    timestamp: now,
  });
  
  return permissions;
}

/**
 * Clear permission cache for a user
 * CRITICAL: Call this when user permissions change
 * to prevent stale permission access
 */
export function clearPermissionCache(userId: number): void {
  permissionCache.delete(userId);
  logger.info("Permission cache cleared", { userId });
}

/**
 * Clear all permission caches
 * Call this when role permissions are updated
 */
export function clearAllPermissionCaches(): void {
  permissionCache.clear();
  logger.info("All permission caches cleared");
}

/**
 * Clear permission cache for multiple users
 * Useful when updating role permissions
 */
export function clearPermissionCacheForUsers(userIds: number[]): void {
  userIds.forEach(userId => permissionCache.delete(userId));
  logger.info("Permission cache cleared for multiple users", { count: userIds.length });
}

/**
 * Check if user has permission (with caching)
 */
async function checkPermission(userId: number, permission: string): Promise<boolean> {
  const permissions = await getCachedPermissions(userId);
  
  // Super admin has all permissions
  if (permissions.includes("*")) {
    return true;
  }
  
  // Check specific permission
  return permissions.includes(permission);
}

/**
 * Require specific permission for API routes
 */
export async function requirePermission(
  permission: string
): Promise<AuthSession> {
  const authSession = await requireAuth();
  
  // Check if user has permission (cached)
  const allowed = await checkPermission(authSession.user.id, permission);
  
  if (!allowed) {
    logger.warn("Permission denied", {
      user_id: authSession.user.id,
      email: authSession.user.email,
      permission,
    });
    
    throw new Error("FORBIDDEN");
  }
  
  return authSession;
}

/**
 * Require Super Admin role
 */
export async function requireSuperAdmin(): Promise<AuthSession> {
  const authSession = await requireAuth();
  
  const isAdmin = await isSuperAdmin(authSession.user.id);
  
  if (!isAdmin) {
    logger.warn("Super Admin access denied", {
      user_id: authSession.user.id,
      email: authSession.user.email,
    });
    
    throw new Error("FORBIDDEN");
  }
  
  return authSession;
}

/**
 * Handle authorization errors
 */
export function handlePermissionError(error: any) {
  if (error.message === "FORBIDDEN") {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  
  return handleAuthError(error);
}
