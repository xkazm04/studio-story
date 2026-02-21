/** Environment category icon path data: lighting, background */

import type { PathData } from './faceIcons';

// Lighting icons (6)
export const LIGHTING_ICONS: Record<string, PathData> = {
  'light-studio': { paths: ['M12 3v2', 'M12 19v2', 'M5 12H3', 'M21 12h-2', 'M7.05 7.05L5.63 5.63', 'M18.36 18.36l-1.41-1.41', 'M7.05 16.95l-1.42 1.41', 'M18.36 5.64l-1.41 1.41', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8'] },
  'light-goldenHour': { paths: ['M12 17a5 5 0 1 0 0-10', 'M4 17h16', 'M7 14l-2 3', 'M17 14l2 3', 'M12 7v-3'] },
  'light-moonlight': { paths: ['M12 3c-4 0-7 4-7 8s3 8 7 8c-2-2-3-5-3-8s1-6 3-8'] },
  'light-dramatic': { paths: ['M3 12h8', 'M13 4v16', 'M13 4l5 4', 'M13 12l5-4', 'M13 12l5 4', 'M13 20l5-4'] },
  'light-neon': { paths: ['M4 6h4v12H4', 'M10 6h4v12h-4', 'M16 6h4v12h-4'] },
  'light-candlelight': { paths: ['M12 20v-4', 'M12 16c-1-2-2-4-2-6s1-4 2-6c1 2 2 4 2 6s-1 4-2 6', 'M10 20h4'] },
};

// Background icons (6)
export const BACKGROUND_ICONS: Record<string, PathData> = {
  'bg-transparent': { paths: ['M4 4h8v8H4', 'M12 12h8v8h-8', 'M4 12h8v8H4', 'M12 4h8v8h-8'] },
  'bg-studioGray': { paths: ['M3 3h18v18H3z'] },
  'bg-deepBlack': { paths: ['M3 3h18v18H3z', 'M8 8h8v8H8'] },
  'bg-gradientBlue': { paths: ['M3 3h18v18H3z', 'M3 8h18', 'M3 13h18', 'M3 18h18'] },
  'bg-fantasyForest': { paths: ['M6 20l3-8 3 4 3-6 3 10', 'M4 14l2-4 2 2', 'M16 14l2-4 2 2'] },
  'bg-castleInterior': { paths: ['M4 20v-12l4-4h8l4 4v12', 'M10 20v-6h4v6', 'M8 10h2v2H8', 'M14 10h2v2h-2'] },
};
