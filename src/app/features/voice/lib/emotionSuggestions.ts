/**
 * Smart emotion defaults for take generation.
 * Suggests complementary emotions based on the current emotion.
 *
 * Canonical location — used by both sound-lab and V2 voice panels.
 */

const COMPLEMENTARY: Record<string, string[]> = {
  neutral: ['happy', 'sad', 'confident', 'tender'],
  happy: ['excited', 'confident', 'tender', 'surprised'],
  sad: ['melancholy', 'tender', 'anxious', 'whispered'],
  angry: ['excited', 'confident', 'fearful', 'anxious'],
  fearful: ['anxious', 'whispered', 'sad', 'surprised'],
  surprised: ['excited', 'happy', 'fearful', 'anxious'],
  excited: ['happy', 'confident', 'angry', 'surprised'],
  tender: ['sad', 'happy', 'melancholy', 'whispered'],
  anxious: ['fearful', 'sad', 'angry', 'excited'],
  melancholy: ['sad', 'tender', 'anxious', 'whispered'],
  confident: ['excited', 'happy', 'angry', 'tender'],
  whispered: ['tender', 'sad', 'anxious', 'melancholy'],
};

const ALL_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised',
  'excited', 'tender', 'anxious', 'melancholy', 'confident', 'whispered',
];

/**
 * Suggest emotions for take generation.
 * Always includes current emotion first, then complementary ones.
 *
 * @param currentEmotion - The line's current emotion
 * @param count - Number of suggestions to return (default 5)
 */
export function suggestEmotions(currentEmotion: string, count: number = 5): string[] {
  const result: string[] = [currentEmotion];
  const complementary = COMPLEMENTARY[currentEmotion] ?? [];

  // Add complementary emotions
  for (const emo of complementary) {
    if (result.length >= count) break;
    if (!result.includes(emo)) result.push(emo);
  }

  // Fill remaining from all emotions
  for (const emo of ALL_EMOTIONS) {
    if (result.length >= count) break;
    if (!result.includes(emo)) result.push(emo);
  }

  return result.slice(0, count);
}
