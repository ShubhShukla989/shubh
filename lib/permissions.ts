/**
 * Permission Helper Functions
 * Use these to check if a user has specific permissions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    // Get user's role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (userError || !user) return false;

    // Super Admin has all permissions
    if ((user.roles as any)?.name === 'Super Admin') {
      return true;
    }

    // Check if role has this permission
    const { data: rolePermission, error: permError } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_id', user.role_id)
      .eq('permission_key', permissionKey)
      .single();

    if (permError || !rolePermission) return false;

    return true;
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
    // Get user's role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (userError || !user) return [];

    // Super Admin has all permissions
    if ((user.roles as any)?.name === 'Super Admin') {
      const { data: allPerms } = await supabaseAdmin
        .from('permissions')
        .select('key');
      return allPerms?.map(p => p.key) || [];
    }

    // Get role permissions
    const { data: rolePermissions } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_key')
      .eq('role_id', user.role_id);

    return rolePermissions?.map(p => p.permission_key) || [];
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
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('roles(name)')
      .eq('id', userId)
      .single();

    return (user?.roles as any)?.name === 'Super Admin';
  } catch (error) {
    return false;
  }
}
