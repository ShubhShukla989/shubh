'use client';

import Image, { ImageProps } from 'next/image';
import { useState, forwardRef } from 'react';
import { generateBlurDataURL, imageSizePresets } from '@/lib/image-utils';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  preset?: keyof typeof imageSizePresets;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  preset,
  fallbackSrc = '/images/placeholder.svg',
  showLoadingSpinner = true,
  className = '',
  width,
  height,
  quality = 80,
  ...props
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Apply preset if provided
  const presetDimensions = preset ? imageSizePresets[preset] : { width: 800, height: 600 };
  
  // Use provided dimensions or preset dimensions
  const finalWidth = width || presetDimensions.width;
  const finalHeight = height || presetDimensions.height;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading spinner */}
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Image unavailable</span>
          </div>
        </div>
      )}
      
      {/* Optimized image */}
      <Image
        {...props}
        ref={ref}
        src={currentSrc}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        quality={quality}
        placeholder="blur"
        blurDataURL={generateBlurDataURL()}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Preset components for common use cases
export function ThumbnailImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="thumbnail" />;
}

export function CardImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="card" />;
}

export function HeroImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="hero" priority />;
}

export function GalleryImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="gallery" />;
}

export function PageImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="page" />;
}

export function ClipImage(props: Omit<OptimizedImageProps, 'preset'>) {
  return <OptimizedImage {...props} preset="clip" />;
}