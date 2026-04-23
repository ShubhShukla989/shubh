import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { page_views, active_sessions, daily_stats } from '@/lib/schema/analytics';
import { eq, and, gte, sql } from 'drizzle-orm';

// 🤖 Known bot signatures (specific, not generic)
const KNOWN_BOTS = [
  // Search engines
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot',
  
  // Social media crawlers
  'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegrambot', 'pinterest',
  
  // SEO tools
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot',
  
  // Monitoring tools
  'uptimerobot', 'pingdom',
];

function isBot(userAgent: string | null): boolean {
  // No user agent = likely bot
  if (!userAgent) return true;
  
  const ua = userAgent.toLowerCase();
  
  // Check against known bots
  return KNOWN_BOTS.some(bot => ua.includes(bot));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      page_url,
      edition_id,
      page_number,
      user_id,
      session_id,
      activity_update = false
    } = body;

    // Validate required fields
    if (!page_url && !activity_update) {
      return NextResponse.json(
        { success: false, error: 'page_url is required' },
        { status: 400 }
      );
    }

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Skip admin routes
    if (page_url && page_url.startsWith('/admin')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // If it's just an activity update, only update session
    if (activity_update && session_id) {
      try {
        await db
          .update(active_sessions)
          .set({ last_activity: new Date().toISOString() })
          .where(eq(active_sessions.session_id, session_id));
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Analytics activity update error:', error);
        // Don't fail the request for activity updates
        return NextResponse.json({ success: true, warning: 'Activity update failed' });
      }
    }

    // Get user info
    const user_ip = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    const user_agent = request.headers.get('user-agent');
    
    // 🤖 BOT DETECTION - Skip if bot
    if (isBot(user_agent)) {
      console.log('🤖 Bot detected, skipping analytics');
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        reason: 'bot_detected'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];

    try {
      // ✅ FIX #1: Session-based duplicate prevention (5-second window)
      // Prevents refresh spam but counts real visits
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      
      const existingView = await db
        .select()
        .from(page_views)
        .where(and(
          eq(page_views.page_url, page_url),
          eq(page_views.session_id, session_id), // Changed: session_id instead of user_id
          gte(page_views.created_at, fiveSecondsAgo) // Changed: 5 seconds instead of whole day
        ))
        .limit(1);

      // Only track if not viewed in last 5 seconds
      if (existingView.length === 0) {
        // Track unique page view
        await db.insert(page_views).values({
          page_url,
          user_ip,
          user_agent: user_agent || '',
          referrer: request.headers.get('referer') || '',
          session_id,
          user_id,
          edition_id: edition_id ? parseInt(edition_id) : null,
          page_number: page_number ? parseInt(page_number) : null,
          created_at: new Date().toISOString(),
        });

        // Update daily stats (total views only)
        const existingStats = await db
          .select()
          .from(daily_stats)
          .where(eq(daily_stats.date, today))
          .limit(1);

        if (existingStats.length > 0) {
          await db
            .update(daily_stats)
            .set({
              total_views: sql`${daily_stats.total_views} + 1`,
            })
            .where(eq(daily_stats.date, today));
        } else {
          await db.insert(daily_stats).values({
            date: today,
            total_views: 1,
            unique_visitors: 0, // Will be calculated from source
            created_at: new Date().toISOString(),
          });
        }
      }

      // Update or create active session
      const existingSession = await db
        .select()
        .from(active_sessions)
        .where(eq(active_sessions.session_id, session_id))
        .limit(1);

      if (existingSession.length > 0) {
        await db
          .update(active_sessions)
          .set({
            current_page: page_url,
            last_activity: new Date().toISOString(),
          })
          .where(eq(active_sessions.session_id, session_id));
      } else {
        await db.insert(active_sessions).values({
          session_id,
          user_ip,
          user_id,
          current_page: page_url,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        // ✅ FIX #2: Don't manually increment unique_visitors
        // It will be calculated from source in dashboard API
      }

      return NextResponse.json({ success: true });

    } catch (dbError) {
      console.error('Analytics database error:', dbError);
      
      // Check if it's a table not found error
      if (dbError instanceof Error && dbError.message.includes('no such table')) {
        console.warn('Analytics tables not found - analytics tracking disabled');
        return NextResponse.json({ 
          success: true, 
          warning: 'Analytics tables not initialized' 
        });
      }
      
      // For other database errors, still return success to not break the app
      return NextResponse.json({ 
        success: true, 
        warning: 'Analytics tracking temporarily unavailable' 
      });
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    await db
      .delete(active_sessions)
      .where(gte(active_sessions.last_activity, thirtyMinutesAgo));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}