/**
 * Unit Tests for OptimizedImage Component
 * Tests lazy loading, error handling, and image optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptimizedImage, generateSrcSet, generateSizes } from '../OptimizedImage';

// Mock IntersectionObserver as a class
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    // Immediately trigger intersection for testing
    this.callback(
      [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }

  unobserve = vi.fn();
  disconnect = vi.fn();

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

beforeEach(() => {
  MockIntersectionObserver.reset();
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OptimizedImage Component', () => {
  describe('Basic Rendering', () => {
    it('should render with src and alt', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test image" />);

      const img = screen.getByAltText('Test image');
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toBe('/test.jpg');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <OptimizedImage src="/test.jpg" alt="Test" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Lazy Loading', () => {
    it('should use native lazy loading by default', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('should use eager loading when priority is true', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('loading')).toBe('eager');
    });

    it('should use sync decoding for priority images', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('decoding')).toBe('sync');
    });

    it('should use async decoding for non-priority images', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('decoding')).toBe('async');
    });
  });

  describe('Responsive Images', () => {
    it('should apply srcSet when provided', () => {
      const srcSet = '/test-320.jpg 320w, /test-640.jpg 640w';
      render(<OptimizedImage src="/test.jpg" alt="Test" srcSet={srcSet} />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('srcset')).toBe(srcSet);
    });

    it('should apply sizes when provided', () => {
      const sizes = '(max-width: 600px) 100vw, 50vw';
      render(<OptimizedImage src="/test.jpg" alt="Test" sizes={sizes} />);

      const img = screen.getByAltText('Test');
      expect(img.getAttribute('sizes')).toBe(sizes);
    });
  });

  describe('Error Handling', () => {
    it('should show fallback image on error', async () => {
      render(
        <OptimizedImage
          src="/broken.jpg"
          alt="Test"
          fallback="/fallback.jpg"
        />
      );

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        expect(img.getAttribute('src')).toBe('/fallback.jpg');
      });
    });

    it('should call onLoadError callback', async () => {
      const onError = vi.fn();
      render(
        <OptimizedImage
          src="/broken.jpg"
          alt="Test"
          onLoadError={onError}
        />
      );

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      });
    });

    it('should not apply srcSet on fallback', async () => {
      const srcSet = '/test-320.jpg 320w';
      render(
        <OptimizedImage
          src="/broken.jpg"
          alt="Test"
          srcSet={srcSet}
          fallback="/fallback.jpg"
        />
      );

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        expect(img.getAttribute('srcset')).toBeNull();
      });
    });
  });

  describe('Load Events', () => {
    it('should call onLoadComplete when loaded', async () => {
      const onLoad = vi.fn();
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          onLoadComplete={onLoad}
        />
      );

      const img = screen.getByAltText('Test');
      fireEvent.load(img);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });
  });

  describe('Placeholder/Blur', () => {
    it('should show placeholder when blurUp is enabled', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          placeholder="/placeholder.jpg"
          blurUp
        />
      );

      const placeholderImg = container.querySelector('img[aria-hidden="true"]');
      expect(placeholderImg).toBeDefined();
      expect(placeholderImg?.getAttribute('src')).toBe('/placeholder.jpg');
    });

    it('should not show placeholder when blurUp is false', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          placeholder="/placeholder.jpg"
          blurUp={false}
        />
      );

      const placeholderImg = container.querySelector('img[aria-hidden="true"]');
      expect(placeholderImg).toBeNull();
    });

    it('should show loading skeleton when no placeholder', () => {
      const { container } = render(
        <OptimizedImage src="/test.jpg" alt="Test" />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeDefined();
    });
  });

  describe('Aspect Ratio', () => {
    it('should apply aspect ratio wrapper styles', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          aspectRatio={16 / 9}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // Check that wrapper has the aspect ratio class
      expect(wrapper).toHaveClass('relative');
      expect(wrapper).toHaveClass('w-full');
    });

    it('should render image with absolute positioning class when aspect ratio set', () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          aspectRatio={1}
        />
      );

      const img = screen.getByAltText('Test');
      // Component applies classes via className, check the element has expected classes
      expect(img.className).toContain('absolute');
    });
  });
});

describe('generateSrcSet', () => {
  it('should generate srcSet for CDN URLs', () => {
    const result = generateSrcSet('https://cdn.example.com/image.jpg?quality=80');
    expect(result).toContain('w=320 320w');
    expect(result).toContain('w=1280 1280w');
  });

  it('should return empty string for non-CDN URLs', () => {
    const result = generateSrcSet('/local/image.jpg');
    expect(result).toBe('');
  });

  it('should use custom widths', () => {
    const result = generateSrcSet('https://cdn.example.com/image.jpg', [100, 200, 300]);
    expect(result).toContain('w=100 100w');
    expect(result).toContain('w=200 200w');
    expect(result).toContain('w=300 300w');
    expect(result).not.toContain('w=320');
  });
});

describe('generateSizes', () => {
  it('should return correct sizes for full layout', () => {
    expect(generateSizes('full')).toBe('100vw');
  });

  it('should return correct sizes for half layout', () => {
    expect(generateSizes('half')).toBe('(min-width: 768px) 50vw, 100vw');
  });

  it('should return correct sizes for third layout', () => {
    expect(generateSizes('third')).toBe('(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw');
  });

  it('should return correct sizes for responsive layout', () => {
    expect(generateSizes('responsive')).toBe('(min-width: 1280px) 1280px, 100vw');
  });
});
