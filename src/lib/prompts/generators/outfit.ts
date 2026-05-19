/**
 * Outfit prompt generator — wraps generateOutfitPrompt from useCharacterOutfits
 * into registry-compatible form.
 */

import type { PromptGeneratorDef } from '../PromptRegistry';
import { promptRegistry } from '../PromptRegistry';

// ============================================================================
// Input types (mirror the relevant parts from useCharacterOutfits)
// ============================================================================

interface ClothingPiece {
  item?: string;
  color?: string;
  material?: string;
}

interface ClothingDetails {
  top?: ClothingPiece;
  bottom?: ClothingPiece;
  footwear?: ClothingPiece;
  outerwear?: ClothingPiece;
  headwear?: ClothingPiece;
  style_notes?: string;
  overall_condition?: string;
}

interface OutfitLike {
  clothing: ClothingDetails;
}

interface AccessoryLike {
  name: string;
  material?: string;
  current_state: string;
}

export interface OutfitPromptInput {
  outfit: OutfitLike;
  accessories?: AccessoryLike[];
}

// ============================================================================
// Generator: outfit.clothing
// ============================================================================

export const outfitClothingDef: PromptGeneratorDef<OutfitPromptInput> = {
  id: 'outfit.clothing',
  entityType: 'outfit',
  description: 'Outfit clothing description from wardrobe details',
  inputFields: [
    { path: 'outfit.clothing.top' },
    { path: 'outfit.clothing.bottom', optional: true },
    { path: 'outfit.clothing.footwear', optional: true },
    { path: 'outfit.clothing.outerwear', optional: true },
    { path: 'outfit.clothing.headwear', optional: true },
    { path: 'outfit.clothing.style_notes', optional: true },
    { path: 'outfit.clothing.overall_condition', optional: true },
    { path: 'accessories', optional: true },
  ],
  dependencies: [],
  outputFormat: 'comma-separated',
  generate({ outfit, accessories = [] }) {
    const parts: string[] = [];

    if (outfit.clothing.top?.item) {
      let topDesc = outfit.clothing.top.item;
      if (outfit.clothing.top.color) topDesc = `${outfit.clothing.top.color} ${topDesc}`;
      if (outfit.clothing.top.material) topDesc = `${outfit.clothing.top.material} ${topDesc}`;
      parts.push(`wearing ${topDesc.toLowerCase()}`);
    }

    if (outfit.clothing.bottom?.item) {
      let bottomDesc = outfit.clothing.bottom.item;
      if (outfit.clothing.bottom.color) bottomDesc = `${outfit.clothing.bottom.color} ${bottomDesc}`;
      parts.push(bottomDesc.toLowerCase());
    }

    if (outfit.clothing.footwear?.item) {
      let footDesc = outfit.clothing.footwear.item;
      if (outfit.clothing.footwear.color) footDesc = `${outfit.clothing.footwear.color} ${footDesc}`;
      parts.push(footDesc.toLowerCase());
    }

    if (outfit.clothing.outerwear?.item) {
      let outerDesc = outfit.clothing.outerwear.item;
      if (outfit.clothing.outerwear.color) outerDesc = `${outfit.clothing.outerwear.color} ${outerDesc}`;
      parts.push(`with ${outerDesc.toLowerCase()}`);
    }

    if (outfit.clothing.headwear?.item) {
      let headDesc = outfit.clothing.headwear.item;
      if (outfit.clothing.headwear.color) headDesc = `${outfit.clothing.headwear.color} ${headDesc}`;
      parts.push(headDesc.toLowerCase());
    }

    const visibleAccessories = accessories.filter(a => a.current_state === 'worn');
    if (visibleAccessories.length > 0) {
      const accParts = visibleAccessories.map(a => {
        let desc = a.name;
        if (a.material) desc = `${a.material} ${desc}`;
        return desc.toLowerCase();
      });
      parts.push(`with ${accParts.join(', ')}`);
    }

    if (outfit.clothing.style_notes) {
      parts.push(outfit.clothing.style_notes.toLowerCase());
    }

    if (outfit.clothing.overall_condition && outfit.clothing.overall_condition !== 'pristine') {
      parts.push(`(${outfit.clothing.overall_condition} condition)`);
    }

    return parts.join(', ');
  },
};

// ============================================================================
// Registration
// ============================================================================

export function registerOutfitGenerators(): void {
  promptRegistry.register(outfitClothingDef);
}
