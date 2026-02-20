/**
 * Panel Layout Presets
 * Defines common panel layout configurations for quick snap-to-preset functionality
 */

export interface PanelPreset {
  id: string;
  name: string;
  description: string;
  sizes: {
    left: number;
    center: number;
    right: number;
  };
  icon: string; // Visual representation (e.g., "|||")
}

/**
 * Predefined panel layout presets
 */
export const PANEL_PRESETS: PanelPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Equal focus on all panels',
    sizes: { left: 20, center: 60, right: 20 },
    icon: '|||',
  },
  {
    id: 'center-focus',
    name: 'Center Focus',
    description: 'Maximize center workspace',
    sizes: { left: 15, center: 70, right: 15 },
    icon: '|█|',
  },
  {
    id: 'left-expanded',
    name: 'Left Expanded',
    description: 'More space for navigation',
    sizes: { left: 30, center: 50, right: 20 },
    icon: '█||',
  },
  {
    id: 'right-expanded',
    name: 'Right Expanded',
    description: 'More space for details',
    sizes: { left: 20, center: 50, right: 30 },
    icon: '||█',
  },
  {
    id: 'minimal-sides',
    name: 'Minimal Sides',
    description: 'Maximum center space',
    sizes: { left: 10, center: 80, right: 10 },
    icon: '|█|',
  },
  {
    id: 'even-split',
    name: 'Even Split',
    description: 'Three equal columns',
    sizes: { left: 33, center: 34, right: 33 },
    icon: '|||',
  },
];
