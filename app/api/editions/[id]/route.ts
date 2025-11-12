import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('editions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edition' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Validate and normalize status if present
    if (body.status) {
      const normalizedStatus = body.status.toLowerCase();
      const validStatuses = ['draft', 'processing', 'published', 'scheduled'];
      
      if (!validStatuses.includes(normalizedStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      
      body.status = normalizedStatus;
    }

    // Handle scheduled_date - allow null to clear it
    if ('scheduled_date' in body) {
      if (body.scheduled_date === null || body.scheduled_date === '') {
        body.scheduled_date = null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('editions')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update edition' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin
      .from('editions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Edition deleted successfully',
    });
  } catch (error) {
    console.error('Delete edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete edition' },
      { status: 500 }
    );
  }
}
