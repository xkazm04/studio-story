/** Feature category icon path data: makeup, markings, accessories, facialHair */

import type { PathData } from './faceIcons';

// Makeup icons (8)
export const MAKEUP_ICONS: Record<string, PathData> = {
  'makeup-natural': { paths: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M9 10c1-1 2-1 3 0', 'M14 10c-1-1-2-1-3 0'] },
  'makeup-smokyEye': { paths: ['M4 12c3-4 13-4 16 0', 'M4 12c3 4 13 4 16 0', 'M6 10c2-2 10-2 12 0', 'M12 10a2 2 0 1 0 0 4'] },
  'makeup-glam': { paths: ['M4 12c3-4 13-4 16 0', 'M4 12c3 4 13 4 16 0', 'M2 8l3 3', 'M19 8l3 3', 'M12 10a2 2 0 1 0 0 4'] },
  'makeup-gothic': { paths: ['M4 12c3-5 13-5 16 0', 'M4 12c3 5 13 5 16 0', 'M8 15h8', 'M12 10a2 2 0 1 0 0 4'] },
  'makeup-tribal': { paths: ['M6 8l2 4-2 4', 'M18 8l-2 4 2 4', 'M9 10h6', 'M9 14h6'] },
  'makeup-ethereal': { paths: ['M12 4l1 3-1 3', 'M8 7l2 2', 'M16 7l-2 2', 'M7 14c2 2 8 2 10 0', 'M10 11a1 1 0 1 0 0 2', 'M14 11a1 1 0 1 0 0 2'] },
  'makeup-warrior': { paths: ['M4 10h6', 'M14 10h6', 'M7 13l3-1 3 1 3-1 3 1', 'M8 16l2-1 2 1 2-1 2 1'] },
  'makeup-fantasy': { paths: ['M12 3l1 4', 'M8 6l2 3', 'M16 6l-2 3', 'M6 11c2-1 4 0 6-1s4 0 6 1', 'M6 14c2-1 4 0 6-1s4 0 6 1'] },
};

// Markings icons (9)
export const MARKING_ICONS: Record<string, PathData> = {
  'marking-none': { paths: ['M18 6L6 18', 'M6 6l12 12'] },
  'marking-scarEye': { paths: ['M7 5l10 14', 'M12 9a2 2 0 1 0 0 4'] },
  'marking-scarCheek': { paths: ['M14 10l4 6', 'M16 10l2 6'] },
  'marking-tribalTattoo': { paths: ['M6 6c3 2 3 6 0 8', 'M6 10h4', 'M18 6c-3 2-3 6 0 8', 'M18 10h-4'] },
  'marking-runeTattoo': { paths: ['M12 4v16', 'M8 8l8 8', 'M16 8l-8 8', 'M8 12h8'] },
  'marking-freckles': { paths: ['M8 10v0', 'M10 8v0', 'M14 8v0', 'M16 10v0', 'M9 13v0', 'M12 12v0', 'M15 13v0', 'M11 15v0', 'M13 15v0'] },
  'marking-beautyMark': { paths: ['M15 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2'] },
  'marking-warPaint': { paths: ['M4 10h7', 'M13 10h7', 'M6 13h5', 'M13 13h5'] },
  'marking-birthmark': { paths: ['M14 9c2 0 3 1 3 3s-1 3-3 3-2-1-2-3 0-3 2-3'] },
};

// Accessories icons (10)
export const ACCESSORY_ICONS: Record<string, PathData> = {
  'acc-none': { paths: ['M18 6L6 18', 'M6 6l12 12'] },
  'acc-glasses': { paths: ['M4 12a4 3 0 1 0 8 0 4 3 0 0 0-8 0', 'M12 12a4 3 0 1 0 8 0 4 3 0 0 0-8 0', 'M2 12h2', 'M20 12h2'] },
  'acc-monocle': { paths: ['M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0', 'M15 12l3 6'] },
  'acc-eyePatch': { paths: ['M6 8l6 4-6 4', 'M4 12h2', 'M12 8v8'] },
  'acc-earrings': { paths: ['M5 10v2', 'M5 14l-1 3', 'M19 10v2', 'M19 14l1 3', 'M4 17a1 1 0 1 0 2 0', 'M18 17a1 1 0 1 0 2 0'] },
  'acc-noseRing': { paths: ['M12 14a2 2 0 1 1 0 4', 'M12 14v-2'] },
  'acc-crown': { paths: ['M4 16h16', 'M4 16l2-6 3 3 3-5 3 5 3-3 2 6', 'M4 16v3h16v-3'] },
  'acc-headband': { paths: ['M4 10c4-4 12-4 16 0', 'M4 12c4-4 12-4 16 0'] },
  'acc-circlet': { paths: ['M5 11c3-4 11-4 14 0', 'M5 13c3-4 11-4 14 0', 'M12 7v2'] },
  'acc-hood': { paths: ['M4 14c0-6 3-10 8-10s8 4 8 10', 'M4 14c1 3 3 5 8 5s7-2 8-5'] },
};

// Facial hair icons (8)
export const FACIAL_HAIR_ICONS: Record<string, PathData> = {
  'fh-cleanShaven': { paths: ['M8 12c2 4 6 4 8 0'] },
  'fh-stubble': { paths: ['M8 14v0', 'M10 15v0', 'M12 14v0', 'M14 15v0', 'M16 14v0', 'M9 16v0', 'M11 17v0', 'M13 17v0', 'M15 16v0'] },
  'fh-fullBeard': { paths: ['M6 10c0 4 2 8 6 9s6-5 6-9', 'M6 10c2-1 4-1 6 0s4-1 6 0'] },
  'fh-goatee': { paths: ['M10 14c0 3 1 5 2 6s2-3 2-6', 'M10 14h4'] },
  'fh-mustache': { paths: ['M6 13c2-2 4-1 6 0s4-2 6 0', 'M6 13c1 1 3 1 6 0', 'M12 13c3 1 5 1 6 0'] },
  'fh-sideburns': { paths: ['M5 8v7', 'M19 8v7', 'M5 8c1-1 2-1 3 0', 'M19 8c-1-1-2-1-3 0'] },
  'fh-vanDyke': { paths: ['M8 13c2-2 6-2 8 0', 'M10 15c0 2 1 4 2 5s2-3 2-5'] },
  'fh-soulPatch': { paths: ['M11 15c0 2 1 3 1 3s1-1 1-3', 'M11 15h2'] },
};
