/**
 * AI Suggestion Service
 *
 * Handles streaming AI suggestions for character traits and relationships
 */

export interface AISuggestion {
  type: 'enhancement' | 'relationship_depth' | 'backstory_expansion' | 'dialogue_style';
  title: string;
  suggestion: string;
  reasoning: string;
}

export interface SuggestionStreamEvent {
  type: 'progress' | 'complete' | 'error';
  content?: string;
  suggestions?: AISuggestion[];
  message?: string;
  processingTime?: number;
}

export type SuggestionContextType = 'trait' | 'relationship' | 'backstory' | 'dialogue';

interface StreamSuggestionsParams {
  projectId: string;
  characterId?: string;
  contextType: SuggestionContextType;
  currentText: string;
  fieldType?: string;
  onProgress?: (content: string) => void;
  onComplete?: (suggestions: AISuggestion[]) => void;
  onError?: (error: string) => void;
}

/**
 * Streams AI suggestions using Server-Sent Events (SSE)
 */
export async function streamAISuggestions({
  projectId,
  characterId,
  contextType,
  currentText,
  fieldType,
  onProgress,
  onComplete,
  onError,
}: StreamSuggestionsParams): Promise<() => void> {
  let abortController: AbortController | null = new AbortController();

  try {
    const response = await fetch('/api/ai/suggestions/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: projectId,
        character_id: characterId,
        context_type: contextType,
        current_text: currentText,
        field_type: fieldType,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    const decoder = new TextDecoder();

    // Process stream
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData: SuggestionStreamEvent = JSON.parse(line.slice(6));

                if (eventData.type === 'progress' && eventData.content) {
                  onProgress?.(eventData.content);
                } else if (eventData.type === 'complete' && eventData.suggestions) {
                  onComplete?.(eventData.suggestions);
                } else if (eventData.type === 'error' && eventData.message) {
                  onError?.(eventData.message);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          onError?.(error.message);
        }
      }
    })();

    // Return cleanup function
    return () => {
      abortController?.abort();
      abortController = null;
      reader.cancel();
    };
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      onError?.(error.message);
    }
    return () => {};
  }
}

/**
 * Debounce helper for typing detection
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Check if text is substantial enough for suggestions
 */
export function isTextSubstantial(text: string, minLength = 10): boolean {
  return text.trim().length >= minLength;
}

/**
 * Extract key terms from text for context
 */
export function extractKeyTerms(text: string, maxTerms = 5): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Simple frequency count
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([word]) => word);
}
