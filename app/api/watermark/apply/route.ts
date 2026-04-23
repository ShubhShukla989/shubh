import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { db } from '@/lib/db';
import { area_map_watermark_settings, category_watermark_settings, editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { replaceTemplatePlaceholders, WatermarkContext } from '@/lib/watermark';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, editionId, position = 'bottom_right', pageNumber, totalPages } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get edition details for watermark context
    let edition = null;
    if (editionId) {
      const [editionData] = await db
        .select()
        .from(editions)
        .where(eq(editions.id, parseInt(editionId)))
        .limit(1);
      edition = editionData;
    }

    // Get watermark settings
    let watermarkSettings = null;
    
    // First get global settings
    const [globalSettings] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

    if (globalSettings && globalSettings.enable_watermarking) {
      watermarkSettings = globalSettings;

      // Check for category-specific settings if edition has category
      if (edition && edition.category_id) {
        const [categorySettings] = await db
          .select()
          .from(category_watermark_settings)
          .where(eq(category_watermark_settings.category_id, edition.category_id))
          .limit(1);

        if (categorySettings && categorySettings.override_global_settings) {
          watermarkSettings = categorySettings;
        }
      }
    }

    if (!watermarkSettings || !watermarkSettings.enable_watermarking || !watermarkSettings.logo_url) {
      return NextResponse.json({
        success: true,
        imageUrl: imageUrl // Return original image if no watermark
      });
    }

    // Load the main image
    const image = await loadImage(imageUrl);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw the main image
    ctx.drawImage(image, 0, 0);

    // Load watermark logo
    try {
      const watermarkLogo = await loadImage(watermarkSettings.logo_url);
      
      // Calculate logo size (30% of image height)
      const logoHeight = Math.floor(image.height * 0.30);
      const logoAspectRatio = watermarkLogo.width / watermarkLogo.height;
      const logoWidth = Math.floor(logoHeight * logoAspectRatio);

      // Calculate position
      let logoX = 10;
      let logoY = 10;
      
      switch (position || watermarkSettings.position) {
        case 'top_left':
          logoX = 10;
          logoY = 10;
          break;
        case 'top_center':
          logoX = (image.width - logoWidth) / 2;
          logoY = 10;
          break;
        case 'top_right':
          logoX = image.width - logoWidth - 10;
          logoY = 10;
          break;
        case 'center_left':
          logoX = 10;
          logoY = (image.height - logoHeight) / 2;
          break;
        case 'center':
          logoX = (image.width - logoWidth) / 2;
          logoY = (image.height - logoHeight) / 2;
          break;
        case 'center_right':
          logoX = image.width - logoWidth - 10;
          logoY = (image.height - logoHeight) / 2;
          break;
        case 'bottom_left':
          logoX = 10;
          logoY = image.height - logoHeight - 10;
          break;
        case 'bottom_center':
          logoX = (image.width - logoWidth) / 2;
          logoY = image.height - logoHeight - 10;
          break;
        case 'bottom_right':
        default:
          logoX = image.width - logoWidth - 10;
          logoY = image.height - logoHeight - 10;
          break;
      }

      // Set opacity
      ctx.globalAlpha = (watermarkSettings.opacity || 100) / 100;

      // Draw background if enabled
      if (watermarkSettings.enable_border || watermarkSettings.background_color !== 'transparent') {
        const padding = 8;
        const textHeight = watermarkSettings.info_text ? 40 : 0; // Estimate text height
        
        ctx.fillStyle = watermarkSettings.background_color || '#ffffff';
        ctx.fillRect(
          logoX - padding, 
          logoY - padding, 
          logoWidth + (padding * 2), 
          logoHeight + textHeight + (padding * 2)
        );

        if (watermarkSettings.enable_border) {
          ctx.strokeStyle = watermarkSettings.border_color || '#000000';
          ctx.lineWidth = watermarkSettings.border_width || 2;
          ctx.strokeRect(
            logoX - padding, 
            logoY - padding, 
            logoWidth + (padding * 2), 
            logoHeight + textHeight + (padding * 2)
          );
        }
      }

      // Draw logo
      ctx.drawImage(watermarkLogo, logoX, logoY, logoWidth, logoHeight);

      // Draw info text if present (multi-line and responsive)
      if (watermarkSettings.info_text) {
        // Create watermark context for template replacement
        const watermarkContext: WatermarkContext = {
          edition_title: edition?.title || 'Edition',
          date: edition?.date ? new Date(edition.date).toLocaleDateString() : new Date().toLocaleDateString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          page_number: pageNumber || 1,
          total_pages: totalPages || 1
        };

        // Replace template placeholders in info text
        const processedInfoText = replaceTemplatePlaceholders(watermarkSettings.info_text, watermarkContext);
        
        const textY = logoY + logoHeight + 20;
        const maxTextWidth = logoWidth;
        const fontSize = Math.max(12, Math.floor(logoHeight * 0.08)); // Responsive font size
        
        ctx.fillStyle = watermarkSettings.foreground_color || '#000000';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';

        // Handle newlines in processed text
        const textLines = processedInfoText.split('\n');
        const allLines = [];

        // Process each line for word wrapping
        for (const textLine of textLines) {
          const words = textLine.split(' ');
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxTextWidth && currentLine) {
              allLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            allLines.push(currentLine);
          }
        }

        // Draw each line
        allLines.forEach((line, index) => {
          ctx.fillText(
            line,
            logoX + logoWidth / 2,
            textY + (index * (fontSize + 4))
          );
        });
      }

      // Reset alpha
      ctx.globalAlpha = 1.0;

    } catch (logoError) {
      console.error('Failed to load watermark logo:', logoError);
      return NextResponse.json(
        { success: false, error: 'Failed to load watermark logo' },
        { status: 500 }
      );
    }

    // Convert to buffer and return as data URL
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to apply watermark' },
      { status: 500 }
    );
  }
}