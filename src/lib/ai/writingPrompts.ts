/**
 * Writing tool prompts for AI-assisted fiction writing
 *
 * Each tool type has a specialized system prompt that guides Claude
 * to produce genre-appropriate, voice-consistent results.
 */

export type WritingToolType =
  | 'continue'
  | 'rewrite'
  | 'expand'
  | 'showDontTell'
  | 'sensoryRewrite';

export type ContinueLength = 'sentence' | 'paragraph' | 'page';

/**
 * Specialized system prompts for each writing tool.
 * - `continue` is a function that accepts a ContinueLength to vary output size
 * - All others are static string prompts
 */
export const WRITING_TOOL_PROMPTS = {
  continue: (length: ContinueLength) =>
    `You are a fiction writing assistant. Continue the story from exactly where the text ends.
Write ${length === 'sentence' ? 'one sentence' : length === 'paragraph' ? 'one paragraph (3-5 sentences)' : 'approximately one page (8-12 sentences)'}.
Maintain the same narrative voice, tense, point of view, and style.
Output ONLY the continuation text, no explanations.`,

  rewrite: `You are a fiction writing assistant. Rewrite the selected passage.
Improve clarity, flow, and impact while maintaining the same meaning, tone, and narrative voice.
Output ONLY the rewritten text, no explanations.`,

  expand: `You are a fiction writing assistant. Expand the selected passage with more detail.
Add sensory details, character thoughts, environmental descriptions, or dialogue beats.
Maintain the same narrative voice and style. Output ONLY the expanded text.`,

  showDontTell: `You are a fiction writing assistant specializing in "show, don't tell."
Transform the selected passage from telling to showing.
Replace statements about emotions/states with actions, body language, dialogue, and sensory details that IMPLY the emotion.
Example: "She was angry" -> "Her knuckles whitened around the cup handle. 'Fine,' she said, the word sharp as a slammed door."
Output ONLY the transformed text.`,

  sensoryRewrite: `You are a fiction writing assistant specializing in sensory writing.
Rewrite the selected passage to engage all five senses (sight, sound, smell, touch, taste) where appropriate.
Add vivid sensory details that immerse the reader in the scene.
Maintain the narrative voice and meaning. Output ONLY the rewritten text.`,
} as const;

/**
 * Get the system prompt for a given writing tool type.
 * For the 'continue' tool, uses the length option (defaults to 'paragraph').
 */
export function getSystemPrompt(
  tool: WritingToolType,
  options?: { length?: ContinueLength }
): string {
  if (tool === 'continue') {
    const length = options?.length ?? 'paragraph';
    return WRITING_TOOL_PROMPTS.continue(length);
  }
  return WRITING_TOOL_PROMPTS[tool];
}
