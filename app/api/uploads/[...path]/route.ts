import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { stat } from 'fs/promises';

/**
 * Dynamic file serving with fallback logic
 * Handles cases where files might be in different locations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const filename = params.path[params.path.length - 1];
    
    // Try original path first
    const originalPath = join(process.cwd(), 'public', 'uploads', filePath);
    
    if (existsSync(originalPath)) {
      return serveFile(originalPath);
    }
    
    // FALLBACK 1: Try direct uploads folder
    const directPath = join(process.cwd(), 'public', 'uploads', filename);
    if (existsSync(directPath)) {
      return serveFile(directPath);
    }
    
    // FALLBACK 2: Try page-assets subfolder
    const pageAssetsPath = join(process.cwd(), 'public', 'uploads', 'page-assets', filename);
    if (existsSync(pageAssetsPath)) {
      return serveFile(pageAssetsPath);
    }
    
    // FALLBACK 3: Try editions subfolder
    const editionsPath = join(process.cwd(), 'public', 'uploads', 'editions', filename);
    if (existsSync(editionsPath)) {
      return serveFile(editionsPath);
    }
    
    // File not found anywhere
    return NextResponse.json(
      { error: 'File not found', path: filePath },
      { status: 404 }
    );
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}

async function serveFile(filePath: string) {
  try {
    const stats = await stat(filePath);
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    
    // Determine content type
    let contentType = 'application/octet-stream';
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }
    
    // Read file synchronously for API route
    const fileBuffer = readFileSync(filePath);
    
    // Create response with proper headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=7776000',
        'X-Accel-Expires': '2592000', // Nginx cache for 1 month
      },
    });
    
    return response;
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to serve file', details: error.message },
      { status: 500 }
    );
  }
}