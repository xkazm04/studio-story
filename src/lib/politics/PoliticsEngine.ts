/**
 * PoliticsEngine - Dynamic faction politics and influence system
 *
 * Manages faction relationships, alliance networks, influence tracking,
 * and power dynamics with event-triggered updates.
 */

// ============================================================================
// Types
// ============================================================================

export type RelationshipType =
  | 'allied'
  | 'friendly'
  | 'neutral'
  | 'tense'
  | 'hostile'
  | 'war'
  | 'vassal'
  | 'overlord'
  | 'secret_ally'
  | 'secret_rival';

export type PoliticalStance =
  | 'isolationist'
  | 'defensive'
  | 'neutral'
  | 'opportunistic'
  | 'expansionist';

export type InfluenceType =
  | 'military'
  | 'economic'
  | 'political'
  | 'cultural'
  | 'religious'
  | 'intelligence';

export interface FactionRelationship {
  id: string;
  faction_a_id: string;
  faction_b_id: string;
  relationship_type: RelationshipType;
  relationship_value: number; // -100 (war) to +100 (allied)
  is_public: boolean;
  treaties: Treaty[];
  history: RelationshipEvent[];
  last_updated: string;
}

export interface Treaty {
  id: string;
  name: string;
  type: 'alliance' | 'non_aggression' | 'trade' | 'mutual_defense' | 'vassalage' | 'tribute' | 'ceasefire';
  signed_at: string;
  expires_at?: string;
  terms: string[];
  is_active: boolean;
  broken_by?: string;
}

export interface RelationshipEvent {
  id: string;
  timestamp: string;
  event_type: RelationshipEventType;
  description: string;
  value_change: number;
  triggered_by?: string; // Story event ID
}

export type RelationshipEventType =
  | 'treaty_signed'
  | 'treaty_broken'
  | 'war_declared'
  | 'peace_made'
  | 'betrayal'
  | 'aid_given'
  | 'insult'
  | 'trade_deal'
  | 'territory_dispute'
  | 'diplomatic_incident'
  | 'marriage_alliance'
  | 'shared_enemy'
  | 'story_event';

export interface FactionInfluence {
  faction_id: string;
  total_influence: number;
  influence_breakdown: Record<InfluenceType, number>;
  territories: Territory[];
  influence_history: InfluenceSnapshot[];
  power_rank: number;
}

export interface Territory {
  id: string;
  name: string;
  controller_id: string;
  contested_by?: string[];
  influence_value: number;
  resource_type?: string;
  strategic_importance: number; // 1-10
}

export interface InfluenceSnapshot {
  timestamp: string;
  total_influence: number;
  breakdown: Record<InfluenceType, number>;
  power_rank: number;
  triggered_by?: string;
}

export interface FactionPolitics {
  faction_id: string;
  faction_name: string;
  political_stance: PoliticalStance;
  diplomatic_reputation: number; // -100 to +100
  aggression_level: number; // 0-100
  trustworthiness: number; // 0-100
  goals: PoliticalGoal[];
  secrets: FactionSecret[];
}

export interface PoliticalGoal {
  id: string;
  description: string;
  priority: number; // 1-10
  target_faction_id?: string;
  goal_type: 'expansion' | 'defense' | 'alliance' | 'revenge' | 'dominance' | 'survival' | 'trade' | 'influence';
  progress: number; // 0-100
  is_public: boolean;
}

export interface FactionSecret {
  id: string;
  secret_type: 'alliance' | 'betrayal_plan' | 'weakness' | 'infiltration' | 'scheme';
  description: string;
  known_by: string[]; // Faction IDs that know this secret
  revealed: boolean;
  reveal_impact: string;
}

export interface PoliticalNetwork {
  factions: Map<string, FactionPolitics>;
  relationships: Map<string, FactionRelationship>;
  influences: Map<string, FactionInfluence>;
  territories: Map<string, Territory>;
  global_tension: number; // 0-100
  era_name?: string;
}

