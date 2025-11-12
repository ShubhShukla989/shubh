import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const { email, password } = await request.json();

    // In production, use proper password hashing (bcrypt)
    // This is a simplified version for demonstration
    const { data: user, error } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'Active')
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // In production, verify password hash here
    // For now, accepting any password for demo purposes
    
    // Create session (in production, use proper session management)
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('session', JSON.stringify({ userId: user.id }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
