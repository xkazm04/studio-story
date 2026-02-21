/**
 * Character Consistency Service
 * Analyzes character consistency across beats, scenes, and traits using embeddings
 */

import OpenAI from 'openai';
import {
  ConsistencyIssue,
  ConsistencyIssueType,
  ConsistencySeverity,
  CharacterConsistencyReport,
} from '@/app/types/CharacterConsistency';
import { Beat } from '@/app/types/Beat';
import { Scene } from '@/app/types/Scene';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TextSource {
  type: 'beat' | 'scene' | 'trait' | 'backstory';
  id: string;
  name: string;
  text: string;
  context: string;
}

interface EmbeddingWithSource {
  embedding: number[];
  source: TextSource;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Generate embeddings for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Extract character mentions and context from text
 */
function extractCharacterContext(text: string, characterName: string): string[] {
  const contexts: string[] = [];
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(characterName.toLowerCase())) {
      contexts.push(sentence.trim());
    }
  }

  return contexts;
}

/**
 * Analyze two texts for consistency using GPT
 */
async function analyzeConsistency(
  text1: string,
  text2: string,
  source1: TextSource,
  source2: TextSource,
  characterName: string
): Promise<ConsistencyIssue | null> {
  try {
    const prompt = `Analyze these two descriptions/dialogues/actions of the character "${characterName}" for consistency issues.

Text 1 (from ${source1.type}: ${source1.name}):
"${text1}"

Text 2 (from ${source2.type}: ${source2.name}):
"${text2}"

Analyze for conflicts in:
1. Personality traits
2. Motivations and goals
3. Speech patterns and dialogue style
4. Behavior and actions
5. Character traits

If you find a significant inconsistency, respond with JSON in this format:
{
  "has_issue": true,
  "issue_type": "personality_conflict" | "motivation_conflict" | "speech_pattern_conflict" | "behavior_conflict" | "trait_conflict",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "Brief description of the inconsistency",
  "reasoning": "Detailed explanation of why this is inconsistent",
  "suggested_resolution": "Suggested way to resolve this conflict",
  "confidence_score": 0.0-1.0
}

If no significant inconsistency is found, respond with:
{
  "has_issue": false
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert narrative consistency analyzer. Analyze character portrayals for inconsistencies and provide constructive feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    if (!result.has_issue) {
      return null;
    }

    const issue: ConsistencyIssue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      character_id: '', // Will be set by caller
      issue_type: result.issue_type as ConsistencyIssueType,
      severity: result.severity as ConsistencySeverity,
      description: result.description,
      conflicting_text_1: text1,
      conflicting_text_2: text2,
      source_1: {
        type: source1.type,
        id: source1.id,
        name: source1.name,
        context: source1.context,
      },
      source_2: {
        type: source2.type,
        id: source2.id,
        name: source2.name,
        context: source2.context,
      },
      similarity_score: 0, // Will be calculated separately
      suggested_resolution: result.suggested_resolution,
      ai_reasoning: result.reasoning,
      confidence_score: result.confidence_score,
      resolved: false,
      created_at: new Date(),
    };

    return issue;
  } catch (error) {
    console.error('Error analyzing consistency:', error);
    return null;
  }
}

/**
 * Collect all text sources for a character
 */
function collectTextSources(
  characterId: string,
  characterName: string,
  beats: Beat[],
  scenes: Scene[],
  traits: any[]
): TextSource[] {
  const sources: TextSource[] = [];

  // Extract from beats
  for (const beat of beats) {
    if (beat.description) {
      const contexts = extractCharacterContext(beat.description, characterName);
      if (contexts.length > 0) {
        sources.push({
          type: 'beat',
          id: beat.id,
          name: beat.name,
          text: contexts.join(' '),
          context: beat.description,
        });
      }
    }
  }

  // Extract from scenes
  for (const scene of scenes) {
    const sceneTexts: string[] = [];

    if (scene.description) {
      const contexts = extractCharacterContext(scene.description, characterName);
      sceneTexts.push(...contexts);
    }

    if (scene.script) {
      const contexts = extractCharacterContext(scene.script, characterName);
      sceneTexts.push(...contexts);
    }

    if (sceneTexts.length > 0) {
      sources.push({
        type: 'scene',
        id: scene.id,
        name: scene.name,
        text: sceneTexts.join(' '),
        context: `${scene.description || ''} ${scene.script || ''}`.trim(),
      });
    }
  }

  // Extract from traits
  for (const trait of traits) {
    if (trait.description) {
      sources.push({
        type: 'trait',
        id: trait.id,
        name: trait.trait_type,
        text: trait.description,
        context: trait.description,
      });
    }
  }

  return sources;
}

/**
 * Analyze character consistency across all sources
 */
export async function analyzeCharacterConsistency(
  characterId: string,
  characterName: string,
  beats: Beat[],
  scenes: Scene[],
  traits: any[]
): Promise<CharacterConsistencyReport> {
  const sources = collectTextSources(characterId, characterName, beats, scenes, traits);
  const issues: ConsistencyIssue[] = [];

  // Generate embeddings for all sources
  const embeddingsWithSources: EmbeddingWithSource[] = [];
  for (const source of sources) {
    try {
      const embedding = await generateEmbedding(source.text);
      embeddingsWithSources.push({ embedding, source });
    } catch (error) {
      console.error(`Error generating embedding for ${source.type} ${source.id}:`, error);
    }
  }

  // Compare embeddings to find potentially conflicting sources
  const comparisonThreshold = 0.6; // Sources with similarity below this might be inconsistent

  for (let i = 0; i < embeddingsWithSources.length; i++) {
    for (let j = i + 1; j < embeddingsWithSources.length; j++) {
      const item1 = embeddingsWithSources[i];
      const item2 = embeddingsWithSources[j];

      const similarity = cosineSimilarity(item1.embedding, item2.embedding);

      // Low similarity might indicate inconsistency
      if (similarity < comparisonThreshold && similarity > 0.2) {
        const issue = await analyzeConsistency(
          item1.source.text,
          item2.source.text,
          item1.source,
          item2.source,
          characterName
        );

        if (issue) {
          issue.character_id = characterId;
          issue.similarity_score = similarity;
          issues.push(issue);
        }
      }
    }
  }

  // Calculate consistency score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  const lowIssues = issues.filter(i => i.severity === 'low').length;

  // Scoring: critical -20, high -10, medium -5, low -2
  const totalDeductions = (criticalIssues * 20) + (highIssues * 10) + (mediumIssues * 5) + (lowIssues * 2);
  const consistencyScore = Math.max(0, Math.min(100, 100 - totalDeductions));

  return {
    character_id: characterId,
    character_name: characterName,
    total_issues: issues.length,
    critical_issues: criticalIssues,
    high_issues: highIssues,
    medium_issues: mediumIssues,
    low_issues: lowIssues,
    consistency_score: consistencyScore,
    issues: issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    analyzed_sources: {
      beats_count: beats.length,
      scenes_count: scenes.length,
      traits_count: traits.length,
    },
    last_analyzed_at: new Date(),
  };
}
