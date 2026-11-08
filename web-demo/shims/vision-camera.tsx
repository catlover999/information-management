import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TargetCameraPosition = 'back' | 'front';
export type FlashMode = 'off' | 'on' | 'auto';
export interface CameraRef {}

export interface CameraDevice {
  id: string;
  position: TargetCameraPosition;
  hasFlash: boolean;
}

interface CaptureState {
  videoEl: HTMLVideoElement | null;
  uploadedDataUrl: string | null;
  uploadedWidth: number;
  uploadedHeight: number;
}

const activeCaptureState: CaptureState = {
  videoEl: null,
  uploadedDataUrl: null,
  uploadedWidth: 0,
  uploadedHeight: 0,
};

let cachedDemoScene: { dataUrl: string; width: number; height: number } | null = null;

/**
 * Generates a realistic synthetic pantry supplies photo onto a canvas when testing
 * in an environment without a hardware webcam (or before picking a photo).
 */
function renderDemoPantryCanvas(): { dataUrl: string; width: number; height: number } {
  if (cachedDemoScene) {
    return cachedDemoScene;
  }
  const width = 960;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pantry wooden shelf background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1E293B');
  bgGrad.addColorStop(0.65, '#334155');
  bgGrad.addColorStop(1, '#475569');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Wooden shelf plank
  ctx.fillStyle = '#78350F';
  ctx.fillRect(0, 520, width, 34);
  ctx.fillStyle = '#92400E';
  ctx.fillRect(0, 512, width, 12);

  // Item 1: 9L Mineral Water Bottles pack (left)
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(70, 210, 185, 302);
  ctx.fillStyle = '#E0F2FE';
  ctx.fillRect(82, 265, 161, 130);
  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('MINERAL', 98, 312);
  ctx.fillText('WATER 9L', 98, 344);
  ctx.font = '18px sans-serif';
  ctx.fillText('6 x 1.5L Still Water', 88, 378);

  // Item 2: Jasmine Rice & Pasta bag (center-left)
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(290, 250, 175, 262);
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(302, 290, 151, 140);
  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText('JASMINE', 318, 335);
  ctx.fillText('RICE & PASTA', 306, 368);
  ctx.font = '18px sans-serif';
  ctx.fillText('Durum Penne 2kg', 310, 405);

  // Item 3: Canned Vegetables & Tomatoes (center-right)
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(500, 310, 165, 202);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(500, 310, 165, 16);
  ctx.fillRect(500, 496, 165, 16);
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(512, 345, 141, 120);
  ctx.fillStyle = '#991B1B';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('CANNED', 534, 382);
  ctx.fillText('VEGETABLES', 515, 412);
  ctx.font = '17px sans-serif';
  ctx.fillText('Tomatoes & Corn', 518, 444);

  // Item 4: Swiss Milk Chocolate bar (right)
  ctx.fillStyle = '#451A03';
  ctx.fillRect(700, 340, 185, 172);
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(712, 365, 161, 110);
  ctx.fillStyle = '#451A03';
  ctx.font = 'bold 23px sans-serif';
  ctx.fillText('SWISS MILK', 725, 408);
  ctx.fillText('CHOCOLATE', 722, 440);

  cachedDemoScene = {
    dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    width,
    height,
  };
  return cachedDemoScene;
}

export function useCameraPermission() {
  return {
    hasPermission: true,
    requestPermission: async () => true,
  };
}

export function useCameraDevice(position: TargetCameraPosition): CameraDevice {
  return {
    id: `web-camera-${position}`,
    position,
    hasFlash: true,
  };
}

