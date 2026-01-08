// Loading States Component for VoiceFlow Pro
import React from 'react';
import { Loader2, Mic, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type: 'recording' | 'transcription' | 'language-detection' | 'audio-enhancement' | 'ai-processing' | 'general';
  message?: string;
  progress?: number;
  showProgress?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
}

// Loading spinner with different icons
const LoadingIcon: React.FC<{ type: string; size: string; className: string }> = ({ type, size, className }) => {
  const iconProps = { className, size };

  switch (type) {
    case 'recording':
      return <Mic {...iconProps} className={cn(className, 'animate-pulse')} />;
    case 'transcription':
      return <Loader2 {...iconProps} className={cn(className, 'animate-spin')} />;
    case 'language-detection':
      return <Globe {...iconProps} className={cn(className, 'animate-pulse')} />;
    case 'audio-enhancement':
      return <Sparkles {...iconProps} className={cn(className, 'animate-pulse')} />;
    case 'ai-processing':
      return <Loader2 {...iconProps} className={cn(className, 'animate-spin')} />;
    default:
      return <Loader2 {...iconProps} className={cn(className, 'animate-spin')} />;
  }
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ progress, className }) => (
  <div className={cn('w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700', className)}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message,
  progress,
  showProgress = true,
  className,
  size = 'medium',
  variant = 'primary'
}) => {
  // Determine size classes
  const sizeClasses = {
    small: {
      container: 'p-3',
      icon: 'h-4 w-4',
      text: 'text-sm',
      progress: 'h-1'
    },
    medium: {
      container: 'p-6',
      icon: 'h-6 w-6',
      text: 'text-base',
      progress: 'h-2'
    },
    large: {
      container: 'p-8',
      icon: 'h-8 w-8',
      text: 'text-lg',
      progress: 'h-3'
    }
  };

  // Determine variant classes
  const variantClasses = {
    primary: {
      container: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      text: 'text-gray-900 dark:text-gray-100',
      subtext: 'text-gray-600 dark:text-gray-400'
    },
    secondary: {
      container: 'bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600',
      text: 'text-gray-800 dark:text-gray-200',
      subtext: 'text-gray-700 dark:text-gray-300'
    },
    minimal: {
      container: 'bg-transparent',
      text: 'text-gray-700 dark:text-gray-300',
      subtext: 'text-gray-500 dark:text-gray-400'
    }
  };

  const classes = sizeClasses[size];
  const variantClasses_ = variantClasses[variant];

  // Default messages for different types
  const defaultMessages = {
    recording: 'Initializing recording...',
    transcription: 'Processing speech...',
    'language-detection': 'Detecting language...',
    'audio-enhancement': 'Enhancing audio quality...',
    'ai-processing': 'AI processing...',
    general: 'Loading...'
  };

  const displayMessage = message || defaultMessages[type];
  const currentProgress = progress ?? 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-4 rounded-lg',
        classes.container,
        variantClasses_.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingIcon
        type={type}
        size={classes.icon}
        className={cn('text-blue-600 dark:text-blue-400', classes.icon)}
      />
      
      <div className="text-center">
        <p className={cn('font-medium', classes.text, variantClasses_.text)}>
          {displayMessage}
        </p>
        {showProgress && (
          <p className={cn('text-xs mt-1', variantClasses_.subtext)}>
            {Math.round(currentProgress)}% complete
          </p>
        )}
      </div>

      {showProgress && (
        <ProgressBar 
          progress={currentProgress} 
          className={cn('w-full max-w-xs', classes.progress)}
        />
      )}

      {/* Screen reader only text for accessibility */}
      <span className="sr-only">
        {displayMessage} {showProgress && `(${Math.round(currentProgress)} percent complete)`}
      </span>
    </div>
  );
};

// Inline loading spinner for buttons and small components
export const InlineLoading: React.FC<{
  size?: 'small' | 'medium';
  className?: string;
}> = ({ size = 'small', className }) => (
  <Loader2
    className={cn(
      'animate-spin text-current',
      size === 'small' ? 'h-4 w-4' : 'h-5 w-5',
      className
    )}
  />
);

// Skeleton loading components
export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}> = ({ className, lines = 3, showAvatar = true, showTimestamp = true }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          {showAvatar && (
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-8 w-8 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            {showTimestamp && (
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Audio visualization loading state
export const AudioVisualizationLoading: React.FC<{
  className?: string;
  bars?: number;
}> = ({ className, bars = 20 }) => (
  <div className={cn('flex items-end justify-center space-x-1 h-16', className)}>
    {Array.from({ length: bars }).map((_, index) => (
      <div
        key={index}
        className="bg-blue-200 dark:bg-blue-800 rounded-t"
        style={{
          height: `${Math.random() * 40 + 10}px`,
          animation: `pulse ${1 + Math.random()}s infinite`,
          animationDelay: `${index * 0.1}s`
        }}
      />
    ))}
  </div>
);

// Full screen loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  type?: LoadingStateProps['type'];
}> = ({ isVisible, message, type = 'ai-processing' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm w-full mx-4">
        <LoadingState
          type={type}
          message={message}
          showProgress={true}
          variant="primary"
        />
      </div>
    </div>
  );
};