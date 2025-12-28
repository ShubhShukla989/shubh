/**
 * Test Analytics System
 * Verifies that analytics tables exist and can be written to
 */

const Database = require('better-sqlite3');
const path = require('path');

async function testAnalytics() {
  try {
    // Database path - same as used by the app
    const dbPath = path.join(process.cwd(), 'database', 'epapercms.db');
    const db = new Database(dbPath);

    console.log('🧪 Testing analytics system...');

    // Check if analytics tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('page_views', 'active_sessions', 'daily_stats')
    `).all();

    console.log('📊 Found analytics tables:', tables.map(t => t.name));

    if (tables.length !== 3) {
      console.log('❌ Missing analytics tables. Run: npm run setup:db');
      return;
    }

    // Test inserting a page view
    const testSessionId = `test_${Date.now()}`;
    
    db.prepare(`
      INSERT INTO page_views (
        page_url, user_ip, user_agent, session_id, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      '/test-page',
      '127.0.0.1',
      'Test User Agent',
      testSessionId,
      new Date().toISOString()
    );

    console.log('✅ Successfully inserted test page view');

    // Test inserting active session
    db.prepare(`
      INSERT INTO active_sessions (
        session_id, user_ip, current_page, last_activity, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      testSessionId,
      '127.0.0.1',
      '/test-page',
      new Date().toISOString(),
      new Date().toISOString()
    );

    console.log('✅ Successfully inserted test session');

    // Test daily stats
    const today = new Date().toISOString().split('T')[0];
    
    const existingStats = db.prepare(`
      SELECT * FROM daily_stats WHERE date = ?
    `).get(today);

    if (existingStats) {
      db.prepare(`
        UPDATE daily_stats 
        SET total_views = total_views + 1
        WHERE date = ?
      `).run(today);
      console.log('✅ Updated existing daily stats');
    } else {
      db.prepare(`
        INSERT INTO daily_stats (date, total_views, unique_visitors, created_at)
        VALUES (?, ?, ?, ?)
      `).run(today, 1, 1, new Date().toISOString());
      console.log('✅ Created new daily stats entry');
    }

    // Clean up test data
    db.prepare(`DELETE FROM page_views WHERE session_id = ?`).run(testSessionId);
    db.prepare(`DELETE FROM active_sessions WHERE session_id = ?`).run(testSessionId);
    
    console.log('🧹 Cleaned up test data');

    // Show current stats
    const totalViews = db.prepare(`SELECT COUNT(*) as count FROM page_views`).get();
    const activeSessions = db.prepare(`SELECT COUNT(*) as count FROM active_sessions`).get();
    const dailyEntries = db.prepare(`SELECT COUNT(*) as count FROM daily_stats`).get();

    console.log('\n📈 Current Analytics Data:');
    console.log(`   Total Page Views: ${totalViews.count}`);
    console.log(`   Active Sessions: ${activeSessions.count}`);
    console.log(`   Daily Stats Entries: ${dailyEntries.count}`);

    db.close();
    console.log('\n✅ Analytics system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    process.exit(1);
  }
}

testAnalytics();