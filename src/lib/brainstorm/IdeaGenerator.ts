/**
 * IdeaGenerator - Context-Aware Creative Brainstorming Engine
 *
 * Generates ideas, what-if scenarios, plot alternatives, conflict escalations,
 * and twists based on story context for creative exploration.
 */

import type {
  IdeaType,
  IdeaImpact,
  IdeaTone,
  BrainstormStoryContext,
  GeneratedIdea,
  WhatIfScenario,
  ConflictEscalation,
  PlotTwist,
  BrainstormSession,
  GenerationOptions,
} from '@/app/features/story/types/ai-writing';
import { templateManager } from '@/lib/templates';

// Re-export all types for backwards compatibility.
// The canonical definitions now live in @/app/features/story/types/ai-writing.
export type {
  IdeaType,
  IdeaImpact,
  IdeaTone,
  GeneratedIdea,
  WhatIfScenario,
  ConflictEscalation,
  PlotTwist,
  BrainstormSession,
  GenerationOptions,
} from '@/app/features/story/types/ai-writing';

// Re-export BrainstormStoryContext as StoryContext for backwards compatibility
export type { BrainstormStoryContext as StoryContext } from '@/app/features/story/types/ai-writing';

// ============================================================================
// Constants
// ============================================================================

const IDEA_TYPE_LABELS: Record<IdeaType, string> = {
  'plot-direction': 'Plot Direction',
  'character-decision': 'Character Decision',
  'conflict-escalation': 'Conflict Escalation',
  'twist': 'Twist',
  'what-if': 'What If',
  'theme-exploration': 'Theme Exploration',
  'setting-change': 'Setting Change',
  'relationship-shift': 'Relationship Shift',
};

const IDEA_TYPE_DESCRIPTIONS: Record<IdeaType, string> = {
  'plot-direction': 'Alternative paths the story could take',
  'character-decision': 'Choices a character could make',
  'conflict-escalation': 'Ways to raise the stakes',
  'twist': 'Unexpected turns of events',
  'what-if': 'Hypothetical scenario exploration',
  'theme-exploration': 'Deeper thematic elements',
  'setting-change': 'Environmental shifts',
  'relationship-shift': 'Evolving character dynamics',
};

const IMPACT_WEIGHTS: Record<IdeaImpact, number> = {
  minor: 1,
  moderate: 2,
  major: 3,
  transformative: 4,
};

// ============================================================================
// Idea Templates - Used to generate diverse ideas
// ============================================================================

const PLOT_DIRECTION_TEMPLATES = [
  'Instead of {expectedAction}, what if {character} chose to {alternativeAction}?',
  'The story could pivot when {event} forces everyone to reconsider their goals.',
  'A hidden connection between {characterA} and {characterB} could change everything.',
  'The real threat isn\'t {obviousThreat}, but rather {hiddenThreat}.',
  'What seems like failure could actually be {character}\'s greatest opportunity.',
];

const CHARACTER_DECISION_TEMPLATES = [
  '{character} faces a choice: {optionA} or {optionB}, with neither being clearly right.',
  'Against everyone\'s advice, {character} decides to {boldAction}.',
  '{character} must choose between loyalty to {personA} and loyalty to {personB}.',
  'A secret from {character}\'s past forces them to make an impossible choice.',
  '{character} surprises everyone by choosing {unexpectedPath}.',
];

const CONFLICT_TEMPLATES = [
  'The stakes double when {newElement} enters the picture.',
  '{character}\'s greatest strength becomes their vulnerability.',
  'Time pressure intensifies: {deadline} approaches faster than expected.',
  'An ally becomes an obstacle when {conflictOfInterest} is revealed.',
  'The enemy adapts, countering {previousStrategy} with {counterStrategy}.',
];

const TWIST_TEMPLATES = [
  'The mentor was never who they claimed to be.',
  'What appeared to be coincidence was actually orchestrated by {mastermind}.',
  'The "villain" was actually trying to prevent a greater catastrophe.',
  '{character} has been unknowingly working against their own goals.',
  'The solution they\'ve been seeking has been with them all along.',
];

