'use client';

import { useRef, useEffect } from 'react';

interface SpectrumDisplayProps {
  data: Uint8Array;
  width?: number;
  height?: number;
}

/**
 * Compact frequency spectrum display using canvas.
 * Groups 128 frequency bins into 32 bars with exponential smoothing.
 */
export default function SpectrumDisplay({
  data,
  width = 60,
  height = 20,
}: SpectrumDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedRef = useRef<number[]>(new Array(32).fill(0));
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
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const numBars = 32;
      const binsPerBar = Math.floor(data.length / numBars) || 1;
      const barWidth = (width - numBars + 1) / numBars;
      const smoothing = 0.7;

      for (let i = 0; i < numBars; i++) {
        // Average bins for this bar
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          const idx = i * binsPerBar + j;
          sum += (data[idx] ?? 0) / 255;
        }
        const raw = sum / binsPerBar;

        // Exponential smoothing
        smoothedRef.current[i] = smoothedRef.current[i]! * smoothing + raw * (1 - smoothing);
        const barHeight = smoothedRef.current[i]! * height;

        // Orange gradient
        const x = i * (barWidth + 1);
        const grad = ctx.createLinearGradient(x, height, x, height - barHeight);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.6)');  // orange-500
        grad.addColorStop(1, 'rgba(251, 191, 36, 0.8)');  // amber-400

        ctx.fillStyle = grad;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="shrink-0 rounded-sm"
    />
  );
}
