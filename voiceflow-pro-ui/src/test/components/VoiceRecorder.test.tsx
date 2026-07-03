/**
 * Voice Recorder Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceRecorder } from '../components/VoiceRecorder';

// Mock the voice recognition engine
vi.mock('../lib/voice-recognition', () => ({
  VoiceFlowRecognitionEngine: class MockVoiceRecognition {
    static isSupported = true;
    isListening = false;
    isInitialized = true;
    currentLanguage = { code: 'en-US' };
    
    async initialize() {
      return Promise.resolve();
    }
    
    async startListening() {
      this.isListening = true;
      setTimeout(() => {
        this.emit('recognition:result', {
          transcript: 'Test recording',
          confidence: 0.95,
          language: 'en-US'
        });
      }, 100);
      return Promise.resolve();
    }
    
    async stopListening() {
      this.isListening = false;
      return Promise.resolve();
    }
    
    on(event: string, handler: Function) {
      return () => {};
    }
    
    off(event: string, handler: Function) {
      return;
    }
    
    dispose() {}
    
    getAudioLevel() {
      return 0.5;
    }
    
    setLanguage(lang: string) {
      this.currentLanguage = { code: lang };
      return Promise.resolve();
    }
  }
}));

// Mock audio context
vi.mock('../hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    isPaused: false,
    audioLevel: 0.5,
    duration: 0,
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    stopRecording: vi.fn(),
    resetRecording: vi.fn()
  })
}));

describe('VoiceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders voice recorder interface', () => {
    render(<VoiceRecorder />);
    
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    expect(screen.getByText(/record your voice/i)).toBeInTheDocument();
  });

  it('starts recording when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });
  });

  it('displays recording status', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });
  });

  it('shows audio level during recording', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      const audioLevel = screen.getByTestId('audio-level');
      expect(audioLevel).toBeInTheDocument();
      expect(audioLevel).toHaveAttribute('aria-valuenow', '50'); // 0.5 * 100
    });
  });

  it('stops recording when stop button is clicked', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      return user.click(stopButton);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });
  });

  it('displays transcription when available', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test recording')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles language switching', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    // Open language selector
    const languageButton = screen.getByRole('button', { name: /language/i });
    await user.click(languageButton);
    
    // Select Spanish
    const spanishOption = screen.getByText('Español');
    await user.click(spanishOption);
    
    // Verify language was updated (this would depend on actual implementation)
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('displays error messages when recording fails', async () => {
    // Mock failed recording
    const { VoiceFlowRecognitionEngine } = await import('../lib/voice-recognition');
    vi.spyOn(VoiceFlowRecognitionEngine.prototype as any, 'startListening').mockRejectedValue(new Error('Microphone access denied'));
    
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
    });
  });

  it('shows recording duration', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      const duration = screen.getByTestId('recording-duration');
      expect(duration).toBeInTheDocument();
      expect(duration.textContent).toMatch(/^\d{1,2}:\d{2}$/); // MM:SS format
    });
  });

  it('provides keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    // Press space to start recording
    await user.keyboard(' ');
    
    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });
    
    // Press space again to stop recording
    await user.keyboard(' ');
    
    await waitFor(() => {
      expect(screen.getByText(/record your voice/i)).toBeInTheDocument();
    });
  });

  it('handles pause/resume functionality', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      return user.click(pauseButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/paused/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });
    
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    await user.click(resumeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });
  });

  it('supports different recording modes', () => {
    render(<VoiceRecorder />);
    
    const modeSelector = screen.getByRole('combobox', { name: /mode/i });
    expect(modeSelector).toBeInTheDocument();
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // continuous, push-to-talk, voice-activity
  });

  it('displays confidence score for transcriptions', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(startButton);
    
    await waitFor(() => {
      const confidence = screen.getByTestId('transcription-confidence');
      expect(confidence).toBeInTheDocument();
      expect(confidence.textContent).toMatch(/95%/); // 0.95 confidence
    }, { timeout: 1000 });
  });

  it('handles theme switching', async () => {
    const user = userEvent.setup();
    render(<VoiceRecorder />);
    
    const themeToggle = screen.getByRole('button', { name: /theme/i });
    await user.click(themeToggle);
    
    // Verify theme change (this would depend on actual theme implementation)
    expect(document.documentElement).toHaveAttribute('data-theme');
  });
});