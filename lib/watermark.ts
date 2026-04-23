import { removeDBDLogo } from './remove-logo';

export interface WatermarkSettings {
  enable_watermarking: boolean;
  logo_url: string;
  opacity: number;
  mode: 'in_outerside' | 'in_inside';
  position: 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
  min_width_px: number;
  background_color: string;
  foreground_color: string;
  enable_border: boolean;
  border_width: number;
  border_color: string;
  info_text: string;
  info_text_font: 'English' | 'Hindi' | 'Gujarati';
  enable_center_watermark: boolean;
  center_watermark_url: string;
  center_watermark_opacity: number;
}

export interface WatermarkContext {
  edition_title?: string;
  date?: string;
  url?: string;
  page_number?: number;
  total_pages?: number;
}

/**
 * Replace template placeholders in text
 */
export function replaceTemplatePlaceholders(text: string, context: WatermarkContext): string {
  let result = text;
  
  // Replace newline placeholder
  result = result.replace(/\{newline\}/g, '\n');
  
  if (context.edition_title) {
    result = result.replace(/\{edition_title\}/g, context.edition_title);
    result = result.replace(/\{page_title\}/g, context.edition_title); // Alias
  }
  if (context.date) {
    result = result.replace(/\{date\}/g, context.date);
  }
  if (context.url) {
    result = result.replace(/\{url\}/g, context.url);
  }
  if (context.page_number) {
    result = result.replace(/\{page_number\}/g, context.page_number.toString());
  }
  if (context.total_pages) {
    result = result.replace(/\{pages\}/g, context.total_pages.toString());
    result = result.replace(/\{total_pages\}/g, context.total_pages.toString()); // Alias
  }
  
  return result;
}

