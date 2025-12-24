/**
 * Permission Helper Functions
 * Use these to check if a user has specific permissions
 */

import { db } from '@/lib/db';
import { users, roles, role_permissions, permissions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has a specific permission
 * @param userId - User ID
 * @param permissionKey - Permission key to check
 * @returns true if user has permission, false otherwise
 */
export async function hasPermission(
  userId: number,
  permissionKey: string
): Promise<boolean> {
  try {
    // Get user with role
    const [user] = await db
      .select({
        role_id: users.role_id,
        role_name: roles.name
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    // Super Admin has all permissions
    if (user.role_name === 'Super Admin') {
      return true;
    }

    // Check if role has this permission
    const [rolePermission] = await db
      .select()
      .from(role_permissions)
      .where(and(eq(role_permissions.role_id, user.role_id!), eq(role_permissions.permission_key, permissionKey)))
      .limit(1);

    return !!rolePermission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param userId - User ID
 * @returns Array of permission keys
 */
export async function getUserPermissions(
  userId: number
): Promise<string[]> {
  try {
    // Get user with role
    const [user] = await db
      .select({
        role_id: users.role_id,
        role_name: roles.name
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return [];

    // Super Admin has all permissions
    if (user.role_name === 'Super Admin') {
      const allPerms = await db.select({ key: permissions.key }).from(permissions);
      return allPerms.map(p => p.key);
    }

    // Get role permissions
    const rolePermissions = await db
      .select({ permission_key: role_permissions.permission_key })
      .from(role_permissions)
      .where(eq(role_permissions.role_id, user.role_id!));

    return rolePermissions.map(p => p.permission_key);
  } catch (error) {
    console.error('Get user permissions error:', error);
    return [];
  }
}

/**
 * Check if user is Super Admin
 * @param userId - User ID
 * @returns true if user is Super Admin
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  try {
    const [user] = await db
      .select({ role_name: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    return user?.role_name === 'Super Admin';
  } catch (error) {
    return false;
  }
}
