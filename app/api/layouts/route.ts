import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layouts } from '@/lib/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await db
      .select()
      .from(layouts)
      .orderBy(asc(layouts.name));

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
