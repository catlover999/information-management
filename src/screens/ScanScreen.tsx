import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  Camera,
  CameraRef,
  FlashMode,
  TargetCameraPosition,
  useCameraDevice,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { HeaderLogo } from '../components/HeaderLogo';
import { useInventory } from '../context/InventoryContext';
import { useAppCameraPermission } from '../hooks/useCameraPermission';
import { CapturedPhotoInfo } from '../models/inventory';
import { RootTabParamList } from '../navigation/AppNavigator';
import {
  identifyPantryItemsFromPhoto,
  OpenRouterRecognitionError,
} from '../services/openRouterService';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';
import { processCapturedImageToDataUrl } from '../utils/imageProcessor';

const pantryLensLogo = require('../assets/pantrylens_logo.png');

interface RecognitionResultState {
  foundItemIds: string[];
  matchedItemNames: string[];
  totalInventoryCount: number;
}

export const ScanScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { items, applyRecognizedItems } = useInventory();

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

  // AI Recognition States
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] =
    useState<RecognitionResultState | null>(null);
  const isIdentifyingRef = useRef<boolean>(false);

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
    setRecognitionError(null);
    setRecognitionResult(null);

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
    if (isIdentifyingRef.current) {
      return;
    }
    setCapturedPhoto(null);
    setCameraError(null);
    setRecognitionError(null);
    setRecognitionResult(null);
  }, []);

  const handleIdentifyItems = useCallback(async () => {
    // Prevent duplicate simultaneous requests
    if (!capturedPhoto || isIdentifyingRef.current) {
      return;
    }

    if (items.length === 0) {
      setRecognitionError(
        'Your pantry inventory is currently empty. Please add items to your checklist before scanning.',
      );
      return;
    }

    isIdentifyingRef.current = true;
    setIsIdentifying(true);
    setRecognitionError(null);
    setRecognitionResult(null);

    try {
      // 1. Compress, resize, and convert captured image into a base64 data URL
      let processedImage;
      try {
        processedImage = await processCapturedImageToDataUrl(
          capturedPhoto.uri,
          {
            maxDimension: 768,
            jpegQuality: 72,
          },
        );
      } catch (imgErr: unknown) {
        const detail =
          imgErr instanceof Error
            ? imgErr.message
            : 'Unable to process captured image.';
        throw new OpenRouterRecognitionError(
          'IMAGE_PROCESSING_ERROR',
          `Failed to prepare captured photo for AI analysis: ${detail}`,
        );
      }

      // 2. Send image + inventory checklist (id & name) to OpenRouter and validate structured JSON output
      const response = await identifyPantryItemsFromPhoto({
        imageDataUrl: processedImage.dataUrl,
        inventoryItems: items,
      });

      // 3. Only after strict validation succeeds, update the checklist in state & AsyncStorage
      applyRecognizedItems(response.foundItemIds);

      const foundSet = new Set(response.foundItemIds);
      const matchedNames = items
        .filter(item => foundSet.has(item.id))
        .map(item => item.name);

      setRecognitionResult({
        foundItemIds: response.foundItemIds,
        matchedItemNames: matchedNames,
        totalInventoryCount: items.length,
      });
    } catch (err: unknown) {
      if (err instanceof OpenRouterRecognitionError) {
        setRecognitionError(err.userMessage);
      } else {
        setRecognitionError(
          'An unexpected error occurred during item recognition. Your existing inventory was kept unchanged.',
        );
      }
    } finally {
      isIdentifyingRef.current = false;
      setIsIdentifying(false);
    }
  }, [applyRecognizedItems, capturedPhoto, items]);

  const handleCameraError = useCallback((error: Error) => {
    console.warn('VisionCamera session error:', error);
    setCameraError(
      error.message || 'Camera initialization encountered an error.',
    );
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

  // 3. Captured Photo Preview & AI Recognition State
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

            {isIdentifying ? (
              <View
                style={styles.identifyingOverlay}
                testID="identifying-loading-overlay">
                <View style={styles.identifyingCard}>
                  <ActivityIndicator size="large" color={Colors.greenMedium} />
                  <Text style={styles.identifyingTitle}>
                    Analyzing Supply Photo...
                  </Text>
                  <Text style={styles.identifyingSubtitle}>
                    Matching visible items against your {items.length}-item
                    pantry checklist
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.previewFooterCard}>
            {/* Error State */}
            {recognitionError ? (
              <View
                style={styles.recognitionErrorBox}
                testID="recognition-error-box">
                <Text style={styles.recognitionErrorTitle}>
                  Recognition Could Not Complete
                </Text>
                <Text style={styles.recognitionErrorText}>
                  {recognitionError}
                </Text>
                <Text style={styles.recognitionErrorHint}>
                  Your existing pantry checklist was kept unchanged.
                </Text>
              </View>
            ) : null}

            {/* Success / Result Feedback State */}
            {recognitionResult ? (
              <View
                style={styles.recognitionResultBox}
                testID="recognition-result-box">
                <View style={styles.resultHeaderRow}>
                  <View style={styles.resultStatusBadge}>
                    <Text style={styles.resultStatusBadgeText}>
                      ✓ Checklist Updated
                    </Text>
                  </View>
                  <Text style={styles.resultCountText}>
                    {recognitionResult.matchedItemNames.length} of{' '}
                    {recognitionResult.totalInventoryCount} matched
                  </Text>
                </View>

                {recognitionResult.matchedItemNames.length > 0 ? (
                  <>
                    <Text style={styles.resultSummaryText}>
                      Marked {recognitionResult.matchedItemNames.length}{' '}
                      recognized{' '}
                      {recognitionResult.matchedItemNames.length === 1
                        ? 'item'
                        : 'items'}{' '}
                      as stocked and unchecked remaining items:
                    </Text>
                    <ScrollView
                      style={styles.matchedItemsScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}>
                      {recognitionResult.matchedItemNames.map((name, idx) => (
                        <View
                          key={`${name}-${idx}`}
                          style={styles.matchedItemPill}>
                          <Text style={styles.matchedItemCheck}>✓</Text>
                          <Text
                            style={styles.matchedItemName}
                            numberOfLines={1}>
                            {name}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <Text style={styles.resultEmptyText}>
                    No items from your pantry checklist were clearly recognized
                    in this photo. All checklist items have been marked as
                    unchecked.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.viewPantryButton}
                  onPress={() => navigation.navigate('Pantry')}
                  activeOpacity={0.85}
                  testID="button-view-pantry">
                  <Text style={styles.viewPantryButtonText}>
                    View Updated Pantry Checklist →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Default Prompt Header when no result/error yet */}
            {!recognitionResult && !recognitionError ? (
              <>
                <Text style={styles.previewFooterTitle}>
                  Ready for AI Supply Recognition
                </Text>
                <Text style={styles.previewFooterSubtitle}>
                  Tap &ldquo;Identify Items&rdquo; to detect which supplies from
                  your {items.length}-item checklist are visible in this photo.
                </Text>
              </>
            ) : null}

            {/* Action Buttons Row */}
            <View style={styles.previewActionsRow}>
              <TouchableOpacity
                style={[
                  styles.identifyButton,
                  isIdentifying ? styles.buttonDisabled : null,
                ]}
                onPress={handleIdentifyItems}
                disabled={isIdentifying}
                activeOpacity={0.85}
                accessibilityLabel="Identify Items"
                testID="button-identify-items">
                {isIdentifying ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.textOnPrimary}
                    style={styles.identifySpinner}
                  />
                ) : (
                  <Text style={styles.identifyButtonIcon}>✨</Text>
                )}
                <Text style={styles.identifyButtonText}>
                  {isIdentifying ? 'Identifying...' : 'Identify Items'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.retakeButton,
                  isIdentifying ? styles.buttonDisabled : null,
                ]}
                onPress={handleRetake}
                disabled={isIdentifying}
                activeOpacity={0.85}
                accessibilityLabel="Retake Photo"
                testID="button-retake-photo">
                <Text style={styles.retakeButtonIcon}>↺</Text>
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
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
              Center pantry supplies in frame, then capture photo
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
    padding: Spacing.md,
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
    marginBottom: Spacing.md,
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
  identifyingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 30, 50, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  identifyingCard: {
    backgroundColor: Colors.navyPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.greenPrimary,
    width: '90%',
  },
  identifyingTitle: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 16,
    marginTop: Spacing.md,
    marginBottom: 4,
    textAlign: 'center',
  },
  identifyingSubtitle: {
    fontFamily: Fonts.regular,
    color: '#CBD5E1',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
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
    fontSize: 16,
    color: Colors.navyPrimary,
    marginBottom: 4,
  },
  previewFooterSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  recognitionErrorBox: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  recognitionErrorTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.danger,
    marginBottom: 4,
  },
  recognitionErrorText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.navyDark,
    lineHeight: 18,
    marginBottom: 4,
  },
  recognitionErrorHint: {
    fontFamily: Fonts.semiBold,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  recognitionResultBox: {
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultStatusBadge: {
    backgroundColor: Colors.greenPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  resultStatusBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
    color: Colors.textOnPrimary,
  },
  resultCountText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.navyPrimary,
  },
  resultSummaryText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  matchedItemsScroll: {
    maxHeight: 96,
    marginBottom: Spacing.sm,
  },
  matchedItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchedItemCheck: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.greenPrimary,
    marginRight: 6,
  },
  matchedItemName: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.navyPrimary,
    flex: 1,
  },
  resultEmptyText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.navyPrimary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  viewPantryButton: {
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 9,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  viewPantryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: Colors.textOnPrimary,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  identifyButton: {
    flex: 1.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.greenPrimary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  identifySpinner: {
    marginRight: 8,
  },
  identifyButtonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  identifyButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textOnPrimary,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  retakeButtonIcon: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.greenMedium,
    marginRight: 6,
  },
  retakeButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: Colors.textOnPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
