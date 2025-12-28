import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { active_sessions } from '@/lib/schema/analytics';
import { lt } from 'drizzle-orm';

/**
 * POST /api/analytics/cleanup
 * Clean up old sessions (inactive for more than 30 minutes)
 */
export async function POST() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const result = await db
      .delete(active_sessions)
      .where(lt(active_sessions.last_activity, thirtyMinutesAgo));

    return NextResponse.json({ 
      success: true, 
      message: 'Old sessions cleaned up successfully'
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}