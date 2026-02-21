/**
 * CultureGenerator - Faction Culture and Traditions System
 *
 * Generates and manages faction cultural elements including:
 * - Core values hierarchy
 * - Traditions and rituals
 * - Social norms and taboos
 * - Greeting and honorific conventions
 * - Cultural calendar with significant dates
 * - Inter-faction cultural compatibility
 */

// ============================================================================
// Types
// ============================================================================

export type ValueCategory = 'core' | 'secondary' | 'aspirational';
export type RitualFrequency = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'annual' | 'once' | 'lifecycle';
export type NormSeverity = 'expectation' | 'strong_norm' | 'taboo' | 'sacred_law';
export type CalendarEventType = 'festival' | 'memorial' | 'ceremony' | 'holy_day' | 'founding' | 'seasonal';

export interface FactionValue {
  id: string;
  name: string;
  description: string;
  category: ValueCategory;
  priority: number; // 1-10, higher = more important
  manifestations: string[]; // How this value shows in daily life
  conflicts_with?: string[]; // Values from other factions this might conflict with
  origin?: string; // Historical reason for this value
}

export interface ValuesHierarchy {
  faction_id: string;
  values: FactionValue[];
  core_philosophy: string;
  guiding_principle: string;
}

export interface Ritual {
  id: string;
  name: string;
  description: string;
  frequency: RitualFrequency;
  purpose: string;
  participants: string; // Who participates (all members, elders, initiates, etc.)
  location?: string;
  duration?: string;
  required_items?: string[];
  steps: string[];
  significance: string;
  origin_story?: string;
  related_values: string[]; // Value IDs this ritual reinforces
}

export interface Tradition {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'ceremonial' | 'martial' | 'artistic' | 'culinary' | 'craft';
  practiced_since?: string;
  passed_down_by: string; // How it's taught (mentorship, family, formal training)
  significance: string;
  variations?: string[]; // Regional or rank-based variations
}

export interface SocialNorm {
  id: string;
  name: string;
  description: string;
  severity: NormSeverity;
  applies_to: string; // Who must follow (all, leaders, outsiders, etc.)
  punishment?: string; // Consequence of breaking
  exceptions?: string[];
  related_values: string[];
}

export interface Taboo {
  id: string;
  name: string;
  description: string;
  origin: string; // Why this became taboo
  punishment: string;
  severity: 'serious' | 'grave' | 'unforgivable';
  known_violators?: string[]; // Historical figures who broke it
}

export interface GreetingConvention {
  id: string;
  context: 'formal' | 'casual' | 'military' | 'sacred' | 'diplomatic';
  greeting: string;
  response?: string;
  physical_gesture?: string;
  rank_modifiers?: Record<string, string>; // Modifications based on relative rank
  time_of_day_variants?: Record<string, string>;
}

export interface Honorific {
  id: string;
  title: string;
  used_for: string; // Who receives this title
  placement: 'prefix' | 'suffix' | 'standalone';
  formal_level: number; // 1-5, higher = more formal
  gender_variants?: Record<string, string>;
  historical_origin?: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  description: string;
  date: string; // Can be "first_full_moon_spring" or specific date
  event_type: CalendarEventType;
  duration_days: number;
  activities: string[];
  traditional_foods?: string[];
  traditional_dress?: string;
  gifts_exchanged?: boolean;
  public_or_private: 'public' | 'private' | 'members_only';
  related_rituals: string[]; // Ritual IDs
  historical_significance?: string;
}

export interface CulturalCalendar {
  faction_id: string;
  calendar_system: string; // e.g., "lunar", "solar", "custom"
  year_start: string; // When their year begins
  seasons: string[]; // How they divide the year
  events: CalendarEvent[];
  observances: string[]; // Regular observances (e.g., weekly rest day)
}

export interface CulturalCompatibility {
  faction_a_id: string;
  faction_b_id: string;
  overall_score: number; // 0-100
  shared_values: string[];
  conflicting_values: string[];
  compatible_traditions: string[];
  incompatible_norms: string[];
  potential_friction_points: string[];
  alliance_potential: 'natural_allies' | 'possible' | 'difficult' | 'unlikely' | 'impossible';
  trade_compatibility: number; // 0-100
  diplomatic_notes: string;
}