/**
 * Apply watermark to image - SIMPLIFIED HTML OVERLAY APPROACH
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  settings: WatermarkSettings,
  context: WatermarkContext = {},
  removeDBDLogoFirst: boolean = true
): Promise<Buffer> {
  try {
    // Dynamic import of sharp to avoid build issues
    const sharp = (await import('sharp')).default;
    
    // Step 1: Remove DBD logo if requested
    let processedBuffer = imageBuffer;
    if (removeDBDLogoFirst) {
      processedBuffer = await removeDBDLogo(imageBuffer);
    }

    // Step 2: If watermarking is disabled, return processed image
    if (!settings.enable_watermarking) {
      return processedBuffer;
    }

    // Get image metadata from processed buffer
    const image = sharp(processedBuffer);
    const metadata = await image.metadata();
    const imageWidth = metadata.width || 800;
    const imageHeight = metadata.height || 600;

    // Create composite array for overlays
    const composites: any[] = [];

    // SIMPLIFIED APPROACH: Only add category logo (REPLACE Aadhaar logo position - top center)
    if (settings.logo_url) {
      try {
        // Make logo bigger - 50% of image width, min 120px, max 600px
        const logoMaxWidth = Math.min(600, Math.max(120, Math.floor(imageWidth * 0.5)));
        const categoryLogo = await sharp(settings.logo_url)
          .resize({ width: logoMaxWidth, fit: 'inside' })
          .toBuffer();

        const logoMetadata = await sharp(categoryLogo).metadata();
        const logoWidth = logoMetadata.width || 0;
        const logoHeight = logoMetadata.height || 0;
        
        // Position: TOP CENTER (where Aadhaar logo is) - centered horizontally
        const logoX = Math.floor((imageWidth - logoWidth) / 2); // Center horizontally
        const logoY = Math.floor(imageHeight * 0.02); // 2% from top (slight margin)

        // Apply opacity if specified
        const logoWithOpacity = await sharp(categoryLogo)
          .composite([{
            input: Buffer.from([255, 255, 255, Math.floor(255 * (settings.opacity / 100))]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'dest-in'
          }])
          .toBuffer();

        composites.push({
          input: logoWithOpacity,
          top: logoY,
          left: logoX
        });
      } catch (error) {
        console.error('[watermark] Failed to load or apply logo:', error);
        throw error;
      }
    }

    // Add text watermark if info_text is provided and mode is in_outerside
    if (settings.info_text && settings.mode === 'in_outerside') {
      try {
        // Process template placeholders in info text
        const processedInfoText = replaceTemplatePlaceholders(settings.info_text, context);
        
        // Create text overlay using SVG
        const textLines = processedInfoText.split('\n');
        const maxLineChars = Math.max(...textLines.map(line => line.length), 1);
        // Fixed size: default 18px, clamped 12-22px, only shrinks if text too long
        const fontSize = Math.min(22, Math.max(12, Math.min(18, Math.floor((imageWidth * 0.9) / (maxLineChars * 0.55)))));
        const lineHeight = fontSize * 1.4;
        const textHeight = textLines.length * lineHeight + fontSize;
        const textWidth = Math.min(imageWidth - 20, Math.max(...textLines.map(line => line.length * fontSize * 0.55)) + 20);
        
        // Calculate position based on settings.position
        let textX = 10;
        let textY = 10;
        
        switch (settings.position) {
          case 'top_left':
            textX = 10;
            textY = 10;
            break;
          case 'top_center':
            textX = Math.floor((imageWidth - textWidth) / 2);
            textY = 10;
            break;
          case 'top_right':
            textX = imageWidth - textWidth - 10;
            textY = 10;
            break;
          case 'bottom_left':
            textX = 10;
            textY = imageHeight - textHeight - 10;
            break;
          case 'bottom_center':
            textX = Math.floor((imageWidth - textWidth) / 2);
            textY = imageHeight - textHeight - 10;
            break;
          case 'bottom_right':
          default:
            textX = imageWidth - textWidth - 10;
            textY = imageHeight - textHeight - 10;
            break;
        }

        // Create SVG text overlay
        const svgWidth = textWidth + 20;
        const svgHeight = textHeight + 20;
        const svgText = `
          <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            ${settings.enable_border ? `
              <rect x="2" y="2" width="${svgWidth - 4}" height="${svgHeight - 4}" 
                    fill="${settings.background_color}" 
                    stroke="${settings.border_color}" 
                    stroke-width="${settings.border_width}" />
            ` : `
              <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" 
                    fill="${settings.background_color}" />
            `}
            ${textLines.map((line, index) => `
              <text x="${svgWidth / 2}" y="${fontSize + index * lineHeight}" 
                    text-anchor="middle" 
                    font-family="Arial, sans-serif" 
                    font-size="${fontSize}" 
                    fill="${settings.foreground_color}">
                ${line}
              </text>
            `).join('')}
          </svg>
        `;

        const textBuffer = Buffer.from(svgText);
        
        composites.push({
          input: textBuffer,
          top: Math.max(0, Math.min(textY, imageHeight - svgHeight)),
          left: Math.max(0, Math.min(textX, imageWidth - svgWidth)),
          blend: 'over'
        });
      } catch (error) {
        console.error('[watermark] Failed to apply text watermark:', error);
        throw error;
      }
    }
    if (settings.enable_center_watermark && settings.center_watermark_url) {
      try {
        const centerWatermark = await sharp(settings.center_watermark_url)
          .resize({ width: Math.floor(imageWidth * 0.3), fit: 'inside' })
          .toBuffer();

        const centerMetadata = await sharp(centerWatermark).metadata();
        const centerX = Math.floor((imageWidth - (centerMetadata.width || 0)) / 2);
        const centerY = Math.floor((imageHeight - (centerMetadata.height || 0)) / 2);

        composites.push({
          input: await sharp(centerWatermark)
            .composite([{
              input: Buffer.from([255, 255, 255, Math.floor(255 * (settings.center_watermark_opacity / 100))]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'dest-in'
            }])
            .toBuffer(),
          top: centerY,
          left: centerX
        });
      } catch (error) {
        console.error('[watermark] Failed to apply center watermark:', error);
        throw error;
      }
    }

    // Apply all composites to image
    if (composites.length > 0) {
      const result = await image.composite(composites).toBuffer();
      return result;
    }

    return processedBuffer;
  } catch (error) {
    console.error('[watermark] applyWatermark failed:', error);
    throw error;
  }
}

/**
 * Apply watermark to base64 image
 */
export async function applyWatermarkToBase64(
  base64Image: string,
  settings: WatermarkSettings,
  context: WatermarkContext = {},
  removeDBDLogoFirst: boolean = true
): Promise<string> {
  try {
    // Extract base64 data
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Apply watermark (with logo removal)
    const watermarkedBuffer = await applyWatermark(imageBuffer, settings, context, removeDBDLogoFirst);

    // Convert back to base64
    return `data:image/png;base64,${watermarkedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[watermark] applyWatermarkToBase64 failed:', error);
    throw error;
  }
}
