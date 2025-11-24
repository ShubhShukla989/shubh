import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/users - Get all users with their roles
export async function GET() {
  try {
    // First, get users
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, fullname, email, mobile, status, created_at, role_id')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Users query error:', usersError);
      throw usersError;
    }

    // Then get roles
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('id, name');

    if (rolesError) {
      console.error('Roles query error:', rolesError);
      throw rolesError;
    }

    // Create a role map
    const roleMap = new Map(rolesData?.map(r => [r.id, r.name]) || []);

    // Format the data
    const formattedUsers = usersData?.map(user => ({
      id: user.id,
      fullname: user.fullname || 'N/A',
      email: user.email,
      mobile: user.mobile || '',
      role: roleMap.get(user.role_id) || 'Admin',
      regt_date: new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      status: user.status || 'Active',
    })) || [];

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullname, email, password, mobile, role } = body;

    // Validate required fields
    if (!fullname || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Get role_id from role name
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        fullname,
        email,
        password_hash: hashedPassword,
        mobile: mobile || null,
        role_id: roleData.id,
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      data: newUser 
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user', details: error },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user (ban/unban)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    // Update user status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `User status updated to ${status} successfully` 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user', details: error },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete user
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', parseInt(userId));

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user', details: error },
      { status: 500 }
    );
  }
}
