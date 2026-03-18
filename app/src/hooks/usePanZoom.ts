import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent, RefObject } from 'react';

interface PanZoomState {
  scale: number;
  offset: { x: number; y: number };
  isPanning: boolean;
}

interface UsePanZoomOptions {
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  wheelZoomFactor?: number;
}

interface UsePanZoomReturn extends PanZoomState {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: () => void;
}

/**
 * Hook for pan & zoom on a canvas element.
 * Supports mouse wheel zoom, drag-to-pan, and touch pinch-zoom.
 */
export function usePanZoom(options: UsePanZoomOptions = {}): UsePanZoomReturn {
  const {
    minScale = 0.4,
    maxScale = 2,
    zoomStep = 1.15,
    wheelZoomFactor = 1.08,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Touch state for pinch-zoom
  const lastTouchDistRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const clampScale = useCallback(
    (s: number) => Math.min(maxScale, Math.max(minScale, s)),
    [minScale, maxScale],
  );

  // ---- Mouse wheel zoom ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? wheelZoomFactor : 1 / wheelZoomFactor;
      setScale((s) => clampScale(s * factor));
    };

    container.addEventListener('wheel', wheelListener, { passive: false });
    return () => container.removeEventListener('wheel', wheelListener);
  }, [clampScale, wheelZoomFactor]);

  // ---- Mouse pan ----
  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return;
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ---- Touch pan & pinch-zoom ----
  const getTouchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        lastTouchDistRef.current = getTouchDistance(e.touches);
        lastTouchCenterRef.current = getTouchCenter(e.touches);
      } else if (e.touches.length === 1) {
        // Pan start
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - offset.x,
          y: e.touches[0].clientY - offset.y,
        });
      }
    },
    [offset],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
        // Pinch zoom
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        const ratio = newDist / lastTouchDistRef.current;
        setScale((s) => clampScale(s * ratio));
        lastTouchDistRef.current = newDist;

        // Pan while pinching
        const center = getTouchCenter(e.touches);
        if (lastTouchCenterRef.current) {
          setOffset((o) => ({
            x: o.x + (center.x - lastTouchCenterRef.current!.x),
            y: o.y + (center.y - lastTouchCenterRef.current!.y),
          }));
        }
        lastTouchCenterRef.current = center;
      } else if (e.touches.length === 1 && isPanning) {
        // Single-finger pan
        setOffset({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart, clampScale],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistRef.current = null;
    lastTouchCenterRef.current = null;
  }, []);

  // ---- Zoom controls ----
  const zoomIn = useCallback(
    () => setScale((s) => clampScale(s * zoomStep)),
    [clampScale, zoomStep],
  );

  const zoomOut = useCallback(
    () => setScale((s) => clampScale(s / zoomStep)),
    [clampScale, zoomStep],
  );

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  return {
    containerRef,
    canvasRef,
    scale,
    offset,
    isPanning,
    zoomIn,
    zoomOut,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
