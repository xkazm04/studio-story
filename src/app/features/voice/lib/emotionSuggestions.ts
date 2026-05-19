/**
 * Smart emotion defaults for take generation.
 *
 * Delegates to the canonical EmotionTaxonomy for the emotion list
 * and adjacency graph. This file re-exports `suggestEmotions` for
 * backward compatibility with existing imports.
 */

export { suggestEmotions } from '@/lib/voice/EmotionTaxonomy';
