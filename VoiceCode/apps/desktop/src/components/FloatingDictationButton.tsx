import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './FloatingDictationButton.css';

interface FloatingDictationButtonProps {
  onStartDictation: () => void;
  onStopDictation: () => void;
  isRecording: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  showTimer?: boolean;
  enabled?: boolean;
}

export const FloatingDictationButton: React.FC<FloatingDictationButtonProps> = ({
  onStartDictation,
  onStopDictation,
  isRecording,
  position = 'bottom-right',
  size = 'medium',
  showTimer = true,
  enabled = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle click/tap
  const handleClick = () => {
    if (isDragging) return;
    
    if (isRecording) {
      onStopDictation();
    } else {
      onStartDictation();
    }
  };

  // Handle long press for menu
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    
    const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
    const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
    
    if (deltaX > 5 || deltaY > 5) {
      setIsDragging(true);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      setCustomPosition({
        x: e.clientX - 24,
        y: e.clientY - 24,
      });
    }
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    setTimeout(() => {
      setIsDragging(false);
      dragStartRef.current = null;
    }, 100);
  };

  // Get button size
  const getButtonSize = (): number => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 56;
      default: return 48;
    }
  };

  // Get position styles
  const getPositionStyles = (): React.CSSProperties => {
    if (customPosition) {
      return {
        position: 'fixed',
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
      };
    }

    const baseStyles: React.CSSProperties = {
      position: 'fixed',
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  // Voice command menu items
  const voiceCommands = [
    { label: 'Insert', action: 'insert' },
    { label: 'Format', action: 'format' },
    { label: 'Undo', action: 'undo' },
    { label: 'Settings', action: 'settings' },
  ];

  const handleMenuAction = (action: string) => {
    console.log('Menu action:', action);
    setShowMenu(false);
    // Implement menu actions here
  };

  if (!enabled) return null;

  const buttonSize = getButtonSize();

  return (
    <>
      <div
        ref={buttonRef}
        className={`floating-dictation-button ${isRecording ? 'recording' : ''} ${isDragging ? 'dragging' : ''} size-${size}`}
        style={{
          ...getPositionStyles(),
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          cursor: isDragging ? 'grabbing' : 'pointer',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        title={isRecording ? 'Stop Dictation' : 'Start Dictation'}
        role="button"
        aria-label={isRecording ? 'Stop Dictation' : 'Start Dictation'}
        tabIndex={0}
      >
        {/* Pulsing animation ring */}
        {isRecording && <div className="pulse-ring"></div>}
        
        {/* Microphone icon */}
        <div className="mic-icon">
          <svg
            width={buttonSize * 0.5}
            height={buttonSize * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
              fill="currentColor"
            />
            <path
              d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Recording timer */}
        {isRecording && showTimer && (
          <div className="recording-timer">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Voice command menu */}
      {showMenu && (
        <div
          className="voice-command-menu"
          style={{
            position: 'fixed',
            left: customPosition ? `${customPosition.x}px` : undefined,
            top: customPosition ? `${customPosition.y - 150}px` : undefined,
            bottom: position.startsWith('bottom') ? '80px' : undefined,
            right: position.endsWith('right') ? '20px' : undefined,
          }}
        >
          <div className="menu-header">Voice Commands</div>
          {voiceCommands.map((cmd) => (
            <button
              key={cmd.action}
              className="menu-item"
              onClick={() => handleMenuAction(cmd.action)}
            >
              {cmd.label}
            </button>
          ))}
          <button
            className="menu-item close"
            onClick={() => setShowMenu(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!isRecording && !isDragging && (
        <div
          className="keyboard-hint"
          style={{
            ...getPositionStyles(),
            bottom: position.startsWith('bottom') ? '80px' : undefined,
            top: position.startsWith('top') ? '80px' : undefined,
          }}
        >
          Ctrl + Shift + V
        </div>
      )}
    </>
  );
};

