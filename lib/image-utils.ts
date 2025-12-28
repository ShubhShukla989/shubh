import { ImageProps } from 'next/image';

/**
 * Generate blur data URL for image placeholders
 */
export function generateBlurDataURL(width = 8, height = 8): string {
  // Create a simple base64 encoded SVG for blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
    sizes?: string;
  } = {}
): Partial<ImageProps> {
  const {
    width = 800,
    height = 600,
    priority = false,
    quality = 80,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  } = options;

  return {
    src,
    alt,
    width,
    height,
    priority,
    quality,
    sizes,
    placeholder: 'blur',
    blurDataURL: generateBlurDataURL(),
    style: {
      width: '100%',
      height: 'auto',
    },
  };
}

/**
 * Image size presets for common use cases
 */
export const imageSizePresets = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 200 },
  hero: { width: 1200, height: 600 },
  gallery: { width: 800, height: 600 },
  avatar: { width: 64, height: 64 },
  logo: { width: 200, height: 80 },
  page: { width: 600, height: 800 }, // For epaper pages
  clip: { width: 400, height: 300 }, // For article clips
} as const;

/**
 * Responsive image sizes for different breakpoints
 */
export const responsiveSizes = {
  mobile: '(max-width: 640px) 100vw',
  tablet: '(max-width: 1024px) 50vw',
  desktop: '33vw',
  full: '100vw',
  half: '50vw',
  third: '33vw',
  quarter: '25vw',
} as const;

/**
 * Check if image URL is external
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

/**
 * Get image file extension
 */
export function getImageExtension(src: string): string {
  try {
    const url = new URL(src, 'http://localhost');
    const pathname = url.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    return extension || '';
  } catch {
    return '';
  }
}

/**
 * Check if image format is modern (WebP, AVIF)
 */
export function isModernImageFormat(src: string): boolean {
  const extension = getImageExtension(src);
  return ['webp', 'avif'].includes(extension);
}

/**
 * Get appropriate image sizes for epaper content
 */
export function getEpaperImageSizes(type: 'page' | 'thumbnail' | 'clip' | 'hero'): string {
  switch (type) {
    case 'page':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw';
    case 'thumbnail':
      return '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 150px';
    case 'clip':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px';
    case 'hero':
      return '100vw';
    default:
      return '(max-width: 768px) 100vw, 50vw';
  }
}