const WHAT_IF_TEMPLATES = [
  'What if {character} had made the opposite choice in {pastEvent}?',
  'What if {secret} had been revealed earlier?',
  'What if {assumedAlly} was actually working against them?',
  'What if the {mcguffin} turned out to be something entirely different?',
  'What if {character} wasn\'t who everyone believes them to be?',
];

// ============================================================================
// Brainstorm Template Registration
// ============================================================================

const BRAINSTORM_TEMPLATE_PREFIX = 'brainstorm_';

const BRAINSTORM_TEMPLATE_CONTENT: Record<IdeaType, string> = {
  'plot-direction': PLOT_DIRECTION_TEMPLATES.join('\n'),
  'character-decision': CHARACTER_DECISION_TEMPLATES.join('\n'),
  'conflict-escalation': CONFLICT_TEMPLATES.join('\n'),
  'twist': TWIST_TEMPLATES.join('\n'),
  'what-if': WHAT_IF_TEMPLATES.join('\n'),
  'theme-exploration': 'Explore the story\'s central themes more deeply.\nThe current conflict mirrors a larger thematic question.\nA character\'s choice could embody the story\'s core message.',
  'setting-change': 'A change in location could bring new challenges.\nThe environment itself could become an obstacle or ally.\nMoving to unfamiliar territory would test characters in new ways.',
  'relationship-shift': 'An unexpected revelation changes how characters see each other.\nShared experience forces new understanding between unlikely parties.\nTrust is tested when competing interests come to light.',
};

// ============================================================================
// IdeaGenerator Class
// ============================================================================

