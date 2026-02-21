'use client';

import React from 'react';
import { EmblemStyle } from './emblemConfig';

interface EmblemSVGProps {
  style: EmblemStyle;
  initial: string;
  primaryColor: string;
  customImage?: string | null;
}

/**
 * Renders emblem SVG content based on the selected style
 */
const EmblemSVG: React.FC<EmblemSVGProps> = ({
  style,
  initial,
  primaryColor,
  customImage,
}) => {
  if (style === 'custom' && customImage) {
    return (
      <img
        src={customImage}
        alt="Custom emblem"
        className="w-full h-full object-contain rounded-lg"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
    >
      {style === 'shield' && (
        <g>
          <path
            d="M100 10 L170 40 L170 100 Q170 160 100 190 Q30 160 30 100 L30 40 Z"
            fill={`${primaryColor}40`}
            stroke={primaryColor}
            strokeWidth="3"
          />
          <path
            d="M100 30 L155 55 L155 100 Q155 145 100 170 Q45 145 45 100 L45 55 Z"
            fill={`${primaryColor}20`}
            stroke={primaryColor}
            strokeWidth="2"
          />
          <text
            x="100"
            y="120"
            fontSize="60"
            fontWeight="bold"
            textAnchor="middle"
            fill={primaryColor}
          >
            {initial}
          </text>
        </g>
      )}
      {style === 'crest' && (
        <g>
          <path
            d="M100 15 L160 50 L150 130 L100 180 L50 130 L40 50 Z"
            fill={`${primaryColor}40`}
            stroke={primaryColor}
            strokeWidth="3"
          />
          <circle cx="100" cy="90" r="50" fill={`${primaryColor}20`} stroke={primaryColor} strokeWidth="2" />
          <path
            d="M70 70 L100 40 L130 70 L115 90 L85 90 Z"
            fill={primaryColor}
            opacity="0.3"
          />
          <text
            x="100"
            y="105"
            fontSize="50"
            fontWeight="bold"
            textAnchor="middle"
            fill={primaryColor}
          >
            {initial}
          </text>
        </g>
      )}
      {style === 'sigil' && (
        <g>
          <circle cx="100" cy="100" r="80" fill={`${primaryColor}40`} stroke={primaryColor} strokeWidth="3" />
          <path
            d="M100 30 L115 85 L170 85 L125 115 L145 170 L100 135 L55 170 L75 115 L30 85 L85 85 Z"
            fill={`${primaryColor}20`}
            stroke={primaryColor}
            strokeWidth="2"
          />
          <circle cx="100" cy="100" r="35" fill={`${primaryColor}60`} />
          <text
            x="100"
            y="115"
            fontSize="40"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
          >
            {initial}
          </text>
        </g>
      )}
    </svg>
  );
};

export default EmblemSVG;
