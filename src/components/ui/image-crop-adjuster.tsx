"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropAdjusterProps {
  /** The raw File selected by the user */
  file: File;
  /** Width ÷ Height ratio of the crop frame (e.g. 1 for square, 0.75 for 3:4 portrait) */
  aspectRatio: number;
  /** Pixel width of the exported image */
  outputWidth: number;
  /** Pixel height of the exported image */
  outputHeight: number;
  /** Prefix for the standardised filename, e.g. "profile" or "gallery" */
  namePrefix: string;
  /** Called with the cropped WebP File when the user clicks Apply */
  onConfirm: (file: File) => void;
  /** Called when the user dismisses the dialog without applying */
  onCancel: () => void;
}

/** Height of the in-dialog canvas preview in pixels */
const PREVIEW_H = 380;

export function ImageCropAdjuster({
  file,
  aspectRatio,
  outputWidth,
  outputHeight,
  namePrefix,
  onConfirm,
  onCancel,
}: ImageCropAdjusterProps) {
  const previewH = PREVIEW_H;
  const previewW = Math.round(PREVIEW_H * aspectRatio);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef({ active: false, x: 0, y: 0, ox: 0, oy: 0 });

  const [isLoaded, setIsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Load the File into an <img> element
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      // Minimum scale = image must fully cover the canvas
      const min = Math.max(previewW / img.naturalWidth, previewH / img.naturalHeight);
      setMinScale(min);
      setScale(min);
      setOffset({ x: 0, y: 0 });
      setIsLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, previewW, previewH]);

  /**
   * Clamp offset so that the image never shows a gap inside the canvas.
   * The image is drawn centered on the canvas, then shifted by offset.
   */
  const clamp = useCallback(
    (ox: number, oy: number, s: number) => {
      const img = imgRef.current;
      if (!img) return { x: ox, y: oy };
      const drawW = img.naturalWidth * s;
      const drawH = img.naturalHeight * s;
      const maxX = Math.max(0, (drawW - previewW) / 2);
      const maxY = Math.max(0, (drawH - previewH) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [previewW, previewH]
  );

  // Re-draw canvas whenever scale / offset / image changes
  useEffect(() => {
    if (!isLoaded || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = imgRef.current;
    ctx.clearRect(0, 0, previewW, previewH);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (previewW - drawW) / 2 + offset.x;
    const y = (previewH - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
  }, [isLoaded, scale, offset, previewW, previewH]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const applyZoom = useCallback(
    (next: number) => {
      const clamped = Math.max(minScale, Math.min(next, minScale * 4));
      setScale(clamped);
      setOffset((o) => clamp(o.x, o.y, clamped));
      return clamped;
    },
    [minScale, clamp]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      applyZoom(scale * (1 - e.deltaY * 0.001));
    },
    [scale, applyZoom]
  );

  // ── Pan (mouse + touch) ───────────────────────────────────────────────────
  const startDrag = (clientX: number, clientY: number) => {
    drag.current = { active: true, x: clientX, y: clientY, ox: offset.x, oy: offset.y };
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!drag.current.active) return;
    const dx = clientX - drag.current.x;
    const dy = clientY - drag.current.y;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy, scale));
  };
  const endDrag = () => {
    drag.current.active = false;
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScale(minScale);
    setOffset({ x: 0, y: 0 });
  };

  // ── Slider ────────────────────────────────────────────────────────────────
  const maxScale = minScale * 4;
  const sliderValue =
    maxScale > minScale ? Math.round(((scale - minScale) / (maxScale - minScale)) * 100) : 0;

  const handleSlider = (v: number) => {
    applyZoom(minScale + ((maxScale - minScale) * v) / 100);
  };

  // ── Apply: export canvas → WebP File with standardised name ───────────────
  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = outputWidth;
    out.height = outputHeight;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Scale the preview-space transform up to the output resolution
    const sx = outputWidth / previewW;
    const sy = outputHeight / previewH;
    const drawW = img.naturalWidth * scale * sx;
    const drawH = img.naturalHeight * scale * sy;
    const x = (outputWidth - drawW) / 2 + offset.x * sx;
    const y = (outputHeight - drawH) / 2 + offset.y * sy;
    ctx.drawImage(img, x, y, drawW, drawH);

    out.toBlob(
      (blob) => {
        if (!blob) return;
        // Standardised name: {prefix}-{unix-ms}.webp
        const name = `${namePrefix}-${Date.now()}.webp`;
        onConfirm(new File([blob], name, { type: "image/webp" }));
      },
      "image/webp",
      0.92
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Photo Position</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground -mt-2 text-sm">
          Drag to reposition · Scroll or use the slider to zoom
        </p>

        {/* Canvas preview area */}
        <div className="flex justify-center">
          <div
            className="border-brand/30 bg-muted overflow-hidden rounded-xl border-2 shadow-inner"
            style={{ width: previewW, height: previewH }}
          >
            {!isLoaded ? (
              <div className="bg-muted-foreground/10 h-full w-full animate-pulse" />
            ) : (
              <canvas
                ref={canvasRef}
                width={previewW}
                height={previewH}
                className="block cursor-grab touch-none active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  startDrag(t.clientX, t.clientY);
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0];
                  moveDrag(t.clientX, t.clientY);
                }}
                onTouchEnd={endDrag}
              />
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomOut className="text-muted-foreground h-4 w-4 shrink-0" />
          <Slider
            min={0}
            max={100}
            step={1}
            value={[sliderValue]}
            onValueChange={([v]) => handleSlider(v)}
            className="flex-1"
            disabled={!isLoaded}
          />
          <ZoomIn className="text-muted-foreground h-4 w-4 shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={!isLoaded}
            title="Reset position"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={!isLoaded}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
