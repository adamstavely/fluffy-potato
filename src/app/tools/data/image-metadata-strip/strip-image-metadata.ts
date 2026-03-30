/** Target MIME for canvas export; falls back to PNG when the browser cannot encode. */
export function pickOutputMime(fileType: string): string {
  const t = fileType.toLowerCase();
  if (t === 'image/jpeg' || t === 'image/jpg') {
    return 'image/jpeg';
  }
  if (t === 'image/webp') {
    return 'image/webp';
  }
  if (t === 'image/png') {
    return 'image/png';
  }
  // GIF/BMP/tiff/etc.: PNG is widely supported and strips embedded metadata.
  return 'image/png';
}

export function outputFilename(originalName: string, outMime: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '') || 'image';
  const ext =
    outMime === 'image/jpeg'
      ? 'jpg'
      : outMime === 'image/webp'
        ? 'webp'
        : outMime === 'image/png'
          ? 'png'
          : 'png';
  return `${base}-stripped.${ext}`;
}

/**
 * Re-encodes a raster image through a canvas so EXIF and other container metadata are not copied.
 * Animated GIF becomes a single PNG frame. Very large canvases may fail depending on the browser.
 */
export async function stripImageMetadata(file: File): Promise<{ blob: Blob; mimeType: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) {
      throw new Error('Invalid image dimensions.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context.');
    }
    ctx.drawImage(img, 0, 0);
    const targetMime = pickOutputMime(file.type);
    const blob = await canvasToBlob(canvas, targetMime);
    return { blob, mimeType: blob.type || targetMime };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const quality = mime === 'image/jpeg' ? 0.92 : undefined;
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
          return;
        }
        if (mime !== 'image/png') {
          canvas.toBlob((b2) => {
            if (b2) {
              resolve(b2);
            } else {
              reject(new Error('Could not encode image.'));
            }
          }, 'image/png');
        } else {
          reject(new Error('Could not encode image.'));
        }
      },
      mime,
      quality,
    );
  });
}
