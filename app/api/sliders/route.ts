import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/sliders
 * Fetch all sliders with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('sliders')
      .select('*, slides(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching sliders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sliders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sliders: data,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/sliders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sliders
 * Create a new slider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, alias, description, status, config } = body;

    // Validate required fields
    if (!title || !alias) {
      return NextResponse.json(
        { error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    // Check if alias already exists (skip error if table doesn't exist yet)
    const { data: existing, error: checkError } = await supabase
      .from('sliders')
      .select('id')
      .eq('alias', alias)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing slider:', checkError);
      return NextResponse.json(
        { error: 'Database error: ' + checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'A slider with this alias already exists' },
        { status: 400 }
      );
    }

    // Create slider
    const { data, error } = await supabase
      .from('sliders')
      .insert([
        {
          title,
          alias,
          description,
          status: status || 'Active',
          config: config || {},
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating slider:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create slider', 
          details: error.message,
          hint: error.hint || 'Make sure the sliders table exists in your database'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sliders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
