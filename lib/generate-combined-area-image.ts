/**
 * Server-side utility to generate combined area map images
 * Used when areas are linked together
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { area_maps, edition_pages, editions } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { getWatermarkSettings } from '@/lib/watermark-helper';

/**
 * Generate combined image for a group of linked area maps
 */
export async function generateCombinedAreaImage(
  areaIds: number[],
  groupId: string
): Promise<string | null> {
  try {
    // Fetch all area maps
    const areas = await db
      .select()
      .from(area_maps)
      .where(inArray(area_maps.id, areaIds));

    if (areas.length === 0) {
      return null;
    }

    // TASK 6: Batch-fetch all pages in a single query instead of N+1 loop
    const pageIds = [...new Set(areas.map(a => a.page_id).filter(Boolean))] as number[];
    const pages = await db
      .select()
      .from(edition_pages)
      .where(inArray(edition_pages.id, pageIds));
    const pageMap = new Map(pages.map(p => [p.id, p]));

    const areasWithPages: Array<{ area: any; page: any }> = [];
    for (const area of areas) {
      const page = pageMap.get(area.page_id);
      if (page) {
        areasWithPages.push({ area, page });
      }
    }

    // Sort by page number
    areasWithPages.sort((a, b) => a.page.page_number - b.page.page_number);

    // Get edition for watermark context
    const [edition] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, areas[0].edition_id!))
      .limit(1);

    // Get watermark settings
    const settings = await getWatermarkSettings(edition?.category_id ?? undefined);

    if (!settings || !settings.enable_watermarking) {
      return null;
    }

    // Load and crop all area images
    const publicPath = path.join(process.cwd(), 'public');
    const croppedBuffers: Buffer[] = [];
    let maxWidth = 0;
    let totalHeight = 0;
    const spacing = 20;

    for (const { area, page } of areasWithPages) {
      const imagePath = page.image_url.startsWith('/') 
        ? path.join(publicPath, page.image_url)
        : path.join(publicPath, '/', page.image_url);

      const imageBuffer = await fs.readFile(imagePath);

      // Crop the area - Round coordinates to integers for sharp
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: Math.max(0, Math.round(area.x)),
          top: Math.max(0, Math.round(area.y)),
          width: Math.round(area.width),
          height: Math.round(area.height)
        })
        .toBuffer();

      croppedBuffers.push(croppedBuffer);
      maxWidth = Math.max(maxWidth, Math.round(area.width));
      totalHeight += Math.round(area.height) + spacing;
    }

    totalHeight -= spacing; // Remove last spacing

    // Create canvas for combined image
    const canvas = sharp({
      create: {
        width: maxWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // TASK 7: Read all metadata in parallel instead of sequential loop
    const allMetadata = await Promise.all(croppedBuffers.map(buf => sharp(buf).metadata()));

    const composites = [];
    let currentY = 0;

    for (let i = 0; i < croppedBuffers.length; i++) {
      const metadata = allMetadata[i];
      const x = Math.floor((maxWidth - (metadata.width || 0)) / 2); // Center horizontally

      composites.push({
        input: croppedBuffers[i],
        top: currentY,
        left: x
      });

      currentY += (metadata.height || 0) + spacing;
    }

    const combinedBuffer = await canvas.composite(composites).png().toBuffer();

    // Get combined image dimensions
    const combinedMetadata = await sharp(combinedBuffer).metadata();
    const combinedWidth = combinedMetadata.width || maxWidth;
    const combinedHeight = combinedMetadata.height || totalHeight;

    // ========================================
    // APPLY WATERMARK (COPIED FROM SINGLE AREA LOGIC)
    // ========================================
    
    // Calculate watermark section dimensions
    let logoHeight = 0;
    let logoBuffer: Buffer | null = null;

    // TASK 8: Remove silent catch — logo load failure propagates as an error
    if (settings.logo_url) {
      const logoPath = path.join(process.cwd(), 'public', settings.logo_url);
      const logoFileBuffer = await fs.readFile(logoPath);
      const logoImage = sharp(logoFileBuffer);
      const logoMetadata = await logoImage.metadata();

      if (logoMetadata.width && logoMetadata.height) {
        // Use 60% of area width for logo
        const logoWidth = Math.floor(combinedWidth * 0.6);
        logoHeight = Math.floor((logoMetadata.height / logoMetadata.width) * logoWidth);

        // Resize logo
        logoBuffer = await logoImage
          .resize(logoWidth, logoHeight)
          .png()
          .toBuffer();
      }
    }

    // Process template placeholders in info text
    const processedInfoText = settings.info_text 
      ? settings.info_text
          .replace(/\{edition_title\}/g, edition?.title || '')
          .replace(/\{page_title\}/g, edition?.title || '')
          .replace(/\{date\}/g, edition?.date ? new Date(edition.date).toLocaleDateString('en-GB') : '')
          .replace(/\{url\}/g, `${process.env.NEXT_PUBLIC_SITE_URL || ''}/epaper/area-map/${areas[0].id}`)
          .replace(/\{page_number\}/g, areasWithPages[0].page.page_number?.toString() || '')
          .replace(/\{newline\}/g, '\n')
      : '';

    // Calculate text dimensions
    const textLines = processedInfoText.split('\n').filter(l => l.trim());
    const fontSize = 16;
    const lineHeight = Math.ceil(fontSize * 1.4);
    const textHeight = textLines.length > 0 ? textLines.length * lineHeight + 20 : 0;

    // Calculate total watermark section height
    const watermarkPadding = 20;
    const watermarkHeight = logoHeight + textHeight + watermarkPadding;
    const gap = 10;
    const totalHeightWithWatermark = combinedHeight + watermarkHeight + gap;

    // Create watermark background
    const watermarkBg = await sharp({
      create: {
        width: combinedWidth,
        height: watermarkHeight,
        channels: 4,
        background: settings.background_color || '#f3f4f6'
      }
    })
      .png()
      .toBuffer();

    // Create text SVG if there's text
    let textBuffer: Buffer | null = null;
    if (textLines.length > 0) {
      const textWidth = combinedWidth - 40; // Leave margins
      const svgText = `
        <svg width="${textWidth}" height="${textHeight}">
          ${textLines.map((line, index) => `
            <text x="${textWidth / 2}" y="${20 + index * lineHeight}" 
                  text-anchor="middle" 
                  font-family="Arial, sans-serif" 
                  font-size="${fontSize}" 
                  fill="${settings.foreground_color || '#000000'}">
              ${line.trim()}
            </text>
          `).join('')}
        </svg>
      `;
      textBuffer = Buffer.from(svgText);
    }

    // Composite layers
    const watermarkCompositeArray: any[] = [];
    const isTopPosition = settings.position?.includes('top');

    if (isTopPosition) {
      // Watermark at top
      watermarkCompositeArray.push({ input: watermarkBg, top: 0, left: 0 });
      watermarkCompositeArray.push({ input: combinedBuffer, top: watermarkHeight + gap, left: 0 });

      // Add logo if available
      if (logoBuffer) {
        const logoWidth = Math.floor(combinedWidth * 0.6);
        const logoX = Math.floor((combinedWidth - logoWidth) / 2);
        watermarkCompositeArray.push({ input: logoBuffer, top: 10, left: logoX });
      }

      // Add text if available
      if (textBuffer) {
        const textX = 20;
        const textY = logoHeight + 10;
        watermarkCompositeArray.push({ input: textBuffer, top: textY, left: textX });
      }
    } else {
      // Watermark at bottom
      watermarkCompositeArray.push({ input: combinedBuffer, top: 0, left: 0 });
      watermarkCompositeArray.push({ input: watermarkBg, top: combinedHeight + gap, left: 0 });

      // Add logo if available
      if (logoBuffer) {
        const logoWidth = Math.floor(combinedWidth * 0.6);
        const logoX = Math.floor((combinedWidth - logoWidth) / 2);
        const logoY = combinedHeight + gap + 10;
        watermarkCompositeArray.push({ input: logoBuffer, top: logoY, left: logoX });
      }

      // Add text if available
      if (textBuffer) {
        const textX = 20;
        const textY = combinedHeight + gap + logoHeight + 10;
        watermarkCompositeArray.push({ input: textBuffer, top: textY, left: textX });
      }
    }

    // Create final watermarked image
    const watermarkedBuffer = await sharp({
      create: {
        width: combinedWidth,
        height: totalHeightWithWatermark,
        channels: 4,
        background: '#ffffff'
      }
    })
      .composite(watermarkCompositeArray)
      .png({ quality: 95 })
      .toBuffer();

    // Save combined image
    const combinedDir = path.join(publicPath, 'uploads', 'area-maps', 'combined');
    await fs.mkdir(combinedDir, { recursive: true });

    const filename = `group-${groupId}.png`;
    const filepath = path.join(combinedDir, filename);
    await fs.writeFile(filepath, watermarkedBuffer);

    const combinedUrl = `/uploads/area-maps/combined/${filename}`;

    return combinedUrl;

  } catch (error) {
    return null;
  }
}

/**
 * Generate group ID from area IDs
 */
export function generateGroupId(areaIds: number[]): string {
  return areaIds.sort((a, b) => a - b).join('-');
}

/**
 * Update area maps with group ID and combined image URL
 * TASK 9: Removed silent catch — errors propagate naturally
 * TASK 10: Parallel updates instead of sequential loop
 */
export async function updateAreaMapsWithGroup(
  areaIds: number[],
  groupId: string,
  combinedImageUrl: string,
  watermarkVersion?: string | null
): Promise<void> {
  await Promise.all(
    areaIds.map(id =>
      db
        .update(area_maps)
        .set({
          group_id: groupId,
          combined_image_url: combinedImageUrl,
          watermark_version: watermarkVersion ?? null,
          updated_at: new Date().toISOString()
        })
        .where(eq(area_maps.id, id))
    )
  );
}
