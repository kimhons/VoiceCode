// Enhanced mobile detection and responsive design hook
import { useState, useEffect, useCallback } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface UseResponsiveResult {
  // Breakpoint checks
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  
  // Screen dimensions
  width: number;
  height: number;
  
  // Current breakpoint
  currentBreakpoint: keyof BreakpointConfig;
  
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Touch capability
  isTouchDevice: boolean;
  
  // Media query helpers
  isBreakpoint: (breakpoint: keyof BreakpointConfig) => boolean;
  isWidthLessThan: (breakpoint: keyof BreakpointConfig) => boolean;
  isWidthGreaterThan: (breakpoint: keyof BreakpointConfig) => boolean;
  
  // Utilities
  getOrientation: () => 'portrait' | 'landscape';
  getBreakpointName: () => keyof BreakpointConfig;
}

export const useResponsive = (
  customBreakpoints?: Partial<BreakpointConfig>
): UseResponsiveResult => {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };

  // Detect touch device
  const isTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check for touch capability
    const hasTouchScreen = (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      // @ts-ignore - legacy support
      (navigator.msMaxTouchPoints > 0)
    );
    
    // Additional check for mobile user agent
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    return hasTouchScreen || isMobileUserAgent;
  }, []);

  // Get current breakpoint
  const getCurrentBreakpoint = useCallback((width: number): keyof BreakpointConfig => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'sm';
  }, [breakpoints]);

  // Check if screen matches breakpoint
  const isBreakpoint = useCallback((breakpoint: keyof BreakpointConfig): boolean => {
    return dimensions.width >= breakpoints[breakpoint];
  }, [dimensions.width, breakpoints]);

  // Check if screen is less than breakpoint
  const isWidthLessThan = useCallback((breakpoint: keyof BreakpointConfig): boolean => {
    return dimensions.width < breakpoints[breakpoint];
  }, [dimensions.width, breakpoints]);

  // Check if screen is greater than breakpoint
  const isWidthGreaterThan = useCallback((breakpoint: keyof BreakpointConfig): boolean => {
    return dimensions.width > breakpoints[breakpoint];
  }, [dimensions.width, breakpoints]);

  // Get orientation
  const getOrientation = useCallback((): 'portrait' | 'landscape' => {
    return dimensions.height > dimensions.width ? 'portrait' : 'landscape';
  }, [dimensions]);

  // Get breakpoint name
  const getBreakpointName = useCallback((): keyof BreakpointConfig => {
    return getCurrentBreakpoint(dimensions.width);
  }, [dimensions.width, getCurrentBreakpoint]);

  // Update dimensions
  const updateDimensions = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Initial dimension check
    updateDimensions();

    // Set up resize listener with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  // Calculate device type
  const currentBreakpoint = getCurrentBreakpoint(dimensions.width);
  const isMobile = dimensions.width < breakpoints.md;
  const isTablet = dimensions.width >= breakpoints.md && dimensions.width < breakpoints.lg;
  const isDesktop = dimensions.width >= breakpoints.lg;
  const isLargeDesktop = dimensions.width >= breakpoints.xl;

  // Calculate orientation
  const isPortrait = dimensions.height > dimensions.width;
  const isLandscape = dimensions.width > dimensions.height;

  return {
    // Breakpoint checks
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    
    // Screen dimensions
    width: dimensions.width,
    height: dimensions.height,
    
    // Current breakpoint
    currentBreakpoint,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Touch capability
    isTouchDevice: isTouchDevice(),
    
    // Media query helpers
    isBreakpoint,
    isWidthLessThan,
    isWidthGreaterThan,
    
    // Utilities
    getOrientation,
    getBreakpointName,
  };
};

// Legacy mobile hook for backward compatibility
export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

// Hook for safe area insets (notch support)
export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    // Check if CSS custom properties are supported
    if (typeof CSS !== 'undefined' && CSS.supports('padding', 'env(safe-area-inset-top)')) {
      const updateSafeArea = () => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        setSafeAreaInsets({
          top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
          right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
          bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
          left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        });
      };

      updateSafeArea();
      window.addEventListener('resize', updateSafeArea);
      
      return () => window.removeEventListener('resize', updateSafeArea);
    }
  }, []);

  return safeAreaInsets;
};

// Hook for viewport height (100vh fix for mobile)
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return viewportHeight;
};

// Hook for reduced motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange(); // Set initial value
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook for device pixel ratio
export const useDevicePixelRatio = () => {
  const [pixelRatio, setPixelRatio] = useState(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );

  useEffect(() => {
    const updatePixelRatio = () => {
      setPixelRatio(window.devicePixelRatio || 1);
    };

    window.addEventListener('resize', updatePixelRatio);
    
    return () => window.removeEventListener('resize', updatePixelRatio);
  }, []);

  return pixelRatio;
};
