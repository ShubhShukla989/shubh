/**
 * Analytics Cleanup Script
 * Cleans up old analytics data and sessions
 */

const Database = require('better-sqlite3');
const path = require('path');

async function cleanupAnalytics() {
  try {
    // Database path - same as used by the app
    const dbPath = path.join(process.cwd(), 'database', 'epapercms.db');
    const db = new Database(dbPath);

    console.log('🧹 Starting analytics cleanup...');

    // Clean up sessions older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const sessionsDeleted = db.prepare(`
      DELETE FROM active_sessions 
      WHERE last_activity < ?
    `).run(thirtyMinutesAgo);

    console.log(`✅ Cleaned up ${sessionsDeleted.changes} old sessions`);

    // Clean up page views older than 90 days (optional)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const viewsDeleted = db.prepare(`
      DELETE FROM page_views 
      WHERE created_at < ?
    `).run(ninetyDaysAgo);

    console.log(`✅ Cleaned up ${viewsDeleted.changes} old page views (90+ days)`);

    // Update daily stats for unique visitors
    const today = new Date().toISOString().split('T')[0];
    
    // Count unique sessions for today
    const uniqueVisitors = db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM page_views 
      WHERE DATE(created_at) = ?
    `).get(today);

    // Update daily stats
    db.prepare(`
      UPDATE daily_stats 
      SET unique_visitors = ?
      WHERE date = ?
    `).run(uniqueVisitors.count, today);

    console.log(`✅ Updated unique visitors count: ${uniqueVisitors.count}`);

    db.close();
    console.log('✅ Analytics cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during analytics cleanup:', error);
    process.exit(1);
  }
}

cleanupAnalytics();