export interface PowerBalance {
  faction_id: string;
  faction_name: string;
  total_power: number;
  military_power: number;
  economic_power: number;
  political_power: number;
  alliance_power: number; // Combined power of allies
  rival_power: number; // Combined power of rivals
  net_position: number; // alliance_power - rival_power + own_power
  vulnerability_score: number; // How vulnerable to attack
}

export interface RelationshipPrediction {
  target_faction_id: string;
  current_value: number;
  predicted_value: number;
  change_direction: 'improving' | 'worsening' | 'stable';
  factors: PredictionFactor[];
  confidence: number; // 0-100
}

export interface PredictionFactor {
  name: string;
  impact: number;
  reason: string;
}

export interface DiplomaticAction {
  id: string;
  action_type: DiplomaticActionType;
  initiator_id: string;
  target_id: string;
  description: string;
  success_chance: number;
  potential_outcomes: DiplomaticOutcome[];
  requirements?: string[];
  cost?: { type: InfluenceType; amount: number };
}

export type DiplomaticActionType =
  | 'propose_alliance'
  | 'propose_trade'
  | 'demand_tribute'
  | 'send_aid'
  | 'send_insult'
  | 'declare_war'
  | 'propose_peace'
  | 'break_treaty'
  | 'send_spy'
  | 'propose_marriage'
  | 'offer_vassalage';

