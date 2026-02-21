/**
 * SuggestionTrigger
 *
 * Manages proactive suggestion triggers based on user behavior patterns.
 * Detects when to surface recommendations without being intrusive.
 */

import type {
  RecommendationContext,
  FeatureArea,
} from './types';
import { contextTracker } from './ContextTracker';

// ============================================================================
// Types
// ============================================================================

export type TriggerType =
  | 'idle'           // User has been idle for a while
  | 'context-switch' // User switched feature areas
  | 'pattern'        // Detected usage pattern
  | 'gap'            // Detected missing content
  | 'milestone'      // User reached a milestone
  | 'schedule'       // Scheduled suggestion time
  | 'manual';        // Manually triggered

export interface TriggerEvent {
  type: TriggerType;
  reason: string;
  context: RecommendationContext;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface TriggerConfig {
  enabled: boolean;
  idleThresholdMs: number;
  contextSwitchDebounceMs: number;
  minTimeBetweenTriggersMs: number;
  maxTriggersPerSession: number;
  enabledTriggers: TriggerType[];
}

type TriggerHandler = (event: TriggerEvent) => void;

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: TriggerConfig = {
  enabled: true,
  idleThresholdMs: 30 * 1000,        // 30 seconds idle
  contextSwitchDebounceMs: 2000,     // 2 seconds after context switch
  minTimeBetweenTriggersMs: 60000,   // 1 minute between triggers
  maxTriggersPerSession: 20,
  enabledTriggers: ['idle', 'context-switch', 'pattern', 'gap'],
};

// ============================================================================
// SuggestionTrigger Class
// ============================================================================

class SuggestionTriggerClass {
  private static instance: SuggestionTriggerClass;

  private config: TriggerConfig;
  private handlers: Set<TriggerHandler> = new Set();
  private lastTriggerTime: number = 0;
  private triggerCount: number = 0;
  private sessionStart: number = Date.now();

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private contextSwitchTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivity: number = Date.now();
  private lastFeatureArea: FeatureArea | null = null;
  private unsubscribeContext: (() => void) | null = null;

  private constructor(config: Partial<TriggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<TriggerConfig>): SuggestionTriggerClass {
    if (!SuggestionTriggerClass.instance) {
      SuggestionTriggerClass.instance = new SuggestionTriggerClass(config);
    }
    return SuggestionTriggerClass.instance;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start monitoring for trigger conditions
   */
  start(): void {
    if (!this.config.enabled) return;

    // Subscribe to context changes
    this.unsubscribeContext = contextTracker.subscribe(context => {
      this.handleContextChange(context);
    });

    // Start idle detection
    this.startIdleDetection();

    console.log('[SuggestionTrigger] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.unsubscribeContext) {
      this.unsubscribeContext();
      this.unsubscribeContext = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.contextSwitchTimer) {
      clearTimeout(this.contextSwitchTimer);
      this.contextSwitchTimer = null;
    }

    console.log('[SuggestionTrigger] Stopped monitoring');
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Subscribe to trigger events
   */
  subscribe(handler: TriggerHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: TriggerEvent): void {
    // Check if we should throttle
    if (!this.shouldTrigger()) {
      return;
    }

    // Check if trigger type is enabled
    if (!this.config.enabledTriggers.includes(event.type)) {
      return;
    }

    this.lastTriggerTime = Date.now();
    this.triggerCount++;

    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Trigger handler error:', error);
      }
    });
  }

  private shouldTrigger(): boolean {
    if (!this.config.enabled) return false;

    // Check max triggers per session
    if (this.triggerCount >= this.config.maxTriggersPerSession) {
      return false;
    }

    // Check minimum time between triggers
    const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
    if (timeSinceLastTrigger < this.config.minTimeBetweenTriggersMs) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // Idle Detection
  // ============================================================================

  private startIdleDetection(): void {
    // Reset idle timer on any activity
    this.resetIdleTimer();

    // Listen for browser activity events
    if (typeof window !== 'undefined') {
      const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

      const handleActivity = () => {
        this.lastActivity = Date.now();
        this.resetIdleTimer();
      };

      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.handleIdle();
    }, this.config.idleThresholdMs);
  }

  private handleIdle(): void {
    const context = contextTracker.getContext();
    if (!context) return;

    this.emit({
      type: 'idle',
      reason: 'User has been idle - good time for suggestions',
      context,
      priority: 'low',
      timestamp: Date.now(),
    });
  }

  // ============================================================================
  // Context Change Detection
  // ============================================================================

