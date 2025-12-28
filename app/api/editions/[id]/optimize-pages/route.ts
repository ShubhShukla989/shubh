import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { optimizeImages, newspaperPresets, formatFileSize } from '@/lib/image-optimization';
import { readdir, stat, rename } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/editions/[id]/optimize-pages
 * 
 * Optimizes extracted page images to reduce file size while maintaining quality
 * Perfect for newspapers - can reduce file size by 60-80%
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const body = await request.json();
    
    // Optimization settings
    const preset = body.preset || 'balanced'; // highQuality, balanced, compressed, thumbnail
    const customOptions = body.options || {};
    
    console.log('🎯 Starting page optimization for edition', editionId);
    console.log('⚙️ Using preset:', preset);

    // Get edition pages
    const pages = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.edition_id, editionId))
      .orderBy(edition_pages.page_number);

    if (!pages.length) {
      return NextResponse.json(
        { success: false, error: 'No pages found for this edition' },
        { status: 404 }
      );
    }

    console.log('📄 Found', pages.length, 'pages to optimize');

    // Get optimization options
    const options = customOptions.quality ? customOptions : newspaperPresets[preset as keyof typeof newspaperPresets];
    
    if (!options) {
      return NextResponse.json(
        { success: false, error: 'Invalid preset. Use: highQuality, balanced, compressed, or thumbnail' },
        { status: 400 }
      );
    }

    // Collect image paths
    const imagePaths: string[] = [];
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    for (const page of pages) {
      const imagePath = join(process.cwd(), 'public', page.image_url);
      imagePaths.push(imagePath);
    }

    // Get original file sizes
    let totalOriginalSize = 0;
    const originalSizes: { [key: string]: number } = {};
    
    for (let i = 0; i < imagePaths.length; i++) {
      try {
        const stats = await stat(imagePaths[i]);
        originalSizes[imagePaths[i]] = stats.size;
        totalOriginalSize += stats.size;
      } catch (error) {
        console.warn(`Could not get size for ${imagePaths[i]}`);
      }
    }

    console.log('📊 Total original size:', formatFileSize(totalOriginalSize));

    // Optimize images
    console.log('🔄 Starting optimization...');
    const optimizationResult = await optimizeImages(imagePaths, options);

    // Replace original files with optimized versions
    let successCount = 0;
    let totalOptimizedSize = 0;
    const results = [];

    for (const result of optimizationResult.results) {
      if (result.error) {
        console.error('❌ Failed to optimize:', result.path, result.error);
        results.push({
          page: result.path,
          status: 'failed',
          error: result.error
        });
        continue;
      }

      try {
        // Replace original with optimized version
        const originalPath = result.path;
        const optimizedPath = originalPath.replace(/\.(png|jpg|jpeg)$/i, `_optimized.${options.format || 'jpg'}`);
        
        // Rename optimized file to replace original
        const finalPath = originalPath.replace(/\.(png|jpg|jpeg)$/i, `.${options.format || 'jpg'}`);
        await rename(optimizedPath, finalPath);
        
        // Update database if format changed
        if (options.format && !originalPath.toLowerCase().endsWith(`.${options.format}`)) {
          const pageNumber = parseInt(originalPath.match(/page-(\d+)/)?.[1] || '0');
          const newImageUrl = pages.find(p => p.page_number === pageNumber)?.image_url.replace(/\.(png|jpg|jpeg)$/i, `.${options.format}`);
          
          if (newImageUrl) {
            await db
              .update(edition_pages)
              .set({ image_url: newImageUrl })
              .where(
                and(
                  eq(edition_pages.edition_id, editionId),
                  eq(edition_pages.page_number, pageNumber)
                )
              );
          }
        }

        totalOptimizedSize += result.optimizedSize;
        successCount++;

        results.push({
          page: `Page ${originalPath.match(/page-(\d+)/)?.[1] || 'Unknown'}`,
          status: 'optimized',
          originalSize: formatFileSize(result.originalSize),
          optimizedSize: formatFileSize(result.optimizedSize),
          savings: `${result.savings}%`
        });

        console.log(`✅ Optimized page ${originalPath.match(/page-(\d+)/)?.[1]}: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.optimizedSize)} (${result.savings}% savings)`);

      } catch (error) {
        console.error('❌ Failed to replace file:', error);
        results.push({
          page: result.path,
          status: 'failed',
          error: 'Failed to replace original file'
        });
      }
    }

    const totalSavings = totalOriginalSize > 0 ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100 : 0;

    console.log('🎉 Optimization complete!');
    console.log('📊 Total savings:', Math.round(totalSavings) + '%');
    console.log('📄 Successfully optimized:', successCount, 'out of', pages.length, 'pages');

    return NextResponse.json({
      success: true,
      message: `Successfully optimized ${successCount} out of ${pages.length} pages`,
      data: {
        preset,
        options,
        totalPages: pages.length,
        optimizedPages: successCount,
        originalSize: formatFileSize(totalOriginalSize),
        optimizedSize: formatFileSize(totalOptimizedSize),
        totalSavings: Math.round(totalSavings) + '%',
        results
      }
    });

  } catch (error: any) {
    console.error('💥 Page optimization failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to optimize pages',
        details: error.message
      },
      { status: 500 }
    );
  }
}