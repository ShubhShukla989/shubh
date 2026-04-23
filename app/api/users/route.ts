import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, roles } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/users - Get all users with their roles
export async function GET() {
  try {
    // Get users
    const usersData = await db
      .select({
        id: users.id,
        fullname: users.fullname,
        email: users.email,
        mobile: users.mobile,
        status: users.status,
        created_at: users.created_at,
        role_id: users.role_id,
      })
      .from(users)
      .orderBy(desc(users.created_at));

    // Get roles
    const rolesData = await db.select().from(roles);

    // Create a role map
    const roleMap = new Map(rolesData.map(r => [r.id, r.name]));

    // Format the data
    const formattedUsers = usersData.map(user => ({
      id: user.id,
      fullname: user.fullname || 'N/A',
      email: user.email,
      mobile: user.mobile || '',
      role: roleMap.get(user.role_id || 2) || 'Admin',
      regt_date: new Date(user.created_at!).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      status: user.status || 'Active',
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
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
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Get role_id from role name
    const [roleData] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, role))
      .limit(1);

    if (!roleData) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [newUser] = await db
      .insert(users)
      .values({
        fullname,
        email,
        password_hash: hashedPassword,
        mobile: mobile || null,
        role_id: roleData.id,
        status: 'Active',
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      data: newUser 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
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
    await db
      .update(users)
      .set({ status, updated_at: new Date().toISOString() })
      .where(eq(users.id, id));

    return NextResponse.json({ 
      success: true, 
      message: `User status updated to ${status} successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
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
    await db
      .delete(users)
      .where(eq(users.id, parseInt(userId)));

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
