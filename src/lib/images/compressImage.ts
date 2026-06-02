const scaleToMaxDimension = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

export interface CompressImageOptions {
  /** Longest edge in pixels after resize. */
  maxDimension?: number;
  /** Target upper bound for output file size. */
  maxBytes?: number;
  /** Preferred output format (JPEG is smallest for photos). */
  mimeType?: "image/jpeg" | "image/webp";
  /** Base filename without extension. */
  filenameStem?: string;
}

const DEFAULT_MAX_DIMENSION = 512;
const DEFAULT_MAX_BYTES = 1.8 * 1024 * 1024;

/**
 * Resize and compress an image in the browser before upload.
 */
export const compressImageForUpload = async (
  file: File,
  options: CompressImageOptions = {}
): Promise<File> => {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const mimeType = options.mimeType ?? "image/jpeg";
  const filenameStem =
    options.filenameStem ?? (file.name.replace(/\.[^.]+$/, "") || "image");
  const ext = mimeType === "image/webp" ? "webp" : "jpg";

  let maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;

  const bitmap = await createImageBitmap(file);
  try {
    while (maxDimension >= 128) {
      const { width, height } = scaleToMaxDimension(
        bitmap.width,
        bitmap.height,
        maxDimension
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not process image");
      }
      ctx.drawImage(bitmap, 0, 0, width, height);

      let quality = 0.88;
      let blob: Blob | null = null;
      while (quality >= 0.45) {
        blob = await canvasToBlob(canvas, mimeType, quality);
        if (blob && blob.size <= maxBytes) {
          return new File([blob], `${filenameStem}.${ext}`, {
            type: mimeType,
            lastModified: Date.now(),
          });
        }
        quality -= 0.08;
      }

      maxDimension = Math.round(maxDimension * 0.75);
    }

    throw new Error(
      "This photo is too large to upload even after compression. Try a smaller image."
    );
  } finally {
    bitmap.close();
  }
};
