/**
 * Web implementation of `react-native-nitro-image` backed by HTML5 <canvas>.
 * Supports `Images.loadFromFileAsync`, `.resizeAsync(w, h)`, and `.toEncodedImageDataAsync('jpg', quality)`.
 */

class WebNitroImage {
  private canvas: HTMLCanvasElement;
  public readonly width: number;
  public readonly height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  async resizeAsync(targetW: number, targetH: number): Promise<WebNitroImage> {
    const resized = document.createElement('canvas');
    resized.width = targetW;
    resized.height = targetH;
    const ctx = resized.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create 2D canvas context for image resize.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.canvas, 0, 0, targetW, targetH);
    return new WebNitroImage(resized);
  }

  async toEncodedImageDataAsync(
    format: 'jpg' | 'jpeg' | 'png' = 'jpg',
    quality = 72,
  ): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const normalizedQuality = Math.max(0.01, Math.min(1, quality / 100));

    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob(
        b => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Canvas JPEG encoding failed.'));
          }
        },
        mime,
        normalizedQuality,
      );
    });

    const buffer = await blob.arrayBuffer();
    return {
      buffer,
      width: this.width,
      height: this.height,
    };
  }

  dispose(): void {
    // No-op on web GC
  }
}

export const Images = {
  async loadFromFileAsync(filePathOrUri: string): Promise<WebNitroImage> {
    const cleanSrc = filePathOrUri.replace(/^file:\/\/(?=(data:|blob:|https?:|\/))/i, '');

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.crossOrigin = 'anonymous';
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Failed to load captured photo in browser.'));
      element.src = cleanSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 800;
    canvas.height = img.naturalHeight || img.height || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to initialize 2D canvas context.');
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new WebNitroImage(canvas);
  },
};
