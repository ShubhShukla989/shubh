'use client';

import { useEffect, useState, useCallback } from 'react';
import { sliderService } from '@/lib/services/sliderService';
import { Slider } from '@/lib/types';

interface SliderWidgetProps {
  alias: string;
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

/**
 * SliderWidget - Frontend component for displaying slideshows
 * Features: Auto-slide, lazy loading, responsive, touch-swipe support
 */
export function SliderWidget({
  alias,
  autoplay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  className = '',
}: SliderWidgetProps) {
  const [slider, setSlider] = useState<Slider | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Fetch slider data
  useEffect(() => {
    const fetchSlider = async () => {
      try {
        setIsLoading(true);
        const data = await sliderService.getSliderByAlias(alias);
        setSlider(data);
      } catch (error) {
        console.error('Error fetching slider:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlider();
  }, [alias]);

  // Auto-slide functionality
  useEffect(() => {
    if (!autoplay || isPaused || !slider?.slides?.length) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slider.slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, isPaused, slider?.slides?.length]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    if (!slider?.slides) return;
    setCurrentIndex(index);
  }, [slider?.slides]);

  const goToPrevious = useCallback(() => {
    if (!slider?.slides) return;
    setCurrentIndex((prev) => 
      prev === 0 ? slider.slides.length - 1 : prev - 1
    );
  }, [slider?.slides]);

  const goToNext = useCallback(() => {
    if (!slider?.slides) return;
    setCurrentIndex((prev) => (prev + 1) % slider.slides.length);
  }, [slider?.slides]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!slider || !slider.slides || slider.slides.length === 0) {
    return null;
  }

  const visibleSlides = slider.slides.filter(slide => slide.visible);

  if (visibleSlides.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div className="relative h-full">
        {visibleSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image_url}
              alt={slide.alt || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            
            {/* Caption */}
            {slide.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <p className="text-lg">{slide.caption}</p>
              </div>
            )}

            {/* Link Overlay */}
            {slide.link && (
              <a
                href={slide.link}
                className="absolute inset-0"
                aria-label={slide.alt || `Go to slide ${index + 1}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Previous Arrow */}
      {showArrows && visibleSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Arrow */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && visibleSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {visibleSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
        {currentIndex + 1} / {visibleSlides.length}
      </div>
    </div>
  );
}
