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
        // Make logo bigger - 60% of image width (150% increase from 40%)
        const logoMaxWidth = Math.floor(imageWidth * 0.6);
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
        // Handle error silently
      }
    }

    // Add center watermark if enabled (optional)
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
        // Handle error silently
      }
    }

    // Apply all composites to image
    if (composites.length > 0) {
      const result = await image.composite(composites).toBuffer();
      return result;
    }

    return processedBuffer;
  } catch (error) {
    return imageBuffer; // Return original image on error
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
    return base64Image; // Return original on error
  }
}
