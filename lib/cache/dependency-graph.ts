/**
 * Layout Dependency Graph System
 * 
 * Tracks relationships between:
 * - Layouts → Pages (which pages use which layouts)
 * - Layouts → Widgets (which widgets are in which layouts)
 * - Widgets → Pages (which pages are affected by widget changes)
 * 
 * Enables smart cache invalidation:
 * - Change widget → Invalidate only affected pages
 * - Change layout → Invalidate only pages using that layout
 */

import { db } from '../db';
import { pages } from '../schema/pages';
import { eq } from 'drizzle-orm';
import { deleteCache, deleteCachePattern } from './redis';

export interface DependencyGraph {
  layouts: {
    [layoutId: string]: {
      pages: string[];      // Page IDs using this layout
      widgets: string[];    // Widget IDs in this layout
    };
  };
  widgets: {
    [widgetId: string]: {
      layouts: string[];    // Layout IDs using this widget
      pages: string[];      // Page IDs affected by this widget
    };
  };
  pages: {
    [pageId: string]: {
      layoutId: string | null;  // Layout used by this page
      widgets: string[];        // Widgets affecting this page
    };
  };
}

/**
 * Build complete dependency graph from database
 * 
 * Note: Currently simplified as pages don't have direct layout_id relationship
 * TODO: Add layout_id to pages table for full dependency tracking
 */
export async function buildDependencyGraph(): Promise<DependencyGraph> {
  const graph: DependencyGraph = {
    layouts: {},
    widgets: {},
    pages: {}
  };
  
  try {
    // Get all pages
    const allPages = await db.select().from(pages);
    
    for (const page of allPages) {
      const pageId = page.id.toString();
      
      // Initialize page entry (no layout relationship yet)
      graph.pages[pageId] = {
        layoutId: null, // TODO: Add when layout_id field exists
        widgets: []
      };
    }
    
    console.log(`✅ Built dependency graph: ${Object.keys(graph.layouts).length} layouts, ${Object.keys(graph.widgets).length} widgets, ${Object.keys(graph.pages).length} pages`);
    
    return graph;
  } catch (error) {
    console.error('❌ Failed to build dependency graph:', error);
    throw error;
  }
}

/**
 * Extract widget IDs from layout structure
 */
async function extractWidgetsFromLayout(layoutId: number): Promise<string[]> {
  try {
    // This would need to query your layouts table
    // For now, return empty array as placeholder
    // TODO: Implement based on your layout schema
    return [];
  } catch (error) {
    console.error(`Failed to extract widgets from layout ${layoutId}:`, error);
    return [];
  }
}

/**
 * Invalidate cache for specific layout (smart invalidation)
 */
export async function invalidateLayout(layoutId: string, layoutName?: string): Promise<void> {
  try {
    // Invalidate by ID (numeric key)
    await deleteCache(`layout:compiled:${layoutId}`);
    await deleteCache(`layout:raw:${layoutId}`);

    // Invalidate by name (string key) — this is what the cache actually uses
    if (layoutName) {
      await deleteCache(`layout:compiled:${layoutName}`);
      await deleteCache(`layout:raw:${layoutName}`);
      await deleteCache(`layout:${layoutName}`);
    }

    console.log(`✅ Invalidated layout ${layoutId} (${layoutName || 'no name'})`);
  } catch (error) {
    console.error(`❌ Failed to invalidate layout ${layoutId}:`, error);
    throw error;
  }
}

/**
 * Invalidate cache for specific widget (smart invalidation)
 */
export async function invalidateWidget(widgetId: string): Promise<void> {
  try {
    const graph = await buildDependencyGraph();
    const affectedLayouts = graph.widgets[widgetId]?.layouts || [];
    const affectedPages = graph.widgets[widgetId]?.pages || [];
    
    console.log(`🔄 Widget ${widgetId} changed`);
    console.log(`📐 Invalidating ${affectedLayouts.length} layouts`);
    console.log(`📄 Invalidating ${affectedPages.length} pages`);
    
    // Invalidate affected layouts
    for (const layoutId of affectedLayouts) {
      await deleteCache(`layout:compiled:${layoutId}`);
      await deleteCache(`layout:raw:${layoutId}`);
    }
    
    // Invalidate affected pages
    for (const pageId of affectedPages) {
      await invalidatePage(pageId);
    }
    
    console.log(`✅ Invalidated widget ${widgetId}, ${affectedLayouts.length} layouts, ${affectedPages.length} pages`);
  } catch (error) {
    console.error(`❌ Failed to invalidate widget ${widgetId}:`, error);
    throw error;
  }
}

/**
 * Invalidate cache for specific page
 */
export async function invalidatePage(pageId: string): Promise<void> {
  try {
    // Invalidate page cache (all variations)
    await deleteCachePattern(`page:${pageId}:*`);
    await deleteCache(`page:${pageId}`);
    
    console.log(`✅ Invalidated page ${pageId}`);
  } catch (error) {
    console.error(`❌ Failed to invalidate page ${pageId}:`, error);
  }
}

/**
 * Invalidate all caches (nuclear option)
 */
export async function invalidateAll(): Promise<void> {
  try {
    console.log(`🔄 Invalidating ALL caches`);
    
    await deleteCachePattern('layout:*');
    await deleteCachePattern('page:*');
    
    console.log(`✅ Invalidated all caches`);
  } catch (error) {
    console.error(`❌ Failed to invalidate all caches:`, error);
    throw error;
  }
}

/**
 * Get dependency statistics
 */
export async function getDependencyStats(): Promise<{
  totalLayouts: number;
  totalWidgets: number;
  totalPages: number;
  avgPagesPerLayout: number;
  avgWidgetsPerLayout: number;
}> {
  try {
    const graph = await buildDependencyGraph();
    
    const totalLayouts = Object.keys(graph.layouts).length;
    const totalWidgets = Object.keys(graph.widgets).length;
    const totalPages = Object.keys(graph.pages).length;
    
    let totalPagesInLayouts = 0;
    let totalWidgetsInLayouts = 0;
    
    for (const layout of Object.values(graph.layouts)) {
      totalPagesInLayouts += layout.pages.length;
      totalWidgetsInLayouts += layout.widgets.length;
    }
    
    return {
      totalLayouts,
      totalWidgets,
      totalPages,
      avgPagesPerLayout: totalLayouts > 0 ? totalPagesInLayouts / totalLayouts : 0,
      avgWidgetsPerLayout: totalLayouts > 0 ? totalWidgetsInLayouts / totalLayouts : 0
    };
  } catch (error) {
    console.error('❌ Failed to get dependency stats:', error);
    return {
      totalLayouts: 0,
      totalWidgets: 0,
      totalPages: 0,
      avgPagesPerLayout: 0,
      avgWidgetsPerLayout: 0
    };
  }
}
