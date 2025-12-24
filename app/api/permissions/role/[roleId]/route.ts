import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { role_permissions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/permissions/role/:roleId - Get permissions for a role
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const roleId = parseInt(params.roleId);

    const data = await db
      .select()
      .from(role_permissions)
      .where(eq(role_permissions.role_id, roleId));

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get role permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role permissions' },
      { status: 500 }
    );
  }
}

// POST /api/permissions/role/:roleId - Update permissions for a role
export async function POST(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const roleId = parseInt(params.roleId);
    const { permissions } = await request.json();

    // Delete existing permissions for this role
    await db
      .delete(role_permissions)
      .where(eq(role_permissions.role_id, roleId));

    // Insert new permissions
    if (permissions && permissions.length > 0) {
      const permissionsData = permissions.map((permKey: string) => ({
        role_id: roleId,
        permission_key: permKey,
      }));

      await db
        .insert(role_permissions)
        .values(permissionsData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update role permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role permissions' },
      { status: 500 }
    );
  }
}
