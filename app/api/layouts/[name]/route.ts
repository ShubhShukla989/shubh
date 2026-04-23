import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layouts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// Force dynamic — no Next.js data cache
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

    // If still no layout found, create a working default based on layout type
    if (!data) {
      console.log('No layouts found, creating working default for:', layoutName);
      
      // Create appropriate default based on layout name
      let defaultStructure;
      if (layoutName.toLowerCase().includes('epaper') || layoutName.toLowerCase().includes('display')) {
        // Epaper display layout
        defaultStructure = {
          rows: [{
            id: 'epaper-row',
            columns: [{
              id: 'epaper-col',
              width: 12,
              widgets: [{
                id: 'epaper-display-widget',
                type: 'epaper-page-display',
                config: {
                  title: 'Epaper Display',
                  width: 500,
                  height: 700,
                  enableNavigation: true,
                  enableZoom: true,
                  cssClasses: 'mx-auto'
                }
              }]
            }]
          }]
        };
      } else {
        // Generic layout
        defaultStructure = {
          rows: [{
            id: 'default-row',
            columns: [{
              id: 'default-col',
              width: 12,
              widgets: [{
                id: 'default-widget',
                type: 'text',
                config: {
                  content: `<div class="text-center p-8"><h2>Welcome</h2><p>Layout "${layoutName}" is loading...</p></div>`,
                  cssClasses: 'text-center p-8'
                }
              }]
            }]
          }]
        };
      }
      
      return NextResponse.json({ 
        success: true, 
        data: {
          id: 0,
          name: layoutName,
          structure: JSON.stringify(defaultStructure),
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        cached: false
      });
    }

    // No Redis cache — always fetch fresh from DB so layout changes reflect instantly
    return NextResponse.json({ 
      success: true, 
      data,
      cached: false 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[GET /api/layouts/:name] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}
