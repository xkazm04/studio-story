/**
 * ContextTracker
 *
 * Tracks user focus and activity for context-aware recommendations.
 * Monitors which entities are being viewed/edited and builds session context.
 */

import type {
  RecommendationContext,
  RecentEntity,
  FeatureArea,
  TaskType,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface ContextTrackerConfig {
  maxRecentEntities: number;
  entityExpiryMs: number;
  debounceMs: number;
}

interface FocusEvent {
  type: 'view' | 'edit' | 'create' | 'select';
  entityId: string;
  entityType: string;
  entityName: string;
  featureArea: FeatureArea;
  timestamp: number;
}

type ContextChangeHandler = (context: RecommendationContext) => void;

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ContextTrackerConfig = {
  maxRecentEntities: 20,
  entityExpiryMs: 30 * 60 * 1000, // 30 minutes
  debounceMs: 300,
};

// ============================================================================
// ContextTracker Class
// ============================================================================

class ContextTrackerClass {
  private static instance: ContextTrackerClass;

  private config: ContextTrackerConfig;
  private currentContext: RecommendationContext | null = null;
  private recentEntities: RecentEntity[] = [];
  private focusHistory: FocusEvent[] = [];
  private handlers: Set<ContextChangeHandler> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionStart: number = Date.now();

  private constructor(config: Partial<ContextTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ContextTrackerConfig>): ContextTrackerClass {
    if (!ContextTrackerClass.instance) {
      ContextTrackerClass.instance = new ContextTrackerClass(config);
    }
    return ContextTrackerClass.instance;
  }

  // ============================================================================
  // Context Management
  // ============================================================================

  /**
   * Set the current project context
   */
  setProject(projectId: string): void {
    if (this.currentContext?.projectId !== projectId) {
      this.recentEntities = [];
      this.focusHistory = [];
      this.sessionStart = Date.now();
    }

    this.updateContext({
      projectId,
    });
  }

  /**
   * Set the current feature area
   */
  setFeatureArea(featureArea: FeatureArea): void {
    this.updateContext({ featureArea });
  }

  /**
   * Set the current task type
   */
  setTask(task: TaskType): void {
    this.updateContext({ currentTask: task });
  }

  /**
   * Track when user focuses on an entity
   */
  trackFocus(
    entityId: string,
    entityType: string,
    entityName: string,
    action: 'view' | 'edit' | 'create' | 'select' = 'view'
  ): void {
    const timestamp = Date.now();
    const featureArea = this.currentContext?.featureArea || 'landing';

    // Record focus event
    const event: FocusEvent = {
      type: action,
      entityId,
      entityType,
      entityName,
      featureArea,
      timestamp,
    };
    this.focusHistory.push(event);

    // Keep history bounded
    if (this.focusHistory.length > 100) {
      this.focusHistory = this.focusHistory.slice(-50);
    }

    // Update recent entities
    this.updateRecentEntities({
      id: entityId,
      type: entityType,
      name: entityName,
      accessedAt: timestamp,
      action,
    });

    // Update current entity in context
    this.updateContext({
      currentEntityId: entityId,
      currentEntityType: entityType,
    });

    // Set entity-specific context
    this.setEntityContext(entityType, entityId);
  }

  /**
   * Track when user leaves/unfocuses an entity
   */
  trackBlur(): void {
    this.updateContext({
      currentEntityId: undefined,
      currentEntityType: undefined,
    });
  }

  // ============================================================================
  // Entity Context Helpers
  // ============================================================================

  private setEntityContext(entityType: string, entityId: string): void {
    const updates: Partial<RecommendationContext> = {};

    switch (entityType) {
      case 'scene':
        updates.sceneId = entityId;
        break;
      case 'character':
        updates.characterId = entityId;
        break;
      case 'act':
        updates.actId = entityId;
        break;
      case 'beat':
        updates.beatId = entityId;
        break;
    }

    if (Object.keys(updates).length > 0) {
      this.updateContext(updates);
    }
  }

  private updateRecentEntities(entity: RecentEntity): void {
    // Remove existing entry for same entity
    this.recentEntities = this.recentEntities.filter(e => e.id !== entity.id);

    // Add at front
    this.recentEntities.unshift(entity);

    // Trim to max
    if (this.recentEntities.length > this.config.maxRecentEntities) {
      this.recentEntities = this.recentEntities.slice(0, this.config.maxRecentEntities);
    }

    // Remove expired entries
    const expiryTime = Date.now() - this.config.entityExpiryMs;
    this.recentEntities = this.recentEntities.filter(e => e.accessedAt > expiryTime);
  }

  // ============================================================================
  // Context Update
  // ============================================================================

  private updateContext(updates: Partial<RecommendationContext>): void {
    const previous = this.currentContext;

    this.currentContext = {
      projectId: updates.projectId ?? previous?.projectId ?? '',
      featureArea: updates.featureArea ?? previous?.featureArea ?? 'landing',
      currentEntityId: updates.currentEntityId ?? previous?.currentEntityId,
      currentEntityType: updates.currentEntityType ?? previous?.currentEntityType,
      recentEntities: this.recentEntities,
      currentTask: updates.currentTask ?? previous?.currentTask,
      sceneId: updates.sceneId ?? previous?.sceneId,
      characterId: updates.characterId ?? previous?.characterId,
      actId: updates.actId ?? previous?.actId,
      beatId: updates.beatId ?? previous?.beatId,
      lastActivity: Date.now(),
      sessionStart: this.sessionStart,
    };

    // Debounce notifications
    this.debouncedNotify();
  }

  private debouncedNotify(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.notifyHandlers();
    }, this.config.debounceMs);
  }

  private notifyHandlers(): void {
    if (!this.currentContext) return;

    this.handlers.forEach(handler => {
      try {
        handler(this.currentContext!);
      } catch (error) {
        console.error('Context change handler error:', error);
      }
    });
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  /**
   * Subscribe to context changes
   */
  subscribe(handler: ContextChangeHandler): () => void {
    this.handlers.add(handler);

    // Immediately notify with current context
    if (this.currentContext) {
      handler(this.currentContext);
    }

    return () => this.handlers.delete(handler);
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  getContext(): RecommendationContext | null {
    return this.currentContext;
  }

  getRecentEntities(): RecentEntity[] {
    return [...this.recentEntities];
  }

  getRecentEntitiesByType(type: string): RecentEntity[] {
    return this.recentEntities.filter(e => e.type === type);
  }

  getFocusHistory(): FocusEvent[] {
    return [...this.focusHistory];
  }

  /**
   * Get inferred task type based on recent activity
   */
  inferTask(): TaskType {
    if (this.focusHistory.length === 0) {
      return 'exploring';
    }

    const recentActions = this.focusHistory.slice(-10);
    const editCount = recentActions.filter(e => e.type === 'edit').length;
    const createCount = recentActions.filter(e => e.type === 'create').length;
    const viewCount = recentActions.filter(e => e.type === 'view').length;

    if (createCount >= 3) return 'generating';
    if (editCount >= 5) return 'editing';
    if (editCount >= 2) return 'writing';
    if (viewCount >= 5) return 'reviewing';

    return 'exploring';
  }

  /**
   * Get the most active entity types in the session
   */
  getMostActiveTypes(): { type: string; count: number }[] {
    const typeCounts = new Map<string, number>();

    this.focusHistory.forEach(event => {
      typeCounts.set(event.entityType, (typeCounts.get(event.entityType) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Check if an entity was recently accessed
   */
  wasRecentlyAccessed(entityId: string, withinMs: number = 5 * 60 * 1000): boolean {
    const entity = this.recentEntities.find(e => e.id === entityId);
    if (!entity) return false;
    return Date.now() - entity.accessedAt < withinMs;
  }

  /**
   * Get session duration in ms
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  // ============================================================================
  // Reset
  // ============================================================================

  reset(): void {
    this.currentContext = null;
    this.recentEntities = [];
    this.focusHistory = [];
    this.sessionStart = Date.now();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  updateConfig(config: Partial<ContextTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Export
// ============================================================================

export const contextTracker = ContextTrackerClass.getInstance();

export { ContextTrackerClass };

export default contextTracker;