export interface FactionCulture {
  id: string;
  faction_id: string;
  faction_name: string;
  values: ValuesHierarchy;
  rituals: Ritual[];
  traditions: Tradition[];
  social_norms: SocialNorm[];
  taboos: Taboo[];
  greetings: GreetingConvention[];
  honorifics: Honorific[];
  calendar: CulturalCalendar;
  cultural_summary: string;
  behavior_guidelines: string[];
  created_at: string;
  updated_at: string;
}

export interface CultureGenerationContext {
  factionName: string;
  factionType?: string;
  factionDescription?: string;
  existingLore?: string[];
  worldSetting?: string;
  memberArchetypes?: string[];
  relationships?: Array<{ faction: string; type: string }>;
}

// ============================================================================
// Constants
// ============================================================================

export const VALUE_CATEGORIES: Record<ValueCategory, { label: string; description: string; color: string }> = {
  core: {
    label: 'Core Values',
    description: 'Fundamental beliefs that define the faction\'s identity',
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  secondary: {
    label: 'Secondary Values',
    description: 'Important principles that guide daily behavior',
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  },
  aspirational: {
    label: 'Aspirational Values',
    description: 'Ideals the faction strives toward',
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
};

export const NORM_SEVERITY_CONFIG: Record<NormSeverity, { label: string; color: string; description: string }> = {
  expectation: {
    label: 'Expectation',
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
    description: 'Generally expected but not strictly enforced',
  },
  strong_norm: {
    label: 'Strong Norm',
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    description: 'Important social rule with social consequences',
  },
  taboo: {
    label: 'Taboo',
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    description: 'Forbidden behavior with serious consequences',
  },
  sacred_law: {
    label: 'Sacred Law',
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    description: 'Inviolable rule with the most severe punishment',
  },
};

export const RITUAL_FREQUENCY_CONFIG: Record<RitualFrequency, { label: string; description: string }> = {
  daily: { label: 'Daily', description: 'Performed every day' },
  weekly: { label: 'Weekly', description: 'Performed once a week' },
  monthly: { label: 'Monthly', description: 'Performed once a month' },
  seasonal: { label: 'Seasonal', description: 'Performed at season changes' },
  annual: { label: 'Annual', description: 'Performed once a year' },
  once: { label: 'One-time', description: 'Performed only once' },
  lifecycle: { label: 'Lifecycle', description: 'Tied to life events (birth, coming of age, death)' },
};

export const CALENDAR_EVENT_TYPES: Record<CalendarEventType, { label: string; icon: string; color: string }> = {
  festival: { label: 'Festival', icon: '🎉', color: 'text-yellow-400' },
  memorial: { label: 'Memorial', icon: '🕯️', color: 'text-purple-400' },
  ceremony: { label: 'Ceremony', icon: '⭐', color: 'text-cyan-400' },
  holy_day: { label: 'Holy Day', icon: '✨', color: 'text-amber-400' },
  founding: { label: 'Founding', icon: '🏛️', color: 'text-blue-400' },
  seasonal: { label: 'Seasonal', icon: '🌿', color: 'text-green-400' },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function generateCultureId(): string {
  return `culture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateValueId(): string {
  return `value_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRitualId(): string {
  return `ritual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateNormId(): string {
  return `norm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate cultural compatibility between two factions
 */
export function calculateCulturalCompatibility(
  cultureA: FactionCulture,
  cultureB: FactionCulture
): CulturalCompatibility {
  // Find shared and conflicting values
  const valuesA = cultureA.values.values.map((v) => v.name.toLowerCase());
  const valuesB = cultureB.values.values.map((v) => v.name.toLowerCase());

  const sharedValues = valuesA.filter((v) => valuesB.includes(v));
  const conflictingValues: string[] = [];

  // Check for explicit conflicts
  cultureA.values.values.forEach((v) => {
    if (v.conflicts_with) {
      const conflicts = v.conflicts_with.filter((c) =>
        valuesB.includes(c.toLowerCase())
      );
      conflictingValues.push(...conflicts);
    }
  });

  // Compare social norms for incompatibility
  const incompatibleNorms: string[] = [];
  cultureA.social_norms.forEach((normA) => {
    cultureB.social_norms.forEach((normB) => {
      // Check if norms directly contradict
      if (
        normA.severity === 'sacred_law' &&
        normB.severity === 'sacred_law' &&
        normA.name.toLowerCase().includes('never') !== normB.name.toLowerCase().includes('never')
      ) {
        incompatibleNorms.push(`${normA.name} vs ${normB.name}`);
      }
    });
  });

  // Find compatible traditions
  const traditionsA = cultureA.traditions.map((t) => t.category);
  const traditionsB = cultureB.traditions.map((t) => t.category);
  const compatibleTraditions = traditionsA.filter((t) => traditionsB.includes(t));

  // Calculate overall score
  const sharedValueScore = sharedValues.length * 15;
  const conflictPenalty = conflictingValues.length * 20;
  const normIncompatibilityPenalty = incompatibleNorms.length * 15;
  const traditionBonus = compatibleTraditions.length * 5;

  let overallScore = 50 + sharedValueScore - conflictPenalty - normIncompatibilityPenalty + traditionBonus;
  overallScore = Math.max(0, Math.min(100, overallScore));

  // Determine alliance potential
  let alliancePotential: CulturalCompatibility['alliance_potential'];
  if (overallScore >= 80) alliancePotential = 'natural_allies';
  else if (overallScore >= 60) alliancePotential = 'possible';
  else if (overallScore >= 40) alliancePotential = 'difficult';
  else if (overallScore >= 20) alliancePotential = 'unlikely';
  else alliancePotential = 'impossible';

  return {
    faction_a_id: cultureA.faction_id,
    faction_b_id: cultureB.faction_id,
    overall_score: overallScore,
    shared_values: sharedValues,
    conflicting_values: conflictingValues,
    compatible_traditions: compatibleTraditions,
    incompatible_norms: incompatibleNorms,
    potential_friction_points: [
      ...conflictingValues.map((v) => `Value conflict: ${v}`),
      ...incompatibleNorms.map((n) => `Norm incompatibility: ${n}`),
    ],
    alliance_potential: alliancePotential,
    trade_compatibility: Math.min(100, overallScore + 20),
    diplomatic_notes: generateDiplomaticNotes(overallScore, sharedValues, conflictingValues),
  };
}

function generateDiplomaticNotes(
  score: number,
  shared: string[],
  conflicts: string[]
): string {
  if (score >= 80) {
    return `Natural cultural affinity. Shared values of ${shared.slice(0, 2).join(' and ')} provide strong foundation for alliance.`;
  } else if (score >= 60) {
    return `Moderate compatibility. Some shared traditions but ${conflicts.length > 0 ? `conflicts over ${conflicts[0]} may cause friction` : 'minor differences in practice'}.`;
  } else if (score >= 40) {
    return `Significant cultural differences. Diplomacy possible but requires careful navigation of ${conflicts.slice(0, 2).join(' and ')} issues.`;
  } else {
    return `Deep cultural incompatibility. ${conflicts.length > 0 ? `Fundamental disagreement on ${conflicts[0]}` : 'Opposing worldviews'} makes lasting peace difficult.`;
  }
}

/**
 * Generate behavior guidelines from culture
 */
export function generateBehaviorGuidelines(culture: FactionCulture): string[] {
  const guidelines: string[] = [];

  // From core values
  culture.values.values
    .filter((v) => v.category === 'core')
    .forEach((v) => {
      guidelines.push(`Uphold ${v.name}: ${v.manifestations[0] || v.description}`);
    });

  // From norms
  culture.social_norms
    .filter((n) => n.severity === 'sacred_law' || n.severity === 'taboo')
    .forEach((n) => {
      guidelines.push(`${n.severity === 'sacred_law' ? 'ALWAYS' : 'NEVER'}: ${n.description}`);
    });

  // From greetings
  const formalGreeting = culture.greetings.find((g) => g.context === 'formal');
  if (formalGreeting) {
    guidelines.push(`Formal greeting: "${formalGreeting.greeting}"${formalGreeting.physical_gesture ? ` with ${formalGreeting.physical_gesture}` : ''}`);
  }

  // From rituals
  const dailyRitual = culture.rituals.find((r) => r.frequency === 'daily');
  if (dailyRitual) {
    guidelines.push(`Daily observance: ${dailyRitual.name} - ${dailyRitual.purpose}`);
  }

  return guidelines;
}

// ============================================================================
// Prompt Templates
// ============================================================================

export const CULTURE_GENERATION_PROMPT = `Generate a comprehensive cultural profile for the faction "{{factionName}}".

FACTION CONTEXT:
- Type: {{factionType}}
- Description: {{factionDescription}}
- World Setting: {{worldSetting}}

Create the following cultural elements:

1. VALUES HIERARCHY (3-5 values per category):
   - Core Values: Fundamental beliefs that define identity
   - Secondary Values: Important daily principles
   - Aspirational Values: Ideals they strive toward
   For each: name, description, manifestations (how it shows in daily life), potential conflicts

2. RITUALS (3-5 rituals):
   - Mix of daily, lifecycle, and annual
   - Include: name, description, frequency, purpose, participants, steps, significance

3. TRADITIONS (3-4 traditions):
   - Categories: social, ceremonial, martial, artistic, culinary, craft
   - Include: name, description, how it's passed down, significance

4. SOCIAL NORMS (4-6 norms):
   - Range from expectations to sacred laws
   - Include: name, description, severity, who it applies to, punishment for violation

5. TABOOS (2-3 taboos):
   - What is absolutely forbidden
   - Include: name, description, origin (why it became taboo), punishment

6. GREETINGS & HONORIFICS:
   - Formal and casual greetings
   - Titles and how they're used

7. CALENDAR EVENTS (3-4 events):
   - Mix of festivals, memorials, ceremonies
   - Include: name, when, duration, activities, significance

Return as valid JSON matching the FactionCulture interface structure.`;

export const VALUE_EXPANSION_PROMPT = `Expand on the faction value "{{valueName}}" for {{factionName}}.

Current description: {{valueDescription}}

Provide:
1. 3-5 specific manifestations (how members demonstrate this value daily)
2. Historical origin (why this became a core value)
3. 2-3 potential conflicts with other faction values
4. How new members are taught this value
5. How violations of this value are handled`;

export const RITUAL_DESIGN_PROMPT = `Design a detailed ritual for {{factionName}} called "{{ritualName}}".

Purpose: {{ritualPurpose}}
Frequency: {{ritualFrequency}}

Provide:
1. Detailed step-by-step process (5-10 steps)
2. Required items or preparations
3. Who participates and their roles
4. The significance and what it reinforces
5. Origin story or legend behind the ritual
6. Variations (for different occasions or ranks)`;

// ============================================================================
// CultureGenerator Class
// ============================================================================

export class CultureGenerator {
  private cultures: Map<string, FactionCulture> = new Map();

  /**
   * Create a new faction culture
   */
  createCulture(
    factionId: string,
    factionName: string,
    data: Partial<FactionCulture>
  ): FactionCulture {
    const now = new Date().toISOString();

    const culture: FactionCulture = {
      id: generateCultureId(),
      faction_id: factionId,
      faction_name: factionName,
      values: data.values || {
        faction_id: factionId,
        values: [],
        core_philosophy: '',
        guiding_principle: '',
      },
      rituals: data.rituals || [],
      traditions: data.traditions || [],
      social_norms: data.social_norms || [],
      taboos: data.taboos || [],
      greetings: data.greetings || [],
      honorifics: data.honorifics || [],
      calendar: data.calendar || {
        faction_id: factionId,
        calendar_system: 'standard',
        year_start: 'Spring Equinox',
        seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
        events: [],
        observances: [],
      },
      cultural_summary: data.cultural_summary || '',
      behavior_guidelines: data.behavior_guidelines || [],
      created_at: now,
      updated_at: now,
    };

    // Auto-generate behavior guidelines
    if (culture.behavior_guidelines.length === 0) {
      culture.behavior_guidelines = generateBehaviorGuidelines(culture);
    }

    this.cultures.set(culture.id, culture);
    return culture;
  }

  /**
   * Get culture by ID
   */
  getCulture(cultureId: string): FactionCulture | undefined {
    return this.cultures.get(cultureId);
  }

  /**
   * Get culture by faction ID
   */
  getCultureByFaction(factionId: string): FactionCulture | undefined {
    return Array.from(this.cultures.values()).find(
      (c) => c.faction_id === factionId
    );
  }

  /**
   * Update culture
   */
  updateCulture(
    cultureId: string,
    updates: Partial<FactionCulture>
  ): FactionCulture | undefined {
    const existing = this.cultures.get(cultureId);
    if (!existing) return undefined;

    const updated: FactionCulture = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Regenerate behavior guidelines if values or norms changed
    if (updates.values || updates.social_norms || updates.greetings || updates.rituals) {
      updated.behavior_guidelines = generateBehaviorGuidelines(updated);
    }

    this.cultures.set(cultureId, updated);
    return updated;
  }

  /**
   * Add a value to the culture
   */
  addValue(cultureId: string, value: Omit<FactionValue, 'id'>): FactionValue | undefined {
    const culture = this.cultures.get(cultureId);
    if (!culture) return undefined;

    const newValue: FactionValue = {
      ...value,
      id: generateValueId(),
    };

    culture.values.values.push(newValue);
    culture.updated_at = new Date().toISOString();
    culture.behavior_guidelines = generateBehaviorGuidelines(culture);

    return newValue;
  }

  /**
   * Add a ritual to the culture
   */
  addRitual(cultureId: string, ritual: Omit<Ritual, 'id'>): Ritual | undefined {
    const culture = this.cultures.get(cultureId);
    if (!culture) return undefined;

    const newRitual: Ritual = {
      ...ritual,
      id: generateRitualId(),
    };

    culture.rituals.push(newRitual);
    culture.updated_at = new Date().toISOString();
    culture.behavior_guidelines = generateBehaviorGuidelines(culture);

    return newRitual;
  }

  /**
   * Add a social norm
   */
  addNorm(cultureId: string, norm: Omit<SocialNorm, 'id'>): SocialNorm | undefined {
    const culture = this.cultures.get(cultureId);
    if (!culture) return undefined;

    const newNorm: SocialNorm = {
      ...norm,
      id: generateNormId(),
    };

    culture.social_norms.push(newNorm);
    culture.updated_at = new Date().toISOString();
    culture.behavior_guidelines = generateBehaviorGuidelines(culture);

    return newNorm;
  }

  /**
   * Add a calendar event
   */
  addCalendarEvent(cultureId: string, event: Omit<CalendarEvent, 'id'>): CalendarEvent | undefined {
    const culture = this.cultures.get(cultureId);
    if (!culture) return undefined;

    const newEvent: CalendarEvent = {
      ...event,
      id: generateEventId(),
    };

    culture.calendar.events.push(newEvent);
    culture.updated_at = new Date().toISOString();

    return newEvent;
  }

  /**
   * Remove a value
   */
  removeValue(cultureId: string, valueId: string): boolean {
    const culture = this.cultures.get(cultureId);
    if (!culture) return false;

    const index = culture.values.values.findIndex((v) => v.id === valueId);
    if (index === -1) return false;

    culture.values.values.splice(index, 1);
    culture.updated_at = new Date().toISOString();
    culture.behavior_guidelines = generateBehaviorGuidelines(culture);

    return true;
  }

  /**
   * Remove a ritual
   */
  removeRitual(cultureId: string, ritualId: string): boolean {
    const culture = this.cultures.get(cultureId);
    if (!culture) return false;

    const index = culture.rituals.findIndex((r) => r.id === ritualId);
    if (index === -1) return false;

    culture.rituals.splice(index, 1);
    culture.updated_at = new Date().toISOString();
    culture.behavior_guidelines = generateBehaviorGuidelines(culture);

    return true;
  }

  /**
   * Calculate compatibility with another faction's culture
   */
  calculateCompatibility(cultureIdA: string, cultureIdB: string): CulturalCompatibility | null {
    const cultureA = this.cultures.get(cultureIdA);
    const cultureB = this.cultures.get(cultureIdB);

    if (!cultureA || !cultureB) return null;

    return calculateCulturalCompatibility(cultureA, cultureB);
  }

  /**
   * Export culture to JSON
   */
  exportCulture(cultureId: string): string | undefined {
    const culture = this.cultures.get(cultureId);
    if (!culture) return undefined;

    return JSON.stringify(culture, null, 2);
  }

  /**
   * Import culture from JSON
   */
  importCulture(json: string): FactionCulture | undefined {
    try {
      const data = JSON.parse(json);
      const culture = this.createCulture(
        data.faction_id,
        data.faction_name,
        data
      );
      return culture;
    } catch {
      return undefined;
    }
  }

  /**
   * Get all cultures
   */
  getAllCultures(): FactionCulture[] {
    return Array.from(this.cultures.values());
  }
}

export default CultureGenerator;