export interface DiplomaticOutcome {
  probability: number;
  description: string;
  relationship_change: number;
  reputation_change: number;
  other_effects?: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, { label: string; color: string; valueRange: [number, number] }> = {
  allied: { label: 'Allied', color: '#22c55e', valueRange: [75, 100] },
  friendly: { label: 'Friendly', color: '#84cc16', valueRange: [50, 74] },
  neutral: { label: 'Neutral', color: '#6b7280', valueRange: [-24, 49] },
  tense: { label: 'Tense', color: '#f59e0b', valueRange: [-49, -25] },
  hostile: { label: 'Hostile', color: '#ef4444', valueRange: [-74, -50] },
  war: { label: 'At War', color: '#dc2626', valueRange: [-100, -75] },
  vassal: { label: 'Vassal', color: '#8b5cf6', valueRange: [0, 100] },
  overlord: { label: 'Overlord', color: '#a855f7', valueRange: [0, 100] },
  secret_ally: { label: 'Secret Ally', color: '#06b6d4', valueRange: [50, 100] },
  secret_rival: { label: 'Secret Rival', color: '#f97316', valueRange: [-100, -25] },
};

export const POLITICAL_STANCE_CONFIG: Record<PoliticalStance, { label: string; description: string; color: string }> = {
  isolationist: {
    label: 'Isolationist',
    description: 'Avoids foreign entanglements, focuses inward',
    color: '#6b7280'
  },
  defensive: {
    label: 'Defensive',
    description: 'Maintains strong borders, limited diplomacy',
    color: '#3b82f6'
  },
  neutral: {
    label: 'Neutral',
    description: 'Balanced approach, case-by-case diplomacy',
    color: '#8b5cf6'
  },
  opportunistic: {
    label: 'Opportunistic',
    description: 'Exploits situations for advantage',
    color: '#f59e0b'
  },
  expansionist: {
    label: 'Expansionist',
    description: 'Actively seeks to grow influence and territory',
    color: '#ef4444'
  },
};

export const INFLUENCE_TYPE_CONFIG: Record<InfluenceType, { label: string; icon: string; color: string }> = {
  military: { label: 'Military', icon: '⚔️', color: '#ef4444' },
  economic: { label: 'Economic', icon: '💰', color: '#f59e0b' },
  political: { label: 'Political', icon: '🏛️', color: '#8b5cf6' },
  cultural: { label: 'Cultural', icon: '🎭', color: '#ec4899' },
  religious: { label: 'Religious', icon: '⛪', color: '#06b6d4' },
  intelligence: { label: 'Intelligence', icon: '🕵️', color: '#10b981' },
};

export const DIPLOMATIC_ACTION_CONFIG: Record<DiplomaticActionType, { label: string; minRelationship: number; description: string }> = {
  propose_alliance: { label: 'Propose Alliance', minRelationship: 25, description: 'Offer a formal alliance' },
  propose_trade: { label: 'Propose Trade', minRelationship: -25, description: 'Establish trade relations' },
  demand_tribute: { label: 'Demand Tribute', minRelationship: -100, description: 'Demand payment or goods' },
  send_aid: { label: 'Send Aid', minRelationship: 0, description: 'Provide assistance' },
  send_insult: { label: 'Send Insult', minRelationship: -100, description: 'Publicly insult the faction' },
  declare_war: { label: 'Declare War', minRelationship: -100, description: 'Begin open conflict' },
  propose_peace: { label: 'Propose Peace', minRelationship: -100, description: 'End ongoing conflict' },
  break_treaty: { label: 'Break Treaty', minRelationship: -100, description: 'Violate existing agreement' },
  send_spy: { label: 'Send Spy', minRelationship: -100, description: 'Infiltrate for information' },
  propose_marriage: { label: 'Propose Marriage', minRelationship: 0, description: 'Seal alliance with marriage' },
  offer_vassalage: { label: 'Offer Vassalage', minRelationship: -50, description: 'Submit as vassal' },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function generateRelationshipId(factionAId: string, factionBId: string): string {
  // Ensure consistent ID regardless of order
  const sorted = [factionAId, factionBId].sort();
  return `rel_${sorted[0]}_${sorted[1]}`;
}

export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTreatyId(): string {
  return `treaty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSecretId(): string {
  return `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTerritoryId(): string {
  return `territory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert relationship value to relationship type
 */
export function valueToRelationshipType(value: number, isSecret: boolean = false): RelationshipType {
  if (isSecret) {
    return value >= 50 ? 'secret_ally' : 'secret_rival';
  }

  if (value >= 75) return 'allied';
  if (value >= 50) return 'friendly';
  if (value >= -24) return 'neutral';
  if (value >= -49) return 'tense';
  if (value >= -74) return 'hostile';
  return 'war';
}

/**
 * Calculate relationship change impact from an event
 */
export function calculateEventImpact(
  eventType: RelationshipEventType,
  baseMagnitude: number = 10
): number {
  const impactMultipliers: Record<RelationshipEventType, number> = {
    treaty_signed: 2.0,
    treaty_broken: -3.0,
    war_declared: -5.0,
    peace_made: 1.5,
    betrayal: -4.0,
    aid_given: 1.5,
    insult: -1.0,
    trade_deal: 1.0,
    territory_dispute: -1.5,
    diplomatic_incident: -1.0,
    marriage_alliance: 2.5,
    shared_enemy: 1.5,
    story_event: 1.0,
  };

  return baseMagnitude * (impactMultipliers[eventType] || 1.0);
}

/**
 * Calculate total faction power
 */
export function calculateTotalPower(influence: FactionInfluence): number {
  const weights: Record<InfluenceType, number> = {
    military: 1.5,
    economic: 1.2,
    political: 1.0,
    cultural: 0.8,
    religious: 0.7,
    intelligence: 0.9,
  };

  let total = 0;
  for (const [type, value] of Object.entries(influence.influence_breakdown)) {
    total += value * (weights[type as InfluenceType] || 1.0);
  }

  return Math.round(total);
}

/**
 * Calculate alliance power (sum of allied factions' power)
 */
export function calculateAlliancePower(
  factionId: string,
  relationships: FactionRelationship[],
  influences: Map<string, FactionInfluence>
): number {
  let totalPower = 0;

  for (const rel of relationships) {
    const isParty = rel.faction_a_id === factionId || rel.faction_b_id === factionId;
    if (!isParty) continue;

    const isAllied = rel.relationship_type === 'allied' ||
                     rel.relationship_type === 'secret_ally' ||
                     rel.relationship_value >= 50;
    if (!isAllied) continue;

    const allyId = rel.faction_a_id === factionId ? rel.faction_b_id : rel.faction_a_id;
    const allyInfluence = influences.get(allyId);
    if (allyInfluence) {
      // Allies contribute 50% of their power to your alliance strength
      totalPower += calculateTotalPower(allyInfluence) * 0.5;
    }
  }

  return Math.round(totalPower);
}

/**
 * Calculate rival power (sum of hostile/war factions' power)
 */
export function calculateRivalPower(
  factionId: string,
  relationships: FactionRelationship[],
  influences: Map<string, FactionInfluence>
): number {
  let totalPower = 0;

  for (const rel of relationships) {
    const isParty = rel.faction_a_id === factionId || rel.faction_b_id === factionId;
    if (!isParty) continue;

    const isRival = rel.relationship_type === 'hostile' ||
                    rel.relationship_type === 'war' ||
                    rel.relationship_type === 'secret_rival' ||
                    rel.relationship_value <= -50;
    if (!isRival) continue;

    const rivalId = rel.faction_a_id === factionId ? rel.faction_b_id : rel.faction_a_id;
    const rivalInfluence = influences.get(rivalId);
    if (rivalInfluence) {
      totalPower += calculateTotalPower(rivalInfluence);
    }
  }

  return Math.round(totalPower);
}

/**
 * Calculate vulnerability score (how at risk a faction is)
 */
export function calculateVulnerability(powerBalance: Omit<PowerBalance, 'vulnerability_score'>): number {
  const { total_power, alliance_power, rival_power } = powerBalance;
  const combinedDefense = total_power + alliance_power;

  if (combinedDefense === 0) return 100;
  if (rival_power === 0) return 0;

  const ratio = rival_power / combinedDefense;
  return Math.min(100, Math.round(ratio * 50));
}

/**
 * Predict relationship trajectory
 */
export function predictRelationshipChange(
  relationship: FactionRelationship,
  factionAPolitics: FactionPolitics,
  factionBPolitics: FactionPolitics
): RelationshipPrediction {
  const factors: PredictionFactor[] = [];
  let totalImpact = 0;

  // Factor 1: Political stance compatibility
  const stanceCompatibility = calculateStanceCompatibility(
    factionAPolitics.political_stance,
    factionBPolitics.political_stance
  );
  factors.push({
    name: 'Political Stance',
    impact: stanceCompatibility,
    reason: `${factionAPolitics.political_stance} vs ${factionBPolitics.political_stance}`,
  });
  totalImpact += stanceCompatibility;

  // Factor 2: Active treaties
  const activeTreaties = relationship.treaties.filter(t => t.is_active);
  if (activeTreaties.length > 0) {
    const treatyImpact = activeTreaties.length * 2;
    factors.push({
      name: 'Active Treaties',
      impact: treatyImpact,
      reason: `${activeTreaties.length} active treaty/treaties`,
    });
    totalImpact += treatyImpact;
  }

  // Factor 3: Recent events trend
  const recentEvents = relationship.history.slice(-5);
  if (recentEvents.length > 0) {
    const recentTrend = recentEvents.reduce((sum, e) => sum + e.value_change, 0) / recentEvents.length;
    factors.push({
      name: 'Recent Events',
      impact: Math.round(recentTrend / 2),
      reason: recentTrend >= 0 ? 'Positive recent interactions' : 'Negative recent interactions',
    });
    totalImpact += recentTrend / 2;
  }

  // Factor 4: Conflicting goals
  const conflictingGoals = factionAPolitics.goals.filter(g =>
    g.target_faction_id === factionBPolitics.faction_id &&
    (g.goal_type === 'revenge' || g.goal_type === 'dominance')
  );
  if (conflictingGoals.length > 0) {
    const conflictImpact = -conflictingGoals.length * 5;
    factors.push({
      name: 'Conflicting Goals',
      impact: conflictImpact,
      reason: `${conflictingGoals.length} conflicting goal(s)`,
    });
    totalImpact += conflictImpact;
  }

  // Factor 5: Aggression levels
  const aggressionDiff = Math.abs(factionAPolitics.aggression_level - factionBPolitics.aggression_level);
  const aggressionImpact = aggressionDiff > 50 ? -5 : aggressionDiff > 25 ? -2 : 1;
  factors.push({
    name: 'Aggression Compatibility',
    impact: aggressionImpact,
    reason: aggressionDiff > 50 ? 'Very different aggression levels' : 'Compatible aggression levels',
  });
  totalImpact += aggressionImpact;

  // Calculate prediction
  const predictedValue = Math.max(-100, Math.min(100, relationship.relationship_value + totalImpact));
  const changeDirection = totalImpact > 2 ? 'improving' : totalImpact < -2 ? 'worsening' : 'stable';
  const confidence = Math.min(100, 50 + factors.length * 10);

  return {
    target_faction_id: relationship.faction_b_id,
    current_value: relationship.relationship_value,
    predicted_value: predictedValue,
    change_direction: changeDirection,
    factors,
    confidence,
  };
}

/**
 * Calculate stance compatibility (-10 to +10)
 */
function calculateStanceCompatibility(stanceA: PoliticalStance, stanceB: PoliticalStance): number {
  const stanceValues: Record<PoliticalStance, number> = {
    isolationist: -2,
    defensive: -1,
    neutral: 0,
    opportunistic: 1,
    expansionist: 2,
  };

  const diff = Math.abs(stanceValues[stanceA] - stanceValues[stanceB]);

  // Same stance
  if (diff === 0) return 5;
  // Adjacent stances
  if (diff === 1) return 2;
  // Two apart
  if (diff === 2) return 0;
  // Very different
  if (diff === 3) return -3;
  // Opposite extremes
  return -7;
}

/**
 * Get available diplomatic actions
 */
export function getAvailableDiplomaticActions(
  initiatorId: string,
  targetId: string,
  relationship: FactionRelationship | undefined,
  initiatorPolitics: FactionPolitics
): DiplomaticAction[] {
  const currentValue = relationship?.relationship_value ?? 0;
  const actions: DiplomaticAction[] = [];

  for (const [actionType, config] of Object.entries(DIPLOMATIC_ACTION_CONFIG)) {
    if (currentValue >= config.minRelationship) {
      // Calculate success chance based on relationship and reputation
      let successChance = 50;
      successChance += (currentValue / 2);
      successChance += (initiatorPolitics.diplomatic_reputation / 4);
      successChance += (initiatorPolitics.trustworthiness / 4);
      successChance = Math.max(5, Math.min(95, successChance));

      const action: DiplomaticAction = {
        id: `action_${actionType}_${Date.now()}`,
        action_type: actionType as DiplomaticActionType,
        initiator_id: initiatorId,
        target_id: targetId,
        description: config.description,
        success_chance: Math.round(successChance),
        potential_outcomes: generateOutcomes(actionType as DiplomaticActionType, successChance),
      };

      // Add specific requirements/costs
      if (actionType === 'send_spy') {
        action.cost = { type: 'intelligence', amount: 10 };
      } else if (actionType === 'send_aid') {
        action.cost = { type: 'economic', amount: 15 };
      }

      actions.push(action);
    }
  }

  return actions;
}

/**
 * Generate potential outcomes for a diplomatic action
 */
function generateOutcomes(actionType: DiplomaticActionType, successChance: number): DiplomaticOutcome[] {
  const outcomes: DiplomaticOutcome[] = [];

  // Success outcome
  const successOutcome = generateSuccessOutcome(actionType);
  successOutcome.probability = successChance;
  outcomes.push(successOutcome);

  // Failure outcome
  const failureOutcome = generateFailureOutcome(actionType);
  failureOutcome.probability = 100 - successChance;
  outcomes.push(failureOutcome);

  return outcomes;
}

function generateSuccessOutcome(actionType: DiplomaticActionType): DiplomaticOutcome {
  const outcomeMap: Partial<Record<DiplomaticActionType, DiplomaticOutcome>> = {
    propose_alliance: {
      probability: 0,
      description: 'Alliance formed successfully',
      relationship_change: 25,
      reputation_change: 5,
      other_effects: ['New treaty created'],
    },
    propose_trade: {
      probability: 0,
      description: 'Trade agreement established',
      relationship_change: 10,
      reputation_change: 2,
      other_effects: ['Economic influence increases'],
    },
    send_aid: {
      probability: 0,
      description: 'Aid received gratefully',
      relationship_change: 15,
      reputation_change: 5,
    },
    declare_war: {
      probability: 0,
      description: 'War declared, conflict begins',
      relationship_change: -50,
      reputation_change: -10,
      other_effects: ['Military conflict initiated'],
    },
    propose_peace: {
      probability: 0,
      description: 'Peace agreement reached',
      relationship_change: 30,
      reputation_change: 10,
      other_effects: ['Ceasefire treaty created'],
    },
  };

  return outcomeMap[actionType] || {
    probability: 0,
    description: 'Action successful',
    relationship_change: 10,
    reputation_change: 2,
  };
}

function generateFailureOutcome(actionType: DiplomaticActionType): DiplomaticOutcome {
  const outcomeMap: Partial<Record<DiplomaticActionType, DiplomaticOutcome>> = {
    propose_alliance: {
      probability: 0,
      description: 'Alliance proposal rejected',
      relationship_change: -5,
      reputation_change: -2,
    },
    send_spy: {
      probability: 0,
      description: 'Spy discovered and captured',
      relationship_change: -20,
      reputation_change: -15,
      other_effects: ['Diplomatic incident'],
    },
    demand_tribute: {
      probability: 0,
      description: 'Demand rejected with insult',
      relationship_change: -15,
      reputation_change: -5,
    },
  };

  return outcomeMap[actionType] || {
    probability: 0,
    description: 'Action failed',
    relationship_change: -5,
    reputation_change: -2,
  };
}

/**
 * Calculate global tension level
 */
export function calculateGlobalTension(relationships: FactionRelationship[]): number {
  if (relationships.length === 0) return 0;

  let tensionScore = 0;
  let warCount = 0;
  let hostileCount = 0;

  for (const rel of relationships) {
    if (rel.relationship_type === 'war') {
      warCount++;
      tensionScore += 20;
    } else if (rel.relationship_type === 'hostile') {
      hostileCount++;
      tensionScore += 10;
    } else if (rel.relationship_type === 'tense') {
      tensionScore += 5;
    } else if (rel.relationship_value < 0) {
      tensionScore += 2;
    }
  }

  // Normalize by number of relationships
  const normalizedTension = (tensionScore / relationships.length) * 2;

  // Add bonus for multiple wars
  const warBonus = Math.min(30, warCount * 10);

  return Math.min(100, Math.round(normalizedTension + warBonus));
}

// ============================================================================
// PoliticsEngine Class
// ============================================================================

export class PoliticsEngine {
  private network: PoliticalNetwork;

  constructor() {
    this.network = {
      factions: new Map(),
      relationships: new Map(),
      influences: new Map(),
      territories: new Map(),
      global_tension: 0,
    };
  }

  // Faction Management
  addFaction(faction: FactionPolitics): void {
    this.network.factions.set(faction.faction_id, faction);
  }

  getFaction(factionId: string): FactionPolitics | undefined {
    return this.network.factions.get(factionId);
  }

  updateFaction(factionId: string, updates: Partial<FactionPolitics>): void {
    const faction = this.network.factions.get(factionId);
    if (faction) {
      this.network.factions.set(factionId, { ...faction, ...updates });
    }
  }

  // Relationship Management
  getRelationship(factionAId: string, factionBId: string): FactionRelationship | undefined {
    const id = generateRelationshipId(factionAId, factionBId);
    return this.network.relationships.get(id);
  }

  setRelationship(relationship: FactionRelationship): void {
    const id = generateRelationshipId(relationship.faction_a_id, relationship.faction_b_id);
    relationship.id = id;
    relationship.relationship_type = valueToRelationshipType(
      relationship.relationship_value,
      !relationship.is_public
    );
    this.network.relationships.set(id, relationship);
    this.updateGlobalTension();
  }

  modifyRelationship(
    factionAId: string,
    factionBId: string,
    valueChange: number,
    eventType: RelationshipEventType,
    description: string,
    triggeredBy?: string
  ): FactionRelationship {
    const id = generateRelationshipId(factionAId, factionBId);
    let relationship = this.network.relationships.get(id);

    if (!relationship) {
      relationship = {
        id,
        faction_a_id: factionAId,
        faction_b_id: factionBId,
        relationship_type: 'neutral',
        relationship_value: 0,
        is_public: true,
        treaties: [],
        history: [],
        last_updated: new Date().toISOString(),
      };
    }

    // Apply change
    relationship.relationship_value = Math.max(-100, Math.min(100,
      relationship.relationship_value + valueChange
    ));
    relationship.relationship_type = valueToRelationshipType(
      relationship.relationship_value,
      !relationship.is_public
    );

    // Add to history
    relationship.history.push({
      id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: eventType,
      description,
      value_change: valueChange,
      triggered_by: triggeredBy,
    });

    relationship.last_updated = new Date().toISOString();
    this.network.relationships.set(id, relationship);
    this.updateGlobalTension();

    return relationship;
  }

  // Influence Management
  setInfluence(influence: FactionInfluence): void {
    this.network.influences.set(influence.faction_id, influence);
  }

  getInfluence(factionId: string): FactionInfluence | undefined {
    return this.network.influences.get(factionId);
  }

  modifyInfluence(
    factionId: string,
    type: InfluenceType,
    change: number,
    reason?: string
  ): void {
    let influence = this.network.influences.get(factionId);

    if (!influence) {
      influence = {
        faction_id: factionId,
        total_influence: 0,
        influence_breakdown: {
          military: 0,
          economic: 0,
          political: 0,
          cultural: 0,
          religious: 0,
          intelligence: 0,
        },
        territories: [],
        influence_history: [],
        power_rank: 0,
      };
    }

    influence.influence_breakdown[type] = Math.max(0,
      influence.influence_breakdown[type] + change
    );
    influence.total_influence = calculateTotalPower(influence);

    // Add snapshot
    influence.influence_history.push({
      timestamp: new Date().toISOString(),
      total_influence: influence.total_influence,
      breakdown: { ...influence.influence_breakdown },
      power_rank: influence.power_rank,
      triggered_by: reason,
    });

    this.network.influences.set(factionId, influence);
    this.recalculatePowerRanks();
  }

  // Territory Management
  addTerritory(territory: Territory): void {
    this.network.territories.set(territory.id, territory);

    // Update controller's influence
    const controllerInfluence = this.network.influences.get(territory.controller_id);
    if (controllerInfluence) {
      controllerInfluence.territories.push(territory);
    }
  }

  transferTerritory(territoryId: string, newControllerId: string): void {
    const territory = this.network.territories.get(territoryId);
    if (!territory) return;

    const oldControllerId = territory.controller_id;

    // Remove from old controller
    const oldInfluence = this.network.influences.get(oldControllerId);
    if (oldInfluence) {
      oldInfluence.territories = oldInfluence.territories.filter(t => t.id !== territoryId);
    }

    // Add to new controller
    territory.controller_id = newControllerId;
    const newInfluence = this.network.influences.get(newControllerId);
    if (newInfluence) {
      newInfluence.territories.push(territory);
    }

    // Create relationship event
    this.modifyRelationship(
      oldControllerId,
      newControllerId,
      -15,
      'territory_dispute',
      `Control of ${territory.name} transferred`
    );
  }

  // Power Calculations
  getPowerBalance(factionId: string): PowerBalance | undefined {
    const faction = this.network.factions.get(factionId);
    const influence = this.network.influences.get(factionId);

    if (!faction || !influence) return undefined;

    const relationships = Array.from(this.network.relationships.values());
    const alliancePower = calculateAlliancePower(factionId, relationships, this.network.influences);
    const rivalPower = calculateRivalPower(factionId, relationships, this.network.influences);
    const totalPower = calculateTotalPower(influence);

    const balance: Omit<PowerBalance, 'vulnerability_score'> = {
      faction_id: factionId,
      faction_name: faction.faction_name,
      total_power: totalPower,
      military_power: influence.influence_breakdown.military,
      economic_power: influence.influence_breakdown.economic,
      political_power: influence.influence_breakdown.political,
      alliance_power: alliancePower,
      rival_power: rivalPower,
      net_position: totalPower + alliancePower - rivalPower,
    };

    return {
      ...balance,
      vulnerability_score: calculateVulnerability(balance),
    };
  }

  getAllPowerBalances(): PowerBalance[] {
    const balances: PowerBalance[] = [];
    for (const factionId of this.network.factions.keys()) {
      const balance = this.getPowerBalance(factionId);
      if (balance) balances.push(balance);
    }
    return balances.sort((a, b) => b.total_power - a.total_power);
  }

  // Predictions
  getRelationshipPrediction(factionAId: string, factionBId: string): RelationshipPrediction | undefined {
    const relationship = this.getRelationship(factionAId, factionBId);
    const factionA = this.network.factions.get(factionAId);
    const factionB = this.network.factions.get(factionBId);

    if (!relationship || !factionA || !factionB) return undefined;

    return predictRelationshipChange(relationship, factionA, factionB);
  }

  // Diplomatic Actions
  getDiplomaticActions(initiatorId: string, targetId: string): DiplomaticAction[] {
    const relationship = this.getRelationship(initiatorId, targetId);
    const initiator = this.network.factions.get(initiatorId);

    if (!initiator) return [];

    return getAvailableDiplomaticActions(initiatorId, targetId, relationship, initiator);
  }

  // Global State
  getNetwork(): PoliticalNetwork {
    return this.network;
  }

  getGlobalTension(): number {
    return this.network.global_tension;
  }

  getAllRelationships(): FactionRelationship[] {
    return Array.from(this.network.relationships.values());
  }

  getAllFactions(): FactionPolitics[] {
    return Array.from(this.network.factions.values());
  }

  // Internal Methods
  private updateGlobalTension(): void {
    const relationships = Array.from(this.network.relationships.values());
    this.network.global_tension = calculateGlobalTension(relationships);
  }

  private recalculatePowerRanks(): void {
    const balances = this.getAllPowerBalances();
    balances.forEach((balance, index) => {
      const influence = this.network.influences.get(balance.faction_id);
      if (influence) {
        influence.power_rank = index + 1;
      }
    });
  }

  // Serialization
  exportNetwork(): string {
    const data = {
      factions: Array.from(this.network.factions.entries()),
      relationships: Array.from(this.network.relationships.entries()),
      influences: Array.from(this.network.influences.entries()),
      territories: Array.from(this.network.territories.entries()),
      global_tension: this.network.global_tension,
      era_name: this.network.era_name,
    };
    return JSON.stringify(data);
  }

  importNetwork(json: string): void {
    const data = JSON.parse(json);
    this.network = {
      factions: new Map(data.factions),
      relationships: new Map(data.relationships),
      influences: new Map(data.influences),
      territories: new Map(data.territories),
      global_tension: data.global_tension,
      era_name: data.era_name,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDefaultFactionPolitics(factionId: string, factionName: string): FactionPolitics {
  return {
    faction_id: factionId,
    faction_name: factionName,
    political_stance: 'neutral',
    diplomatic_reputation: 50,
    aggression_level: 25,
    trustworthiness: 50,
    goals: [],
    secrets: [],
  };
}

export function createDefaultInfluence(factionId: string): FactionInfluence {
  return {
    faction_id: factionId,
    total_influence: 0,
    influence_breakdown: {
      military: 10,
      economic: 10,
      political: 10,
      cultural: 10,
      religious: 5,
      intelligence: 5,
    },
    territories: [],
    influence_history: [],
    power_rank: 0,
  };
}
