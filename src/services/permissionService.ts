import { Linking, PermissionsAndroid, Platform } from 'react-native';

export type AndroidCameraPermissionResult =
  | 'granted'
  | 'denied'
  | 'never_ask_again';

export const PermissionService = {
  async checkAndroidCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
    } catch {
      return false;
    }
  },

  async requestAndroidCameraPermission(): Promise<AndroidCameraPermissionResult> {
    if (Platform.OS !== 'android') {
      return 'granted';
    }
    try {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'PantryLens Camera Permission',
          message:
            'PantryLens needs access to your camera to scan and photograph your pantry and emergency supplies.',
          buttonPositive: 'Allow Camera',
          buttonNegative: 'Not Now',
        },
      );

      if (status === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      }
      if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      return 'denied';
    } catch {
      return 'denied';
    }
  },

  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Unable to open system settings:', error);
    }
  },
};

