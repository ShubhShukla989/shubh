import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Check current records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('media_files')
      .select('id, filename, created_at')
      .order('id', { ascending: false })
      .limit(5);

    results.checks.currentRecords = {
      success: !recordsError,
      error: recordsError?.message,
      count: records?.length || 0,
      records: records || []
    };

    // 2. Try a test insert
    const testData = {
      filename: `test-${Date.now()}.jpg`,
      original_name: 'test-debug.jpg',
      file_path: `media/test-${Date.now()}.jpg`,
      file_url: `https://test.com/test-${Date.now()}.jpg`,
      file_size: 12345,
      mime_type: 'image/jpeg',
      title: 'Test Insert',
      alt_text: 'Test Alt'
    };

    console.log('🧪 Attempting test insert:', testData);

    const { data: insertedRecord, error: insertError } = await supabaseAdmin
      .from('media_files')
      .insert(testData)
      .select()
      .single();

    results.checks.testInsert = {
      success: !insertError && !!insertedRecord,
      error: insertError ? {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      } : null,
      insertedId: insertedRecord?.id,
      insertedRecord: insertedRecord
    };

    console.log('🧪 Test insert result:', results.checks.testInsert);

    // 3. If insert succeeded, delete it
    if (insertedRecord?.id) {
      await supabaseAdmin
        .from('media_files')
        .delete()
        .eq('id', insertedRecord.id);
      
      results.checks.testInsert.cleaned = true;
    }

    // 4. Check table info
    let tableInfo = null;
    let tableError = null;
    try {
      const result = await supabaseAdmin
        .rpc('get_table_info', { table_name: 'media_files' });
      tableInfo = result.data;
      tableError = result.error;
    } catch (err) {
      tableError = { message: 'RPC not available' };
    }

    results.checks.tableInfo = {
      available: !tableError,
      error: tableError?.message,
      info: tableInfo
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        message: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
