/**
 * AI Service for LLM-powered faction generation
 *
 * This service handles all AI-related functionality for generating faction data
 * using Claude API or compatible LLM endpoints.
 */

import { AIGeneratedFaction, FactionWizardPrompt, FactionWizardResponse } from '../types/Faction';

const AI_API_ENDPOINT = process.env.NEXT_PUBLIC_AI_API_ENDPOINT || '/api/ai/generate-faction';

/**
 * Generate a complete faction profile using AI
 * @param prompt - User's creative prompt describing the faction
 * @param factionType - Optional type of faction (guild, nation, etc.)
 * @param projectId - Project ID for context
 * @returns AI-generated faction data
 */
export async function generateFaction(
  prompt: string,
  factionType?: FactionWizardPrompt['faction_type'],
  projectId?: string
): Promise<FactionWizardResponse> {
  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        faction_type: factionType,
        project_id: projectId,
      } as FactionWizardPrompt),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data as FactionWizardResponse;
  } catch (error) {
    console.error('Error generating faction with AI:', error);
    throw error;
  }
}

/**
 * Generate a mock faction for testing/development without AI API
 * This is a fallback when AI service is unavailable
 */
export function generateMockFaction(
  prompt: string,
  factionType?: FactionWizardPrompt['faction_type']
): FactionWizardResponse {
  const type = factionType || 'guild';
  const now = new Date().toISOString();

  // Extract potential faction name from prompt
  const words = prompt.split(' ');
  const factionName = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const mockFaction: AIGeneratedFaction = {
    name: factionName || 'The Generated Faction',
    description: `A ${type} created based on: "${prompt}". This faction represents a unique organization with its own culture, history, and aspirations.`,
    type,
    branding: {
      primary_color: '#3B82F6',
      secondary_color: '#60A5FA',
      accent_color: '#DBEAFE',
      emblem_style: 'shield',
      banner_template: 'standard',
    },
    lore: [
      {
        title: 'The Founding',
        content: `In the beginning, ${factionName} was formed with a vision that would change the world. The founders, united by common purpose, established the core principles that guide the faction to this day.`,
        category: 'history',
      },
      {
        title: 'Core Values',
        content: `The faction values honor, loyalty, and innovation. These principles are instilled in every member from their first day.`,
        category: 'culture',
      },
    ],
    timeline_events: [
      {
        title: 'Foundation Day',
        description: `The ${factionName} was officially founded, marking the beginning of a new era.`,
        date: '2020-01-01',
        event_type: 'founding',
      },
      {
        title: 'First Major Victory',
        description: 'A significant achievement that proved the faction\'s capabilities.',
        date: '2021-06-15',
        event_type: 'achievement',
      },
    ],
    achievements: [
      {
        title: 'Established Presence',
        description: 'Successfully established the faction and gained recognition.',
        earned_date: '2020-12-31',
      },
    ],
    emblem_design_prompt: `Design a ${type} emblem featuring elements that represent strength, unity, and purpose. Use colors ${['#3B82F6', '#60A5FA', '#DBEAFE'].join(', ')}. The design should evoke a sense of authority and tradition.`,
    member_archetypes: [
      {
        role: 'Leader',
        description: 'Visionary leader who guides the faction\'s strategic direction.',
      },
      {
        role: 'Specialist',
        description: 'Expert in their field, providing crucial skills and knowledge.',
      },
      {
        role: 'Defender',
        description: 'Protects the faction\'s interests and members.',
      },
    ],
  };

  return {
    faction: mockFaction,
    metadata: {
      generated_at: now,
      model_used: 'mock-generator',
    },
  };
}

/**
 * Validate AI-generated faction data
 * Ensures all required fields are present and valid
 */
export function validateAIFaction(faction: Partial<AIGeneratedFaction>): faction is AIGeneratedFaction {
  return !!(
    faction.name &&
    faction.description &&
    faction.type &&
    faction.branding &&
    faction.lore &&
    Array.isArray(faction.lore) &&
    faction.timeline_events &&
    Array.isArray(faction.timeline_events) &&
    faction.achievements &&
    Array.isArray(faction.achievements) &&
    faction.emblem_design_prompt &&
    faction.member_archetypes &&
    Array.isArray(faction.member_archetypes)
  );
}

/**
 * AI Service exports
 */
export const aiService = {
  generateFaction,
  generateMockFaction,
  validateAIFaction,
};
