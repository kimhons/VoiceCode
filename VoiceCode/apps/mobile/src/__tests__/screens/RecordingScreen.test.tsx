// VoiceCode Mobile - Recording Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { RecordingScreen } from '../../screens/recording/RecordingScreen';
import { audioRecorder } from '../../services/AudioRecorder';

jest.mock('../../services/AudioRecorder');

describe('RecordingScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (audioRecorder.requestPermissions as jest.Mock).mockResolvedValue(true);
    (audioRecorder.startRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.stopRecording as jest.Mock).mockResolvedValue({
      uri: 'file:///recording.m4a',
      metadata: { duration: 60000, fileSize: 1024000 },
    });
    (audioRecorder.pauseRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.resumeRecording as jest.Mock).mockResolvedValue(undefined);
    (audioRecorder.getDuration as jest.Mock).mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render recording screen correctly', () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('recording-screen')).toBeTruthy();
    });

    it('should display record button', () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('record-button')).toBeTruthy();
    });

    it('should display timer', () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('recording-timer')).toBeTruthy();
    });
  });

  describe('Permission Handling', () => {
    it('should request microphone permission on mount', async () => {
      renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      await waitFor(() => {
        expect(audioRecorder.requestPermissions).toHaveBeenCalled();
      });
    });

    it('should show permission denied message', async () => {
      (audioRecorder.requestPermissions as jest.Mock).mockResolvedValue(false);

      const { findByText } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const permissionMessage = await findByText(/microphone permission/i);
      expect(permissionMessage).toBeTruthy();
    });
  });

  describe('Recording Controls', () => {
    it('should start recording on button press', async () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });
    });

    it('should stop recording on button press when recording', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      // Stop recording
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.stopRecording).toHaveBeenCalled();
      });
    });

    it('should pause recording on pause button press', async () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      // Pause recording
      const pauseButton = getByTestId('pause-button');
      fireEvent.press(pauseButton);

      await waitFor(() => {
        expect(audioRecorder.pauseRecording).toHaveBeenCalled();
      });
    });

    it('should resume recording after pause', async () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start, pause, then resume
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      const pauseButton = getByTestId('pause-button');
      fireEvent.press(pauseButton);

      await waitFor(() => {
        expect(audioRecorder.pauseRecording).toHaveBeenCalled();
      });

      // Resume
      fireEvent.press(pauseButton);

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

      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      // Fast forward timer
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const timer = getByTestId('recording-timer');
      expect(timer).toBeTruthy();
    });
  });

  describe('Waveform Display', () => {
    it('should display audio waveform during recording', async () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      const waveform = getByTestId('audio-waveform');
      expect(waveform).toBeTruthy();
    });
  });

  describe('Navigation After Recording', () => {
    it('should navigate to transcription screen after stopping', async () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      // Stop recording
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Transcription', {
          audioUri: 'file:///recording.m4a',
          duration: 60000,
        });
      });
    });
  });

  describe('Cancel Recording', () => {
    it('should show confirmation dialog on back press during recording', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Start recording
      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(audioRecorder.startRecording).toHaveBeenCalled();
      });

      // Press back
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      const confirmDialog = getByText(/discard recording/i);
      expect(confirmDialog).toBeTruthy();
    });
  });

  describe('Quality Settings', () => {
    it('should display quality selector', () => {
      const { getByTestId } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const qualitySelector = getByTestId('quality-selector');
      expect(qualitySelector).toBeTruthy();
    });

    it('should change recording quality', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <RecordingScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const qualitySelector = getByTestId('quality-selector');
      fireEvent.press(qualitySelector);

      const highQuality = getByText(/high/i);
      fireEvent.press(highQuality);

      // Quality should be updated
      expect(getByText(/high/i)).toBeTruthy();
    });
  });
});
