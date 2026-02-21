/**
 * TaxonomyLibrary
 * Comprehensive beat type taxonomy with emotional markers,
 * function tags, and smart categorization system
 */

// ===== BEAT TYPE TAXONOMY =====

export type BeatCategory =
  | 'action'
  | 'revelation'
  | 'decision'
  | 'emotional'
  | 'dialogue'
  | 'transition'
  | 'setup'
  | 'payoff';

export type BeatSubtype =
  // Action subtypes
  | 'chase'
  | 'fight'
  | 'escape'
  | 'confrontation'
  | 'rescue'
  | 'discovery'
  // Revelation subtypes
  | 'plot_twist'
  | 'character_secret'
  | 'world_building'
  | 'backstory'
  | 'clue'
  | 'realization'
  // Decision subtypes
  | 'moral_choice'
  | 'strategic_choice'
  | 'sacrifice'
  | 'commitment'
  | 'refusal'
  // Emotional subtypes
  | 'bonding'
  | 'conflict'
  | 'reconciliation'
  | 'loss'
  | 'triumph'
  | 'despair'
  // Dialogue subtypes
  | 'negotiation'
  | 'interrogation'
  | 'confession'
  | 'debate'
  | 'seduction'
  // Transition subtypes
  | 'time_skip'
  | 'location_change'
  | 'montage'
  | 'flashback'
  | 'flash_forward'
  // Setup subtypes
  | 'foreshadowing'
  | 'introduction'
  | 'world_establishment'
  | 'stakes_raising'
  | 'goal_setting'
  // Payoff subtypes
  | 'callback'
  | 'resolution'
  | 'consequence'
  | 'revelation_payoff'
  | 'character_arc_completion';

export interface BeatTypeDefinition {
  category: BeatCategory;
  subtype: BeatSubtype;
  label: string;
  description: string;
  icon: string; // Emoji or icon name
  examples: string[];
  commonEmotions: EmotionType[];
  commonFunctions: FunctionTag[];
  paceImpact: 'accelerates' | 'decelerates' | 'maintains' | 'varies';
  typicalDuration: 'short' | 'medium' | 'long';
}

// ===== EMOTIONAL MARKERS =====

export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'surprise'
  | 'disgust'
  | 'anticipation'
  | 'trust'
  | 'tension'
  | 'relief'
  | 'love'
  | 'hate'
  | 'hope'
  | 'despair'
  | 'curiosity'
  | 'confusion'
  | 'pride'
  | 'shame'
  | 'nostalgia'
  | 'awe';

export interface EmotionDefinition {
  type: EmotionType;
  label: string;
  color: string; // Hex color for visualization
  intensity: 'low' | 'medium' | 'high';
  valence: 'positive' | 'negative' | 'neutral';
  arousal: 'calm' | 'moderate' | 'excited';
  opposites: EmotionType[];
  blendsWith: EmotionType[];
}

export interface EmotionalMarker {
  primary: EmotionType;
  secondary?: EmotionType;
  intensity: number; // 0-100
  shift?: {
    from: EmotionType;
    to: EmotionType;
  };
}

// ===== FUNCTION TAGS =====

export type FunctionTag =
  // Structural functions
  | 'inciting_incident'
  | 'first_plot_point'
  | 'midpoint'
  | 'all_is_lost'
  | 'climax'
  | 'resolution'
  // Narrative functions
  | 'setup'
  | 'payoff'
  | 'foreshadowing'
  | 'callback'
  | 'plant'
  | 'consequence'
  // Character functions
  | 'introduction'
  | 'character_moment'
  | 'arc_turning_point'
  | 'transformation'
  // Pacing functions
  | 'tension_builder'
  | 'tension_release'
  | 'breather'
  | 'accelerator'
  // World building functions
  | 'world_establishment'
  // Thematic functions
  | 'theme_statement'
  | 'theme_exploration'
  | 'theme_reinforcement';

export interface FunctionDefinition {
  tag: FunctionTag;
  label: string;
  description: string;
  placement: ('beginning' | 'middle' | 'end' | 'any')[];
  importance: 'critical' | 'important' | 'optional';
  frequency: 'once' | 'few' | 'many';
}

// ===== BEAT CLASSIFICATION =====

export interface BeatClassification {
  beatId: string;
  category: BeatCategory;
  subtype: BeatSubtype;
  confidence: number;
  emotionalMarkers: EmotionalMarker[];
  functionTags: FunctionTag[];
  alternativeCategories?: {
    category: BeatCategory;
    subtype: BeatSubtype;
    confidence: number;
  }[];
}

// ===== DISTRIBUTION ANALYSIS =====

export interface CategoryDistribution {
  category: BeatCategory;
  count: number;
  percentage: number;
  beats: string[]; // Beat IDs
}

export interface EmotionDistribution {
  emotion: EmotionType;
  count: number;
  percentage: number;
  averageIntensity: number;
}

export interface FunctionDistribution {
  function: FunctionTag;
  count: number;
  percentage: number;
  positions: number[]; // Relative positions (0-1) of beats with this function
}

export interface DistributionAnalysis {
  totalBeats: number;
  categoryDistribution: CategoryDistribution[];
  emotionDistribution: EmotionDistribution[];
  functionDistribution: FunctionDistribution[];
  balanceScore: number; // 0-100
  recommendations: BalanceRecommendation[];
}

