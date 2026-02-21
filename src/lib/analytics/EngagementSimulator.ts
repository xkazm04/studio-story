/**
 * EngagementSimulator
 *
 * Simulates reader engagement and attention levels throughout the story.
 * Predicts drop-off points, confusion moments, and generates reader experience reports.
 * Builds on FlowSimulator with engagement-specific modeling.
 */

import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';
import { BEAT_TYPE_TENSION } from './PacingAnalyzer';

// ============================================================================
// Types
// ============================================================================

export interface EngagementConfig {
  readerProfile: ReaderProfile;
  attentionDecayRate: number;      // How fast attention drops (0-1)
  recoveryRate: number;            // How fast attention recovers after peaks (0-1)
  confusionThreshold: number;      // When reader gets confused (0-1)
  engagementThreshold: number;     // Minimum engagement to continue (0-1)
}

export type ReaderProfile =
  | 'casual'      // Lower attention span, prefers action
  | 'engaged'     // Average attention, balanced preferences
  | 'literary'    // High attention span, appreciates nuance
  | 'scanner';    // Skims, needs frequent hooks

export interface EngagementPoint {
  position: number;           // 0-1 story position
  sceneId?: string;
  beatId?: string;
  engagement: number;         // 0-100 engagement level
  attention: number;          // 0-100 attention level
  curiosity: number;          // 0-100 curiosity level
  satisfaction: number;       // 0-100 satisfaction level
  emotionalInvestment: number; // 0-100
  flags: EngagementFlag[];
}

export type EngagementFlag =
  | 'drop-off-risk'
  | 'confusion'
  | 'boredom'
  | 'peak-engagement'
  | 'hook'
  | 'payoff'
  | 'fatigue'
  | 'recovery';

export interface DropOffPrediction {
  position: number;
  sceneId?: string;
  probability: number;        // 0-1 likelihood of drop-off
  reason: string;
  suggestions: string[];
}

export interface ConfusionPoint {
  position: number;
  sceneId?: string;
  severity: 'mild' | 'moderate' | 'severe';
  reason: string;
  suggestions: string[];
}

export interface ReaderExperienceReport {
  overallEngagement: number;       // 0-100
  engagementCurve: EngagementPoint[];
  dropOffPredictions: DropOffPrediction[];
  confusionPoints: ConfusionPoint[];
  hooks: { position: number; strength: number; description: string }[];
  payoffs: { position: number; satisfaction: number; description: string }[];
  pacingAssessment: {
    overall: 'too-slow' | 'good' | 'too-fast' | 'inconsistent';
    details: string;
  };
  retentionPrediction: {
    finishProbability: number;     // 0-1 chance reader finishes
    likelyDropOffPoint: number;    // Position where most would drop
    engagementPeaks: number[];     // Positions of highest engagement
    engagementValleys: number[];   // Positions of lowest engagement
  };
  recommendations: string[];
}

// ============================================================================
// Reader Profiles
// ============================================================================