export function usePhotoOutput(_options?: {
  quality?: number;
  qualityPrioritization?: string;
}) {
  return {
    capturePhotoToFile: async (_captureOpts?: any, _extras?: any) => {
      // 1. If the user selected a photo from their phone camera / file picker, use it
      if (activeCaptureState.uploadedDataUrl) {
        return {
          filePath: activeCaptureState.uploadedDataUrl,
          width: activeCaptureState.uploadedWidth || 1024,
          height: activeCaptureState.uploadedHeight || 768,
        };
      }

      // 2. If a live WebRTC video stream is active, capture the current video frame
      const video = activeCaptureState.videoEl;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          return {
            filePath: dataUrl,
            width,
            height,
          };
        }
      }

      // 3. Fallback: capture the synthetic demo pantry shelf canvas
      const demo = renderDemoPantryCanvas();
      return {
        filePath: demo.dataUrl,
        width: demo.width,
        height: demo.height,
      };
    },
  };
}

export const Camera = forwardRef<CameraRef, any>((props, ref) => {
  const {
    device,
    isActive,
    onPreviewStarted,
    onPreviewStopped,
    style,
  } = props;

  useImperativeHandle(ref, () => ({}));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [streamMode, setStreamMode] = useState<'live' | 'fallback' | 'uploaded'>(() =>
    activeCaptureState.uploadedDataUrl ? 'uploaded' : 'fallback',
  );
  const [fallbackPreviewUrl, setFallbackPreviewUrl] = useState<string>(
    () => activeCaptureState.uploadedDataUrl || renderDemoPantryCanvas().dataUrl,
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startStream() {
      if (!isActive) {
        onPreviewStopped?.();
        return;
      }

      // Mark preview ready immediately so UI reticle & controls are never blocked
      onPreviewStarted?.();

      if (activeCaptureState.uploadedDataUrl) {
        setStreamMode('uploaded');
        setFallbackPreviewUrl(activeCaptureState.uploadedDataUrl);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const facingMode = device?.position === 'front' ? 'user' : 'environment';
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 960 },
              },
              audio: false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }

          if (cancelled) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          setStreamMode('live');
          requestAnimationFrame(() => {
            if (videoRef.current && stream) {
              videoRef.current.srcObject = stream;
              activeCaptureState.videoEl = videoRef.current;
            }
          });
          return;
        } catch {
          // Keep fallback scene active
        }
      }
    }

    startStream();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (activeCaptureState.videoEl === videoRef.current) {
        activeCaptureState.videoEl = null;
      }
    };
  }, [isActive, device?.position]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const img = new window.Image();
      img.onload = () => {
        activeCaptureState.uploadedDataUrl = dataUrl;
        activeCaptureState.uploadedWidth = img.naturalWidth || 1024;
        activeCaptureState.uploadedHeight = img.naturalHeight || 768;
        setFallbackPreviewUrl(dataUrl);
        setStreamMode('uploaded');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <View style={[styles.container, style]}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {streamMode === 'live' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <img
          src={fallbackPreviewUrl}
          alt="Camera viewfinder"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Non-intrusive top helper pill for uploading/capturing via native mobile input */}
      <View style={styles.webHelperBar}>
        <View style={styles.helperButtonsRow}>
          <TouchableOpacity
            style={styles.uploadPill}
            onPress={() => fileInputRef.current?.click()}
            activeOpacity={0.85}>
            <Text style={styles.uploadPillText}>
              📷 {streamMode === 'uploaded' ? 'Change Photo' : 'Phone Camera / Upload Photo'}
            </Text>
          </TouchableOpacity>

          {streamMode === 'uploaded' ? (
            <TouchableOpacity
              style={styles.resetPill}
              onPress={() => {
                activeCaptureState.uploadedDataUrl = null;
                const demo = renderDemoPantryCanvas();
                setFallbackPreviewUrl(demo.dataUrl);
                setStreamMode(activeCaptureState.videoEl ? 'live' : 'fallback');
              }}
              activeOpacity={0.85}>
              <Text style={styles.resetPillText}>✕ Reset</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  webHelperBar: {
    position: 'absolute',
    top: 58,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  helperButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  uploadPillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  resetPill: {
    backgroundColor: 'rgba(15, 41, 66, 0.9)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  resetPillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});
