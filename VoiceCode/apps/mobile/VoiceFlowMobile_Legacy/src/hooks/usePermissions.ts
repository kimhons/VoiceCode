// VoiceCode Pro Mobile - Permissions Hook

import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface Permissions {
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permissions>({
    microphone: {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    },
    mediaLibrary: {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setIsLoading(true);

      // Check microphone permission
      const audioStatus = await Audio.getPermissionsAsync();
      setPermissions(prev => ({
        ...prev,
        microphone: {
          granted: audioStatus.granted,
          canAskAgain: audioStatus.canAskAgain,
          status: audioStatus.granted ? 'granted' : audioStatus.canAskAgain ? 'undetermined' : 'denied',
        },
      }));

      // Check media library permission
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      setPermissions(prev => ({
        ...prev,
        mediaLibrary: {
          granted: mediaStatus.granted,
          canAskAgain: mediaStatus.canAskAgain,
          status: mediaStatus.granted ? 'granted' : mediaStatus.canAskAgain ? 'undetermined' : 'denied',
        },
      }));
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const { granted, canAskAgain } = await Audio.requestPermissionsAsync();
      
      setPermissions(prev => ({
        ...prev,
        microphone: {
          granted,
          canAskAgain,
          status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied',
        },
      }));

      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    try {
      const { granted, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      setPermissions(prev => ({
        ...prev,
        mediaLibrary: {
          granted,
          canAskAgain,
          status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied',
        },
      }));

      return granted;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  };

  const requestAllPermissions = async (): Promise<boolean> => {
    const micGranted = await requestMicrophonePermission();
    const mediaGranted = await requestMediaLibraryPermission();
    return micGranted && mediaGranted;
  };

  return {
    permissions,
    isLoading,
    checkPermissions,
    requestMicrophonePermission,
    requestMediaLibraryPermission,
    requestAllPermissions,
    hasAllPermissions: permissions.microphone.granted && permissions.mediaLibrary.granted,
    hasMicrophonePermission: permissions.microphone.granted,
    hasMediaLibraryPermission: permissions.mediaLibrary.granted,
  };
};

