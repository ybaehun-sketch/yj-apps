import { showAlert } from './dialog.js';

/**
 * 「쓱-지우개」 & 「영역 자르기(모서리·선 조절 + 전체 이동)」 부품
 * - 쓱-지우개: 주변 종이 색을 자동으로 읽어 낙서/필기를 감쪽같이 덮어줍니다.
 * - 자르기: 네모 영역의 4개 모서리·4개 선을 끌어 늘리거나 줄이고, 안쪽을 잡아 전체 이동할 수 있습니다.
 */
export function createMagicEraser({
  canvas,
  onHintChange
}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let mode = 'eraser'; // 'eraser' | 'crop'
  let brushRadius = 22;
  let history = [];
  let isPointerDown = false;
  let dragAction = null; // null | 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
  let dragStart = null;
  let startRect = null;
  let cropRect = null;
  let baseBeforeCropOverlay = null;

  function pushHistory() {
    if (canvas.width === 0 || canvas.height === 0) return;
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 15) history.shift();
  }

  function loadDataUrl(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        history = [];
        pushHistory();
        baseBeforeCropOverlay = null;
        cropRect = null;
        resolve();
      };
      img.src = dataUrl;
    });
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (mode === 'eraser') {
      if (baseBeforeCropOverlay) {
        ctx.putImageData(baseBeforeCropOverlay, 0, 0);
        baseBeforeCropOverlay = null;
      }
      cropRect = null;
      canvas.style.cursor = 'crosshair';
      onHintChange?.('내가 푼 볼펜·형광펜 자국 위를 손가락으로 쓱 문질러 지우세요.');
    } else {
      if (!baseBeforeCropOverlay && canvas.width > 0 && canvas.height > 0) {
        baseBeforeCropOverlay = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      if (canvas.width > 0 && canvas.height > 0) {
        const padX = Math.round(canvas.width * 0.08);
        const padY = Math.round(canvas.height * 0.08);
        cropRect = {
          x: padX,
          y: padY,
          w: Math.max(30, canvas.width - padX * 2),
          h: Math.max(30, canvas.height - padY * 2)
        };
        drawCropOverlay(cropRect);
      }
      onHintChange?.('모서리나 선을 끌어 크기를 맞추고, 안쪽을 잡아 이동한 뒤 [잘라내기 적용]을 누르세요.');
    }
  }

  function setBrushSize(size) {
    brushRadius = Number(size) || 22;
  }

  function undo() {
    if (baseBeforeCropOverlay) {
      ctx.putImageData(baseBeforeCropOverlay, 0, 0);
      baseBeforeCropOverlay = null;
      cropRect = null;
    }
    if (history.length > 1) {
      history.pop();
      const prev = history[history.length - 1];
      canvas.width = prev.width;
      canvas.height = prev.height;
      ctx.putImageData(prev, 0, 0);
    }
    if (mode === 'crop' && canvas.width > 0) {
      setMode('crop');
    }
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function getHitTolerance() {
    const displayWidth = Math.max(canvas.clientWidth || 340, 240);
    return 18 * (canvas.width / displayWidth);
  }

  function hitTestCrop(pos) {
    if (!cropRect) return 'draw';
    const tol = getHitTolerance();
    const { x, y, w, h } = cropRect;
    const right = x + w;
    const bottom = y + h;

    const nearLeft = Math.abs(pos.x - x) <= tol;
    const nearRight = Math.abs(pos.x - right) <= tol;
    const nearTop = Math.abs(pos.y - y) <= tol;
    const nearBottom = Math.abs(pos.y - bottom) <= tol;
    const withinX = pos.x >= x - tol && pos.x <= right + tol;
    const withinY = pos.y >= y - tol && pos.y <= bottom + tol;

    if (nearLeft && nearTop) return 'nw';
    if (nearRight && nearTop) return 'ne';
    if (nearLeft && nearBottom) return 'sw';
    if (nearRight && nearBottom) return 'se';
    if (nearTop && withinX) return 'n';
    if (nearBottom && withinX) return 's';
    if (nearLeft && withinY) return 'w';
    if (nearRight && withinY) return 'e';
    if (pos.x > x && pos.x < right && pos.y > y && pos.y < bottom) return 'move';
    return 'draw';
  }

  function cursorForAction(action) {
    switch (action) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'w':
      case 'e':
        return 'ew-resize';
      case 'move':
        return 'move';
      default:
        return 'crosshair';
    }
  }

  function samplePaperColor(cx, cy, radius) {
    const ring = Math.round(radius + 10);
    const x0 = Math.max(0, Math.floor(cx - ring));
    const y0 = Math.max(0, Math.floor(cy - ring));
    const x1 = Math.min(canvas.width - 1, Math.ceil(cx + ring));
    const y1 = Math.min(canvas.height - 1, Math.ceil(cy + ring));
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    if (w <= 0 || h <= 0) return 'rgb(255,255,255)';

    const data = ctx.getImageData(x0, y0, w, h).data;
    const candidates = [];
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      candidates.push({ r, g, b, lum });
    }
    if (!candidates.length) return 'rgb(255,255,255)';
    candidates.sort((a, b) => b.lum - a.lum);
    const topCount = Math.max(1, Math.floor(candidates.length * 0.35));
    let sr = 0, sg = 0, sb = 0;
    for (let i = 0; i < topCount; i++) {
      sr += candidates[i].r;
      sg += candidates[i].g;
      sb += candidates[i].b;
    }
    return `rgb(${Math.round(sr / topCount)}, ${Math.round(sg / topCount)}, ${Math.round(sb / topCount)})`;
  }

  function eraseAt(x, y) {
    const r = brushRadius * (canvas.width / Math.max(canvas.clientWidth || 360, 260));
    const paperColor = samplePaperColor(x, y, r);
    ctx.save();
    ctx.fillStyle = paperColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCropOverlay(rect) {
    if (!baseBeforeCropOverlay) return;
    ctx.putImageData(baseBeforeCropOverlay, 0, 0);
    ctx.save();
    ctx.fillStyle = 'rgba(17, 24, 39, 0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 선택된 영역만 밝게 복원
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    temp.getContext('2d').putImageData(baseBeforeCropOverlay, 0, 0);
    ctx.drawImage(temp, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);

    // 테두리
    const scale = canvas.width / Math.max(canvas.clientWidth || 340, 240);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = Math.max(2, 2 * scale);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    // 모서리 및 변 핸들
    const handleSize = Math.max(8, 10 * scale);
    const points = [
      [rect.x, rect.y],
      [rect.x + rect.w, rect.y],
      [rect.x, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h],
      [rect.x + rect.w / 2, rect.y],
      [rect.x + rect.w / 2, rect.y + rect.h],
      [rect.x, rect.y + rect.h / 2],
      [rect.x + rect.w, rect.y + rect.h / 2]
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.rect(px - handleSize / 2, py - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function updateCropFromDrag(pos) {
    const minSize = Math.max(24, Math.round(Math.min(canvas.width, canvas.height) * 0.08));
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (dragAction === 'draw') {
      const cx = clamp(pos.x, 0, canvas.width);
      const cy = clamp(pos.y, 0, canvas.height);
      const sx = clamp(dragStart.x, 0, canvas.width);
      const sy = clamp(dragStart.y, 0, canvas.height);
      cropRect = {
        x: Math.min(sx, cx),
        y: Math.min(sy, cy),
        w: Math.abs(cx - sx),
        h: Math.abs(cy - sy)
      };
      return;
    }

    if (dragAction === 'move' && startRect) {
      cropRect = {
        x: clamp(startRect.x + dx, 0, canvas.width - startRect.w),
        y: clamp(startRect.y + dy, 0, canvas.height - startRect.h),
        w: startRect.w,
        h: startRect.h
      };
      return;
    }

    if (!startRect) return;
    let left = startRect.x;
    let top = startRect.y;
    let right = startRect.x + startRect.w;
    let bottom = startRect.y + startRect.h;

    if (dragAction.includes('w')) {
      left = clamp(startRect.x + dx, 0, right - minSize);
    }
    if (dragAction.includes('e')) {
      right = clamp(startRect.x + startRect.w + dx, left + minSize, canvas.width);
    }
    if (dragAction.includes('n')) {
      top = clamp(startRect.y + dy, 0, bottom - minSize);
    }
    if (dragAction.includes('s')) {
      bottom = clamp(startRect.y + startRect.h + dy, top + minSize, canvas.height);
    }

    cropRect = {
      x: left,
      y: top,
      w: right - left,
      h: bottom - top
    };
  }

  function applyCrop() {
    if (!cropRect || cropRect.w < 20 || cropRect.h < 20) {
      showAlert('자르고 싶은 영역을 마우스나 손가락으로 먼저 지정해 주세요.');
      return false;
    }
    const source = baseBeforeCropOverlay || ctx.getImageData(0, 0, canvas.width, canvas.height);
    const temp = document.createElement('canvas');
    temp.width = source.width;
    temp.height = source.height;
    temp.getContext('2d').putImageData(source, 0, 0);

    canvas.width = Math.round(cropRect.w);
    canvas.height = Math.round(cropRect.h);
    ctx.drawImage(temp, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, canvas.width, canvas.height);
    baseBeforeCropOverlay = null;
    cropRect = null;
    pushHistory();
    return true;
  }

  canvas.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    const pos = getCanvasPos(e);
    if (mode === 'eraser') {
      eraseAt(pos.x, pos.y);
    } else {
      dragStart = pos;
      dragAction = hitTestCrop(pos);
      startRect = cropRect ? { ...cropRect } : null;
      if (dragAction === 'draw') {
        cropRect = { x: pos.x, y: pos.y, w: 0, h: 0 };
      }
      canvas.style.cursor = cursorForAction(dragAction);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const pos = getCanvasPos(e);
    if (!isPointerDown) {
      if (mode === 'crop') {
        canvas.style.cursor = cursorForAction(hitTestCrop(pos));
      }
      return;
    }
    if (mode === 'eraser') {
      eraseAt(pos.x, pos.y);
    } else if (dragStart) {
      updateCropFromDrag(pos);
      drawCropOverlay(cropRect);
    }
  });

  canvas.addEventListener('pointerup', () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    dragAction = null;
    startRect = null;
    if (mode === 'eraser') {
      pushHistory();
    }
  });

  function rotate90() {
    if (canvas.width === 0 || canvas.height === 0) return;
    if (baseBeforeCropOverlay) {
      ctx.putImageData(baseBeforeCropOverlay, 0, 0);
      baseBeforeCropOverlay = null;
      cropRect = null;
    }
    const oldW = canvas.width;
    const oldH = canvas.height;
    const temp = document.createElement('canvas');
    temp.width = oldW;
    temp.height = oldH;
    temp.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = oldH;
    canvas.height = oldW;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(temp, -oldW / 2, -oldH / 2);
    ctx.restore();

    pushHistory();
    if (mode === 'crop') {
      setMode('crop');
    }
  }

  function exportDataUrl() {
    if (baseBeforeCropOverlay) {
      ctx.putImageData(baseBeforeCropOverlay, 0, 0);
      baseBeforeCropOverlay = null;
    }
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  return {
    loadDataUrl,
    setMode,
    setBrushSize,
    undo,
    rotate90,
    applyCrop,
    exportDataUrl
  };
}
