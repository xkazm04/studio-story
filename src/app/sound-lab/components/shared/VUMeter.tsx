'use client';

import { useRef, useEffect } from 'react';

interface VUMeterProps {
  level: number;      // 0-1 current level
  peak?: number;      // 0-1 peak hold
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Canvas-based VU meter with green→yellow→red gradient and peak hold.
 * Renders at 60fps via requestAnimationFrame.
 */
export default function VUMeter({
  level,
  peak = 0,
  width = 4,
  height = 24,
  orientation = 'vertical',
}: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakRef = useRef(0);
  const peakDecayRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, width, height);

      // Update peak hold
      const currentPeak = Math.max(level, peak);
      if (currentPeak > peakRef.current) {
        peakRef.current = currentPeak;
        peakDecayRef.current = 90; // ~1.5s at 60fps
      } else if (peakDecayRef.current > 0) {
        peakDecayRef.current--;
      } else {
        peakRef.current = Math.max(0, peakRef.current - 0.01);
      }

      const isVertical = orientation === 'vertical';
      const size = isVertical ? height : width;
      const fillSize = level * size;
      const peakPos = peakRef.current * size;

      if (isVertical) {
        // Green (0-60%) → Yellow (60-85%) → Red (85-100%)
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#22c55e');     // green-500
        grad.addColorStop(0.6, '#eab308');   // yellow-500
        grad.addColorStop(0.85, '#ef4444');  // red-500
        grad.addColorStop(1, '#ef4444');

        ctx.fillStyle = grad;
        ctx.fillRect(0, height - fillSize, width, fillSize);

        // Peak hold line
        if (peakRef.current > 0.01) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(0, height - peakPos, width, 1);
        }
      } else {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.6, '#eab308');
        grad.addColorStop(0.85, '#ef4444');
        grad.addColorStop(1, '#ef4444');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, fillSize, height);

        if (peakRef.current > 0.01) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(peakPos - 1, 0, 1, height);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [level, peak, width, height, orientation]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="shrink-0"
    />
  );
}