  private handleContextChange(context: RecommendationContext): void {
    this.lastActivity = Date.now();
    this.resetIdleTimer();

    // Detect feature area change
    if (this.lastFeatureArea && this.lastFeatureArea !== context.featureArea) {
      this.handleFeatureSwitch(context);
    }

    this.lastFeatureArea = context.featureArea;

    // Check for patterns that warrant suggestions
    this.checkForPatterns(context);
  }

  private handleFeatureSwitch(context: RecommendationContext): void {
    // Debounce context switch triggers
    if (this.contextSwitchTimer) {
      clearTimeout(this.contextSwitchTimer);
    }

    this.contextSwitchTimer = setTimeout(() => {
      this.emit({
        type: 'context-switch',
        reason: `Switched to ${context.featureArea} - may need relevant suggestions`,
        context,
        priority: 'medium',
        timestamp: Date.now(),
      });
    }, this.config.contextSwitchDebounceMs);
  }

  // ============================================================================
  // Pattern Detection
  // ============================================================================

  private checkForPatterns(context: RecommendationContext): void {
    // Check for "gap" patterns - things that might be missing

    // Pattern: Multiple characters viewed but no relationship activity
    const recentCharacters = context.recentEntities.filter(e => e.type === 'character');
    const hasRelationshipActivity = context.recentEntities.some(e => e.type === 'relationship');

    if (recentCharacters.length >= 3 && !hasRelationshipActivity) {
      this.emit({
        type: 'gap',
        reason: 'Multiple characters viewed without defining relationships',
        context,
        priority: 'medium',
        timestamp: Date.now(),
      });
    }

    // Pattern: Scene without characters
    if (context.featureArea === 'scene-editor' && context.sceneId) {
      const recentSceneCharacters = context.recentEntities.filter(
        e => e.type === 'character' && e.accessedAt > Date.now() - 10 * 60 * 1000
      );

      if (recentSceneCharacters.length === 0) {
        this.emit({
          type: 'pattern',
          reason: 'Editing scene without recent character activity',
          context,
          priority: 'low',
          timestamp: Date.now(),
        });
      }
    }

    // Pattern: Storyboard without assets
    if (context.featureArea === 'storyboard') {
      const recentAssets = context.recentEntities.filter(e => e.type === 'asset');
      if (recentAssets.length === 0) {
        this.emit({
          type: 'gap',
          reason: 'Storyboard work without asset references',
          context,
          priority: 'low',
          timestamp: Date.now(),
        });
      }
    }
  }

  // ============================================================================
  // Manual Triggers
  // ============================================================================

  /**
   * Manually trigger suggestions (e.g., from a button click)
   */
  triggerManually(reason: string = 'User requested suggestions'): void {
    const context = contextTracker.getContext();
    if (!context) return;

    this.emit({
      type: 'manual',
      reason,
      context,
      priority: 'high',
      timestamp: Date.now(),
    });
  }

  /**
   * Trigger for a specific milestone
   */
  triggerMilestone(milestone: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const context = contextTracker.getContext();
    if (!context) return;

    this.emit({
      type: 'milestone',
      reason: `Milestone reached: ${milestone}`,
      context,
      priority,
      timestamp: Date.now(),
    });
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  updateConfig(config: Partial<TriggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TriggerConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable specific trigger type
   */
  setTriggerEnabled(type: TriggerType, enabled: boolean): void {
    if (enabled && !this.config.enabledTriggers.includes(type)) {
      this.config.enabledTriggers.push(type);
    } else if (!enabled) {
      this.config.enabledTriggers = this.config.enabledTriggers.filter(t => t !== type);
    }
  }

  // ============================================================================
  // Stats
  // ============================================================================

  getStats(): {
    triggerCount: number;
    sessionDuration: number;
    lastTriggerAgo: number;
    isEnabled: boolean;
  } {
    return {
      triggerCount: this.triggerCount,
      sessionDuration: Date.now() - this.sessionStart,
      lastTriggerAgo: this.lastTriggerTime > 0 ? Date.now() - this.lastTriggerTime : -1,
      isEnabled: this.config.enabled,
    };
  }

  resetSession(): void {
    this.triggerCount = 0;
    this.sessionStart = Date.now();
    this.lastTriggerTime = 0;
  }
}

// ============================================================================
// Export
// ============================================================================

export const suggestionTrigger = SuggestionTriggerClass.getInstance();

export { SuggestionTriggerClass };

export default suggestionTrigger;
