import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { page_views, active_sessions, daily_stats } from '@/lib/schema/analytics';
import { sql, gte, eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7';

    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Get active sessions (last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const activeSessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(active_sessions)
      .where(gte(active_sessions.last_activity, thirtyMinutesAgo));

    // Get today's stats
    const todayStats = await db
      .select()
      .from(daily_stats)
      .where(eq(daily_stats.date, todayStr))
      .limit(1);

    // ✅ FIX #3: Calculate actual unique visitors from source (COUNT DISTINCT)
    const todayUniqueVisitors = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT user_id)` 
      })
      .from(page_views)
      .where(gte(page_views.created_at, todayStr + 'T00:00:00.000Z'));

    // Override with correct value
    const todayViews = todayStats[0]?.total_views || 0;
    const todayVisitors = todayUniqueVisitors[0]?.count || 0;

    // Get daily stats for the period
    const dailyData = await db
      .select()
      .from(daily_stats)
      .where(gte(daily_stats.date, startDateStr))
      .orderBy(desc(daily_stats.date))
      .limit(parseInt(period));

    // Get this week's total
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekStats = await db
      .select({ 
        total: sql<number>`sum(total_views)`,
      })
      .from(daily_stats)
      .where(gte(daily_stats.date, weekStart));

    // Calculate week unique visitors from source
    const weekUniqueVisitors = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT user_id)` 
      })
      .from(page_views)
      .where(gte(page_views.created_at, weekStart + 'T00:00:00.000Z'));

    // Get this month's total
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthStats = await db
      .select({ 
        total: sql<number>`sum(total_views)`,
      })
      .from(daily_stats)
      .where(gte(daily_stats.date, monthStart));

    // Calculate month unique visitors from source
    const monthUniqueVisitors = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT user_id)` 
      })
      .from(page_views)
      .where(gte(page_views.created_at, monthStart + 'T00:00:00.000Z'));

    // Prepare chart data (calculate unique visitors for each day from source)
    const chartData = [];
    for (const day of dailyData.reverse()) {
      // Calculate unique visitors for this day from source
      const nextDay = new Date(day.date + 'T00:00:00.000Z');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0] + 'T00:00:00.000Z';

      const dayUniqueVisitors = await db
        .select({ 
          count: sql<number>`COUNT(DISTINCT user_id)` 
        })
        .from(page_views)
        .where(and(
          gte(page_views.created_at, day.date + 'T00:00:00.000Z'),
          sql`${page_views.created_at} < ${nextDayStr}`
        ));

      chartData.push({
        date: day.date,
        views: day.total_views,
        visitors: dayUniqueVisitors[0]?.count || 0,
      });
    }

    // Fill missing days with 0 values
    const filledData = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const existingData = chartData.find(d => d.date === dateStr);
      
      filledData.push({
        date: dateStr,
        views: existingData?.views || 0,
        visitors: existingData?.visitors || 0,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    const response = {
      success: true,
      data: {
        realtime: {
          activeNow: activeSessions[0]?.count || 0,
          todayViews: todayVisitors, // 🔥 CHANGED: Show unique visitors instead of total views
          weekViews: weekUniqueVisitors[0]?.count || 0, // 🔥 CHANGED: Show unique visitors instead of total views
          monthViews: monthUniqueVisitors[0]?.count || 0, // 🔥 CHANGED: Show unique visitors instead of total views
        },
        chart: filledData,
        period: parseInt(period),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}