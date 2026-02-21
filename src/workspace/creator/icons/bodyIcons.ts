/** Body category icon path data: skinTone, age, bodyType */

import type { PathData } from './faceIcons';

// Skin tone icons (12) — color swatch circles with fill colors
export interface SkinToneIcon extends PathData {
  fill?: string;
}

export const SKIN_TONE_ICONS: Record<string, SkinToneIcon> = {
  'skin-porcelain': { paths: ['M4 4h16v16H4z'], fill: '#faf5f0' },
  'skin-ivory': { paths: ['M4 4h16v16H4z'], fill: '#f5e6d3' },
  'skin-sand': { paths: ['M4 4h16v16H4z'], fill: '#e8c99b' },
  'skin-honey': { paths: ['M4 4h16v16H4z'], fill: '#d4a96a' },
  'skin-caramel': { paths: ['M4 4h16v16H4z'], fill: '#b07d4f' },
  'skin-chestnut': { paths: ['M4 4h16v16H4z'], fill: '#8b5e3c' },
  'skin-espresso': { paths: ['M4 4h16v16H4z'], fill: '#5c3a21' },
  'skin-obsidian': { paths: ['M4 4h16v16H4z'], fill: '#3b2314' },
  'skin-elvenSilver': { paths: ['M4 4h16v16H4z'], fill: '#c0c8d4' },
  'skin-orcGreen': { paths: ['M4 4h16v16H4z'], fill: '#5a7a4a' },
  'skin-demonRed': { paths: ['M4 4h16v16H4z'], fill: '#8b2020' },
  'skin-frostBlue': { paths: ['M4 4h16v16H4z'], fill: '#7ab0d4' },
};

// Age icons (6)
export const AGE_ICONS: Record<string, PathData> = {
  'age-child': { paths: ['M12 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M9 10v0', 'M15 10v0', 'M10 12c1 1 3 1 4 0'] },
  'age-teen': { paths: ['M12 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10', 'M9 9v1', 'M15 9v1', 'M10 13c1 1 3 1 4 0'] },
  'age-youngAdult': { paths: ['M12 4a5 6 0 1 0 0 12 5 6 0 0 0 0-12', 'M9 9v1', 'M15 9v1', 'M10 14h4'] },
  'age-adult': { paths: ['M12 3a6 7 0 1 0 0 14 6 7 0 0 0 0-14', 'M9 9v1', 'M15 9v1', 'M10 14h4'] },
  'age-middleAge': { paths: ['M12 3a6 7 0 1 0 0 14 6 7 0 0 0 0-14', 'M8 8h3', 'M13 8h3', 'M10 14h4', 'M8 6h2', 'M14 6h2'] },
  'age-elder': { paths: ['M12 3a6 7 0 1 0 0 14 6 7 0 0 0 0-14', 'M7 8h4', 'M13 8h4', 'M10 14c1 1 3 1 4 0', 'M8 5c1 1 3 0 4-1', 'M12 5c1 1 3 0 4-1'] },
};

// Body type icons (6)
export const BODY_TYPE_ICONS: Record<string, PathData> = {
  'body-slim': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v5', 'M8 8h8', 'M12 11l-3 9', 'M12 11l3 9'] },
  'body-athletic': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v5', 'M7 7h10', 'M12 11l-3 9', 'M12 11l3 9'] },
  'body-muscular': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v5', 'M6 7c2 1 4 1 6 0s4-1 6 0', 'M12 11l-4 9', 'M12 11l4 9'] },
  'body-average': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v5', 'M8 7h8', 'M10 11c-1 3-2 6-3 9', 'M14 11c1 3 2 6 3 9'] },
  'body-stocky': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v4', 'M7 7c2 1 4 2 5 2s3-1 5-2', 'M10 10c-2 3-3 7-4 10', 'M14 10c2 3 3 7 4 10'] },
  'body-heavy': { paths: ['M12 2a2 2 0 1 0 0 4', 'M12 6v3', 'M6 7c2 2 5 3 6 3s4-1 6-3', 'M9 9c-2 4-4 7-5 11', 'M15 9c2 4 4 7 5 11'] },
};
