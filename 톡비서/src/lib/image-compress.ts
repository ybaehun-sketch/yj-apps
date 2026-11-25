async function loadDrawable(file: Blob): Promise<{ source: ImageBitmap | HTMLImageElement; width: number; height: number; cleanup: () => void }> {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => URL.revokeObjectURL(url),
      });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("이미지 디코딩 실패"));
      };
      img.src = url;
    });
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/** Compress an image in the browser to WebP (with JPEG/Image fallback), max 960x1600. Call only from event handlers. */
export async function compressToWebp(file: Blob, maxWidth = 960, quality = 0.78, maxHeight = 1600): Promise<Blob> {
  const { source, width, height, cleanup } = await loadDrawable(file);
  try {
    const scale = Math.min(1, maxWidth / Math.max(1, width), maxHeight / Math.max(1, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스 초기화 실패");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const webp = await canvasToBlob(canvas, "image/webp", quality);
    if (webp) return webp;
    const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
    if (jpeg) return jpeg;
    throw new Error("압축 실패");
  } finally {
    cleanup();
  }
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}
