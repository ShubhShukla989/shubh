import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/permissions/role/:roleId - Get permissions for a role
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const roleId = parseInt(params.roleId);

    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;

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
    const { error: deleteError } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) throw deleteError;

    // Insert new permissions
    if (permissions && permissions.length > 0) {
      const permissionsData = permissions.map((permKey: string) => ({
        role_id: roleId,
        permission_key: permKey,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('role_permissions')
        .insert(permissionsData);

      if (insertError) throw insertError;
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
