import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { page_views, active_sessions, daily_stats } from '@/lib/schema/analytics';
import { sql, gte, eq, desc } from 'drizzle-orm';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/dashboard
 * Get analytics data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7'; // days

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
        visitors: sql<number>`sum(unique_visitors)`
      })
      .from(daily_stats)
      .where(gte(daily_stats.date, weekStart));

    // Get this month's total
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthStats = await db
      .select({ 
        total: sql<number>`sum(total_views)`,
        visitors: sql<number>`sum(unique_visitors)`
      })
      .from(daily_stats)
      .where(gte(daily_stats.date, monthStart));

    // Prepare chart data
    const chartData = dailyData.reverse().map(day => ({
      date: day.date,
      views: day.total_views,
      visitors: day.unique_visitors,
    }));

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
          todayViews: todayStats[0]?.total_views || 0,
          weekViews: weekStats[0]?.total || 0,
          monthViews: monthStats[0]?.total || 0,
        },
        chart: filledData,
        period: parseInt(period),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}