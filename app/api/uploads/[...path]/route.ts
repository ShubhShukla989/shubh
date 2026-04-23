import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { getPublicDir, getUploadsDir } from '@/lib/paths';

/**
 * Dynamic file serving with intelligent fallback
 * Handles missing files by searching multiple locations
 * NOTE: Uses lib/paths.ts to resolve correct public dir in standalone mode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const publicDir = getPublicDir();
    const uploadsDir = getUploadsDir();
    
    // List of possible file locations to try
    const possiblePaths = [
      join(uploadsDir, filePath), // Original path
      join(uploadsDir, 'page-assets', filePath), // Page assets
      join(uploadsDir, 'editions', filePath), // Editions folder
      join(publicDir, filePath), // Direct public path
    ];
    
    // Try different file extensions if original doesn't exist
    const filename = filePath.split('/').pop() || '';
    const baseName = filename.split('.')[0];
    const extensions = ['jpg', 'jpeg', 'png', 'pdf'];
    
    // Add extension variations to possible paths
    for (const ext of extensions) {
      const testFilename = `${baseName}.${ext}`;
      possiblePaths.push(
        join(publicDir, 'uploads', testFilename),
        join(publicDir, 'uploads', 'page-assets', testFilename),
        join(publicDir, 'uploads', 'editions', testFilename)
      );
    }
    
    // Find the first existing file
    let foundPath: string | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        foundPath = path;
        break;
      }
    }
    
    if (!foundPath) {
      return NextResponse.json(
        { error: 'File not found', path: filePath },
        { status: 404 }
      );
    }
    
    // Read and serve the file
    const fileBuffer = await readFile(foundPath);
    const stats = await stat(foundPath);
    
    // Determine content type
    const ext = foundPath.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }[ext || ''] || 'application/octet-stream';
    
    // Set appropriate headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
      'Last-Modified': stats.mtime.toUTCString(),
    });
    
    return new NextResponse(fileBuffer, { headers });
    
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}