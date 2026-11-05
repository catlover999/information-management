import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  CameraRef,
  FlashMode,
  TargetCameraPosition,
  useCameraDevice,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { HeaderLogo } from '../components/HeaderLogo';
import { useAppCameraPermission } from '../hooks/useCameraPermission';
import { CapturedPhotoInfo } from '../models/inventory';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';

const pantryLensLogo = require('../assets/pantrylens_logo.png');

export const ScanScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const {
    hasPermission,
    isChecking,
    isPermanentlyDenied,
    requestPermission,
    openSettings,
  } = useAppCameraPermission();

  const [cameraPosition, setCameraPosition] =
    useState<TargetCameraPosition>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isAppActive, setIsAppActive] = useState<boolean>(true);
  const [isPreviewReady, setIsPreviewReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] =
    useState<CapturedPhotoInfo | null>(null);

  const cameraRef = useRef<CameraRef>(null);
  const device = useCameraDevice(cameraPosition);
  const photoOutput = usePhotoOutput({
    quality: 0.9,
    qualityPrioritization: 'balanced',
  });

  // Automatically request camera permission when navigating to Scan tab for the first time
  useEffect(() => {
    if (isFocused && !hasPermission && !isChecking && !isPermanentlyDenied) {
      requestPermission();
    }
  }, [
    isFocused,
    hasPermission,
    isChecking,
    isPermanentlyDenied,
    requestPermission,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  const isCameraActive =
    isFocused && isAppActive && hasPermission && !capturedPhoto && !cameraError;

  const handleToggleFlash = useCallback(() => {
    setFlashMode(prev => {
      if (prev === 'off') {
        return 'on';
      }
      if (prev === 'on') {
        return 'auto';
      }
      return 'off';
    });
  }, []);

  const handleFlipCamera = useCallback(() => {
    setIsPreviewReady(false);
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleCapturePhoto = useCallback(async () => {
    if (isCapturing || !device) {
      return;
    }

    setIsCapturing(true);
    setCameraError(null);

    try {
      const effectiveFlash: FlashMode = device.hasFlash ? flashMode : 'off';
      const photoFile = await photoOutput.capturePhotoToFile(
        {
          flashMode: effectiveFlash,
          enableShutterSound: true,
        },
        {},
      );

      const normalizedUri = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;

      setCapturedPhoto({
        uri: normalizedUri,
        width: photoFile.width,
        height: photoFile.height,
        capturedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to capture photo from camera.';
      setCameraError(message);
    } finally {
      setIsCapturing(false);
    }
  }, [device, flashMode, isCapturing, photoOutput]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback((error: Error) => {
    console.warn('VisionCamera session error:', error);
    setCameraError(error.message || 'Camera initialization encountered an error.');
  }, []);

  // 1. Permission Checking State
  if (isChecking) {
    return (
      <View style={styles.screenContainer}>
        <HeaderLogo subtitle="Supply & Label Scanner" />
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
          <Text style={styles.stateTitle}>Checking Camera Access...</Text>
        </View>
      </View>
    );
  }

  // 2. Permission Denied State
  if (!hasPermission) {
    return (
      <View style={styles.screenContainer}>
        <HeaderLogo subtitle="Supply & Label Scanner" />
        <View style={styles.centeredState}>
          <View style={styles.permissionCard}>
            <View style={styles.logoBadge}>
              <Image
                source={pantryLensLogo}
                style={styles.logoBadgeImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.stateTitle}>Camera Access Required</Text>
            <Text style={styles.stateDescription}>
              PantryLens uses your camera to capture photos of your pantry
              shelves, food labels, and emergency supplies.
            </Text>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={requestPermission}
              activeOpacity={0.85}
              testID="button-request-camera-permission">
              <Text style={styles.primaryActionText}>
                Grant Camera Permission
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={openSettings}
              activeOpacity={0.8}
              testID="button-open-settings">
              <Text style={styles.secondaryActionText}>
                Open Android App Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 3. Captured Photo Preview State
  if (capturedPhoto) {
    return (
      <View style={styles.screenContainer}>
        <HeaderLogo subtitle="Captured Supply Preview" />

        <View style={styles.previewWrapper}>
          <View style={styles.imageFrame}>
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.capturedImage}
              resizeMode="cover"
              testID="captured-photo-preview"
            />

            <View style={styles.previewBadgeRow}>
              <View style={styles.previewBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.previewBadgeText}>Photo Captured</Text>
              </View>
              <View style={styles.previewMetaPill}>
                <Text style={styles.previewMetaText}>
                  {capturedPhoto.width}×{capturedPhoto.height} •{' '}
                  {capturedPhoto.capturedAt}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.previewFooterCard}>
            <Text style={styles.previewFooterTitle}>
              Clear & Ready for Inspection
            </Text>
            <Text style={styles.previewFooterSubtitle}>
              Review the captured image of your pantry supply. You can retake
              the photo anytime to get a clearer angle.
            </Text>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              activeOpacity={0.85}
              testID="button-retake-photo">
              <Text style={styles.retakeButtonIcon}>↺</Text>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 4. No Camera Device Found State
  if (!device) {
    return (
      <View style={styles.screenContainer}>
        <HeaderLogo subtitle="Supply & Label Scanner" />
        <View style={styles.centeredState}>
          <View style={styles.permissionCard}>
            <View style={styles.logoBadge}>
              <Image
                source={pantryLensLogo}
                style={styles.logoBadgeImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.stateTitle}>No Camera Device Detected</Text>
            <Text style={styles.stateDescription}>
              Unable to find an available {cameraPosition} camera on this
              Android device or emulator.
            </Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleFlipCamera}
              activeOpacity={0.85}>
              <Text style={styles.primaryActionText}>
                Switch to {cameraPosition === 'back' ? 'Front' : 'Back'} Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 5. Live Camera Preview Screen
  return (
    <View style={styles.screenContainer}>
      <HeaderLogo subtitle="Supply & Label Scanner" />

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={[photoOutput]}
          isActive={isCameraActive}
          resizeMode="cover"
          enableNativeTapToFocusGesture
          enableNativeZoomGesture
          onPreviewStarted={() => {
            setIsPreviewReady(true);
            setCameraError(null);
          }}
          onPreviewStopped={() => setIsPreviewReady(false)}
          onError={handleCameraError}
        />

        {/* Camera Initializing Overlay */}
        {!isPreviewReady && !cameraError ? (
          <View style={styles.initializingOverlay}>
            <ActivityIndicator size="large" color={Colors.greenMedium} />
            <Text style={styles.initializingText}>Initializing camera...</Text>
          </View>
        ) : null}

        {/* Camera Error Banner */}
        {cameraError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Camera Notice</Text>
            <Text style={styles.errorBannerMessage}>{cameraError}</Text>
            <TouchableOpacity
              style={styles.retryBannerButton}
              onPress={() => setCameraError(null)}>
              <Text style={styles.retryBannerButtonText}>Retry Camera</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Top Controls Overlay */}
        <View style={styles.topCameraBar}>
          <TouchableOpacity
            style={styles.cameraControlPill}
            onPress={handleToggleFlash}
            activeOpacity={0.8}>
            <Text style={styles.cameraControlText}>
              ⚡ Flash: {flashMode.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraControlPill}
            onPress={handleFlipCamera}
            activeOpacity={0.8}>
            <Text style={styles.cameraControlText}>
              🔄 {cameraPosition === 'back' ? 'Rear Lens' : 'Front Lens'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Scanner Framing Guide */}
        <View style={styles.reticleContainer} pointerEvents="none">
          <View style={styles.reticleBox}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.guidePill}>
            <Text style={styles.guideText}>
              Center pantry item or expiry label in frame
            </Text>
          </View>
        </View>

        {/* Bottom Capture Dock */}
        <View style={styles.bottomDock}>
          <TouchableOpacity
            style={[
              styles.shutterOuter,
              isCapturing ? styles.shutterOuterDisabled : null,
            ]}
            onPress={handleCapturePhoto}
            disabled={isCapturing}
            activeOpacity={0.8}
            accessibilityLabel="Capture photo"
            testID="button-capture-photo">
            <View style={styles.shutterInner}>
              {isCapturing ? (
                <ActivityIndicator size="small" color={Colors.navyPrimary} />
              ) : (
                <View style={styles.shutterCoreDot} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.captureHintText}>
            {isCapturing ? 'Capturing photo...' : 'Tap shutter to capture photo'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.navyDark,
  },
  centeredState: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  logoBadgeImg: {
    width: 72,
    height: 72,
  },
  stateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.navyPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stateDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  primaryActionButton: {
    width: '100%',
    backgroundColor: Colors.greenPrimary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryActionText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.textOnPrimary,
  },
  secondaryActionButton: {
    width: '100%',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.navyPrimary,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  initializingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 30, 50, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  initializingText: {
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.md,
    color: Colors.textOnPrimary,
    fontSize: 14,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(15, 41, 66, 0.94)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    zIndex: 10,
  },
  errorBannerTitle: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 15,
    marginBottom: 4,
  },
  errorBannerMessage: {
    fontFamily: Fonts.regular,
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  retryBannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.greenPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  retryBannerButtonText: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 13,
  },
  topCameraBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    zIndex: 6,
  },
  cameraControlPill: {
    backgroundColor: 'rgba(15, 41, 66, 0.78)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraControlText: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 12,
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: Colors.greenMedium,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  guidePill: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(15, 41, 66, 0.82)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  guideText: {
    fontFamily: Fonts.medium,
    color: Colors.textOnPrimary,
    fontSize: 12,
  },
  bottomDock: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: 'rgba(10, 30, 50, 0.82)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: Colors.greenMedium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.sm,
  },
  shutterOuterDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCoreDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.greenPrimary,
  },
  captureHintText: {
    fontFamily: Fonts.medium,
    color: '#CBD5E1',
    fontSize: 12,
  },
  previewWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  imageFrame: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.navyDark,
    borderWidth: 2,
    borderColor: Colors.navyPrimary,
    position: 'relative',
    marginBottom: Spacing.lg,
    ...Shadows.floating,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  previewBadgeRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 41, 66, 0.88)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.greenMedium,
    marginRight: 6,
  },
  previewBadgeText: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 12,
  },
  previewMetaPill: {
    backgroundColor: 'rgba(15, 41, 66, 0.88)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  previewMetaText: {
    fontFamily: Fonts.medium,
    color: '#E2E8F0',
    fontSize: 11,
  },
  previewFooterCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  previewFooterTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16.5,
    color: Colors.navyPrimary,
    marginBottom: 4,
  },
  previewFooterSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  retakeButtonIcon: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.greenMedium,
    marginRight: 8,
  },
  retakeButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.textOnPrimary,
  },
});
