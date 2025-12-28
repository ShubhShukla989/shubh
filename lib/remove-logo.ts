/**
 * Remove DBD logo from newspaper page by covering it with white rectangle
 * Logo is typically at top center of the page
 */
export async function removeDBDLogo(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Dynamic import of sharp to avoid build issues
    const sharp = (await import('sharp')).default;
    
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 1200;

    // DBD/Aadhaar logo position - Updated for current page layout
    const logoX = Math.floor(width * 0.25); // 25% from left (more left)
    const logoY = Math.floor(height * 0.02); // 2% from top (slight margin)
    const logoWidth = Math.floor(width * 0.5); // 50% of page width (wider coverage)
    const logoHeight = Math.floor(height * 0.12); // 12% of page height (taller coverage)

    // Create white rectangle to cover logo
    const whiteBox = Buffer.from(
      `<svg width="${logoWidth}" height="${logoHeight}">
        <rect width="${logoWidth}" height="${logoHeight}" fill="white"/>
      </svg>`
    );

    // Overlay white box on image
    const result = await image
      .composite([{
        input: whiteBox,
        top: logoY,
        left: logoX
      }])
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Error removing DBD logo:', error);
    return imageBuffer; // Return original on error
  }
}

/**
 * Remove logo from base64 image
 */
export async function removeDBDLogoFromBase64(base64Image: string): Promise<string> {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const processedBuffer = await removeDBDLogo(imageBuffer);
    
    return `data:image/png;base64,${processedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error removing logo from base64:', error);
    return base64Image;
  }
}
