// VoiceCode Mobile - Device Service Tests

import { describe, it, expect } from '@jest/globals';
import { getDeviceInfo, getAppInfo } from '../../services/deviceService';

// expo-device and expo-constants are mocked in jest.setup.js with static values.

describe('deviceService', () => {
  describe('getDeviceInfo', () => {
    it('returns brand, model, and OS details from the device', async () => {
      const info = await getDeviceInfo();

      expect(info.brand).toBe('Apple');
      expect(info.modelName).toBe('iPhone 17 Pro');
      expect(info.osName).toBe('iOS');
      expect(info.osVersion).toBe('17.0');
    });
  });

  describe('getAppInfo', () => {
    it('returns app name, version, and build number from Expo config', async () => {
      const info = await getAppInfo();

      expect(info.name).toBe('VoiceCode');
      expect(info.version).toBe('1.0.0');
      expect(info.buildNumber).toBe('1');
    });
  });
});