const READER_PROFILES: Record<ReaderProfile, {
  attentionSpan: number;      // Base attention capacity
  peakSensitivity: number;    // How much peaks boost engagement
  valleySensitivity: number;  // How much valleys hurt engagement
  curiosityWeight: number;    // How much mystery/questions matter
  actionWeight: number;       // Preference for action
  emotionWeight: number;      // Preference for emotional content
}> = {
  casual: {
    attentionSpan: 0.6,
    peakSensitivity: 1.5,
    valleySensitivity: 1.5,
    curiosityWeight: 0.8,
    actionWeight: 1.3,
    emotionWeight: 0.7,
  },
  engaged: {
    attentionSpan: 0.8,
    peakSensitivity: 1.2,
    valleySensitivity: 1.0,
    curiosityWeight: 1.0,
    actionWeight: 1.0,
    emotionWeight: 1.0,
  },
  literary: {
    attentionSpan: 1.0,
    peakSensitivity: 0.9,
    valleySensitivity: 0.7,
    curiosityWeight: 1.2,
    actionWeight: 0.7,
    emotionWeight: 1.3,
  },
  scanner: {
    attentionSpan: 0.4,
    peakSensitivity: 2.0,
    valleySensitivity: 2.0,
    curiosityWeight: 1.5,
    actionWeight: 1.5,
    emotionWeight: 0.5,
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: EngagementConfig = {
  readerProfile: 'engaged',
  attentionDecayRate: 0.02,
  recoveryRate: 0.15,
  confusionThreshold: 0.3,
  engagementThreshold: 0.2,
};

// ============================================================================
// EngagementSimulator Class
// ============================================================================

class EngagementSimulatorClass {
  private static instance: EngagementSimulatorClass;

  private constructor() {}

  static getInstance(): EngagementSimulatorClass {
    if (!EngagementSimulatorClass.instance) {
      EngagementSimulatorClass.instance = new EngagementSimulatorClass();
    }
    return EngagementSimulatorClass.instance;
  }

  // ============================================================================
  // Main Simulation
  // ============================================================================

  /**
   * Simulate reader engagement throughout the story
   */
  simulateEngagement(
    scenes: Scene[],
    beats: Beat[],
    config: Partial<EngagementConfig> = {}
  ): ReaderExperienceReport {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const profile = READER_PROFILES[fullConfig.readerProfile];

    // Sort scenes by order
    const sortedScenes = this.sortScenes(scenes, beats);
    // Map beats by act_id since Beat doesn't have direct scene_id
    const beatsMap = new Map<string, Beat>(
      beats.filter(b => b.act_id).map(b => [b.act_id!, b])
    );

    // Simulate engagement curve
    const engagementCurve = this.buildEngagementCurve(
      sortedScenes,
      beatsMap,
      profile,
      fullConfig
    );

    // Predict drop-off points
    const dropOffPredictions = this.predictDropOffs(engagementCurve, sortedScenes, fullConfig);

    // Identify confusion points
    const confusionPoints = this.identifyConfusion(sortedScenes, beatsMap, engagementCurve);

    // Find hooks and payoffs
    const hooks = this.findHooks(engagementCurve, sortedScenes, beatsMap);
    const payoffs = this.findPayoffs(engagementCurve, sortedScenes, beatsMap);

    // Assess pacing
    const pacingAssessment = this.assessPacing(engagementCurve);

    // Calculate retention prediction
    const retentionPrediction = this.predictRetention(engagementCurve, dropOffPredictions);

    // Calculate overall engagement
    const overallEngagement = this.calculateOverallEngagement(engagementCurve);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      engagementCurve,
      dropOffPredictions,
      confusionPoints,
      pacingAssessment
    );

    return {
      overallEngagement,
      engagementCurve,
      dropOffPredictions,
      confusionPoints,
      hooks,
      payoffs,
      pacingAssessment,
      retentionPrediction,
      recommendations,
    };
  }

  // ============================================================================
  // Engagement Curve Building
  // ============================================================================

  private buildEngagementCurve(
    scenes: Scene[],
    beatsMap: Map<string, Beat>,
    profile: typeof READER_PROFILES['engaged'],
    config: EngagementConfig
  ): EngagementPoint[] {
    const curve: EngagementPoint[] = [];

    let attention = 80; // Start with good attention
    let curiosity = 60; // Moderate curiosity at start
    let satisfaction = 50; // Neutral satisfaction
    let emotionalInvestment = 30; // Low initial investment

    scenes.forEach((scene, index) => {
      const position = scenes.length > 1 ? index / (scenes.length - 1) : 0.5;
      const beat = beatsMap.get(scene.id);

      // Calculate scene impact
      const sceneImpact = this.calculateSceneImpact(scene, beat, profile);

      // Update attention
      attention = this.updateAttention(
        attention,
        sceneImpact,
        profile.attentionSpan,
        config.attentionDecayRate,
        config.recoveryRate
      );

      // Update curiosity
      curiosity = this.updateCuriosity(curiosity, scene, beat);

      // Update satisfaction (increases with payoffs)
      satisfaction = this.updateSatisfaction(satisfaction, beat, profile);

      // Update emotional investment
      emotionalInvestment = this.updateEmotionalInvestment(
        emotionalInvestment,
        scene,
        beat,
        profile.emotionWeight
      );

      // Calculate overall engagement
      const engagement = this.calculateEngagement(
        attention,
        curiosity,
        satisfaction,
        emotionalInvestment,
        sceneImpact
      );

      // Detect flags
      const flags = this.detectFlags(
        engagement,
        attention,
        curiosity,
        satisfaction,
        sceneImpact,
        config
      );

      curve.push({
        position,
        sceneId: scene.id,
        beatId: beat?.id,
        engagement,
        attention,
        curiosity,
        satisfaction,
        emotionalInvestment,
        flags,
      });
    });

    return curve;
  }

  private calculateSceneImpact(
    scene: Scene,
    beat: Beat | undefined,
    profile: typeof READER_PROFILES['engaged']
  ): number {
    let impact = 50; // Base impact

    // Beat type impact
    if (beat?.type) {
      const tension = BEAT_TYPE_TENSION[beat.type] ?? 50;
      impact = tension;
    }

    // Adjust for profile preferences
    if (beat?.type === 'action') {
      impact *= profile.actionWeight;
    } else if (beat?.type === 'emotional') {
      impact *= profile.emotionWeight;
    } else if (beat?.type === 'revelation') {
      impact *= profile.curiosityWeight;
    }

    // Content length impact (very long scenes can reduce engagement)
    const contentLength = (scene.content?.length ?? 0) + (scene.description?.length ?? 0);
    if (contentLength > 2000) {
      impact *= 0.9; // Slight reduction for very long scenes
    }

    return Math.min(100, Math.max(0, impact));
  }

  private updateAttention(
    current: number,
    sceneImpact: number,
    attentionSpan: number,
    decayRate: number,
    recoveryRate: number
  ): number {
    // Natural decay
    let attention = current - (decayRate * 100 * (1 - attentionSpan));

    // Scene impact effect
    if (sceneImpact > 60) {
      // High-impact scenes boost attention
      attention += (sceneImpact - 60) * recoveryRate * 2;
    } else if (sceneImpact < 40) {
      // Low-impact scenes accelerate decay
      attention -= (40 - sceneImpact) * decayRate * 2;
    }

    return Math.min(100, Math.max(0, attention));
  }

  private updateCuriosity(
    current: number,
    scene: Scene,
    beat: Beat | undefined
  ): number {
    let curiosity = current;

    // Questions/mystery increase curiosity
    const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
    if (content.includes('?') || content.match(/mystery|secret|hidden|wonder|what if/)) {
      curiosity += 10;
    }

    // Revelations satisfy curiosity (decrease it)
    if (beat?.type === 'revelation') {
      curiosity -= 15;
    }

    // Setup increases curiosity
    if (beat?.type === 'setup') {
      curiosity += 8;
    }

    return Math.min(100, Math.max(0, curiosity));
  }

  private updateSatisfaction(
    current: number,
    beat: Beat | undefined,
    profile: typeof READER_PROFILES['engaged']
  ): number {
    let satisfaction = current;

    // Payoffs increase satisfaction
    if (beat?.type === 'payoff') {
      satisfaction += 20 * profile.peakSensitivity;
    }

    // Resolution beats increase satisfaction
    const beatName = (beat?.name || '').toLowerCase();
    if (beatName.includes('resolution') || beatName.includes('callback')) {
      satisfaction += 12;
    }

    // Cliffhangers can decrease satisfaction temporarily
    if (beatName.includes('cliffhanger')) {
      satisfaction -= 5;
    }

    // Natural decay toward neutral
    satisfaction = satisfaction * 0.95 + 50 * 0.05;

    return Math.min(100, Math.max(0, satisfaction));
  }

  private updateEmotionalInvestment(
    current: number,
    scene: Scene,
    beat: Beat | undefined,
    emotionWeight: number
  ): number {
    let investment = current;

    // Emotional beats increase investment
    if (beat?.type === 'emotional') {
      investment += 15 * emotionWeight;
    }

    // Character moments increase investment
    const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
    if (content.match(/feel|emotion|love|hate|fear|joy|sad|happy|angry/)) {
      investment += 5 * emotionWeight;
    }

    // Gradual increase over time (familiarity)
    investment += 0.5;

    return Math.min(100, Math.max(0, investment));
  }

  private calculateEngagement(
    attention: number,
    curiosity: number,
    satisfaction: number,
    emotionalInvestment: number,
    sceneImpact: number
  ): number {
    // Weighted combination
    const engagement =
      attention * 0.3 +
      curiosity * 0.2 +
      satisfaction * 0.15 +
      emotionalInvestment * 0.15 +
      sceneImpact * 0.2;

    return Math.round(Math.min(100, Math.max(0, engagement)));
  }

  private detectFlags(
    engagement: number,
    attention: number,
    curiosity: number,
    satisfaction: number,
    sceneImpact: number,
    config: EngagementConfig
  ): EngagementFlag[] {
    const flags: EngagementFlag[] = [];

    // Drop-off risk
    if (engagement < config.engagementThreshold * 100) {
      flags.push('drop-off-risk');
    }

    // Confusion
    if (curiosity > 80 && satisfaction < 30) {
      flags.push('confusion');
    }

    // Boredom
    if (attention < 40 && sceneImpact < 40) {
      flags.push('boredom');
    }

    // Peak engagement
    if (engagement > 80) {
      flags.push('peak-engagement');
    }

    // Hook (high curiosity + decent attention)
    if (curiosity > 70 && attention > 50 && sceneImpact > 50) {
      flags.push('hook');
    }

    // Payoff (satisfaction spike)
    if (satisfaction > 75) {
      flags.push('payoff');
    }

    // Fatigue (low attention despite good content)
    if (attention < 50 && sceneImpact > 50) {
      flags.push('fatigue');
    }

    // Recovery (attention returning after dip)
    if (attention > 60 && engagement > 60) {
      flags.push('recovery');
    }

    return flags;
  }

  // ============================================================================
  // Analysis Methods
  // ============================================================================

  private predictDropOffs(
    curve: EngagementPoint[],
    scenes: Scene[],
    config: EngagementConfig
  ): DropOffPrediction[] {
    const predictions: DropOffPrediction[] = [];

    curve.forEach((point, index) => {
      // Check for drop-off conditions
      if (point.flags.includes('drop-off-risk') || point.flags.includes('boredom')) {
        const probability = this.calculateDropOffProbability(point, config);

        if (probability > 0.2) {
          const scene = scenes[index];
          predictions.push({
            position: point.position,
            sceneId: point.sceneId,
            probability,
            reason: this.getDropOffReason(point),
            suggestions: this.getDropOffSuggestions(point),
          });
        }
      }
    });

    return predictions;
  }

  private calculateDropOffProbability(
    point: EngagementPoint,
    config: EngagementConfig
  ): number {
    let probability = 0;

    // Base probability from engagement level
    probability += (1 - point.engagement / 100) * 0.5;

    // Attention factor
    probability += (1 - point.attention / 100) * 0.3;

    // Position factor (early drop-offs more likely)
    if (point.position < 0.2) {
      probability *= 1.5;
    }

    return Math.min(1, probability);
  }

  private getDropOffReason(point: EngagementPoint): string {
    if (point.flags.includes('boredom')) {
      return 'Low engagement and attention - reader may be bored';
    }
    if (point.flags.includes('confusion')) {
      return 'High curiosity but low satisfaction - reader may be confused';
    }
    if (point.flags.includes('fatigue')) {
      return 'Reader fatigue - attention dropping despite good content';
    }
    return 'Low overall engagement';
  }

  private getDropOffSuggestions(point: EngagementPoint): string[] {
    const suggestions: string[] = [];

    if (point.flags.includes('boredom')) {
      suggestions.push('Add a hook or revelation to increase interest');
      suggestions.push('Introduce conflict or tension');
    }
    if (point.flags.includes('confusion')) {
      suggestions.push('Provide clarity on plot points');
      suggestions.push('Add a small payoff to satisfy curiosity');
    }
    if (point.flags.includes('fatigue')) {
      suggestions.push('Consider a breather scene before this point');
      suggestions.push('Break up long sections with dialogue');
    }
    if (point.attention < 40) {
      suggestions.push('Add a compelling hook to recapture attention');
    }

    return suggestions;
  }

  private identifyConfusion(
    scenes: Scene[],
    beatsMap: Map<string, Beat>,
    curve: EngagementPoint[]
  ): ConfusionPoint[] {
    const confusionPoints: ConfusionPoint[] = [];

    curve.forEach((point, index) => {
      if (point.flags.includes('confusion')) {
        const scene = scenes[index];
        const beat = beatsMap.get(scene?.id || '');

        let severity: ConfusionPoint['severity'] = 'mild';
        if (point.curiosity > 90 && point.satisfaction < 20) {
          severity = 'severe';
        } else if (point.curiosity > 80 && point.satisfaction < 30) {
          severity = 'moderate';
        }

        confusionPoints.push({
          position: point.position,
          sceneId: point.sceneId,
          severity,
          reason: 'Too many unanswered questions without resolution',
          suggestions: [
            'Resolve some earlier mysteries before introducing new ones',
            'Add clarity through dialogue or exposition',
            'Consider the reader\'s information state at this point',
          ],
        });
      }
    });

    return confusionPoints;
  }

  private findHooks(
    curve: EngagementPoint[],
    scenes: Scene[],
    beatsMap: Map<string, Beat>
  ): { position: number; strength: number; description: string }[] {
    return curve
      .filter(point => point.flags.includes('hook'))
      .map(point => {
        const scene = scenes.find(s => s.id === point.sceneId);
        const beat = beatsMap.get(point.sceneId || '');

        return {
          position: point.position,
          strength: (point.curiosity + point.attention) / 2,
          description: beat?.name || scene?.name || 'Hook moment',
        };
      });
  }

  private findPayoffs(
    curve: EngagementPoint[],
    scenes: Scene[],
    beatsMap: Map<string, Beat>
  ): { position: number; satisfaction: number; description: string }[] {
    return curve
      .filter(point => point.flags.includes('payoff'))
      .map(point => {
        const scene = scenes.find(s => s.id === point.sceneId);
        const beat = beatsMap.get(point.sceneId || '');

        return {
          position: point.position,
          satisfaction: point.satisfaction,
          description: beat?.name || scene?.name || 'Payoff moment',
        };
      });
  }

  private assessPacing(curve: EngagementPoint[]): ReaderExperienceReport['pacingAssessment'] {
    if (curve.length < 3) {
      return { overall: 'inconsistent', details: 'Not enough data points' };
    }

    const engagements = curve.map(p => p.engagement);
    const avgEngagement = engagements.reduce((a, b) => a + b, 0) / engagements.length;

    // Count direction changes (oscillation)
    let oscillations = 0;
    for (let i = 2; i < engagements.length; i++) {
      const prev = engagements[i - 1] - engagements[i - 2];
      const curr = engagements[i] - engagements[i - 1];
      if (prev * curr < 0) oscillations++;
    }

    const oscillationRate = oscillations / (engagements.length - 2);

    // Check for sustained low engagement
    const lowEngagementStretch = this.findLongestStretch(engagements, e => e < 50);
    const highEngagementStretch = this.findLongestStretch(engagements, e => e > 70);

    if (lowEngagementStretch > engagements.length * 0.3) {
      return {
        overall: 'too-slow',
        details: 'Extended period of low engagement - story may feel slow',
      };
    }

    if (oscillationRate < 0.1 && avgEngagement > 70) {
      return {
        overall: 'too-fast',
        details: 'Consistent high engagement without breaks - reader may feel overwhelmed',
      };
    }

    if (oscillationRate > 0.5) {
      return {
        overall: 'inconsistent',
        details: 'Engagement fluctuates too frequently - pacing feels uneven',
      };
    }

    return {
      overall: 'good',
      details: 'Pacing shows good variation with appropriate peaks and valleys',
    };
  }

  private findLongestStretch(values: number[], predicate: (v: number) => boolean): number {
    let longest = 0;
    let current = 0;

    values.forEach(v => {
      if (predicate(v)) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });

    return longest;
  }

  private predictRetention(
    curve: EngagementPoint[],
    dropOffs: DropOffPrediction[]
  ): ReaderExperienceReport['retentionPrediction'] {
    // Calculate finish probability
    const avgEngagement = curve.reduce((sum, p) => sum + p.engagement, 0) / curve.length;
    let finishProbability = avgEngagement / 100;

    // Reduce for each drop-off point
    dropOffs.forEach(d => {
      finishProbability *= (1 - d.probability * 0.3);
    });

    // Find likely drop-off point
    const likelyDropOff = dropOffs.length > 0
      ? dropOffs.reduce((max, d) => d.probability > max.probability ? d : max).position
      : 1.0;

    // Find peaks and valleys
    const peaks: number[] = [];
    const valleys: number[] = [];

    for (let i = 1; i < curve.length - 1; i++) {
      const prev = curve[i - 1].engagement;
      const curr = curve[i].engagement;
      const next = curve[i + 1].engagement;

      if (curr > prev && curr > next && curr > 70) {
        peaks.push(curve[i].position);
      }
      if (curr < prev && curr < next && curr < 40) {
        valleys.push(curve[i].position);
      }
    }

    return {
      finishProbability: Math.max(0, Math.min(1, finishProbability)),
      likelyDropOffPoint: likelyDropOff,
      engagementPeaks: peaks,
      engagementValleys: valleys,
    };
  }

  private calculateOverallEngagement(curve: EngagementPoint[]): number {
    if (curve.length === 0) return 50;

    // Weighted average giving more importance to beginning and end
    let weightedSum = 0;
    let totalWeight = 0;

    curve.forEach((point, index) => {
      // Higher weight for beginning (first 20%) and end (last 10%)
      let weight = 1;
      if (point.position < 0.2) weight = 1.5;
      if (point.position > 0.9) weight = 1.3;

      weightedSum += point.engagement * weight;
      totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  private generateRecommendations(
    curve: EngagementPoint[],
    dropOffs: DropOffPrediction[],
    confusion: ConfusionPoint[],
    pacing: ReaderExperienceReport['pacingAssessment']
  ): string[] {
    const recommendations: string[] = [];

    // Drop-off recommendations
    if (dropOffs.length > 0) {
      const earlyDropOffs = dropOffs.filter(d => d.position < 0.3);
      if (earlyDropOffs.length > 0) {
        recommendations.push('Add a stronger hook in the opening to capture readers early');
      }
    }

    // Confusion recommendations
    if (confusion.length > 2) {
      recommendations.push('Story may be too complex - consider resolving mysteries more frequently');
    }

    // Pacing recommendations
    if (pacing.overall === 'too-slow') {
      recommendations.push('Inject more action or revelation beats to pick up the pace');
    }
    if (pacing.overall === 'too-fast') {
      recommendations.push('Add breather moments to let readers process events');
    }
    if (pacing.overall === 'inconsistent') {
      recommendations.push('Smooth out pacing by transitioning more gradually between intense and calm scenes');
    }

    // Attention recommendations
    const lowAttentionPoints = curve.filter(p => p.attention < 40);
    if (lowAttentionPoints.length > curve.length * 0.2) {
      recommendations.push('Reader attention drops frequently - add more engaging hooks throughout');
    }

    // Emotional investment recommendations
    const avgEmotionalInvestment = curve.reduce((sum, p) => sum + p.emotionalInvestment, 0) / curve.length;
    if (avgEmotionalInvestment < 40) {
      recommendations.push('Increase emotional stakes and character development to build reader investment');
    }

    return [...new Set(recommendations)].slice(0, 6);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private sortScenes(scenes: Scene[], beats: Beat[]): Scene[] {
    const actOrderMap = new Map<string, number>();
    beats.forEach(beat => {
      if (beat.act_id && beat.order !== undefined) {
        actOrderMap.set(beat.act_id, Math.min(actOrderMap.get(beat.act_id) ?? Infinity, beat.order));
      }
    });

    return [...scenes].sort((a, b) => {
      const orderA = (a.act_id ? actOrderMap.get(a.act_id) : undefined) ?? 0;
      const orderB = (b.act_id ? actOrderMap.get(b.act_id) : undefined) ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  getReaderProfiles(): ReaderProfile[] {
    return Object.keys(READER_PROFILES) as ReaderProfile[];
  }

  getDefaultConfig(): EngagementConfig {
    return { ...DEFAULT_CONFIG };
  }
}

// ============================================================================
// Export
// ============================================================================

export const engagementSimulator = EngagementSimulatorClass.getInstance();

export { EngagementSimulatorClass, READER_PROFILES };

export default engagementSimulator;
