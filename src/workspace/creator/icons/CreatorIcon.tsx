import React from 'react';
import { ICON_REGISTRY } from './registry';
import type { SkinToneIcon } from './bodyIcons';

interface CreatorIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function CreatorIcon({ name, size = 24, className }: CreatorIconProps) {
  const icon = ICON_REGISTRY[name];

  if (!icon) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="8" opacity="0.4" />
      </svg>
    );
  }

  const skinIcon = icon as SkinToneIcon;
  const hasFill = !!skinIcon.fill;

  // Skin tone swatches: render as a filled rounded rect that fills the space
  if (hasFill) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
      >
        <rect x="2" y="2" width="20" height="20" rx="4" fill={skinIcon.fill} />
        <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox || '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icon.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
