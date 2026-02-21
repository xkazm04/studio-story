/** Face category icon path data: hair, eyes, nose, mouth, expression */

export type PathData = { paths: string[]; viewBox?: string };

// Hair icons (12)
export const HAIR_ICONS: Record<string, PathData> = {
  'hair-longWavy': { paths: ['M7 4c-2 0-3 2-3 5s0 6 1 9', 'M17 4c2 0 3 2 3 5s0 6-1 9', 'M7 4c2-2 8-2 10 0'] },
  'hair-shortSpiky': { paths: ['M6 12c0-4 2-7 6-8', 'M18 12c0-4-2-7-6-8', 'M8 5l-1-3', 'M12 4v-3', 'M16 5l1-3'] },
  'hair-braidedCrown': { paths: ['M6 8c2-3 10-3 12 0', 'M6 8c-1 3 0 7 1 10', 'M18 8c1 3 0 7-1 10', 'M8 6l2-1 2 1 2-1 2 1'] },
  'hair-undercut': { paths: ['M7 10h10', 'M7 10c0-4 2-6 5-6s5 2 5 6', 'M7 10c0 3 0 6 1 8', 'M17 10c0 3 0 6-1 8'] },
  'hair-flowingLocks': { paths: ['M6 6c1-2 5-3 6-3s5 1 6 3', 'M6 6c-2 4-2 8-1 12', 'M18 6c2 4 2 8 1 12', 'M10 6c-1 4-1 8 0 12', 'M14 6c1 4 1 8 0 12'] },
  'hair-mohawk': { paths: ['M12 2v5', 'M10 3l2-1 2 1', 'M8 4l4-2 4 2', 'M7 12c0-3 1-6 5-7', 'M17 12c0-3-1-6-5-7'] },
  'hair-pixieCut': { paths: ['M7 10c0-3 2-5 5-5s5 2 5 5', 'M7 10c0 1 0 2 1 3', 'M17 10c0 1 0 2-1 3', 'M5 9l3 1'] },
  'hair-ponytail': { paths: ['M7 9c0-3 2-5 5-5s5 2 5 5', 'M17 9c1 0 2 1 3 4', 'M20 13c0 3-1 5-2 7'] },
  'hair-afro': { paths: ['M4 12a8 8 0 1 1 16 0', 'M4 12c0 3 1 5 3 7', 'M20 12c0 3-1 5-3 7'] },
  'hair-bald': { paths: ['M7 12c0-4 2-7 5-7s5 3 5 7', 'M7 12h10'] },
  'hair-dreadlocks': { paths: ['M7 8c0-2 2-4 5-4s5 2 5 4', 'M6 8c-1 4-1 8 0 12', 'M9 8c0 4 0 8-1 12', 'M12 8c0 4 0 10 0 12', 'M15 8c0 4 0 8 1 12', 'M18 8c1 4 1 8 0 12'] },
  'hair-sideShave': { paths: ['M12 5c3 0 5 2 5 5', 'M7 12h0', 'M7 10h0', 'M7 14h0', 'M12 5c-1 3-1 6 0 9', 'M17 10c0 2 0 4-1 6'] },
};

