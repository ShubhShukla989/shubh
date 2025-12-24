import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { category_watermark_settings } from '@/lib/schema/settings';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing watermark database...');
    
    // Get all watermark settings
    const allSettings = await db.select().from(category_watermark_settings);
    
    console.log('🔍 All watermark settings in database:', allSettings);
    
    return NextResponse.json({
      success: true,
      count: allSettings.length,
      data: allSettings
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}