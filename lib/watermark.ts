import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
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
 * Get font family based on language selection
 */
function getFontFamily(font: string): string {
  switch (font) {
    case 'Hindi':
      return 'Arial, sans-serif'; // Replace with Hindi font if available
    case 'Gujarati':
      return 'Arial, sans-serif'; // Replace with Gujarati font if available
    default:
      return 'Arial, sans-serif';
  }
}

/**
 * Calculate position coordinates based on position setting
 */
function calculatePosition(
  imageWidth: number,
  imageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: string,
  padding: number = 20
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  switch (position) {
    case 'top_left':
      x = padding;
      y = padding;
      break;
    case 'top_center':
      x = (imageWidth - watermarkWidth) / 2;
      y = padding;
      break;
    case 'top_right':
      x = imageWidth - watermarkWidth - padding;
      y = padding;
      break;
    case 'bottom_left':
      x = padding;
      y = imageHeight - watermarkHeight - padding;
      break;
    case 'bottom_center':
      x = (imageWidth - watermarkWidth) / 2;
      y = imageHeight - watermarkHeight - padding;
      break;
    case 'bottom_right':
      x = imageWidth - watermarkWidth - padding;
      y = imageHeight - watermarkHeight - padding;
      break;
  }

  return { x, y };
}

/**
 * Create watermark overlay with logo and text
 */
async function createWatermarkOverlay(
  settings: WatermarkSettings,
  context: WatermarkContext,
  imageWidth: number
): Promise<Buffer | null> {
  try {
    // Calculate watermark dimensions
    const minWidth = settings.min_width_px || 200;
    const watermarkWidth = Math.max(minWidth, imageWidth * 0.3);
    const watermarkHeight = 80;

    // Create canvas
    const canvas = createCanvas(watermarkWidth, watermarkHeight);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = settings.background_color || '#ffffff';
    ctx.fillRect(0, 0, watermarkWidth, watermarkHeight);

    // Draw border if enabled
    if (settings.enable_border) {
      ctx.strokeStyle = settings.border_color || '#000000';
      ctx.lineWidth = settings.border_width || 2;
      ctx.strokeRect(0, 0, watermarkWidth, watermarkHeight);
    }

    let currentX = 10;

    // Draw logo if provided
    if (settings.logo_url) {
      try {
        const logo = await loadImage(settings.logo_url);
        const logoHeight = watermarkHeight - 20;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, currentX, 10, logoWidth, logoHeight);
        currentX += logoWidth + 10;
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }

    // Draw info text if provided
    if (settings.info_text) {
      const text = replaceTemplatePlaceholders(settings.info_text, context);
      const fontFamily = getFontFamily(settings.info_text_font);
      
      ctx.fillStyle = settings.foreground_color || '#000000';
      ctx.font = `16px ${fontFamily}`;
      ctx.textBaseline = 'middle';
      
      const lines = text.split('\n');
      const lineHeight = 20;
      const startY = (watermarkHeight - (lines.length * lineHeight)) / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, currentX, startY + (index * lineHeight));
      });
    }

    // Convert canvas to buffer
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error creating watermark overlay:', error);
    return null;
  }
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
    // Step 1: Remove DBD logo if requested
    let processedBuffer = imageBuffer;
    if (removeDBDLogoFirst) {
      console.log('🗑️ Removing DBD logo from image...');
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
        console.log('🎨 Adding category logo to clip (replacing Aadhaar logo):', settings.logo_url);
        
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
        
        console.log(`✅ Category logo added to clip at TOP CENTER (${logoX}, ${logoY}) - ${logoWidth}x${logoHeight} - REPLACING Aadhaar logo`);
      } catch (error) {
        console.error('❌ Error adding category logo to clip:', error);
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
        
        console.log('✅ Center watermark added to clip');
      } catch (error) {
        console.error('❌ Error adding center watermark to clip:', error);
      }
    }

    // Apply all composites to image
    if (composites.length > 0) {
      const result = await image.composite(composites).toBuffer();
      console.log('✅ Clip watermarking completed successfully');
      return result;
    }

    console.log('ℹ️ No watermarks applied to clip');
    return processedBuffer;
  } catch (error) {
    console.error('❌ Error applying watermark to clip:', error);
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
    console.error('Error applying watermark to base64:', error);
    return base64Image; // Return original on error
  }
}
