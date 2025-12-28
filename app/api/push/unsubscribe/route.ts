import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    // Here you would typically remove the subscription from your database
    console.log('Push unsubscription received:', subscription);
    
    // In a real implementation, you would:
    // 1. Find the subscription in your database
    // 2. Remove it from the database
    // 3. Clean up any associated data
    
    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}