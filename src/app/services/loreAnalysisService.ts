/**
 * AI Lore Analysis Service
 *
 * Generates AI-powered summaries and tag extraction for lore entries
 */

export interface LoreSummaryResult {
  summary: string; // Bullet-point format summary
  tags: string[]; // Extracted key themes/tags
  generated_at: string;
}

const AI_LORE_ENDPOINT = process.env.NEXT_PUBLIC_AI_LORE_ENDPOINT || '/api/ai/analyze-lore';

/**
 * Generate a summary and extract tags from lore content using AI
 * @param loreContent - The full lore text to analyze
 * @param loreTitle - Title of the lore entry for context
 * @param category - Category of the lore entry for context
 * @returns AI-generated summary and tags
 */
export async function analyzeLore(
  loreContent: string,
  loreTitle: string,
  category: string
): Promise<LoreSummaryResult> {
  try {
    const response = await fetch(AI_LORE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: loreContent,
        title: loreTitle,
        category,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `AI lore analysis error: ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.summary,
      tags: data.tags,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing lore with AI:', error);
    throw error;
  }
}

/**
 * Generate a mock summary and tags for testing/development
 * This is a fallback when AI service is unavailable
 */
export function generateMockLoreAnalysis(
  loreContent: string,
  loreTitle: string,
  category: string
): LoreSummaryResult {
  // Extract keywords as mock tags (simple extraction)
  const words = loreContent.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can']);

  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length > 3 && !stopWords.has(cleaned)) {
      wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
    }
  });

  // Get top 5 most frequent words as tags
  const tags = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Generate a simple summary (first 3 sentences or 200 chars)
  const sentences = loreContent.match(/[^.!?]+[.!?]+/g) || [loreContent];
  const summaryText = sentences.slice(0, 3).join(' ').substring(0, 300);

  // Format as bullet points
  const bulletPoints = [
    `Main theme: ${category}`,
    `Content focuses on ${tags.slice(0, 3).join(', ')}`,
    `Summary: ${summaryText}${summaryText.length >= 300 ? '...' : ''}`,
  ];

  return {
    summary: bulletPoints.join('\n• '),
    tags: tags.concat([category]),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Batch analyze multiple lore entries
 * @param loreEntries - Array of lore entries to analyze
 * @returns Map of lore IDs to analysis results
 */
export async function batchAnalyzeLore(
  loreEntries: Array<{ id: string; content: string; title: string; category: string }>
): Promise<Map<string, LoreSummaryResult>> {
  const results = new Map<string, LoreSummaryResult>();

  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < loreEntries.length; i += batchSize) {
    const batch = loreEntries.slice(i, i + batchSize);
    const batchPromises = batch.map(lore =>
      analyzeLore(lore.content, lore.title, lore.category)
        .catch(error => {
          console.error(`Failed to analyze lore ${lore.id}:`, error);
          // Fallback to mock analysis
          return generateMockLoreAnalysis(lore.content, lore.title, lore.category);
        })
    );

    const batchResults = await Promise.all(batchPromises);
    batch.forEach((lore, index) => {
      results.set(lore.id, batchResults[index]);
    });
  }

  return results;
}

/**
 * Lore Analysis Service exports
 */
export const loreAnalysisService = {
  analyzeLore,
  generateMockLoreAnalysis,
  batchAnalyzeLore,
};
