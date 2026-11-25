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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForVisible(): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState === "visible") return;
  await new Promise<void>((resolve) => {
    const done = () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(t);
      resolve();
    };
    const onVis = () => { if (document.visibilityState === "visible") done(); };
    const t = setTimeout(done, 1500);
    document.addEventListener("visibilitychange", onVis);
  });
  await wait(120);
}

/**
 * Android TWA/WebView에서 사진 선택기 복귀 직후 content:// URI 읽기가 일시 실패할 수 있어
 * 화면 복귀(visible)를 확인한 뒤 arrayBuffer -> FileReader -> createImageBitmap/ObjectURL 순서로 재시도합니다.
 */
export async function readImageFileSafely(file: File): Promise<{ blob: Blob; preview?: string }> {
  if (file.size === 0) throw new Error("empty_file");
  await waitForVisible();
  const delays = [0, 300, 600, 1000, 1500, 2000];
  let err1 = "";
  let err2 = "";
  let err3 = "";
  let primaryErr: unknown;
  const fmt = (e: unknown) => (e instanceof Error ? `${e.name}:${e.message}` : String(e));
  for (const ms of delays) {
    if (ms > 0) await wait(ms);
    try {
      const buf = await file.arrayBuffer();
      return { blob: new Blob([buf], { type: file.type || "image/png" }) };
    } catch (e) {
      primaryErr = e;
      err1 = fmt(e);
    }
    try {
      const preview = await blobToDataUrl(file);
      const blob = await (await fetch(preview)).blob();
      return { blob, preview };
    } catch (e) {
      err2 = fmt(e);
    }
    try {
      const blob = await compressToWebp(file);
      return { blob };
    } catch (e) {
      err3 = fmt(e);
    }
  }
  const out = primaryErr instanceof Error ? primaryErr : new Error("image_read_failed");
  (out as Error & { details?: unknown }).details = { err1, err2, err3 };
  throw out;
}
