import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, tag } = body;
    
    if (!path && !tag) {
      return NextResponse.json(
        { success: false, error: 'Path or tag is required' },
        { status: 400 }
      );
    }

    // Revalidate by path or tag
    if (path) {
      revalidatePath(path);
    }
    
    if (tag) {
      revalidateTag(tag);
    }
    
    return NextResponse.json({
      success: true,
      message: path 
        ? `Path ${path} revalidated successfully` 
        : `Tag ${tag} revalidated successfully`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Revalidation failed' },
      { status: 500 }
    );
  }
}
