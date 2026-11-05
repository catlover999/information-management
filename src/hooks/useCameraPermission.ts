import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';
import { PermissionService } from '../services/permissionService';

export function useAppCameraPermission() {
  const visionPermission = useVisionCameraPermission();
  const [hasPermission, setHasPermission] = useState<boolean>(
    visionPermission.hasPermission,
  );
  const [isPermanentlyDenied, setIsPermanentlyDenied] =
    useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const syncPermissionStatus = useCallback(async () => {
    const androidGranted =
      await PermissionService.checkAndroidCameraPermission();
    const granted = androidGranted || visionPermission.hasPermission;
    setHasPermission(granted);
    if (granted) {
      setIsPermanentlyDenied(false);
    }
    setIsChecking(false);
    return granted;
  }, [visionPermission.hasPermission]);

  useEffect(() => {
    syncPermissionStatus();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncPermissionStatus();
      }
    });
    return () => subscription.remove();
  }, [syncPermissionStatus]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const result = await PermissionService.requestAndroidCameraPermission();
      if (result === 'granted') {
        setHasPermission(true);
        setIsPermanentlyDenied(false);
        setIsChecking(false);
        return true;
      }

      if (result === 'never_ask_again') {
        setIsPermanentlyDenied(true);
      }

      // Also notify VisionCamera permission state if needed
      const visionGranted = await visionPermission.requestPermission();
      setHasPermission(visionGranted);
      setIsChecking(false);
      return visionGranted;
    } catch {
      setIsChecking(false);
      return false;
    }
  }, [visionPermission]);

  const openSettings = useCallback(async () => {
    await PermissionService.openAppSettings();
  }, []);

  return {
    hasPermission,
    isChecking,
    isPermanentlyDenied,
    requestPermission,
    openSettings,
    refreshPermission: syncPermissionStatus,
  };
}

