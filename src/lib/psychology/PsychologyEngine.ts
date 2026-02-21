/**
 * PsychologyEngine - Character Psychology and Motivation System
 *
 * Provides comprehensive psychological analysis for characters including:
 * - Motivation trees (primary, secondary, hidden motivations)
 * - Internal conflict identification and modeling
 * - Fear and desire mapping
 * - Defense mechanism analysis
 * - Psychological archetype suggestions (Jungian, Enneagram)
 * - Behavior prediction based on psychology profile
 */

// ============================================================================
// Types
// ============================================================================

export type MotivationLevel = 'primary' | 'secondary' | 'hidden' | 'unconscious';
export type ConflictSeverity = 'minor' | 'moderate' | 'major' | 'defining';
export type DefenseMechanismType =
  | 'denial'
  | 'projection'
  | 'rationalization'
  | 'displacement'
  | 'sublimation'
  | 'regression'
  | 'repression'
  | 'reaction_formation'
  | 'intellectualization'
  | 'compartmentalization';

export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type JungianArchetype =
  | 'hero'
  | 'mentor'
  | 'shadow'
  | 'trickster'
  | 'caregiver'
  | 'explorer'
  | 'rebel'
  | 'lover'
  | 'creator'
  | 'ruler'
  | 'magician'
  | 'innocent';

export interface Motivation {
  id: string;
  label: string;
  description: string;
  level: MotivationLevel;
  source?: string;
  strength: number; // 0-100
  parentId?: string;
  children?: Motivation[];
  isAwareOf: boolean;
  relatedFears?: string[];
  relatedDesires?: string[];
  triggers?: string[];
}

export interface MotivationTree {
  characterId: string;
  rootMotivations: Motivation[];
  totalMotivations: number;
  maxDepth: number;
  dominantLevel: MotivationLevel;
}

export interface InternalConflict {
  id: string;
  name: string;
  description: string;
  motivationA: string;
  motivationB: string;
  severity: ConflictSeverity;
  manifestations: string[];
  resolutionPath?: string;
  storyImpact: string;
  isResolved: boolean;
  resolvedInScene?: string;
}

export interface Fear {
  id: string;
  label: string;
  description: string;
  origin?: string;
  intensity: number; // 0-100
  isRational: boolean;
  triggers: string[];
  copingMechanisms: string[];
  relatedTrauma?: string;
}

export interface Desire {
  id: string;
  label: string;
  description: string;
  type: 'want' | 'need';
  intensity: number; // 0-100
  isAchievable: boolean;
  obstacles: string[];
  willingness: number; // 0-100, how far they'll go to achieve it
}

export interface DefenseMechanism {
  id: string;
  type: DefenseMechanismType;
  description: string;
  triggers: string[];
  manifestations: string[];
  healthiness: number; // 0-100, how adaptive it is
}

export interface Wound {
  id: string;
  label: string;
  description: string;
  origin: string;
  ageWhenOccurred?: string;
  stillActive: boolean;
  healingProgress: number; // 0-100
  triggerPatterns: string[];
  defenseMechanisms: DefenseMechanismType[];
}

export interface PsychologicalArchetypes {
  jungian: {
    primary: JungianArchetype;
    secondary?: JungianArchetype;
    shadow?: JungianArchetype;
  };
  enneagram: {
    type: EnneagramType;
    wing?: EnneagramType;
    integrationDirection: EnneagramType;
    disintegrationDirection: EnneagramType;
  };
}

export interface BehaviorPrediction {
  situation: string;
  likelyResponse: string;
  emotionalState: string;
  motivationTriggered: string;
  defenseMechanismsActivated: DefenseMechanismType[];
  conflictsTriggered: string[];
  confidence: number; // 0-100
}

