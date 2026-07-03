/**
 * OptimizedImage Component
 *
 * A performance-optimized image component with:
 * - Native lazy loading
 * - Intersection Observer fallback
 * - Blur-up placeholder support
 * - Error handling with fallback
 * - Responsive srcSet support
 */

import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Placeholder image or blur data URL */
  placeholder?: string;
  /** Fallback image if loading fails */
  fallback?: string;
  /** Enable blur-up effect */
  blurUp?: boolean;
  /** Responsive image sources */
  srcSet?: string;
  /** Image sizes for responsive loading */
  sizes?: string;
  /** Custom aspect ratio (width/height) */
  aspectRatio?: number;
  /** Loading priority - eager for above-the-fold images */
  priority?: boolean;
  /** Callback when image loads */
  onLoadComplete?: () => void;
  /** Callback when image fails to load */
  onLoadError?: (error: Error) => void;
}

export function OptimizedImage({
  src,
  alt,
  placeholder,
  fallback = '/images/placeholder.svg',
  blurUp = true,
  srcSet,
  sizes,
  aspectRatio,
  priority = false,
  className,
  onLoadComplete,
  onLoadError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    onLoadError?.(new Error(`Failed to load image: ${src}`));
  };

  const imageSrc = hasError ? fallback : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio && 'w-full',
        className
      )}
      style={aspectRatio ? { paddingBottom: `${(1 / aspectRatio) * 100}%` } : undefined}
      ref={imgRef}
    >
      {/* Placeholder/blur background */}
      {blurUp && placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            'filter blur-lg scale-110 transform',
            'transition-opacity duration-300',
            isLoaded && 'opacity-0'
          )}
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          srcSet={!hasError ? srcSet : undefined}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            aspectRatio ? 'absolute inset-0 w-full h-full object-cover' : '',
            'transition-opacity duration-300',
            blurUp && !isLoaded && 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !placeholder && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 dark:bg-gray-800',
            'animate-pulse'
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Generate responsive srcSet for common breakpoints
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  // If it's a CDN URL that supports width params, generate srcSet
  if (baseSrc.includes('?') || baseSrc.includes('cdn')) {
    return widths
      .map((w) => `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}w=${w} ${w}w`)
      .join(', ');
  }
  return '';
}

/**
 * Generate sizes attribute for common layouts
 */
export function generateSizes(layout: 'full' | 'half' | 'third' | 'responsive'): string {
  switch (layout) {
    case 'full':
      return '100vw';
    case 'half':
      return '(min-width: 768px) 50vw, 100vw';
    case 'third':
      return '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';
    case 'responsive':
    default:
      return '(min-width: 1280px) 1280px, 100vw';
  }
}

export default OptimizedImage;
