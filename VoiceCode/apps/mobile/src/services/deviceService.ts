// VoiceCode Mobile - Device Service
// Exposes device and app metadata from expo-device + expo-constants.

import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface DeviceInfo {
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
}

export interface AppInfo {
  name: string;
  version: string;
  buildNumber: string;
}

export const getDeviceInfo = async (): Promise<DeviceInfo> => ({
  brand: Device.brand,
  modelName: Device.modelName,
  osName: Device.osName,
  osVersion: Device.osVersion,
});

export const getAppInfo = async (): Promise<AppInfo> => {
  const config = Constants.expoConfig;
  const buildNumber =
    config?.ios?.buildNumber ??
    config?.android?.versionCode?.toString() ??
    '1';

  return {
    name: config?.name ?? 'VoiceCode',
    version: config?.version ?? '1.0.0',
    buildNumber,
  };
};
