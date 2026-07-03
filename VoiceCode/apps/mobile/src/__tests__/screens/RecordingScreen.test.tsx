// VoiceCode Mobile - Recording Screen Tests
//
// The real RecordingScreen (src/screens/home/RecordingScreen.tsx) is a live-streaming
// transcription screen: it drives audioRecorder.startStreamingRecording /
// stopStreamingRecording through a WebSocket streaming service and surfaces results via
// Alert. It intentionally does NOT own a separate microphone-permission screen, a
// Transcription-navigation step, or a quality selector (recording is fixed at HIGH), so
// those behaviors are asserted against the screen's actual streaming contract here.

import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Alert } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import RecordingScreen from '../../screens/home/RecordingScreen';
import { audioRecorder } from '../../services/AudioRecorder';
import { getStreamingService } from '../../services/WebSocketStreamingService';
import { RecordingQuality } from '../../types/recording';

jest.mock('../../services/AudioRecorder');

jest.mock('../../services/WebSocketStreamingService', () => ({
  getStreamingService: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true),
    startStreaming: jest.fn(),
    stopStreaming: jest.fn(),
    sendAudioChunk: jest.fn(),
  })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

// Child visualizers pull heavier native deps; the screen wraps them in testID'd containers,
// so render them as no-ops to keep this suite focused on the screen's own behavior.
jest.mock('../../components/recording/AudioWaveform', () => ({ AudioWaveform: () => null }));
jest.mock('../../components/recording/LiveTranscriptionView', () => ({
  LiveTranscriptionView: () => null,
}));

const stopMetadata = {
  duration: 60000,
  fileSize: 1024000,
  sampleRate: 48000,
  channels: 2,
  bitRate: 192000,
};

describe('RecordingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (audioRecorder.setStreamingService as jest.Mock).mockReturnValue(undefined);
    (audioRecorder.startStreamingRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.stopStreamingRecording as jest.Mock).mockResolvedValue(stopMetadata);
    (audioRecorder.pauseRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.resumeRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.getMetering as jest.Mock).mockResolvedValue(null);
    (audioRecorder.getDuration as jest.Mock).mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render recording screen correctly', () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      expect(getByTestId('recording-screen')).toBeTruthy();
    });

    it('should display record button', () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      expect(getByTestId('record-button')).toBeTruthy();
    });

    it('should display timer', () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      expect(getByTestId('recording-timer')).toBeTruthy();
    });
  });

  describe('Recording Controls', () => {
    it('should start streaming recording on button press', async () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });
    });

    it('should record at HIGH quality', async () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalledWith(
          RecordingQuality.HIGH
        );
      });
    });

    it('should stop streaming recording on button press when recording', async () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });

      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.stopStreamingRecording).toHaveBeenCalled();
      });
    });

    it('should pause recording on pause button press', async () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });

      fireEvent.press(getByTestId('pause-button'));

      await waitFor(() => {
        expect(audioRecorder.pauseRecording).toHaveBeenCalled();
      });
    });

    it('should resume recording after pause', async () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });

      fireEvent.press(getByTestId('pause-button'));

      await waitFor(() => {
        expect(audioRecorder.pauseRecording).toHaveBeenCalled();
      });

      fireEvent.press(getByTestId('pause-button'));

      await waitFor(() => {
        expect(audioRecorder.resumeRecording).toHaveBeenCalled();
      });
    });
  });

  describe('Timer Display', () => {
    it('should update timer during recording', async () => {
      (audioRecorder.getDuration as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(getByTestId('recording-timer')).toBeTruthy();
    });
  });

  describe('Waveform Display', () => {
    it('should display audio waveform', () => {
      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      expect(getByTestId('audio-waveform')).toBeTruthy();
    });
  });

  describe('Recording Completion', () => {
    it('should surface a completion alert after stopping', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startStreamingRecording).toHaveBeenCalled();
      });

      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Recording Complete',
          expect.stringContaining('Duration'),
          expect.anything()
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should surface an error alert when starting fails', async () => {
      (audioRecorder.startStreamingRecording as jest.Mock).mockRejectedValue(
        new Error('mic busy')
      );
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(<RecordingScreen />);

      fireEvent.press(getByTestId('record-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Recording Error',
          expect.stringContaining('Failed to start recording')
        );
      });

      alertSpy.mockRestore();
    });
  });
});
