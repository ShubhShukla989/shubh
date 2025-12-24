import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { permissions } from '@/lib/schema';
import { asc } from 'drizzle-orm';

// GET /api/permissions - Get all available permissions
export async function GET() {
  try {
    const data = await db
      .select()
      .from(permissions)
      .orderBy(asc(permissions.category), asc(permissions.name));

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
