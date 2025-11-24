import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Get user from database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        fullname,
        password_hash,
        role_id,
        status
      `)
      .eq('email', email)
      .single();

    if (error || !users) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (users.status?.toLowerCase() !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, users.password_hash);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get role name
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', users.role_id)
      .single();

    const user = {
      id: users.id,
      email: users.email,
      fullname: users.fullname,
      role_id: users.role_id,
      role_name: role?.name || 'Admin',
    };

    // Create session data
    const sessionData = {
      userId: users.id,
      email: users.email,
      roleId: users.role_id,
      roleName: role?.name || 'Admin',
    };

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user,
    });

    // Set session cookie (expires in 7 days)
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