export class IdeaGenerator {
  private static instance: IdeaGenerator;
  private sessions: Map<string, BrainstormSession> = new Map();
  private activeSessionId: string | null = null;
  private brainstormTemplatesRegistered = false;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): IdeaGenerator {
    if (!IdeaGenerator.instance) {
      IdeaGenerator.instance = new IdeaGenerator();
    }
    return IdeaGenerator.instance;
  }

  // -------------------------------------------------------------------------
  // Brainstorm Template Registration
  // -------------------------------------------------------------------------

  private ensureBrainstormTemplates(): void {
    if (this.brainstormTemplatesRegistered) return;

    const allTypes = Object.keys(IDEA_TYPE_LABELS) as IdeaType[];
    for (const ideaType of allTypes) {
      templateManager.ensureTemplate(`${BRAINSTORM_TEMPLATE_PREFIX}${ideaType}`, {
        name: `Brainstorm: ${IDEA_TYPE_LABELS[ideaType]}`,
        description: IDEA_TYPE_DESCRIPTIONS[ideaType],
        category: 'story',
        tags: ['brainstorm', 'idea-generation', ideaType],
        content: BRAINSTORM_TEMPLATE_CONTENT[ideaType],
        variables: [],
        authorId: 'system',
        authorName: 'Brainstorm Engine',
        visibility: 'private',
      });
    }
    this.brainstormTemplatesRegistered = true;
  }

  getBrainstormTemplateId(ideaType: IdeaType): string {
    this.ensureBrainstormTemplates();
    return `${BRAINSTORM_TEMPLATE_PREFIX}${ideaType}`;
  }

  // -------------------------------------------------------------------------
  // Session Management
  // -------------------------------------------------------------------------

  createSession(name: string, context: BrainstormStoryContext): BrainstormSession {
    const id = `brainstorm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const session: BrainstormSession = {
      id,
      name,
      context,
      ideas: [],
      scenarios: [],
      escalations: [],
      twists: [],
      savedIdeas: [],
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    this.activeSessionId = id;
    this.saveToStorage();
    return session;
  }

  getSession(id: string): BrainstormSession | undefined {
    return this.sessions.get(id);
  }

  getActiveSession(): BrainstormSession | undefined {
    if (!this.activeSessionId) return undefined;
    return this.sessions.get(this.activeSessionId);
  }

  setActiveSession(id: string | null): void {
    this.activeSessionId = id;
    this.saveToStorage();
  }

  getAllSessions(): BrainstormSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  updateSessionContext(sessionId: string, context: Partial<BrainstormStoryContext>): BrainstormSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.context = { ...session.context, ...context };
    session.updatedAt = Date.now();
    this.saveToStorage();
    return session;
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      if (this.activeSessionId === id) {
        this.activeSessionId = null;
      }
      this.saveToStorage();
    }
    return deleted;
  }

  // -------------------------------------------------------------------------
  // Idea Generation
  // -------------------------------------------------------------------------

  generateIdeas(sessionId: string, options: GenerationOptions = {}): GeneratedIdea[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    this.ensureBrainstormTemplates();

    const {
      count = 5,
      types = ['plot-direction', 'character-decision', 'conflict-escalation', 'twist', 'what-if'],
      tones = ['dramatic', 'mysterious', 'action'],
      focusCharacters = [],
    } = options;

    const ideas: GeneratedIdea[] = [];

    // Use weighted selection based on effectiveness data
    const weighted = this.getWeightedTypes(types);

    for (let i = 0; i < count; i++) {
      const type = weighted.length > 1
        ? this.selectWeightedType(weighted)
        : weighted[0].type;
      const tone = tones[i % tones.length];
      const idea = this.generateSingleIdea(session.context, type, tone, focusCharacters);
      ideas.push(idea);
    }

    session.ideas.push(...ideas);
    session.updatedAt = Date.now();
    this.saveToStorage();

    return ideas;
  }

  private generateSingleIdea(
    context: BrainstormStoryContext,
    type: IdeaType,
    tone: IdeaTone,
    focusCharacters: string[]
  ): GeneratedIdea {
    const id = `idea_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const characters = context.characters || [];
    const relevantCharacters = focusCharacters.length > 0
      ? focusCharacters
      : characters.slice(0, 2).map(c => c.name);

    // Select template based on type
    let title = '';
    let description = '';

    switch (type) {
      case 'plot-direction':
        title = this.generatePlotDirectionTitle(context, relevantCharacters);
        description = this.generatePlotDirectionDescription(context, relevantCharacters);
        break;
      case 'character-decision':
        title = this.generateCharacterDecisionTitle(relevantCharacters);
        description = this.generateCharacterDecisionDescription(context, relevantCharacters);
        break;
      case 'conflict-escalation':
        title = this.generateConflictTitle(context);
        description = this.generateConflictDescription(context);
        break;
      case 'twist':
        title = this.generateTwistTitle();
        description = this.generateTwistDescription(context, relevantCharacters);
        break;
      case 'what-if':
        title = this.generateWhatIfTitle(context, relevantCharacters);
        description = this.generateWhatIfDescription(context, relevantCharacters);
        break;
      case 'theme-exploration':
        title = this.generateThemeTitle(context);
        description = this.generateThemeDescription(context);
        break;
      case 'setting-change':
        title = 'Shift in Environment';
        description = this.generateSettingDescription(context);
        break;
      case 'relationship-shift':
        title = this.generateRelationshipTitle(relevantCharacters);
        description = this.generateRelationshipDescription(context, relevantCharacters);
        break;
    }

    const impact = this.determineImpact(type, context);
    const potentialConsequences = this.generateConsequences(type, context);
    const followUpQuestions = this.generateFollowUpQuestions(type, title);
    const explorationPrompts = this.generateExplorationPrompts(type, description);

    return {
      id,
      type,
      title,
      description,
      impact,
      tone,
      relevantCharacters,
      potentialConsequences,
      followUpQuestions,
      explorationPrompts,
      createdAt: Date.now(),
      explored: false,
      saved: false,
      templateKey: `${BRAINSTORM_TEMPLATE_PREFIX}${type}`,
    };
  }

  private generatePlotDirectionTitle(context: BrainstormStoryContext, characters: string[]): string {
    const titles = [
      'A Different Path Forward',
      'Unexpected Alliance',
      'The Hidden Route',
      'Pivot Point',
      'Alternative Approach',
      `${characters[0] || 'The protagonist'}\'s New Direction`,
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generatePlotDirectionDescription(context: BrainstormStoryContext, characters: string[]): string {
    const char = characters[0] || 'the protagonist';
    const descriptions = [
      `Instead of pursuing the obvious path, ${char} could discover a completely unexpected opportunity that changes everything.`,
      `What if the current approach is fundamentally flawed? There might be a solution that no one has considered yet.`,
      `A chance encounter or discovery could redirect the entire narrative in a more compelling direction.`,
      `The apparent dead end might actually contain a hidden passage to something greater.`,
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateCharacterDecisionTitle(characters: string[]): string {
    const char = characters[0] || 'Character';
    return `${char}'s Crossroads`;
  }

  private generateCharacterDecisionDescription(context: BrainstormStoryContext, characters: string[]): string {
    const char = characters[0] || 'The character';
    const descriptions = [
      `${char} faces an impossible choice that will define who they truly are.`,
      `Against all logic, ${char} might choose the path that feels right rather than the one that seems smart.`,
      `What ${char} decides in this moment will have repercussions no one can predict.`,
      `${char} must choose between two things they value equally—and there's no middle ground.`,
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateConflictTitle(context: BrainstormStoryContext): string {
    const titles = [
      'Rising Stakes',
      'The Pressure Intensifies',
      'New Complications',
      'The Clock Ticks',
      'Escalating Tensions',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateConflictDescription(context: BrainstormStoryContext): string {
    const conflicts = context.activeConflicts || ['the main challenge'];
    const conflict = conflicts[0] || 'the situation';
    const descriptions = [
      `The ${conflict} becomes far more dangerous when an unexpected element is introduced.`,
      `Just when things seemed manageable, new information reveals the true scope of the problem.`,
      `Time constraints force a decision before anyone is truly ready.`,
      `An ally's hidden agenda complicates an already difficult situation.`,
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateTwistTitle(): string {
    const titles = [
      'Nothing Is What It Seems',
      'The Revelation',
      'Hidden Truth',
      'The Reversal',
      'Unexpected Discovery',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateTwistDescription(context: BrainstormStoryContext, characters: string[]): string {
    const char = characters[0] || 'someone';
    const descriptions = [
      `What if ${char} has been operating under a fundamental misconception this entire time?`,
      `A discovery reveals that the apparent antagonist had noble motivations all along.`,
      `The truth about past events changes everything about the present situation.`,
      `Someone everyone trusted has been secretly working toward their own agenda.`,
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateWhatIfTitle(context: BrainstormStoryContext, characters: string[]): string {
    const char = characters[0] || 'they';
    return `What If ${char} Had Chosen Differently?`;
  }

  private generateWhatIfDescription(context: BrainstormStoryContext, characters: string[]): string {
    const char = characters[0] || 'the protagonist';
    const descriptions = [
      `Explore an alternate path where ${char} made a different crucial decision.`,
      `What would the story look like if a key assumption turned out to be wrong?`,
      `Consider a scenario where the biggest obstacle was actually the greatest opportunity.`,
      `Imagine if ${char}'s greatest fear had already come true—what would they do then?`,
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateThemeTitle(context: BrainstormStoryContext): string {
    const themes = context.themes || ['identity', 'choice', 'consequence'];
    return `Exploring ${themes[0] || 'Deeper Themes'}`;
  }

  private generateThemeDescription(context: BrainstormStoryContext): string {
    const descriptions = [
      'This moment presents an opportunity to explore the story\'s central themes more deeply.',
      'The current conflict mirrors a larger thematic question worth examining.',
      'A character\'s choice here could embody the story\'s core message.',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateSettingDescription(context: BrainstormStoryContext): string {
    const descriptions = [
      'A change in location could bring new challenges and opportunities.',
      'The environment itself could become an obstacle or ally.',
      'Moving to unfamiliar territory would test characters in new ways.',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateRelationshipTitle(characters: string[]): string {
    if (characters.length >= 2) {
      return `${characters[0]} and ${characters[1]}: A Shifting Dynamic`;
    }
    return 'Relationship Evolution';
  }

  private generateRelationshipDescription(context: BrainstormStoryContext, characters: string[]): string {
    const descriptions = [
      'An unexpected revelation changes how these characters see each other.',
      'Shared experience forces a new understanding between unlikely parties.',
      'Trust is tested when competing interests come to light.',
      'What started as opposition might evolve into something else entirely.',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private determineImpact(type: IdeaType, context: BrainstormStoryContext): IdeaImpact {
    const baseImpacts: Record<IdeaType, IdeaImpact> = {
      'plot-direction': 'major',
      'character-decision': 'moderate',
      'conflict-escalation': 'moderate',
      'twist': 'transformative',
      'what-if': 'moderate',
      'theme-exploration': 'minor',
      'setting-change': 'moderate',
      'relationship-shift': 'moderate',
    };
    return baseImpacts[type];
  }

  private generateConsequences(type: IdeaType, context: BrainstormStoryContext): string[] {
    const genericConsequences = [
      'This could change character relationships significantly',
      'The story\'s pacing might shift',
      'New conflicts could emerge',
      'Previously established elements might need revision',
    ];
    return genericConsequences.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private generateFollowUpQuestions(type: IdeaType, title: string): string[] {
    const questions = [
      'How would other characters react to this development?',
      'What needs to be set up for this to work?',
      'Are there any plot holes this might create?',
      'How does this fit with the overall story arc?',
      'What\'s the emotional payoff for the reader?',
    ];
    return questions.slice(0, 3);
  }

  private generateExplorationPrompts(type: IdeaType, description: string): string[] {
    const prompts = [
      'Explore the immediate aftermath',
      'Consider the long-term consequences',
      'Think about character reactions',
      'Map out the necessary setup',
    ];
    return prompts.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  // -------------------------------------------------------------------------
  // What-If Scenario Generation
  // -------------------------------------------------------------------------

  generateWhatIfScenario(sessionId: string, premise: string): WhatIfScenario {
    const session = this.sessions.get(sessionId);
    const id = `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const scenario: WhatIfScenario = {
      id,
      premise,
      description: `Exploring the implications of: ${premise}`,
      possibleOutcomes: [
        { outcome: 'The situation resolves positively with unexpected growth', likelihood: 'possible', tone: 'dramatic' },
        { outcome: 'Complications arise that test everyone involved', likelihood: 'likely', tone: 'mysterious' },
        { outcome: 'An unforeseen consequence changes everything', likelihood: 'unlikely', tone: 'dramatic' },
      ],
      affectedCharacters: session?.context.characters?.map(c => c.name) || [],
      storyImplications: [
        'This would require adjusting previous plot points',
        'Character motivations might need reconsideration',
        'The story\'s tone could shift',
      ],
      explorationDepth: 1,
      childScenarioIds: [],
      createdAt: Date.now(),
    };

    if (session) {
      session.scenarios.push(scenario);
      session.updatedAt = Date.now();
      this.saveToStorage();
    }

    return scenario;
  }

  exploreScenarioDeeper(sessionId: string, parentScenarioId: string): WhatIfScenario[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const parentScenario = session.scenarios.find(s => s.id === parentScenarioId);
    if (!parentScenario) return [];

    const childScenarios: WhatIfScenario[] = parentScenario.possibleOutcomes.map((outcome, i) => {
      const id = `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${i}`;
      return {
        id,
        premise: outcome.outcome,
        description: `Following the ${outcome.likelihood} path: ${outcome.outcome}`,
        possibleOutcomes: [
          { outcome: 'This leads to resolution', likelihood: 'possible', tone: outcome.tone },
          { outcome: 'New challenges emerge', likelihood: 'likely', tone: 'dramatic' },
        ],
        affectedCharacters: parentScenario.affectedCharacters,
        storyImplications: ['Builds on previous developments', 'Opens new narrative possibilities'],
        explorationDepth: parentScenario.explorationDepth + 1,
        parentScenarioId,
        childScenarioIds: [],
        createdAt: Date.now(),
      };
    });

    parentScenario.childScenarioIds = childScenarios.map(s => s.id);
    session.scenarios.push(...childScenarios);
    session.updatedAt = Date.now();
    this.saveToStorage();

    return childScenarios;
  }

  // -------------------------------------------------------------------------
  // Conflict Escalation
  // -------------------------------------------------------------------------

  escalateConflict(sessionId: string, originalConflict: string, targetLevel: 1 | 2 | 3 | 4 | 5): ConflictEscalation {
    const session = this.sessions.get(sessionId);
    const id = `escalation_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const escalationDescriptions: Record<number, string> = {
      1: 'Minor tension added',
      2: 'Stakes raised moderately',
      3: 'Significant complications introduced',
      4: 'Critical turning point reached',
      5: 'Maximum intensity - everything is at stake',
    };

    const escalation: ConflictEscalation = {
      id,
      originalConflict,
      escalationLevel: targetLevel,
      escalatedDescription: `${originalConflict} - ${escalationDescriptions[targetLevel]}`,
      newStakes: this.generateNewStakes(targetLevel),
      characterReactions: session?.context.characters?.slice(0, 3).map(c => ({
        characterName: c.name,
        reaction: this.generateCharacterReaction(c.name, targetLevel),
      })) || [],
      potentialResolutions: this.generateResolutions(targetLevel),
      createdAt: Date.now(),
    };

    if (session) {
      session.escalations.push(escalation);
      session.updatedAt = Date.now();
      this.saveToStorage();
    }

    return escalation;
  }

  private generateNewStakes(level: number): string[] {
    const stakes = [
      'Personal reputation is on the line',
      'Important relationships may be damaged',
      'Physical danger becomes real',
      'Life-changing consequences loom',
      'Everything they care about hangs in the balance',
    ];
    return stakes.slice(0, level);
  }

  private generateCharacterReaction(name: string, level: number): string {
    const reactions = [
      `${name} grows concerned but remains composed`,
      `${name} shows signs of stress but pushes forward`,
      `${name} must make difficult choices under pressure`,
      `${name} faces their deepest fears`,
      `${name} is pushed to their absolute limit`,
    ];
    return reactions[level - 1] || reactions[0];
  }

  private generateResolutions(level: number): string[] {
    const resolutions = [
      'A compromise might be reached',
      'One side must make a significant sacrifice',
      'An unexpected third option could emerge',
      'Outside intervention might be necessary',
      'Only a fundamental change can resolve this',
    ];
    return resolutions.slice(0, Math.min(level + 1, 5));
  }

  // -------------------------------------------------------------------------
  // Twist Generation
  // -------------------------------------------------------------------------

  generateTwist(sessionId: string, twistType: PlotTwist['twistType']): PlotTwist {
    const session = this.sessions.get(sessionId);
    const id = `twist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const twistTemplates: Record<PlotTwist['twistType'], { title: string; description: string }> = {
      revelation: {
        title: 'Hidden Truth Revealed',
        description: 'A long-concealed secret comes to light, changing everything.',
      },
      betrayal: {
        title: 'Trust Shattered',
        description: 'Someone thought to be loyal reveals their true allegiance.',
      },
      reversal: {
        title: 'The Tables Turn',
        description: 'The power dynamic shifts dramatically and unexpectedly.',
      },
      discovery: {
        title: 'Unexpected Discovery',
        description: 'Something found changes the understanding of the entire situation.',
      },
      arrival: {
        title: 'An Unexpected Arrival',
        description: 'Someone appears who changes the course of events.',
      },
      departure: {
        title: 'Sudden Departure',
        description: 'A key figure leaves, creating a void that must be addressed.',
      },
    };

    const template = twistTemplates[twistType];
    const characters = session?.context.characters?.map(c => c.name) || [];

    const twist: PlotTwist = {
      id,
      twistType,
      title: template.title,
      description: template.description,
      setup: 'Plant subtle hints earlier in the narrative to make this feel earned.',
      payoff: 'This revelation recontextualizes previous events and raises new questions.',
      foreshadowingHints: [
        'A seemingly minor detail that gains significance',
        'Character behavior that seemed odd at the time',
        'A conversation that takes on new meaning',
      ],
      affectedCharacters: characters.slice(0, 3),
      impact: 'major',
      createdAt: Date.now(),
    };

    if (session) {
      session.twists.push(twist);
      session.updatedAt = Date.now();
      this.saveToStorage();
    }

    return twist;
  }

  // -------------------------------------------------------------------------
  // Idea Management
  // -------------------------------------------------------------------------

  saveIdea(sessionId: string, ideaId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) return false;

    idea.saved = true;
    if (!session.savedIdeas.includes(ideaId)) {
      session.savedIdeas.push(ideaId);
    }
    session.updatedAt = Date.now();
    this.saveToStorage();

    // Pipe feedback: saving an idea signals usefulness
    this.recordIdeaUsage(idea);

    return true;
  }

  unsaveIdea(sessionId: string, ideaId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) return false;

    idea.saved = false;
    session.savedIdeas = session.savedIdeas.filter(id => id !== ideaId);
    session.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  markIdeaExplored(sessionId: string, ideaId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) return false;

    idea.explored = true;
    session.updatedAt = Date.now();
    this.saveToStorage();

    // Pipe feedback: exploring an idea signals interest
    this.recordIdeaUsage(idea);

    return true;
  }

  rateIdea(sessionId: string, ideaId: string, rating: 1 | 2 | 3 | 4 | 5): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const idea = session.ideas.find(i => i.id === ideaId);
    if (!idea) return false;

    idea.rating = rating;
    session.updatedAt = Date.now();
    this.saveToStorage();

    // Pipe feedback: explicit quality signal into template effectiveness
    const templateId = idea.templateKey || `${BRAINSTORM_TEMPLATE_PREFIX}${idea.type}`;
    const qualityMap: Record<number, 'poor' | 'fair' | 'good' | 'excellent'> = {
      1: 'poor', 2: 'poor', 3: 'fair', 4: 'good', 5: 'excellent',
    };
    templateManager.addRating(templateId, idea.id, rating, undefined, qualityMap[rating]);

    return true;
  }

  getSavedIdeas(sessionId: string): GeneratedIdea[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.ideas.filter(i => i.saved);
  }

  // -------------------------------------------------------------------------
  // Effectiveness Feedback Bridge
  // -------------------------------------------------------------------------

  private recordIdeaUsage(idea: GeneratedIdea): void {
    const templateId = idea.templateKey || `${BRAINSTORM_TEMPLATE_PREFIX}${idea.type}`;
    templateManager.recordUsage(templateId, idea.description.length);
  }

  private getWeightedTypes(types: IdeaType[]): Array<{ type: IdeaType; weight: number }> {
    return types.map(type => {
      const templateId = `${BRAINSTORM_TEMPLATE_PREFIX}${type}`;
      const report = templateManager.getEffectivenessReport(templateId);
      // Base weight 1.0; boost up to 2.0 for highly-rated types
      const weight = report && report.metrics.ratingCount > 0
        ? 1 + (report.metrics.averageRating / 5)
        : 1;
      return { type, weight };
    });
  }

  private selectWeightedType(weighted: Array<{ type: IdeaType; weight: number }>): IdeaType {
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.type;
    }
    return weighted[weighted.length - 1].type;
  }

  getIdeaTypeEffectiveness(ideaType: IdeaType) {
    this.ensureBrainstormTemplates();
    const templateId = `${BRAINSTORM_TEMPLATE_PREFIX}${ideaType}`;
    return templateManager.getEffectivenessReport(templateId);
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  getIdeaTypeLabel(type: IdeaType): string {
    return IDEA_TYPE_LABELS[type];
  }

  getIdeaTypeDescription(type: IdeaType): string {
    return IDEA_TYPE_DESCRIPTIONS[type];
  }

  getAllIdeaTypes(): IdeaType[] {
    return Object.keys(IDEA_TYPE_LABELS) as IdeaType[];
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('brainstorm_sessions');
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = new Map(Object.entries(data.sessions || {}));
        this.activeSessionId = data.activeSessionId || null;
      }
    } catch (err) {
      console.error('Failed to load IdeaGenerator from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        sessions: Object.fromEntries(this.sessions),
        activeSessionId: this.activeSessionId,
      };
      localStorage.setItem('brainstorm_sessions', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save IdeaGenerator to storage:', err);
    }
  }
}

// Export singleton instance
export const ideaGenerator = IdeaGenerator.getInstance();
