import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layouts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/layouts/[name] - Fetch latest published layout by name
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const layoutName = decodeURIComponent(params.name);

    // Try to find the exact layout first
    let [data] = await db
      .select()
      .from(layouts)
      .where(and(eq(layouts.name, layoutName), eq(layouts.status, 'published')))
      .limit(1);

    // If not found, try case-insensitive search
    if (!data) {
      console.log(`Layout "${layoutName}" not found, trying case-insensitive search`);
      const allLayouts = await db
        .select()
        .from(layouts)
        .where(eq(layouts.status, 'published'));
      
      const foundLayout = allLayouts.find(layout => 
        layout.name.toLowerCase() === layoutName.toLowerCase()
      );
      if (foundLayout) {
        data = foundLayout;
      }
    }

    // If still not found, try fallback to Website Homepage
    if (!data && layoutName !== 'Website Homepage') {
      console.log(`Layout "${layoutName}" not found, falling back to Website Homepage`);
      [data] = await db
        .select()
        .from(layouts)
        .where(and(eq(layouts.name, 'Website Homepage'), eq(layouts.status, 'published')))
        .limit(1);
    }

    // If still no layout found, create a minimal default
    if (!data) {
      console.log('No layouts found, creating minimal default');
      return NextResponse.json({ 
        success: true, 
        data: {
          id: 0,
          name: layoutName,
          structure: JSON.stringify({
            rows: [{
              id: 'default-row',
              columns: [{
                id: 'default-col',
                width: 12,
                widgets: [{
                  id: 'default-widget',
                  type: 'text',
                  config: {
                    content: `<h2>Layout "${layoutName}" not found</h2><p>Please configure this layout in the admin panel.</p>`,
                    cssClasses: 'text-center p-8'
                  }
                }]
              }]
            }]
          }),
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/layouts/:name] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}