export interface BalanceRecommendation {
  type: 'add' | 'remove' | 'rebalance' | 'move';
  category?: BeatCategory;
  emotion?: EmotionType;
  function?: FunctionTag;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion?: string;
}

// ===== TAXONOMY DEFINITIONS =====

export const BEAT_TYPES: BeatTypeDefinition[] = [
  // Action beats
  {
    category: 'action',
    subtype: 'chase',
    label: 'Chase',
    description: 'Pursuit sequences creating momentum and urgency',
    icon: '🏃',
    examples: ['Car chase', 'Foot pursuit', 'Escape from danger'],
    commonEmotions: ['fear', 'anticipation', 'tension'],
    commonFunctions: ['tension_builder', 'accelerator'],
    paceImpact: 'accelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'action',
    subtype: 'fight',
    label: 'Fight/Combat',
    description: 'Physical or verbal confrontation between characters',
    icon: '⚔️',
    examples: ['Battle scene', 'Argument', 'Duel'],
    commonEmotions: ['anger', 'fear', 'tension'],
    commonFunctions: ['climax', 'tension_builder'],
    paceImpact: 'accelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'action',
    subtype: 'escape',
    label: 'Escape',
    description: 'Characters fleeing from danger or confinement',
    icon: '🚪',
    examples: ['Prison break', 'Narrow escape', 'Last-second getaway'],
    commonEmotions: ['fear', 'relief', 'anticipation'],
    commonFunctions: ['tension_release', 'accelerator'],
    paceImpact: 'accelerates',
    typicalDuration: 'short',
  },
  {
    category: 'action',
    subtype: 'confrontation',
    label: 'Confrontation',
    description: 'Direct face-off between opposing forces',
    icon: '🎯',
    examples: ['Showdown', 'Face-to-face meeting', 'Ultimatum delivery'],
    commonEmotions: ['tension', 'anger', 'anticipation'],
    commonFunctions: ['climax', 'arc_turning_point'],
    paceImpact: 'varies',
    typicalDuration: 'medium',
  },
  {
    category: 'action',
    subtype: 'rescue',
    label: 'Rescue',
    description: 'Saving someone from danger or captivity',
    icon: '🦸',
    examples: ['Hostage rescue', 'Medical emergency', 'Natural disaster rescue'],
    commonEmotions: ['fear', 'hope', 'relief'],
    commonFunctions: ['climax', 'payoff'],
    paceImpact: 'accelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'action',
    subtype: 'discovery',
    label: 'Discovery',
    description: 'Finding something important through active investigation',
    icon: '🔍',
    examples: ['Finding evidence', 'Discovering a location', 'Uncovering a secret'],
    commonEmotions: ['surprise', 'curiosity', 'anticipation'],
    commonFunctions: ['payoff', 'setup'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },

  // Revelation beats
  {
    category: 'revelation',
    subtype: 'plot_twist',
    label: 'Plot Twist',
    description: 'Unexpected turn that changes understanding of the story',
    icon: '🔄',
    examples: ['The villain was the hero\'s father', 'It was all a dream', 'Double agent reveal'],
    commonEmotions: ['surprise', 'confusion', 'awe'],
    commonFunctions: ['midpoint', 'climax'],
    paceImpact: 'varies',
    typicalDuration: 'short',
  },
  {
    category: 'revelation',
    subtype: 'character_secret',
    label: 'Character Secret',
    description: 'Hidden aspect of a character is revealed',
    icon: '🎭',
    examples: ['True identity', 'Hidden motive', 'Past trauma'],
    commonEmotions: ['surprise', 'trust', 'shame'],
    commonFunctions: ['character_moment', 'payoff'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'revelation',
    subtype: 'world_building',
    label: 'World Revelation',
    description: 'New information about the story world is revealed',
    icon: '🌍',
    examples: ['Hidden society exists', 'True nature of the world', 'Conspiracy unveiled'],
    commonEmotions: ['awe', 'curiosity', 'fear'],
    commonFunctions: ['world_establishment', 'theme_exploration'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'revelation',
    subtype: 'backstory',
    label: 'Backstory',
    description: 'Past events that explain current situation',
    icon: '📜',
    examples: ['Origin story', 'How they met', 'The incident that started it all'],
    commonEmotions: ['nostalgia', 'sadness', 'curiosity'],
    commonFunctions: ['character_moment', 'theme_exploration'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'revelation',
    subtype: 'clue',
    label: 'Clue',
    description: 'Piece of information that hints at the truth',
    icon: '🧩',
    examples: ['Cryptic message', 'Physical evidence', 'Overheard conversation'],
    commonEmotions: ['curiosity', 'anticipation', 'confusion'],
    commonFunctions: ['setup', 'foreshadowing'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },
  {
    category: 'revelation',
    subtype: 'realization',
    label: 'Realization',
    description: 'Character understands something important',
    icon: '💡',
    examples: ['Epiphany', 'Connecting the dots', 'Seeing the truth'],
    commonEmotions: ['surprise', 'awe', 'hope'],
    commonFunctions: ['arc_turning_point', 'payoff'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },

  // Decision beats
  {
    category: 'decision',
    subtype: 'moral_choice',
    label: 'Moral Choice',
    description: 'Character faces an ethical dilemma',
    icon: '⚖️',
    examples: ['Save one or save many', 'Tell the truth or protect someone', 'Right vs. easy'],
    commonEmotions: ['tension', 'fear', 'hope'],
    commonFunctions: ['theme_statement', 'arc_turning_point'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'decision',
    subtype: 'strategic_choice',
    label: 'Strategic Choice',
    description: 'Character makes a tactical decision',
    icon: '🎯',
    examples: ['Battle plan', 'Heist approach', 'Negotiation strategy'],
    commonEmotions: ['anticipation', 'tension', 'hope'],
    commonFunctions: ['setup', 'accelerator'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },
  {
    category: 'decision',
    subtype: 'sacrifice',
    label: 'Sacrifice',
    description: 'Character gives up something important',
    icon: '💔',
    examples: ['Self-sacrifice', 'Giving up a dream', 'Letting someone go'],
    commonEmotions: ['sadness', 'love', 'hope'],
    commonFunctions: ['climax', 'transformation'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'decision',
    subtype: 'commitment',
    label: 'Commitment',
    description: 'Character commits to a course of action',
    icon: '🤝',
    examples: ['Accepting the quest', 'Making a promise', 'Choosing a side'],
    commonEmotions: ['hope', 'anticipation', 'trust'],
    commonFunctions: ['first_plot_point', 'arc_turning_point'],
    paceImpact: 'accelerates',
    typicalDuration: 'short',
  },
  {
    category: 'decision',
    subtype: 'refusal',
    label: 'Refusal',
    description: 'Character refuses to act or participate',
    icon: '🚫',
    examples: ['Refusing the call', 'Rejection', 'Standing ground'],
    commonEmotions: ['fear', 'anger', 'pride'],
    commonFunctions: ['setup', 'arc_turning_point'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },

  // Emotional beats
  {
    category: 'emotional',
    subtype: 'bonding',
    label: 'Bonding',
    description: 'Characters form or strengthen a connection',
    icon: '❤️',
    examples: ['First meeting', 'Shared experience', 'Heart-to-heart conversation'],
    commonEmotions: ['love', 'trust', 'joy'],
    commonFunctions: ['character_moment', 'breather'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'emotional',
    subtype: 'conflict',
    label: 'Emotional Conflict',
    description: 'Characters clash emotionally',
    icon: '💥',
    examples: ['Argument', 'Betrayal reaction', 'Disappointment'],
    commonEmotions: ['anger', 'sadness', 'hate'],
    commonFunctions: ['tension_builder', 'arc_turning_point'],
    paceImpact: 'accelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'emotional',
    subtype: 'reconciliation',
    label: 'Reconciliation',
    description: 'Characters repair a damaged relationship',
    icon: '🤗',
    examples: ['Apology', 'Forgiveness', 'Making amends'],
    commonEmotions: ['relief', 'love', 'hope'],
    commonFunctions: ['resolution', 'tension_release'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'emotional',
    subtype: 'loss',
    label: 'Loss',
    description: 'Character experiences significant loss',
    icon: '😢',
    examples: ['Death of a loved one', 'Failed mission', 'Losing a possession'],
    commonEmotions: ['sadness', 'despair', 'anger'],
    commonFunctions: ['all_is_lost', 'arc_turning_point'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'emotional',
    subtype: 'triumph',
    label: 'Triumph',
    description: 'Character achieves a significant victory',
    icon: '🎉',
    examples: ['Winning the battle', 'Achieving the goal', 'Overcoming fear'],
    commonEmotions: ['joy', 'pride', 'relief'],
    commonFunctions: ['climax', 'payoff'],
    paceImpact: 'varies',
    typicalDuration: 'medium',
  },
  {
    category: 'emotional',
    subtype: 'despair',
    label: 'Despair',
    description: 'Character hits rock bottom emotionally',
    icon: '😔',
    examples: ['Giving up hope', 'Dark night of the soul', 'Complete defeat'],
    commonEmotions: ['despair', 'sadness', 'fear'],
    commonFunctions: ['all_is_lost', 'theme_exploration'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },

  // Dialogue beats
  {
    category: 'dialogue',
    subtype: 'negotiation',
    label: 'Negotiation',
    description: 'Characters try to reach an agreement',
    icon: '🤝',
    examples: ['Business deal', 'Hostage negotiation', 'Peace talks'],
    commonEmotions: ['tension', 'anticipation', 'trust'],
    commonFunctions: ['setup', 'tension_builder'],
    paceImpact: 'maintains',
    typicalDuration: 'medium',
  },
  {
    category: 'dialogue',
    subtype: 'interrogation',
    label: 'Interrogation',
    description: 'One character questions another',
    icon: '🔦',
    examples: ['Police questioning', 'Seeking information', 'Confronting a suspect'],
    commonEmotions: ['tension', 'fear', 'anticipation'],
    commonFunctions: ['tension_builder', 'setup'],
    paceImpact: 'maintains',
    typicalDuration: 'medium',
  },
  {
    category: 'dialogue',
    subtype: 'confession',
    label: 'Confession',
    description: 'Character reveals hidden truth or feelings',
    icon: '🙏',
    examples: ['Love confession', 'Admitting guilt', 'Sharing a secret'],
    commonEmotions: ['fear', 'relief', 'love'],
    commonFunctions: ['payoff', 'character_moment'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'dialogue',
    subtype: 'debate',
    label: 'Debate',
    description: 'Characters argue different viewpoints',
    icon: '💬',
    examples: ['Ideological conflict', 'Planning disagreement', 'Moral debate'],
    commonEmotions: ['anger', 'tension', 'pride'],
    commonFunctions: ['theme_statement', 'character_moment'],
    paceImpact: 'maintains',
    typicalDuration: 'medium',
  },
  {
    category: 'dialogue',
    subtype: 'seduction',
    label: 'Seduction',
    description: 'Character tries to persuade or charm another',
    icon: '💋',
    examples: ['Romantic pursuit', 'Con artist manipulation', 'Diplomatic charm'],
    commonEmotions: ['anticipation', 'love', 'tension'],
    commonFunctions: ['setup', 'character_moment'],
    paceImpact: 'maintains',
    typicalDuration: 'medium',
  },

  // Transition beats
  {
    category: 'transition',
    subtype: 'time_skip',
    label: 'Time Skip',
    description: 'Story jumps forward in time',
    icon: '⏭️',
    examples: ['Years later', 'Next morning', 'Six months pass'],
    commonEmotions: ['anticipation', 'nostalgia', 'curiosity'],
    commonFunctions: ['breather', 'accelerator'],
    paceImpact: 'varies',
    typicalDuration: 'short',
  },
  {
    category: 'transition',
    subtype: 'location_change',
    label: 'Location Change',
    description: 'Story moves to a new setting',
    icon: '🗺️',
    examples: ['Travel scene', 'New city arrival', 'Entering a building'],
    commonEmotions: ['anticipation', 'curiosity', 'fear'],
    commonFunctions: ['setup', 'world_establishment'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },
  {
    category: 'transition',
    subtype: 'montage',
    label: 'Montage',
    description: 'Series of brief scenes showing progress',
    icon: '🎬',
    examples: ['Training montage', 'Preparation sequence', 'Relationship development'],
    commonEmotions: ['anticipation', 'hope', 'joy'],
    commonFunctions: ['accelerator', 'transformation'],
    paceImpact: 'accelerates',
    typicalDuration: 'short',
  },
  {
    category: 'transition',
    subtype: 'flashback',
    label: 'Flashback',
    description: 'Story temporarily moves to the past',
    icon: '⏪',
    examples: ['Memory sequence', 'Origin story', 'Trauma recall'],
    commonEmotions: ['nostalgia', 'sadness', 'fear'],
    commonFunctions: ['character_moment', 'payoff'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'transition',
    subtype: 'flash_forward',
    label: 'Flash Forward',
    description: 'Story briefly jumps to the future',
    icon: '⏩',
    examples: ['Premonition', 'Teaser of events to come', 'Prophetic vision'],
    commonEmotions: ['anticipation', 'fear', 'curiosity'],
    commonFunctions: ['foreshadowing', 'setup'],
    paceImpact: 'accelerates',
    typicalDuration: 'short',
  },

  // Setup beats
  {
    category: 'setup',
    subtype: 'foreshadowing',
    label: 'Foreshadowing',
    description: 'Hints at future events or revelations',
    icon: '🔮',
    examples: ['Ominous warning', 'Symbolic imagery', 'Seemingly insignificant detail'],
    commonEmotions: ['anticipation', 'curiosity', 'tension'],
    commonFunctions: ['foreshadowing', 'plant'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },
  {
    category: 'setup',
    subtype: 'introduction',
    label: 'Introduction',
    description: 'New character, location, or concept is introduced',
    icon: '👋',
    examples: ['Character entrance', 'New world reveal', 'Introducing a problem'],
    commonEmotions: ['curiosity', 'anticipation', 'trust'],
    commonFunctions: ['introduction', 'setup'],
    paceImpact: 'maintains',
    typicalDuration: 'medium',
  },
  {
    category: 'setup',
    subtype: 'world_establishment',
    label: 'World Building',
    description: 'Establishing rules, culture, or atmosphere',
    icon: '🏗️',
    examples: ['Magic system explanation', 'Social norms shown', 'Setting the tone'],
    commonEmotions: ['curiosity', 'awe', 'anticipation'],
    commonFunctions: ['world_establishment', 'setup'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'setup',
    subtype: 'stakes_raising',
    label: 'Stakes Raising',
    description: 'Consequences of failure become more severe',
    icon: '📈',
    examples: ['Threat escalation', 'Time pressure added', 'Personal stakes revealed'],
    commonEmotions: ['fear', 'tension', 'anticipation'],
    commonFunctions: ['tension_builder', 'accelerator'],
    paceImpact: 'accelerates',
    typicalDuration: 'short',
  },
  {
    category: 'setup',
    subtype: 'goal_setting',
    label: 'Goal Setting',
    description: 'Character establishes what they want',
    icon: '🎯',
    examples: ['Mission briefing', 'Stating desire', 'Making a plan'],
    commonEmotions: ['hope', 'anticipation', 'tension'],
    commonFunctions: ['setup', 'inciting_incident'],
    paceImpact: 'maintains',
    typicalDuration: 'short',
  },

  // Payoff beats
  {
    category: 'payoff',
    subtype: 'callback',
    label: 'Callback',
    description: 'Earlier setup pays off in a meaningful way',
    icon: '🔗',
    examples: ['Chekhov\'s gun fires', 'Earlier dialogue gains meaning', 'Skill finally used'],
    commonEmotions: ['surprise', 'joy', 'awe'],
    commonFunctions: ['callback', 'payoff'],
    paceImpact: 'varies',
    typicalDuration: 'short',
  },
  {
    category: 'payoff',
    subtype: 'resolution',
    label: 'Resolution',
    description: 'Story thread reaches its conclusion',
    icon: '✅',
    examples: ['Mystery solved', 'Conflict resolved', 'Question answered'],
    commonEmotions: ['relief', 'joy', 'sadness'],
    commonFunctions: ['resolution', 'payoff'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
  {
    category: 'payoff',
    subtype: 'consequence',
    label: 'Consequence',
    description: 'Earlier action results in impact',
    icon: '⚡',
    examples: ['Karma', 'Delayed reaction', 'Chickens come home to roost'],
    commonEmotions: ['surprise', 'fear', 'relief'],
    commonFunctions: ['payoff', 'consequence'],
    paceImpact: 'varies',
    typicalDuration: 'medium',
  },
  {
    category: 'payoff',
    subtype: 'revelation_payoff',
    label: 'Revelation Payoff',
    description: 'Truth hinted at earlier is fully revealed',
    icon: '🎆',
    examples: ['Identity reveal', 'Conspiracy exposed', 'True nature shown'],
    commonEmotions: ['surprise', 'awe', 'fear'],
    commonFunctions: ['payoff', 'climax'],
    paceImpact: 'varies',
    typicalDuration: 'medium',
  },
  {
    category: 'payoff',
    subtype: 'character_arc_completion',
    label: 'Arc Completion',
    description: 'Character\'s journey reaches its conclusion',
    icon: '🦋',
    examples: ['Hero transformation complete', 'Redemption achieved', 'Growth shown'],
    commonEmotions: ['joy', 'pride', 'hope'],
    commonFunctions: ['transformation', 'resolution'],
    paceImpact: 'decelerates',
    typicalDuration: 'medium',
  },
];

// ===== EMOTION DEFINITIONS =====

export const EMOTIONS: EmotionDefinition[] = [
  { type: 'joy', label: 'Joy', color: '#FFD700', intensity: 'high', valence: 'positive', arousal: 'excited', opposites: ['sadness'], blendsWith: ['love', 'hope', 'pride'] },
  { type: 'sadness', label: 'Sadness', color: '#4169E1', intensity: 'medium', valence: 'negative', arousal: 'calm', opposites: ['joy'], blendsWith: ['nostalgia', 'despair', 'love'] },
  { type: 'fear', label: 'Fear', color: '#800080', intensity: 'high', valence: 'negative', arousal: 'excited', opposites: ['trust'], blendsWith: ['anticipation', 'surprise', 'tension'] },
  { type: 'anger', label: 'Anger', color: '#FF4500', intensity: 'high', valence: 'negative', arousal: 'excited', opposites: ['trust', 'love'], blendsWith: ['hate', 'pride', 'tension'] },
  { type: 'surprise', label: 'Surprise', color: '#00CED1', intensity: 'high', valence: 'neutral', arousal: 'excited', opposites: ['anticipation'], blendsWith: ['curiosity', 'fear', 'joy'] },
  { type: 'disgust', label: 'Disgust', color: '#556B2F', intensity: 'medium', valence: 'negative', arousal: 'moderate', opposites: ['trust'], blendsWith: ['anger', 'shame', 'fear'] },
  { type: 'anticipation', label: 'Anticipation', color: '#FFA500', intensity: 'medium', valence: 'neutral', arousal: 'moderate', opposites: ['surprise'], blendsWith: ['hope', 'fear', 'curiosity'] },
  { type: 'trust', label: 'Trust', color: '#32CD32', intensity: 'medium', valence: 'positive', arousal: 'calm', opposites: ['fear', 'disgust'], blendsWith: ['love', 'hope', 'joy'] },
  { type: 'tension', label: 'Tension', color: '#DC143C', intensity: 'high', valence: 'negative', arousal: 'excited', opposites: ['relief'], blendsWith: ['fear', 'anticipation', 'anger'] },
  { type: 'relief', label: 'Relief', color: '#98FB98', intensity: 'medium', valence: 'positive', arousal: 'calm', opposites: ['tension'], blendsWith: ['joy', 'hope', 'trust'] },
  { type: 'love', label: 'Love', color: '#FF69B4', intensity: 'high', valence: 'positive', arousal: 'moderate', opposites: ['hate'], blendsWith: ['joy', 'trust', 'hope'] },
  { type: 'hate', label: 'Hate', color: '#8B0000', intensity: 'high', valence: 'negative', arousal: 'excited', opposites: ['love'], blendsWith: ['anger', 'disgust', 'fear'] },
  { type: 'hope', label: 'Hope', color: '#87CEEB', intensity: 'medium', valence: 'positive', arousal: 'moderate', opposites: ['despair'], blendsWith: ['anticipation', 'joy', 'love'] },
  { type: 'despair', label: 'Despair', color: '#2F4F4F', intensity: 'high', valence: 'negative', arousal: 'calm', opposites: ['hope'], blendsWith: ['sadness', 'fear', 'shame'] },
  { type: 'curiosity', label: 'Curiosity', color: '#9932CC', intensity: 'medium', valence: 'positive', arousal: 'moderate', opposites: ['confusion'], blendsWith: ['anticipation', 'surprise', 'awe'] },
  { type: 'confusion', label: 'Confusion', color: '#808080', intensity: 'medium', valence: 'negative', arousal: 'moderate', opposites: ['curiosity'], blendsWith: ['fear', 'surprise', 'tension'] },
  { type: 'pride', label: 'Pride', color: '#DAA520', intensity: 'high', valence: 'positive', arousal: 'moderate', opposites: ['shame'], blendsWith: ['joy', 'anger', 'hope'] },
  { type: 'shame', label: 'Shame', color: '#A0522D', intensity: 'high', valence: 'negative', arousal: 'moderate', opposites: ['pride'], blendsWith: ['sadness', 'fear', 'disgust'] },
  { type: 'nostalgia', label: 'Nostalgia', color: '#DEB887', intensity: 'medium', valence: 'neutral', arousal: 'calm', opposites: [], blendsWith: ['sadness', 'joy', 'love'] },
  { type: 'awe', label: 'Awe', color: '#4B0082', intensity: 'high', valence: 'positive', arousal: 'excited', opposites: [], blendsWith: ['surprise', 'curiosity', 'fear'] },
];

// ===== FUNCTION DEFINITIONS =====

export const FUNCTIONS: FunctionDefinition[] = [
  // Structural
  { tag: 'inciting_incident', label: 'Inciting Incident', description: 'Event that starts the main story', placement: ['beginning'], importance: 'critical', frequency: 'once' },
  { tag: 'first_plot_point', label: 'First Plot Point', description: 'Point of no return for the protagonist', placement: ['beginning'], importance: 'critical', frequency: 'once' },
  { tag: 'midpoint', label: 'Midpoint', description: 'Major shift in the middle of the story', placement: ['middle'], importance: 'critical', frequency: 'once' },
  { tag: 'all_is_lost', label: 'All Is Lost', description: 'Protagonist\'s lowest point', placement: ['middle', 'end'], importance: 'important', frequency: 'once' },
  { tag: 'climax', label: 'Climax', description: 'Peak of the story\'s tension', placement: ['end'], importance: 'critical', frequency: 'once' },
  { tag: 'resolution', label: 'Resolution', description: 'Wrapping up of story threads', placement: ['end'], importance: 'important', frequency: 'few' },

  // Narrative
  { tag: 'setup', label: 'Setup', description: 'Establishing information for later payoff', placement: ['beginning', 'middle', 'any'], importance: 'important', frequency: 'many' },
  { tag: 'payoff', label: 'Payoff', description: 'Earlier setup delivers its impact', placement: ['middle', 'end', 'any'], importance: 'important', frequency: 'many' },
  { tag: 'foreshadowing', label: 'Foreshadowing', description: 'Hinting at future events', placement: ['any'], importance: 'optional', frequency: 'many' },
  { tag: 'callback', label: 'Callback', description: 'Reference to earlier story element', placement: ['any'], importance: 'optional', frequency: 'many' },
  { tag: 'plant', label: 'Plant', description: 'Placing something to be used later', placement: ['any'], importance: 'optional', frequency: 'many' },
  { tag: 'consequence', label: 'Consequence', description: 'Result of earlier action', placement: ['any'], importance: 'important', frequency: 'many' },

  // Character
  { tag: 'introduction', label: 'Introduction', description: 'First appearance of a character', placement: ['any'], importance: 'important', frequency: 'few' },
  { tag: 'character_moment', label: 'Character Moment', description: 'Scene that reveals character', placement: ['any'], importance: 'important', frequency: 'many' },
  { tag: 'arc_turning_point', label: 'Arc Turning Point', description: 'Character begins to change', placement: ['any'], importance: 'important', frequency: 'few' },
  { tag: 'transformation', label: 'Transformation', description: 'Character completes their change', placement: ['end'], importance: 'important', frequency: 'few' },

  // Pacing
  { tag: 'tension_builder', label: 'Tension Builder', description: 'Increases story tension', placement: ['any'], importance: 'important', frequency: 'many' },
  { tag: 'tension_release', label: 'Tension Release', description: 'Releases built-up tension', placement: ['any'], importance: 'important', frequency: 'many' },
  { tag: 'breather', label: 'Breather', description: 'Quiet moment for audience to rest', placement: ['any'], importance: 'optional', frequency: 'many' },
  { tag: 'accelerator', label: 'Accelerator', description: 'Speeds up the story pace', placement: ['any'], importance: 'optional', frequency: 'many' },

  // World Building
  { tag: 'world_establishment', label: 'World Establishment', description: 'Establishing world rules and setting', placement: ['beginning', 'middle'], importance: 'important', frequency: 'few' },

  // Thematic
  { tag: 'theme_statement', label: 'Theme Statement', description: 'Explicit statement of theme', placement: ['beginning', 'middle'], importance: 'optional', frequency: 'few' },
  { tag: 'theme_exploration', label: 'Theme Exploration', description: 'Scene that explores the theme', placement: ['any'], importance: 'optional', frequency: 'many' },
  { tag: 'theme_reinforcement', label: 'Theme Reinforcement', description: 'Scene that reinforces the theme', placement: ['any'], importance: 'optional', frequency: 'many' },
];

// ===== HELPER FUNCTIONS =====

/**
 * Get beat type definition by category and subtype
 */
export function getBeatType(category: BeatCategory, subtype: BeatSubtype): BeatTypeDefinition | undefined {
  return BEAT_TYPES.find(bt => bt.category === category && bt.subtype === subtype);
}

/**
 * Get all beat types for a category
 */
export function getBeatTypesForCategory(category: BeatCategory): BeatTypeDefinition[] {
  return BEAT_TYPES.filter(bt => bt.category === category);
}

/**
 * Get emotion definition by type
 */
export function getEmotion(type: EmotionType): EmotionDefinition | undefined {
  return EMOTIONS.find(e => e.type === type);
}

/**
 * Get function definition by tag
 */
export function getFunction(tag: FunctionTag): FunctionDefinition | undefined {
  return FUNCTIONS.find(f => f.tag === tag);
}

/**
 * Get all categories
 */
export function getCategories(): BeatCategory[] {
  return Array.from(new Set(BEAT_TYPES.map(bt => bt.category)));
}

/**
 * Classify text content to suggest beat type
 */
export function classifyBeatContent(
  content: string,
  name: string
): { category: BeatCategory; subtype: BeatSubtype; confidence: number }[] {
  const suggestions: { category: BeatCategory; subtype: BeatSubtype; confidence: number }[] = [];
  const lowerContent = (content + ' ' + name).toLowerCase();

  // Simple keyword-based classification
  const keywordMatches: Record<string, { category: BeatCategory; subtype: BeatSubtype; weight: number }[]> = {
    'chase': [{ category: 'action', subtype: 'chase', weight: 0.9 }],
    'pursuit': [{ category: 'action', subtype: 'chase', weight: 0.8 }],
    'fight': [{ category: 'action', subtype: 'fight', weight: 0.9 }],
    'battle': [{ category: 'action', subtype: 'fight', weight: 0.85 }],
    'combat': [{ category: 'action', subtype: 'fight', weight: 0.85 }],
    'escape': [{ category: 'action', subtype: 'escape', weight: 0.9 }],
    'flee': [{ category: 'action', subtype: 'escape', weight: 0.8 }],
    'reveal': [{ category: 'revelation', subtype: 'plot_twist', weight: 0.7 }],
    'twist': [{ category: 'revelation', subtype: 'plot_twist', weight: 0.9 }],
    'secret': [{ category: 'revelation', subtype: 'character_secret', weight: 0.8 }],
    'backstory': [{ category: 'revelation', subtype: 'backstory', weight: 0.9 }],
    'clue': [{ category: 'revelation', subtype: 'clue', weight: 0.9 }],
    'realize': [{ category: 'revelation', subtype: 'realization', weight: 0.85 }],
    'decision': [{ category: 'decision', subtype: 'moral_choice', weight: 0.7 }],
    'choice': [{ category: 'decision', subtype: 'moral_choice', weight: 0.7 }],
    'sacrifice': [{ category: 'decision', subtype: 'sacrifice', weight: 0.9 }],
    'bond': [{ category: 'emotional', subtype: 'bonding', weight: 0.8 }],
    'love': [{ category: 'emotional', subtype: 'bonding', weight: 0.7 }],
    'conflict': [{ category: 'emotional', subtype: 'conflict', weight: 0.8 }],
    'loss': [{ category: 'emotional', subtype: 'loss', weight: 0.85 }],
    'death': [{ category: 'emotional', subtype: 'loss', weight: 0.8 }],
    'triumph': [{ category: 'emotional', subtype: 'triumph', weight: 0.9 }],
    'victory': [{ category: 'emotional', subtype: 'triumph', weight: 0.85 }],
    'negotiate': [{ category: 'dialogue', subtype: 'negotiation', weight: 0.9 }],
    'interrogate': [{ category: 'dialogue', subtype: 'interrogation', weight: 0.9 }],
    'confess': [{ category: 'dialogue', subtype: 'confession', weight: 0.9 }],
    'flashback': [{ category: 'transition', subtype: 'flashback', weight: 0.95 }],
    'montage': [{ category: 'transition', subtype: 'montage', weight: 0.95 }],
    'setup': [{ category: 'setup', subtype: 'foreshadowing', weight: 0.6 }],
    'introduce': [{ category: 'setup', subtype: 'introduction', weight: 0.8 }],
    'stakes': [{ category: 'setup', subtype: 'stakes_raising', weight: 0.85 }],
    'climax': [{ category: 'payoff', subtype: 'revelation_payoff', weight: 0.8 }],
    'resolution': [{ category: 'payoff', subtype: 'resolution', weight: 0.9 }],
    'callback': [{ category: 'payoff', subtype: 'callback', weight: 0.9 }],
  };

  for (const [keyword, matches] of Object.entries(keywordMatches)) {
    if (lowerContent.includes(keyword)) {
      for (const match of matches) {
        const existing = suggestions.find(
          s => s.category === match.category && s.subtype === match.subtype
        );
        if (existing) {
          existing.confidence = Math.max(existing.confidence, match.weight);
        } else {
          suggestions.push({
            category: match.category,
            subtype: match.subtype,
            confidence: match.weight,
          });
        }
      }
    }
  }

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Analyze emotion from text content
 */
export function analyzeEmotions(content: string): EmotionalMarker[] {
  const markers: EmotionalMarker[] = [];
  const lowerContent = content.toLowerCase();

  const emotionKeywords: Record<EmotionType, string[]> = {
    joy: ['happy', 'joy', 'laugh', 'smile', 'celebrate', 'excited', 'thrilled'],
    sadness: ['sad', 'cry', 'tears', 'grief', 'mourn', 'weep', 'sorrow'],
    fear: ['afraid', 'fear', 'terror', 'scared', 'horrified', 'panic', 'dread'],
    anger: ['angry', 'rage', 'furious', 'mad', 'outraged', 'enraged'],
    surprise: ['surprised', 'shocked', 'astonished', 'amazed', 'stunned'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened'],
    anticipation: ['anticipate', 'expect', 'await', 'eager', 'looking forward'],
    trust: ['trust', 'believe', 'faith', 'rely', 'confident'],
    tension: ['tense', 'suspense', 'nervous', 'anxious', 'on edge'],
    relief: ['relief', 'relieved', 'thankful', 'exhale', 'finally'],
    love: ['love', 'adore', 'cherish', 'devoted', 'affection'],
    hate: ['hate', 'despise', 'loathe', 'detest', 'abhor'],
    hope: ['hope', 'optimistic', 'wish', 'aspire', 'dream'],
    despair: ['despair', 'hopeless', 'defeated', 'crushed', 'broken'],
    curiosity: ['curious', 'wonder', 'intrigued', 'fascinated'],
    confusion: ['confused', 'puzzled', 'bewildered', 'lost', 'uncertain'],
    pride: ['proud', 'accomplished', 'satisfied', 'triumphant'],
    shame: ['ashamed', 'embarrassed', 'humiliated', 'guilty'],
    nostalgia: ['nostalgic', 'remember', 'reminisce', 'memories'],
    awe: ['awe', 'wonder', 'magnificent', 'breathtaking', 'spectacular'],
  };

  const foundEmotions: { type: EmotionType; count: number }[] = [];

  for (const [emotion, keywords] of Object.entries(emotionKeywords) as [EmotionType, string[]][]) {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    if (count > 0) {
      foundEmotions.push({ type: emotion, count });
    }
  }

  // Sort by count and create markers
  foundEmotions.sort((a, b) => b.count - a.count);

  if (foundEmotions.length > 0) {
    const primary = foundEmotions[0];
    const marker: EmotionalMarker = {
      primary: primary.type,
      intensity: Math.min(100, primary.count * 25),
    };

    if (foundEmotions.length > 1) {
      marker.secondary = foundEmotions[1].type;
    }

    markers.push(marker);
  }

  return markers;
}

/**
 * Suggest function tags based on beat position and content
 */
export function suggestFunctions(
  content: string,
  position: number, // 0-1 representing position in story
  totalBeats: number
): FunctionTag[] {
  const suggestions: FunctionTag[] = [];
  const lowerContent = content.toLowerCase();

  // Position-based suggestions
  if (position < 0.15) {
    suggestions.push('setup', 'introduction');
    if (position < 0.1) {
      suggestions.push('inciting_incident');
    }
  } else if (position >= 0.2 && position <= 0.3) {
    suggestions.push('first_plot_point');
  } else if (position >= 0.45 && position <= 0.55) {
    suggestions.push('midpoint');
  } else if (position >= 0.7 && position <= 0.8) {
    suggestions.push('all_is_lost');
  } else if (position >= 0.85) {
    suggestions.push('climax', 'resolution');
  }

  // Content-based suggestions
  if (lowerContent.includes('setup') || lowerContent.includes('establish')) {
    suggestions.push('setup');
  }
  if (lowerContent.includes('reveal') || lowerContent.includes('payoff')) {
    suggestions.push('payoff');
  }
  if (lowerContent.includes('foreshadow') || lowerContent.includes('hint')) {
    suggestions.push('foreshadowing');
  }
  if (lowerContent.includes('transform') || lowerContent.includes('change')) {
    suggestions.push('transformation', 'arc_turning_point');
  }
  if (lowerContent.includes('tension')) {
    if (lowerContent.includes('build') || lowerContent.includes('rise')) {
      suggestions.push('tension_builder');
    }
    if (lowerContent.includes('release') || lowerContent.includes('resolve')) {
      suggestions.push('tension_release');
    }
  }
  if (lowerContent.includes('theme')) {
    suggestions.push('theme_exploration');
  }

  return [...new Set(suggestions)];
}

export default {
  BEAT_TYPES,
  EMOTIONS,
  FUNCTIONS,
  getBeatType,
  getBeatTypesForCategory,
  getEmotion,
  getFunction,
  getCategories,
  classifyBeatContent,
  analyzeEmotions,
  suggestFunctions,
};
