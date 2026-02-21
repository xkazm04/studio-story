/** Preset class icon path data */

import type { PathData } from './faceIcons';

export const PRESET_ICONS: Record<string, PathData> = {
  'preset-warrior': { paths: ['M7 3l5 5 5-5', 'M12 8v12', 'M7 14h10'] },
  'preset-mage': { paths: ['M12 3l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z'] },
  'preset-ranger': { paths: ['M4 20L12 4l8 16', 'M12 4v16', 'M7 13l5-3'] },
  'preset-rogue': { paths: ['M12 3l1 8 7-4-5 6 5 6-7-4-1 8-1-8-7 4 5-6-5-6 7 4z'] },
  'preset-cleric': { paths: ['M12 4v16', 'M6 10h12', 'M12 4a2 2 0 1 0 0 4'] },
  'preset-bard': { paths: ['M9 4v10a3 3 0 1 0 6 0V4', 'M9 4h6', 'M9 8h6'] },
  'preset-paladin': { paths: ['M6 4h12l-2 16H8z', 'M12 8v8', 'M9 12h6'] },
  'preset-warlock': { paths: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M12 8a4 4 0 1 0 0 8', 'M12 10a2 2 0 1 0 0 4'] },
  'preset-monk': { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 8c-2 0-3 2-3 4s1 4 3 4 3-2 3-4-1-4-3-4'] },
};
