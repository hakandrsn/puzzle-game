import * as Application from 'expo-application';
import { Platform } from 'react-native';

let cachedDeviceId: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    if (Platform.OS === 'android') {
      cachedDeviceId = Application.getAndroidId() || 'unknown-android';
    } else if (Platform.OS === 'ios') {
      cachedDeviceId = await Application.getIosIdForVendorAsync() || 'unknown-ios';
    } else {
      // Web fallback
      cachedDeviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  } catch (error) {
    cachedDeviceId = `fallback-${Date.now()}`;
  }

  console.log('📱 Device ID:', cachedDeviceId);
  return cachedDeviceId;
};

export const getAppInfo = () => {
  return {
    name: Application.applicationName,
    version: Application.nativeApplicationVersion,
    buildVersion: Application.nativeBuildVersion,
  };
};
