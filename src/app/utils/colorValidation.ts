/**
 * Color Validation Utilities
 *
 * Validates hex color codes for faction branding
 * Ensures colors match #RRGGBB format and fall within acceptable brightness ranges
 */

export interface ColorValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface BrightnessRange {
  min: number;
  max: number;
}

// Default brightness range (0-255 per channel)
// Min: Prevent too dark colors that are hard to see
// Max: Prevent too bright colors that cause eye strain
const DEFAULT_BRIGHTNESS_RANGE: BrightnessRange = {
  min: 20,
  max: 240,
};

// Default hex colors for faction branding
export const DEFAULT_FACTION_COLORS = {
  primary: '#3b82f6',    // Blue
  secondary: '#10b981',  // Green
  accent: '#8b5cf6',     // Purple
};

/**
 * Validates a hex color code format (#RRGGBB)
 */
export function isValidHexFormat(color: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
}

/**
 * Converts hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculates perceived brightness of a color (0-255)
 * Uses relative luminance formula
 */
export function calculateBrightness(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  // Relative luminance formula (ITU-R BT.709)
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

/**
 * Checks if color brightness is within acceptable range
 */
export function isWithinBrightnessRange(
  hex: string,
  range: BrightnessRange = DEFAULT_BRIGHTNESS_RANGE
): boolean {
  const brightness = calculateBrightness(hex);
  if (brightness === null) return false;

  return brightness >= range.min && brightness <= range.max;
}

/**
 * Sanitizes a color string by normalizing format
 * Handles shorthand hex (#RGB -> #RRGGBB)
 * Converts to uppercase and ensures # prefix
 */
export function sanitizeHexColor(color: string): string | null {
  // Remove whitespace
  let sanitized = color.trim();

  // Add # if missing
  if (!sanitized.startsWith('#')) {
    sanitized = '#' + sanitized;
  }

  // Convert shorthand hex (#RGB) to full form (#RRGGBB)
  if (/^#[0-9A-Fa-f]{3}$/.test(sanitized)) {
    sanitized = '#' + sanitized[1] + sanitized[1] + sanitized[2] + sanitized[2] + sanitized[3] + sanitized[3];
  }

  // Validate final format
  if (!isValidHexFormat(sanitized)) {
    return null;
  }

  return sanitized.toUpperCase();
}

/**
 * Comprehensive color validation
 * Returns validation result with error message if invalid
 */
export function validateFactionColor(
  color: string | undefined | null,
  options: {
    required?: boolean;
    brightnessRange?: BrightnessRange;
    fieldName?: string;
  } = {}
): ColorValidationResult {
  const { required = false, brightnessRange = DEFAULT_BRIGHTNESS_RANGE, fieldName = 'Color' } = options;

  // Handle undefined/null
  if (color === undefined || color === null || color === '') {
    if (required) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }
    return { isValid: true }; // Optional and not provided
  }

  // Sanitize input
  const sanitized = sanitizeHexColor(color);
  if (!sanitized) {
    return {
      isValid: false,
      error: `${fieldName} must be in #RRGGBB format (e.g., #3B82F6)`,
    };
  }

  // Check brightness range
  if (!isWithinBrightnessRange(sanitized, brightnessRange)) {
    const brightness = calculateBrightness(sanitized);
    if (brightness !== null) {
      if (brightness < brightnessRange.min) {
        return {
          isValid: false,
          error: `${fieldName} is too dark. Please choose a brighter color for better visibility.`,
        };
      }
      if (brightness > brightnessRange.max) {
        return {
          isValid: false,
          error: `${fieldName} is too bright. Please choose a darker color to reduce eye strain.`,
        };
      }
    }
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validates all faction branding colors at once
 */
export function validateFactionBrandingColors(branding: {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
} {
  const errors: Record<string, string> = {};
  const sanitized = {
    primary_color: DEFAULT_FACTION_COLORS.primary,
    secondary_color: DEFAULT_FACTION_COLORS.secondary,
    accent_color: DEFAULT_FACTION_COLORS.accent,
  };

  // Validate primary color
  const primaryResult = validateFactionColor(branding.primary_color, {
    required: false,
    fieldName: 'Primary color',
  });
  if (!primaryResult.isValid && primaryResult.error) {
    errors.primary_color = primaryResult.error;
  } else if (primaryResult.sanitized) {
    sanitized.primary_color = primaryResult.sanitized;
  }

  // Validate secondary color
  const secondaryResult = validateFactionColor(branding.secondary_color, {
    required: false,
    fieldName: 'Secondary color',
  });
  if (!secondaryResult.isValid && secondaryResult.error) {
    errors.secondary_color = secondaryResult.error;
  } else if (secondaryResult.sanitized) {
    sanitized.secondary_color = secondaryResult.sanitized;
  }

  // Validate accent color
  const accentResult = validateFactionColor(branding.accent_color, {
    required: false,
    fieldName: 'Accent color',
  });
  if (!accentResult.isValid && accentResult.error) {
    errors.accent_color = accentResult.error;
  } else if (accentResult.sanitized) {
    sanitized.accent_color = accentResult.sanitized;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Ensures a color value is valid, returning a default if not
 */
export function ensureValidColor(color: string | undefined | null, defaultColor: string): string {
  const result = validateFactionColor(color, { required: false });
  return result.sanitized || defaultColor;
}
