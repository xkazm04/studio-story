'use client';

import type { AutomationPoint } from '../../types';

interface AutomationOverlayProps {
  automation: AutomationPoint[];
  clipDuration: number;
  clipWidth: number;
  clipHeight: number;
}

/**
 * Renders automation envelope as SVG polyline inside a clip.
 * Points are mapped: X = time proportional to clip width, Y = value (top=0, bottom=1).
 */
export default function AutomationOverlay({
  automation,
  clipDuration,
  clipWidth,
  clipHeight,
}: AutomationOverlayProps) {
  if (automation.length === 0 || clipDuration <= 0) return null;

  // Build SVG points string
  const points = automation.map((p) => {
    const x = (p.time / clipDuration) * clipWidth;
    const y = (1 - p.value) * clipHeight; // Invert: value=1 → top, value=0 → bottom
    return `${x},${y}`;
  }).join(' ');

  // Build fill polygon (close path along bottom)
  const fillPoints = [
    ...automation.map((p) => {
      const x = (p.time / clipDuration) * clipWidth;
      const y = (1 - p.value) * clipHeight;
      return `${x},${y}`;
    }),
    `${(automation[automation.length - 1]!.time / clipDuration) * clipWidth},${clipHeight}`,
    `${(automation[0]!.time / clipDuration) * clipWidth},${clipHeight}`,
  ].join(' ');

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[4]"
      width={clipWidth}
      height={clipHeight}
      viewBox={`0 0 ${clipWidth} ${clipHeight}`}
      preserveAspectRatio="none"
    >
      {/* Fill below the automation line */}
      <polygon
        points={fillPoints}
        fill="rgba(251, 191, 36, 0.1)"
      />
      {/* Automation line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgba(251, 191, 36, 0.5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
