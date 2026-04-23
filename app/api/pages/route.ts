import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { eq, desc, ilike, ne, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

/**
 * GET /api/pages/check-alias - Check if alias is available
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const alias = searchParams.get('alias');
    const excludeId = searchParams.get('excludeId');

    // Handle alias availability check
    if (alias) {
      const queryStart = performance.now();
      
      let whereConditions = [eq(pages.alias, alias)];
      
      if (excludeId) {
        // If excludeId is provided, we want to exclude that page from the check
        whereConditions.push(ne(pages.id, parseInt(excludeId)));
      }
      
      const existingPages = await db
        .select()
        .from(pages)
        .where(and(...whereConditions));
      
      const queryTime = performance.now() - queryStart;
      console.log(`⏱️ API /pages (alias check): Query ${queryTime.toFixed(2)}ms`);
      
      const available = existingPages.length === 0;
      
      return NextResponse.json({ available });
    }

    // Handle regular page listing
    const queryStart = performance.now();
    
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
    
    const queryTime = performance.now() - queryStart;
    const totalTime = performance.now() - startTime;
    
    console.log(`⏱️ API /pages: Query ${queryTime.toFixed(2)}ms | Total ${totalTime.toFixed(2)}ms | Rows ${data.length}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(`❌ API /pages: Error after ${totalTime.toFixed(2)}ms`, error);
    
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
      .values({
        title: body.title,
        alias: body.alias,
        description: body.description || null,
        content: body.content || null,
        status: body.status || 'Public',
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        meta_keywords: body.meta_keywords || null,
        og_image: body.og_image || null,
        twitter_title: body.twitter_title || null,
        twitter_description: body.twitter_description || null,
        twitter_image: body.twitter_image || null,
        header_code: body.header_code || null,
        footer_code: body.footer_code || null,
      })
      .returning();

    invalidateCacheKeysAsync(['pages:*', 'menu:*', 'layout:menu:*']);
    if (newPage.alias) revalidatePath(`/${newPage.alias}`, 'page');
    return NextResponse.json({ success: true, data: newPage }, { status: 201 });
  } catch (error: any) {
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
