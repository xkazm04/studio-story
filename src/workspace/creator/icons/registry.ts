import type { PathData } from './faceIcons';
import { HAIR_ICONS, EYE_ICONS, NOSE_ICONS, MOUTH_ICONS, EXPRESSION_ICONS } from './faceIcons';
import { MAKEUP_ICONS, MARKING_ICONS, ACCESSORY_ICONS, FACIAL_HAIR_ICONS } from './featureIcons';
import { SKIN_TONE_ICONS, AGE_ICONS, BODY_TYPE_ICONS } from './bodyIcons';
import { LIGHTING_ICONS, BACKGROUND_ICONS } from './environmentIcons';
import { PRESET_ICONS } from './presetIcons';

export const ICON_REGISTRY: Record<string, PathData> = {
  ...HAIR_ICONS,
  ...EYE_ICONS,
  ...NOSE_ICONS,
  ...MOUTH_ICONS,
  ...EXPRESSION_ICONS,
  ...MAKEUP_ICONS,
  ...MARKING_ICONS,
  ...ACCESSORY_ICONS,
  ...FACIAL_HAIR_ICONS,
  ...SKIN_TONE_ICONS,
  ...AGE_ICONS,
  ...BODY_TYPE_ICONS,
  ...LIGHTING_ICONS,
  ...BACKGROUND_ICONS,
  ...PRESET_ICONS,
};
