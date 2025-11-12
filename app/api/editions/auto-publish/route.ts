import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// This endpoint checks for scheduled editions that should be published
// Call this from a cron job or on page load
export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all scheduled editions where scheduled_date has passed
    const { data: scheduledEditions, error: fetchError } = await supabaseAdmin
      .from('editions')
      .select('id, title, scheduled_date')
      .eq('status', 'scheduled')
      .not('scheduled_date', 'is', null)
      .lte('scheduled_date', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!scheduledEditions || scheduledEditions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No editions to publish',
        count: 0,
      });
    }

    // Update all eligible editions to published
    const { error: updateError } = await supabaseAdmin
      .from('editions')
      .update({ status: 'published' })
      .in('id', scheduledEditions.map(e => e.id));

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: `Published ${scheduledEditions.length} edition(s)`,
      count: scheduledEditions.length,
      editions: scheduledEditions,
    });
  } catch (error) {
    console.error('Auto-publish error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-publish editions' },
      { status: 500 }
    );
  }
}
