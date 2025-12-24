import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { page_views, active_sessions, daily_stats } from '@/lib/schema/analytics';
import { eq, and, gte } from 'drizzle-orm';

/**
 * POST /api/analytics/track
 * Track page views and user sessions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      page_url,
      edition_id,
      page_number,
      session_id,
      view_duration = 0
    } = body;

    // Get user info from request
    const user_ip = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    const user_agent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    // Track page view
    await db.insert(page_views).values({
      page_url,
      user_ip,
      user_agent,
      referrer,
      session_id,
      edition_id: edition_id ? parseInt(edition_id) : null,
      page_number: page_number ? parseInt(page_number) : null,
      view_duration,
      created_at: new Date().toISOString(),
    });

    // Update or create active session
    const existingSession = await db
      .select()
      .from(active_sessions)
      .where(eq(active_sessions.session_id, session_id))
      .limit(1);

    if (existingSession.length > 0) {
      // Update existing session
      await db
        .update(active_sessions)
        .set({
          current_page: page_url,
          last_activity: new Date().toISOString(),
        })
        .where(eq(active_sessions.session_id, session_id));
    } else {
      // Create new session
      await db.insert(active_sessions).values({
        session_id,
        user_ip,
        current_page: page_url,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const existingStats = await db
      .select()
      .from(daily_stats)
      .where(eq(daily_stats.date, today))
      .limit(1);

    if (existingStats.length > 0) {
      // Update existing stats
      const currentStats = existingStats[0];
      if (currentStats) {
        await db
          .update(daily_stats)
          .set({
            total_views: (currentStats.total_views || 0) + 1,
          })
          .where(eq(daily_stats.date, today));
      }
    } else {
      // Create new daily stats
      await db.insert(daily_stats).values({
        date: today,
        total_views: 1,
        unique_visitors: 1,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/track
 * Clean up old sessions (inactive for more than 30 minutes)
 */
export async function DELETE() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    await db
      .delete(active_sessions)
      .where(gte(active_sessions.last_activity, thirtyMinutesAgo));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}