/**
 * Prompt Generation Modules
 *
 * Delegates to the centralized PromptRegistry.
 * This file is kept for backward compatibility — new code should
 * import directly from '@/lib/prompts'.
 */

export {
  generateFacialFeaturesPrompt,
  generateClothingPrompt,
  generateFullPrompt,
} from '@/lib/prompts';
