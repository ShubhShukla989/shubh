import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menus } from '@/lib/schema';
import { asc } from 'drizzle-orm';

/**
 * GET /api/menu - Get all menus
 */
export async function GET() {
  try {
    const data = await db.select().from(menus).orderBy(asc(menus.name));
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu - Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Menu name is required' },
        { status: 400 }
      );
    }

    const [data] = await db
      .insert(menus)
      .values({ name: name.trim() })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
