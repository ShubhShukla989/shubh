import Database from 'better-sqlite3';
import path from 'path';

/**
 * Optimized database connection with performance settings
 */
class OptimizedDatabase {
  private static instance: Database.Database | null = null;
  
  public static getInstance(): Database.Database {
    if (!OptimizedDatabase.instance) {
      const dbPath = path.join(process.cwd(), 'database', 'epapercms.db');
      
      OptimizedDatabase.instance = new Database(dbPath, {
        // Enable verbose logging in development
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });
      
      // Apply performance optimizations
      OptimizedDatabase.optimizeSettings();
    }
    
    return OptimizedDatabase.instance;
  }
  
  private static optimizeSettings(): void {
    if (!OptimizedDatabase.instance) return;
    
    const db = OptimizedDatabase.instance;
    
    try {
      // Enable Write-Ahead Logging for better concurrency
      db.pragma('journal_mode = WAL');
      
      // Balance between safety and performance
      db.pragma('synchronous = NORMAL');
      
      // Increase cache size to 64MB
      db.pragma('cache_size = -64000');
      
      // Store temporary tables in memory
      db.pragma('temp_store = MEMORY');
      
      // Enable memory-mapped I/O (256MB)
      db.pragma('mmap_size = 268435456');
      
      // Optimize for read-heavy workload
      db.pragma('optimize');
      
      console.log('✅ Database optimizations applied');
    } catch (error) {
      console.error('❌ Failed to apply database optimizations:', error);
    }
  }
  
  public static close(): void {
    if (OptimizedDatabase.instance) {
      OptimizedDatabase.instance.close();
      OptimizedDatabase.instance = null;
    }
  }
  
  /**
   * Get database statistics
   */
  public static getStats(): {
    size: string;
    pages: number;
    indexes: number;
    cacheSize: number;
    journalMode: string;
  } {
    const db = OptimizedDatabase.getInstance();
    
    try {
      const pageCount = db.pragma('page_count', { simple: true }) as number;
      const pageSize = db.pragma('page_size', { simple: true }) as number;
      const sizeBytes = pageCount * pageSize;
      const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
      
      const indexCount = db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_autoindex_%'
      `).get() as { count: number };
      
      const cacheSize = Math.abs(db.pragma('cache_size', { simple: true }) as number);
      const journalMode = db.pragma('journal_mode', { simple: true }) as string;
      
      return {
        size: `${sizeMB} MB`,
        pages: pageCount,
        indexes: indexCount.count,
        cacheSize,
        journalMode,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        size: 'Unknown',
        pages: 0,
        indexes: 0,
        cacheSize: 0,
        journalMode: 'Unknown',
      };
    }
  }
}

/**
 * Performance monitoring wrapper for database queries
 */
export function monitorQuery<T>(
  queryName: string,
  queryFn: () => T,
  slowThreshold = 100
): T {
  const start = process.hrtime.bigint();
  
  try {
    const result = queryFn();
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
    
    // Log slow queries
    if (duration > slowThreshold) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === 'development' && duration > 10) {
      console.log(`⚡ Query ${queryName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    console.error(`❌ Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Optimized query helpers using indexes
 */
export const optimizedQueries = {
  // Edition queries (using date and category indexes)
  getRecentEditions: (limit = 10, offset = 0) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getRecentEditions', () =>
      db.prepare(`
        SELECT * FROM editions 
        WHERE status = 'published' 
        ORDER BY date DESC 
        LIMIT ? OFFSET ?
      `).all(limit, offset)
    );
  },
  
  getEditionsByCategory: (categoryId: number, limit = 10) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getEditionsByCategory', () =>
      db.prepare(`
        SELECT * FROM editions 
        WHERE category_id = ? AND status = 'published'
        ORDER BY date DESC 
        LIMIT ?
      `).all(categoryId, limit)
    );
  },
  
  getFeaturedEditions: (limit = 5) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getFeaturedEditions', () =>
      db.prepare(`
        SELECT * FROM editions 
        WHERE is_featured = 1 AND status = 'published'
        ORDER BY date DESC 
        LIMIT ?
      `).all(limit)
    );
  },
  
  // Page queries (using edition and page indexes)
  getEditionPages: (editionId: number) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getEditionPages', () =>
      db.prepare(`
        SELECT * FROM edition_pages 
        WHERE edition_id = ? 
        ORDER BY page_number
      `).all(editionId)
    );
  },
  
  getPageWithAreaMaps: (pageId: number) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getPageWithAreaMaps', () => {
      const page = db.prepare(`
        SELECT * FROM edition_pages WHERE id = ?
      `).get(pageId);
      
      const areaMaps = db.prepare(`
        SELECT * FROM area_maps WHERE page_id = ?
      `).all(pageId);
      
      return { page, areaMaps };
    });
  },
  
  // Category queries (using alias and featured indexes)
  getCategoryByAlias: (alias: string) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getCategoryByAlias', () =>
      db.prepare(`
        SELECT * FROM epaper_categories 
        WHERE alias = ? AND is_active = 1
      `).get(alias)
    );
  },
  
  getFeaturedCategories: () => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getFeaturedCategories', () =>
      db.prepare(`
        SELECT * FROM epaper_categories 
        WHERE is_featured = 1 AND is_active = 1
        ORDER BY display_order
      `).all()
    );
  },
  
  getActiveCategories: () => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getActiveCategories', () =>
      db.prepare(`
        SELECT * FROM epaper_categories 
        WHERE is_active = 1
        ORDER BY display_order
      `).all()
    );
  },
  
  // Media queries (using filename and type indexes)
  getMediaByFilename: (filename: string) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getMediaByFilename', () =>
      db.prepare(`
        SELECT * FROM media_files WHERE filename = ?
      `).get(filename)
    );
  },
  
  getMediaByType: (mimeType: string, limit = 20) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getMediaByType', () =>
      db.prepare(`
        SELECT * FROM media_files 
        WHERE mime_type LIKE ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(`${mimeType}%`, limit)
    );
  },
  
  // Analytics queries (using date indexes)
  getPageViewsByEdition: (editionId: number, startDate: string, endDate: string) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getPageViewsByEdition', () =>
      db.prepare(`
        SELECT COUNT(*) as views, DATE(created_at) as date
        FROM page_views 
        WHERE edition_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `).all(editionId, startDate, endDate)
    );
  },
  
  getDailyStats: (startDate: string, endDate: string) => {
    const db = OptimizedDatabase.getInstance();
    return monitorQuery('getDailyStats', () =>
      db.prepare(`
        SELECT * FROM daily_stats 
        WHERE date BETWEEN ? AND ?
        ORDER BY date
      `).all(startDate, endDate)
    );
  }
};

// Export the optimized database instance
export const db = OptimizedDatabase.getInstance();
export { OptimizedDatabase };