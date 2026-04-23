import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { layouts, layout_backups } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { deleteCachePattern } from '@/lib/cache/redis';
import { preCompileAndCacheLayout } from '@/lib/layout-compiler';
import { invalidateLayout } from '@/lib/cache/dependency-graph';

// POST /api/layouts/update - Save or publish layout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, structure, custom_css, custom_js, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    const structureStr = typeof structure === 'string' ? structure : JSON.stringify(structure || { rows: [] });

    // Check if layout exists
    const [existing] = await db
      .select()
      .from(layouts)
      .where(eq(layouts.name, name))
      .limit(1);

    let data;
    if (existing) {
      // Update existing layout
      [data] = await db
        .update(layouts)
        .set({
          structure: structureStr,
          custom_css: custom_css || '',
          custom_js: custom_js || '',
          status: status || 'draft',
          updated_at: new Date().toISOString(),
        })
        .where(eq(layouts.name, name))
        .returning();
    } else {
      // Insert new layout
      [data] = await db
        .insert(layouts)
        .values({
          name,
          structure: structureStr,
          custom_css: custom_css || '',
          custom_js: custom_js || '',
          status: status || 'draft',
        })
        .returning();
    }

    // If publishing, create a backup
    if (status === 'published') {
      await db.insert(layout_backups).values({
        id: uuidv4(),
        layout_name: name,
        structure: structureStr,
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ PHASE 2: Pre-Compile Layout to HTML with XSS Protection
    try {
      await preCompileAndCacheLayout(data);
      console.log(`✅ Pre-compiled layout: ${name} [XSS Protected]`);
    } catch (error) {
      console.error('⚠️ Failed to pre-compile layout:', error);
      // Continue anyway - not critical
    }

    // ✅ PHASE 3: Smart Cache Invalidation with Dependency Graph
    try {
      // Use dependency graph for targeted invalidation
      await invalidateLayout(data.id.toString(), name);
      console.log(`✅ Smart cache invalidation for layout: ${name}`);
    } catch (error) {
      console.error('⚠️ Failed to use smart invalidation, falling back to pattern:', error);
      
      // Fallback: Clear with new key structure
      try {
        await deleteCachePattern(`layout:compiled:${name}`);
        await deleteCachePattern(`layout:raw:${name}`);
        await deleteCachePattern(`layout:lock:${name}`);
        await deleteCachePattern(`layout:${name}`); // raw layout cache used by LayoutRenderer
        
        // CRITICAL: Also clear widget data caches when layout changes
        await deleteCachePattern('editions:featured:*');
        await deleteCachePattern('categories:*');
        await deleteCachePattern('menu:*');
        await deleteCachePattern('slider:*');
        
        console.log(`✅ Redis cache cleared for layout: ${name} (new key structure + widget data)`);
      } catch (fallbackError) {
        console.error('⚠️ Failed to clear Redis cache:', fallbackError);
      }
    }

    // ✅ Use tag-based revalidation for cleaner code
    try {
      // Revalidate all pages that use layouts
      revalidateTag('layout');
      
      // Also revalidate specific paths for immediate effect
      revalidatePath('/', 'page'); // Homepage
      revalidatePath('/page/[alias]', 'page'); // Custom pages
      
      // If it's a header/footer, revalidate all pages
      if (name === 'Site Header' || name === 'Site Footer') {
        revalidatePath('/', 'layout'); // All pages in layout
      }
      
      console.log(`✅ Next.js pages revalidated for layout: ${name}`);
    } catch (error) {
      console.error('⚠️ Failed to revalidate pages:', error);
      // Continue anyway - not critical
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Layout updated successfully.'
    });
  } catch (error) {
    console.error('[POST /api/layouts/update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layout' },
      { status: 500 }
    );
  }
}
