import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/layouts/[name]/pages
 * Get all pages that use this layout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    // Get all pages
    const allPages = await db
      .select({
        id: pages.id,
        title: pages.title,
        alias: pages.alias,
        content: pages.content,
        status: pages.status,
        created_at: pages.created_at
      })
      .from(pages)
      .orderBy(desc(pages.created_at));

    // Filter pages that use this layout
    const connectedPages = allPages.filter(page => {
      try {
        const content = JSON.parse(page.content || '{}');
        return content.mode === 'designer' && content.layoutName === name;
      } catch (e) {
        return false;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        layoutName: name,
        totalPages: connectedPages.length,
        pages: connectedPages.map(p => ({
          id: p.id,
          title: p.title,
          alias: p.alias,
          status: p.status,
          created_at: p.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get layout pages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connected pages' },
      { status: 500 }
    );
  }
}
