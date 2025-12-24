import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { eq, desc, ilike, ne, and } from 'drizzle-orm';

/**
 * GET /api/pages/check-alias - Check if alias is available
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const alias = searchParams.get('alias');
    const excludeId = searchParams.get('excludeId');

    // Handle alias availability check
    if (alias) {
      let whereConditions = [eq(pages.alias, alias)];
      
      if (excludeId) {
        // If excludeId is provided, we want to exclude that page from the check
        whereConditions.push(ne(pages.id, parseInt(excludeId)));
      }
      
      const existingPages = await db
        .select()
        .from(pages)
        .where(and(...whereConditions));
      
      const available = existingPages.length === 0;
      
      return NextResponse.json({ available });
    }

    // Handle regular page listing
    let query = db.select().from(pages).orderBy(desc(pages.created_at));

    let data;
    if (search) {
      data = await db
        .select()
        .from(pages)
        .where(ilike(pages.title, `%${search}%`))
        .orderBy(desc(pages.created_at));
    } else {
      data = await query;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get pages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pages - Create new page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.alias) {
      return NextResponse.json(
        { success: false, error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    // Check if alias already exists
    const existingPage = await db
      .select()
      .from(pages)
      .where(eq(pages.alias, body.alias))
      .limit(1);

    if (existingPage.length > 0) {
      return NextResponse.json(
        { success: false, error: `Alias "${body.alias}" already exists. Please use a different alias.` },
        { status: 400 }
      );
    }

    const [newPage] = await db
      .insert(pages)
      .values(body)
      .returning();

    return NextResponse.json({ success: true, data: newPage }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Create page error:', error);
    
    // Handle specific database errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'A page with this alias already exists. Please use a different alias.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create page' },
      { status: 500 }
    );
  }
}
