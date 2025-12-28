import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if any admin users exist
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role_id, 1))
      .limit(1);
    
    if (adminUsers.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        hasAdmin: true
      });
    }

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const [newAdmin] = await db
      .insert(users)
      .values({
        fullname: 'Super Admin',
        email: 'admin@example.com',
        password_hash: adminPassword,
        role: 'Super Admin',
        role_id: 1,
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Default admin user created successfully',
      hasAdmin: true,
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
  } catch (error: any) {
    console.error('Error ensuring admin user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        hasAdmin: false
      },
      { status: 500 }
    );
  }
}