// Eyes icons (8)
export const EYE_ICONS: Record<string, PathData> = {
  'eyes-almond': { paths: ['M4 12c3-4 13-4 16 0', 'M4 12c3 4 13 4 16 0', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'] },
  'eyes-round': { paths: ['M5 12c2-5 12-5 14 0', 'M5 12c2 5 12 5 14 0', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5'] },
  'eyes-hooded': { paths: ['M4 13c3-5 13-5 16 0', 'M4 13c3 3 13 3 16 0', 'M4 11c3-2 13-2 16 0', 'M12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4'] },
  'eyes-upturned': { paths: ['M4 14c3-5 13-5 16 0', 'M4 14c3 2 13 2 16 0', 'M12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4'] },
  'eyes-downturned': { paths: ['M4 10c3-2 13-2 16 0', 'M4 10c3 5 13 5 16 0', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'] },
  'eyes-monolid': { paths: ['M4 12h16', 'M4 12c3 3 13 3 16 0', 'M12 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3'] },
  'eyes-deepSet': { paths: ['M5 12c2-3 12-3 14 0', 'M5 12c2 3 12 3 14 0', 'M3 10c3-2 15-2 18 0', 'M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3'] },
  'eyes-wideSet': { paths: ['M2 12c2-3 6-3 8 0', 'M2 12c2 3 6 3 8 0', 'M14 12c2-3 6-3 8 0', 'M14 12c2 3 6 3 8 0', 'M6 11a1 1 0 1 0 0 2', 'M18 11a1 1 0 1 0 0 2'] },
};

// Nose icons (8)
export const NOSE_ICONS: Record<string, PathData> = {
  'nose-straight': { paths: ['M12 6v10', 'M10 16c1 1 3 1 4 0'] },
  'nose-aquiline': { paths: ['M12 6c0 2 1 4 2 6s-1 3-2 4', 'M10 16c1 1 3 1 4 0'] },
  'nose-button': { paths: ['M12 8v5', 'M10 14a2 2 0 1 0 4 0'] },
  'nose-roman': { paths: ['M11 6c0 2 2 4 2 6s0 3-1 4', 'M10 16c1 1 3 1 4 0'] },
  'nose-snub': { paths: ['M12 8v4', 'M12 12c1 0 2 1 2 2', 'M10 15c1 1 3 1 4 0'] },
  'nose-hawk': { paths: ['M11 6c0 3 3 5 3 8s-1 2-2 3', 'M10 17c1 1 3 1 4 0'] },
  'nose-nubian': { paths: ['M12 6v8', 'M8 16c2 2 6 2 8 0'] },
  'nose-greek': { paths: ['M10 4h2v12', 'M10 16c1 1 3 1 4 0'] },
};

// Mouth icons (8)
export const MOUTH_ICONS: Record<string, PathData> = {
  'mouth-fullLips': { paths: ['M7 12c2-2 8-2 10 0', 'M7 12c2 3 8 3 10 0'] },
  'mouth-thinLips': { paths: ['M7 12h10', 'M7 12c2 1 8 1 10 0'] },
  'mouth-cupidBow': { paths: ['M7 12c1-2 3-2 5 0c2-2 4-2 5 0', 'M7 12c2 2 8 2 10 0'] },
  'mouth-wideSmile': { paths: ['M5 11c3-1 11-1 14 0', 'M5 11c3 4 11 4 14 0'] },
  'mouth-heartShape': { paths: ['M7 11c2-1 3-1 5 1c2-2 3-2 5-1', 'M7 11c2 3 8 3 10 0'] },
  'mouth-downturned': { paths: ['M7 11c2 1 8 1 10 0', 'M7 13c2 1 8 1 10 0'] },
  'mouth-pouty': { paths: ['M8 11c1-1 6-1 8 0', 'M7 12c2 3 8 3 10 0'] },
  'mouth-smirk': { paths: ['M7 12c3-1 7 0 10-2', 'M7 12c2 2 8 1 10-1'] },
};

// Expression icons (8) — minimalist face with expression indicator
export const EXPRESSION_ICONS: Record<string, PathData> = {
  'expr-neutral': { paths: ['M8 9v0', 'M16 9v0', 'M8 15h8'] },
  'expr-smile': { paths: ['M8 9v0', 'M16 9v0', 'M8 14c2 2 6 2 8 0'] },
  'expr-smirk': { paths: ['M8 9v0', 'M16 9v0', 'M9 14c3 1 6 0 7-1'] },
  'expr-fierce': { paths: ['M7 8l4 2', 'M17 8l-4 2', 'M8 15h8'] },
  'expr-sad': { paths: ['M8 9v0', 'M16 9v0', 'M8 16c2-2 6-2 8 0'] },
  'expr-surprised': { paths: ['M8 8v2', 'M16 8v2', 'M10 15a2 2 0 1 0 4 0 2 2 0 0 0-4 0'] },
  'expr-determined': { paths: ['M7 9l4 1', 'M17 9l-4 1', 'M8 15c2 1 6 1 8 0'] },
  'expr-serene': { paths: ['M8 10c1-1 2-1 3 0', 'M13 10c1-1 2-1 3 0', 'M9 15c2 1 4 1 6 0'] },
};
