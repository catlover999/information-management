import { Images } from 'react-native-nitro-image';

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Pure TypeScript/JS Uint8Array to Base64 encoder (RFC 4648) compatible with
 * React Native Hermes runtime without relying on browser DOM APIs.
 */
/* eslint-disable no-bitwise */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const len = bytes.length;
  const chunks: string[] = [];
  const chunkSize = 3072; // Multiple of 3 for clean base64 blocks

  for (let offset = 0; offset < len; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, len);
    let segment = '';

    for (let i = offset; i < end; i += 3) {
      const b1 = bytes[i];
      const hasB2 = i + 1 < len;
      const hasB3 = i + 2 < len;
      const b2 = hasB2 ? bytes[i + 1] : 0;
      const b3 = hasB3 ? bytes[i + 2] : 0;

      const triplet = (b1 << 16) | (b2 << 8) | b3;

      segment +=
        BASE64_CHARS[(triplet >> 18) & 0x3f] +
        BASE64_CHARS[(triplet >> 12) & 0x3f] +
        (hasB2 ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=') +
        (hasB3 ? BASE64_CHARS[triplet & 0x3f] : '=');
    }
    chunks.push(segment);
  }

  return chunks.join('');
}
/* eslint-enable no-bitwise */

export interface ProcessedImageResult {
  dataUrl: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  byteLength: number;
}

export interface ImageProcessOptions {
  maxDimension?: number;
  jpegQuality?: number; // 1 to 100
}

/**
 * Loads a captured photo from the device filesystem, resizes it to a compact
 * resolution (default max 768px), compresses it as a JPEG (default quality 72),
 * and returns a base64 data URL (`data:image/jpeg;base64,...`).
 */
export async function processCapturedImageToDataUrl(
  filePathOrUri: string,
  options: ImageProcessOptions = {},
): Promise<ProcessedImageResult> {
  const maxDimension = options.maxDimension ?? 768;
  const jpegQuality = options.jpegQuality ?? 72;

  if (!filePathOrUri || !filePathOrUri.trim()) {
    throw new Error('Invalid image path: no photo file was provided.');
  }

  const cleanFilePath = filePathOrUri.replace(/^file:\/\//, '');

  let sourceImage: Awaited<ReturnType<typeof Images.loadFromFileAsync>> | null =
    null;
  let resizedImage: Awaited<
    ReturnType<typeof Images.loadFromFileAsync>
  > | null = null;

  try {
    sourceImage = await Images.loadFromFileAsync(cleanFilePath);
    const srcW = sourceImage.width;
    const srcH = sourceImage.height;

    if (srcW <= 0 || srcH <= 0) {
      throw new Error('Captured image has invalid dimensions.');
    }

    let targetW = srcW;
    let targetH = srcH;
    const longestSide = Math.max(srcW, srcH);

    if (longestSide > maxDimension) {
      const scale = maxDimension / longestSide;
      targetW = Math.max(1, Math.round(srcW * scale));
      targetH = Math.max(1, Math.round(srcH * scale));
    }

    if (targetW !== srcW || targetH !== srcH) {
      resizedImage = await sourceImage.resizeAsync(targetW, targetH);
    } else {
      resizedImage = sourceImage;
    }

    const encoded = await resizedImage.toEncodedImageDataAsync(
      'jpg',
      jpegQuality,
    );
    const bytes = new Uint8Array(encoded.buffer);

    if (bytes.byteLength === 0) {
      throw new Error('Compressed image buffer is empty.');
    }

    const base64 = uint8ArrayToBase64(bytes);
    const mimeType = 'image/jpeg' as const;

    return {
      dataUrl: `data:${mimeType};base64,${base64}`,
      mimeType,
      width: encoded.width,
      height: encoded.height,
      byteLength: bytes.byteLength,
    };
  } catch (err: unknown) {
    const detail =
      err instanceof Error ? err.message : 'Unable to process captured image.';
    throw new Error(`Image processing failed: ${detail}`);
  } finally {
    try {
      if (resizedImage && resizedImage !== sourceImage) {
        (resizedImage as { dispose?: () => void }).dispose?.();
      }
      if (sourceImage) {
        (sourceImage as { dispose?: () => void }).dispose?.();
      }
    } catch {
      // Ignore disposal cleanup errors
    }
  }
}