export interface PsychologyProfile {
  id: string;
  characterId: string;
  characterName: string;
  motivationTree: MotivationTree;
  internalConflicts: InternalConflict[];
  fears: Fear[];
  desires: Desire[];
  wounds: Wound[];
  defenseMechanisms: DefenseMechanism[];
  archetypes: PsychologicalArchetypes;
  coreBeliefs: string[];
  values: string[];
  blindSpots: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PsychologyGenerationContext {
  characterName: string;
  characterType?: string;
  existingTraits?: string[];
  background?: string;
  relationships?: string[];
  storyContext?: string;
  projectContext?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const ENNEAGRAM_TYPES: Record<EnneagramType, {
  name: string;
  coreMotivation: string;
  coreFear: string;
  desires: string[];
  weaknesses: string[];
}> = {
  1: {
    name: 'The Reformer',
    coreMotivation: 'To be good, right, and perfect',
    coreFear: 'Being corrupt, defective, or wrong',
    desires: ['Integrity', 'Balance', 'Improvement'],
    weaknesses: ['Perfectionism', 'Judgmental', 'Repressed anger'],
  },
  2: {
    name: 'The Helper',
    coreMotivation: 'To be loved and needed',
    coreFear: 'Being unwanted or unworthy of love',
    desires: ['Love', 'Appreciation', 'Being needed'],
    weaknesses: ['Possessiveness', 'People-pleasing', 'Manipulation'],
  },
  3: {
    name: 'The Achiever',
    coreMotivation: 'To be valuable and successful',
    coreFear: 'Being worthless or a failure',
    desires: ['Success', 'Recognition', 'Admiration'],
    weaknesses: ['Workaholism', 'Image-conscious', 'Deceit'],
  },
  4: {
    name: 'The Individualist',
    coreMotivation: 'To be unique and authentic',
    coreFear: 'Having no identity or significance',
    desires: ['Self-expression', 'Depth', 'Understanding'],
    weaknesses: ['Envy', 'Self-absorption', 'Melancholy'],
  },
  5: {
    name: 'The Investigator',
    coreMotivation: 'To be capable and competent',
    coreFear: 'Being useless or incompetent',
    desires: ['Knowledge', 'Understanding', 'Mastery'],
    weaknesses: ['Isolation', 'Detachment', 'Hoarding'],
  },
  6: {
    name: 'The Loyalist',
    coreMotivation: 'To have security and support',
    coreFear: 'Being without support or guidance',
    desires: ['Security', 'Certainty', 'Belonging'],
    weaknesses: ['Anxiety', 'Suspicion', 'Indecision'],
  },
  7: {
    name: 'The Enthusiast',
    coreMotivation: 'To be happy and fulfilled',
    coreFear: 'Being deprived or trapped in pain',
    desires: ['Freedom', 'Variety', 'Satisfaction'],
    weaknesses: ['Impulsiveness', 'Escapism', 'Scattered focus'],
  },
  8: {
    name: 'The Challenger',
    coreMotivation: 'To be self-reliant and strong',
    coreFear: 'Being controlled or harmed by others',
    desires: ['Control', 'Independence', 'Protection'],
    weaknesses: ['Domination', 'Excess', 'Intimidation'],
  },
  9: {
    name: 'The Peacemaker',
    coreMotivation: 'To have inner peace and harmony',
    coreFear: 'Loss and separation, conflict',
    desires: ['Peace', 'Harmony', 'Connection'],
    weaknesses: ['Complacency', 'Stubbornness', 'Passivity'],
  },
};

export const JUNGIAN_ARCHETYPES: Record<JungianArchetype, {
  label: string;
  coreMotivation: string;
  fears: string[];
  strengths: string[];
  shadows: string[];
}> = {
  hero: {
    label: 'The Hero',
    coreMotivation: 'To prove worth through courage',
    fears: ['Weakness', 'Vulnerability', 'Being a coward'],
    strengths: ['Courage', 'Determination', 'Competence'],
    shadows: ['Arrogance', 'Ruthlessness', 'Obsession with winning'],
  },
  mentor: {
    label: 'The Sage/Mentor',
    coreMotivation: 'To find truth and wisdom',
    fears: ['Ignorance', 'Being deceived', 'Irrelevance'],
    strengths: ['Wisdom', 'Intelligence', 'Experience'],
    shadows: ['Detachment', 'Dogmatism', 'Ivory tower syndrome'],
  },
  shadow: {
    label: 'The Shadow',
    coreMotivation: 'To confront repressed aspects',
    fears: ['Being exposed', 'Facing truth', 'Integration'],
    strengths: ['Hidden power', 'Truth-telling', 'Transformation'],
    shadows: ['Destruction', 'Self-sabotage', 'Denial'],
  },
  trickster: {
    label: 'The Trickster',
    coreMotivation: 'To live in the moment with joy',
    fears: ['Boredom', 'Being trapped', 'Seriousness'],
    strengths: ['Wit', 'Adaptability', 'Innovation'],
    shadows: ['Cruelty', 'Deception', 'Irresponsibility'],
  },
  caregiver: {
    label: 'The Caregiver',
    coreMotivation: 'To protect and care for others',
    fears: ['Selfishness', 'Ingratitude', 'Helplessness'],
    strengths: ['Compassion', 'Generosity', 'Nurturing'],
    shadows: ['Martyrdom', 'Enabling', 'Manipulation through guilt'],
  },
  explorer: {
    label: 'The Explorer',
    coreMotivation: 'To experience authentic life',
    fears: ['Conformity', 'Inner emptiness', 'Being trapped'],
    strengths: ['Autonomy', 'Ambition', 'Authenticity'],
    shadows: ['Aimless wandering', 'Inability to commit', 'Alienation'],
  },
  rebel: {
    label: 'The Rebel/Outlaw',
    coreMotivation: 'To overturn what isn\'t working',
    fears: ['Powerlessness', 'Conformity', 'Being ineffectual'],
    strengths: ['Independence', 'Courage', 'Leadership'],
    shadows: ['Lawlessness', 'Self-destruction', 'Alienation'],
  },
  lover: {
    label: 'The Lover',
    coreMotivation: 'To be in relationship with people and things',
    fears: ['Being alone', 'Being unwanted', 'Being unloved'],
    strengths: ['Passion', 'Appreciation', 'Commitment'],
    shadows: ['Obsession', 'Jealousy', 'Loss of identity'],
  },
  creator: {
    label: 'The Creator',
    coreMotivation: 'To create enduring value',
    fears: ['Mediocrity', 'Inauthenticity', 'Meaninglessness'],
    strengths: ['Creativity', 'Imagination', 'Artistic skill'],
    shadows: ['Perfectionism', 'Creative block', 'Self-indulgence'],
  },
  ruler: {
    label: 'The Ruler',
    coreMotivation: 'To control and create order',
    fears: ['Chaos', 'Being overthrown', 'Loss of power'],
    strengths: ['Leadership', 'Responsibility', 'Competence'],
    shadows: ['Tyranny', 'Rigidity', 'Entitlement'],
  },
  magician: {
    label: 'The Magician',
    coreMotivation: 'To understand the universe',
    fears: ['Unintended consequences', 'Losing control', 'Corruption'],
    strengths: ['Transformation', 'Vision', 'Finding win-win solutions'],
    shadows: ['Manipulation', 'Disconnection from reality', 'Charlatanism'],
  },
  innocent: {
    label: 'The Innocent',
    coreMotivation: 'To be happy',
    fears: ['Doing wrong', 'Punishment', 'Abandonment'],
    strengths: ['Faith', 'Optimism', 'Trust'],
    shadows: ['Naivety', 'Denial', 'Dependency'],
  },
};

export const DEFENSE_MECHANISMS: Record<DefenseMechanismType, {
  label: string;
  description: string;
  example: string;
  healthiness: number;
}> = {
  denial: {
    label: 'Denial',
    description: 'Refusing to accept reality or facts',
    example: 'Refusing to believe a loved one has died',
    healthiness: 20,
  },
  projection: {
    label: 'Projection',
    description: 'Attributing one\'s own unacceptable thoughts to others',
    example: 'Accusing others of being angry when you\'re the angry one',
    healthiness: 25,
  },
  rationalization: {
    label: 'Rationalization',
    description: 'Creating logical explanations for irrational behavior',
    example: 'Justifying cheating because "everyone does it"',
    healthiness: 40,
  },
  displacement: {
    label: 'Displacement',
    description: 'Redirecting emotions to a safer target',
    example: 'Taking out work frustration on family members',
    healthiness: 35,
  },
  sublimation: {
    label: 'Sublimation',
    description: 'Channeling unacceptable impulses into positive activities',
    example: 'Converting aggression into competitive sports',
    healthiness: 85,
  },
  regression: {
    label: 'Regression',
    description: 'Reverting to earlier developmental stages',
    example: 'Throwing a tantrum when stressed',
    healthiness: 25,
  },
  repression: {
    label: 'Repression',
    description: 'Unconsciously blocking unacceptable thoughts',
    example: 'Forgetting a traumatic childhood event',
    healthiness: 30,
  },
  reaction_formation: {
    label: 'Reaction Formation',
    description: 'Behaving opposite to one\'s true feelings',
    example: 'Being excessively kind to someone you dislike',
    healthiness: 35,
  },
  intellectualization: {
    label: 'Intellectualization',
    description: 'Using abstract thinking to avoid emotional distress',
    example: 'Focusing on statistics during a personal crisis',
    healthiness: 50,
  },
  compartmentalization: {
    label: 'Compartmentalization',
    description: 'Separating conflicting thoughts into mental compartments',
    example: 'Being ethical at work but dishonest in relationships',
    healthiness: 45,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function generatePsychologyId(): string {
  return `psych_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMotivationId(): string {
  return `mot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConflictId(): string {
  return `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate motivation tree depth
 */
export function calculateTreeDepth(motivations: Motivation[]): number {
  let maxDepth = 0;

  function traverse(motivation: Motivation, depth: number): void {
    maxDepth = Math.max(maxDepth, depth);
    if (motivation.children) {
      motivation.children.forEach((child) => traverse(child, depth + 1));
    }
  }

  motivations.forEach((m) => traverse(m, 1));
  return maxDepth;
}

/**
 * Flatten motivation tree for iteration
 */
export function flattenMotivationTree(motivations: Motivation[]): Motivation[] {
  const result: Motivation[] = [];

  function traverse(motivation: Motivation): void {
    result.push(motivation);
    if (motivation.children) {
      motivation.children.forEach(traverse);
    }
  }

  motivations.forEach(traverse);
  return result;
}

/**
 * Find conflicts between motivations
 */
export function detectConflicts(motivations: Motivation[]): InternalConflict[] {
  const conflicts: InternalConflict[] = [];
  const flat = flattenMotivationTree(motivations);

  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      const a = flat[i];
      const b = flat[j];

      // Check for opposing motivations
      const hasOpposingFears = a.relatedFears?.some(
        (fear) => b.relatedDesires?.includes(fear)
      );
      const hasOpposingDesires = a.relatedDesires?.some(
        (desire) => b.relatedFears?.includes(desire)
      );

      if (hasOpposingFears || hasOpposingDesires) {
        const severity = calculateConflictSeverity(a, b);
        conflicts.push({
          id: generateConflictId(),
          name: `${a.label} vs ${b.label}`,
          description: `Internal tension between the desire for ${a.label.toLowerCase()} and ${b.label.toLowerCase()}`,
          motivationA: a.id,
          motivationB: b.id,
          severity,
          manifestations: [],
          storyImpact: '',
          isResolved: false,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Calculate conflict severity based on motivation strengths
 */
function calculateConflictSeverity(a: Motivation, b: Motivation): ConflictSeverity {
  const avgStrength = (a.strength + b.strength) / 2;
  const levelWeight = {
    primary: 4,
    secondary: 3,
    hidden: 2,
    unconscious: 1,
  };

  const levelScore = (levelWeight[a.level] + levelWeight[b.level]) / 2;
  const totalScore = avgStrength * levelScore / 100;

  if (totalScore > 3) return 'defining';
  if (totalScore > 2) return 'major';
  if (totalScore > 1) return 'moderate';
  return 'minor';
}

/**
 * Suggest Enneagram type based on motivations and fears
 */
export function suggestEnneagramType(
  motivations: Motivation[],
  fears: Fear[]
): EnneagramType {
  const scores: Record<EnneagramType, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };

  // Score based on motivations
  const motivationLabels = motivations.map((m) => m.label.toLowerCase());
  const fearLabels = fears.map((f) => f.label.toLowerCase());

  // Type 1 - Perfectionist
  if (motivationLabels.some((m) => m.includes('perfect') || m.includes('right') || m.includes('correct'))) {
    scores[1] += 2;
  }
  if (fearLabels.some((f) => f.includes('wrong') || f.includes('corrupt'))) {
    scores[1] += 1;
  }

  // Type 2 - Helper
  if (motivationLabels.some((m) => m.includes('help') || m.includes('love') || m.includes('needed'))) {
    scores[2] += 2;
  }
  if (fearLabels.some((f) => f.includes('unwanted') || f.includes('unloved'))) {
    scores[2] += 1;
  }

  // Type 3 - Achiever
  if (motivationLabels.some((m) => m.includes('success') || m.includes('achieve') || m.includes('recognition'))) {
    scores[3] += 2;
  }
  if (fearLabels.some((f) => f.includes('failure') || f.includes('worthless'))) {
    scores[3] += 1;
  }

  // Type 4 - Individualist
  if (motivationLabels.some((m) => m.includes('unique') || m.includes('authentic') || m.includes('special'))) {
    scores[4] += 2;
  }
  if (fearLabels.some((f) => f.includes('ordinary') || f.includes('insignificant'))) {
    scores[4] += 1;
  }

  // Type 5 - Investigator
  if (motivationLabels.some((m) => m.includes('knowledge') || m.includes('understand') || m.includes('competent'))) {
    scores[5] += 2;
  }
  if (fearLabels.some((f) => f.includes('incompetent') || f.includes('useless'))) {
    scores[5] += 1;
  }

  // Type 6 - Loyalist
  if (motivationLabels.some((m) => m.includes('security') || m.includes('support') || m.includes('belong'))) {
    scores[6] += 2;
  }
  if (fearLabels.some((f) => f.includes('alone') || f.includes('abandoned'))) {
    scores[6] += 1;
  }

  // Type 7 - Enthusiast
  if (motivationLabels.some((m) => m.includes('freedom') || m.includes('adventure') || m.includes('happy'))) {
    scores[7] += 2;
  }
  if (fearLabels.some((f) => f.includes('trapped') || f.includes('pain') || f.includes('bored'))) {
    scores[7] += 1;
  }

  // Type 8 - Challenger
  if (motivationLabels.some((m) => m.includes('control') || m.includes('power') || m.includes('strong'))) {
    scores[8] += 2;
  }
  if (fearLabels.some((f) => f.includes('vulnerable') || f.includes('weak') || f.includes('controlled'))) {
    scores[8] += 1;
  }

  // Type 9 - Peacemaker
  if (motivationLabels.some((m) => m.includes('peace') || m.includes('harmony') || m.includes('stability'))) {
    scores[9] += 2;
  }
  if (fearLabels.some((f) => f.includes('conflict') || f.includes('separation'))) {
    scores[9] += 1;
  }

  // Find highest score
  let maxType: EnneagramType = 1;
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = parseInt(type) as EnneagramType;
    }
  }

  return maxType;
}

/**
 * Suggest Jungian archetype based on motivations and traits
 */
export function suggestJungianArchetype(
  motivations: Motivation[],
  traits?: string[]
): JungianArchetype {
  const scores: Record<JungianArchetype, number> = {
    hero: 0,
    mentor: 0,
    shadow: 0,
    trickster: 0,
    caregiver: 0,
    explorer: 0,
    rebel: 0,
    lover: 0,
    creator: 0,
    ruler: 0,
    magician: 0,
    innocent: 0,
  };

  const keywords = [
    ...motivations.map((m) => m.label.toLowerCase()),
    ...motivations.map((m) => m.description.toLowerCase()),
    ...(traits || []).map((t) => t.toLowerCase()),
  ].join(' ');

  // Score based on keyword presence
  if (keywords.includes('courage') || keywords.includes('overcome') || keywords.includes('prove')) {
    scores.hero += 2;
  }
  if (keywords.includes('wisdom') || keywords.includes('teach') || keywords.includes('guide')) {
    scores.mentor += 2;
  }
  if (keywords.includes('dark') || keywords.includes('hidden') || keywords.includes('repress')) {
    scores.shadow += 2;
  }
  if (keywords.includes('trick') || keywords.includes('fun') || keywords.includes('humor')) {
    scores.trickster += 2;
  }
  if (keywords.includes('care') || keywords.includes('protect') || keywords.includes('nurture')) {
    scores.caregiver += 2;
  }
  if (keywords.includes('explore') || keywords.includes('discover') || keywords.includes('adventure')) {
    scores.explorer += 2;
  }
  if (keywords.includes('rebel') || keywords.includes('fight') || keywords.includes('revolution')) {
    scores.rebel += 2;
  }
  if (keywords.includes('love') || keywords.includes('passion') || keywords.includes('connect')) {
    scores.lover += 2;
  }
  if (keywords.includes('create') || keywords.includes('art') || keywords.includes('innovate')) {
    scores.creator += 2;
  }
  if (keywords.includes('lead') || keywords.includes('control') || keywords.includes('order')) {
    scores.ruler += 2;
  }
  if (keywords.includes('transform') || keywords.includes('change') || keywords.includes('power')) {
    scores.magician += 2;
  }
  if (keywords.includes('pure') || keywords.includes('trust') || keywords.includes('hope')) {
    scores.innocent += 2;
  }

  // Find highest score
  let maxArchetype: JungianArchetype = 'hero';
  let maxScore = 0;
  for (const [archetype, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxArchetype = archetype as JungianArchetype;
    }
  }

  return maxArchetype;
}

/**
 * Predict behavior based on psychology profile
 */
export function predictBehavior(
  profile: PsychologyProfile,
  situation: string
): BehaviorPrediction {
  // This is a simplified prediction - in practice, this would use LLM
  const primaryMotivation = profile.motivationTree.rootMotivations.find(
    (m) => m.level === 'primary'
  );

  const activeFears = profile.fears.filter((f) =>
    f.triggers.some((t) => situation.toLowerCase().includes(t.toLowerCase()))
  );

  const triggeredConflicts = profile.internalConflicts.filter(
    (c) => !c.isResolved && c.severity !== 'minor'
  );

  const activeDefenses = profile.defenseMechanisms.filter(
    (d) => d.triggers.some((t) => situation.toLowerCase().includes(t.toLowerCase()))
  );

  return {
    situation,
    likelyResponse: `Character will likely respond based on their ${primaryMotivation?.label || 'core'} motivation`,
    emotionalState: activeFears.length > 0 ? 'Anxious/Defensive' : 'Normal',
    motivationTriggered: primaryMotivation?.id || '',
    defenseMechanismsActivated: activeDefenses.map((d) => d.type),
    conflictsTriggered: triggeredConflicts.map((c) => c.id),
    confidence: 60 + (activeFears.length > 0 ? -20 : 0) + (primaryMotivation ? 20 : 0),
  };
}

// ============================================================================
// Prompt Templates for LLM Generation
// ============================================================================

export const PSYCHOLOGY_GENERATION_PROMPT = `Analyze this character and generate a comprehensive psychological profile.

CHARACTER: {{characterName}}
TYPE: {{characterType}}
BACKGROUND: {{background}}
EXISTING TRAITS: {{existingTraits}}

Generate the following sections in JSON format:

1. MOTIVATION TREE (hierarchical structure):
   - Primary motivations (conscious, driving goals)
   - Secondary motivations (supporting goals)
   - Hidden motivations (unconscious or denied)
   - For each: label, description, strength (0-100), isAwareOf

2. INTERNAL CONFLICTS:
   - Identify conflicts between motivations
   - Name, description, severity (minor/moderate/major/defining)
   - How it manifests in behavior
   - Potential story impact

3. FEARS AND DESIRES:
   - Core fears with origins and triggers
   - Core desires (want vs need distinction)
   - Intensity levels (0-100)

4. WOUNDS:
   - Past traumas or emotional wounds
   - Origin and still active status
   - Associated defense mechanisms

5. DEFENSE MECHANISMS:
   - Which mechanisms this character uses
   - When and how they manifest

6. ARCHETYPES:
   - Primary Jungian archetype
   - Enneagram type with wing
   - Brief reasoning

7. CORE BELIEFS AND VALUES:
   - Fundamental beliefs about self and world
   - Key values that guide decisions

Return as valid JSON matching the PsychologyProfile interface.`;

export const MOTIVATION_ANALYSIS_PROMPT = `Analyze the motivations of this character more deeply:

CHARACTER: {{characterName}}
CURRENT MOTIVATIONS: {{currentMotivations}}
STORY CONTEXT: {{storyContext}}

For each motivation, identify:
1. The deeper "why" behind it (what need does it serve?)
2. Hidden or unconscious versions of this motivation
3. How this motivation might conflict with others
4. What fears drive this motivation
5. What happens if this motivation is thwarted?

Return as JSON array of enhanced Motivation objects.`;

export const CONFLICT_RESOLUTION_PROMPT = `Suggest resolution paths for this internal conflict:

CHARACTER: {{characterName}}
CONFLICT: {{conflictDescription}}
MOTIVATION A: {{motivationA}}
MOTIVATION B: {{motivationB}}
STORY CONTEXT: {{storyContext}}

Provide:
1. Potential resolution approaches (integration, choosing one, finding middle ground)
2. Story beats that could lead to resolution
3. Character growth required for resolution
4. What the character would look like after resolution
5. Consequences of NOT resolving the conflict

Return as structured JSON.`;

export const BEHAVIOR_PREDICTION_PROMPT = `Predict how this character would behave in this situation:

CHARACTER: {{characterName}}
PSYCHOLOGY PROFILE: {{psychologyProfile}}
SITUATION: {{situation}}

Consider:
1. Which motivations would be activated?
2. Which fears might be triggered?
3. What defense mechanisms might engage?
4. How would internal conflicts affect response?
5. What would the character say/do/feel?

Return prediction with confidence level and reasoning.`;

// ============================================================================
// PsychologyEngine Class
// ============================================================================

export class PsychologyEngine {
  private profiles: Map<string, PsychologyProfile> = new Map();

  /**
   * Create a new psychology profile from parsed LLM response
   */
  createProfile(
    characterId: string,
    characterName: string,
    data: Partial<PsychologyProfile>
  ): PsychologyProfile {
    const now = new Date().toISOString();

    const profile: PsychologyProfile = {
      id: generatePsychologyId(),
      characterId,
      characterName,
      motivationTree: data.motivationTree || {
        characterId,
        rootMotivations: [],
        totalMotivations: 0,
        maxDepth: 0,
        dominantLevel: 'primary',
      },
      internalConflicts: data.internalConflicts || [],
      fears: data.fears || [],
      desires: data.desires || [],
      wounds: data.wounds || [],
      defenseMechanisms: data.defenseMechanisms || [],
      archetypes: data.archetypes || {
        jungian: { primary: 'hero' },
        enneagram: {
          type: 5,
          integrationDirection: 8,
          disintegrationDirection: 7,
        },
      },
      coreBeliefs: data.coreBeliefs || [],
      values: data.values || [],
      blindSpots: data.blindSpots || [],
      createdAt: now,
      updatedAt: now,
    };

    // Calculate tree stats
    const allMotivations = flattenMotivationTree(profile.motivationTree.rootMotivations);
    profile.motivationTree.totalMotivations = allMotivations.length;
    profile.motivationTree.maxDepth = calculateTreeDepth(profile.motivationTree.rootMotivations);

    // Auto-detect conflicts if not provided
    if (profile.internalConflicts.length === 0) {
      profile.internalConflicts = detectConflicts(profile.motivationTree.rootMotivations);
    }

    // Auto-suggest archetypes if not fully specified
    if (!data.archetypes?.enneagram?.type) {
      profile.archetypes.enneagram.type = suggestEnneagramType(
        allMotivations,
        profile.fears
      );
    }

    if (!data.archetypes?.jungian?.primary) {
      profile.archetypes.jungian.primary = suggestJungianArchetype(
        allMotivations
      );
    }

    this.profiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): PsychologyProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get profile by character ID
   */
  getProfileByCharacter(characterId: string): PsychologyProfile | undefined {
    return Array.from(this.profiles.values()).find(
      (p) => p.characterId === characterId
    );
  }

  /**
   * Update profile
   */
  updateProfile(
    profileId: string,
    updates: Partial<PsychologyProfile>
  ): PsychologyProfile | undefined {
    const existing = this.profiles.get(profileId);
    if (!existing) return undefined;

    const updated: PsychologyProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate tree stats if motivations changed
    if (updates.motivationTree) {
      const allMotivations = flattenMotivationTree(updated.motivationTree.rootMotivations);
      updated.motivationTree.totalMotivations = allMotivations.length;
      updated.motivationTree.maxDepth = calculateTreeDepth(updated.motivationTree.rootMotivations);
    }

    this.profiles.set(profileId, updated);
    return updated;
  }

  /**
   * Add a motivation to the tree
   */
  addMotivation(
    profileId: string,
    motivation: Omit<Motivation, 'id'>,
    parentId?: string
  ): Motivation | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    const newMotivation: Motivation = {
      ...motivation,
      id: generateMotivationId(),
      parentId,
    };

    if (parentId) {
      // Find parent and add as child
      const addToParent = (motivations: Motivation[]): boolean => {
        for (const m of motivations) {
          if (m.id === parentId) {
            m.children = m.children || [];
            m.children.push(newMotivation);
            return true;
          }
          if (m.children && addToParent(m.children)) return true;
        }
        return false;
      };

      addToParent(profile.motivationTree.rootMotivations);
    } else {
      profile.motivationTree.rootMotivations.push(newMotivation);
    }

    this.updateProfile(profileId, { motivationTree: profile.motivationTree });
    return newMotivation;
  }

  /**
   * Add an internal conflict
   */
  addConflict(
    profileId: string,
    conflict: Omit<InternalConflict, 'id'>
  ): InternalConflict | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    const newConflict: InternalConflict = {
      ...conflict,
      id: generateConflictId(),
    };

    profile.internalConflicts.push(newConflict);
    this.updateProfile(profileId, { internalConflicts: profile.internalConflicts });
    return newConflict;
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    profileId: string,
    conflictId: string,
    resolutionPath: string,
    sceneId?: string
  ): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    const conflict = profile.internalConflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    conflict.isResolved = true;
    conflict.resolutionPath = resolutionPath;
    conflict.resolvedInScene = sceneId;

    this.updateProfile(profileId, { internalConflicts: profile.internalConflicts });
    return true;
  }

  /**
   * Predict behavior in a situation
   */
  predictBehaviorForCharacter(
    profileId: string,
    situation: string
  ): BehaviorPrediction | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    return predictBehavior(profile, situation);
  }

  /**
   * Get Enneagram details for a profile
   */
  getEnneagramDetails(profileId: string): typeof ENNEAGRAM_TYPES[EnneagramType] | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    return ENNEAGRAM_TYPES[profile.archetypes.enneagram.type];
  }

  /**
   * Get Jungian archetype details for a profile
   */
  getJungianDetails(profileId: string): typeof JUNGIAN_ARCHETYPES[JungianArchetype] | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    return JUNGIAN_ARCHETYPES[profile.archetypes.jungian.primary];
  }

  /**
   * Export profile to JSON
   */
  exportProfile(profileId: string): string | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  importProfile(json: string): PsychologyProfile | undefined {
    try {
      const data = JSON.parse(json);
      const profile = this.createProfile(
        data.characterId,
        data.characterName,
        data
      );
      return profile;
    } catch {
      return undefined;
    }
  }
}

export default PsychologyEngine;
