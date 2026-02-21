/**
 * TourEngine - Guided walkthrough system for interactive tutorials
 *
 * Provides a comprehensive API for creating step-by-step guided tours
 * with element highlighting, positioning, and progress tracking.
 */

export interface TourStep {
  /** Unique identifier for the step */
  id: string;
  /** CSS selector or ref callback to target element */
  target: string | (() => HTMLElement | null);
  /** Main title of the step */
  title: string;
  /** Detailed description or instructions */
  content: string;
  /** Position of the tooltip relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Whether to highlight the target element */
  highlight?: boolean;
  /** Custom action to perform when step is shown */
  onShow?: () => void | Promise<void>;
  /** Custom action to perform when step is hidden */
  onHide?: () => void | Promise<void>;
  /** Whether user can interact with target during step */
  allowInteraction?: boolean;
  /** Custom button text for next action */
  nextLabel?: string;
  /** Custom button text for previous action */
  prevLabel?: string;
  /** Show skip button for this step */
  showSkip?: boolean;
  /** Delay before showing this step (ms) */
  delay?: number;
  /** Feature gate - only show if feature is unlocked */
  requiredFeature?: string;
}

export interface Tour {
  /** Unique identifier for the tour */
  id: string;
  /** Display name of the tour */
  name: string;
  /** Description of what the tour covers */
  description?: string;
  /** Ordered list of steps */
  steps: TourStep[];
  /** Category for grouping tours */
  category?: 'onboarding' | 'feature' | 'advanced';
  /** Priority for tour suggestions (lower = higher priority) */
  priority?: number;
  /** Prerequisites - other tour IDs that must be completed first */
  prerequisites?: string[];
}

export interface TourProgress {
  tourId: string;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: number;
  completedAt?: number;
  skipped?: boolean;
}

export interface TourEngineState {
  /** Currently active tour */
  activeTour: Tour | null;
  /** Current step index */
  currentStepIndex: number;
  /** Whether the tour is running */
  isRunning: boolean;
  /** Progress for all tours */
  progress: Record<string, TourProgress>;
  /** Unlocked features through progressive disclosure */
  unlockedFeatures: Set<string>;
}

const STORAGE_KEY = 'story-tutorial-progress';
const FEATURES_KEY = 'story-unlocked-features';

class TourEngineImpl {
  private state: TourEngineState;
  private registeredTours: Map<string, Tour> = new Map();
  private listeners: Set<(state: TourEngineState) => void> = new Set();

  constructor() {
    this.state = {
      activeTour: null,
      currentStepIndex: 0,
      isRunning: false,
      progress: {},
      unlockedFeatures: new Set(),
    };
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        this.state.progress = JSON.parse(savedProgress);
      }

      const savedFeatures = localStorage.getItem(FEATURES_KEY);
      if (savedFeatures) {
        this.state.unlockedFeatures = new Set(JSON.parse(savedFeatures));
      }
    } catch (error) {
      console.warn('Failed to load tutorial progress:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.progress));
      localStorage.setItem(FEATURES_KEY, JSON.stringify(Array.from(this.state.unlockedFeatures)));
    } catch (error) {
      console.warn('Failed to save tutorial progress:', error);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Register a tour to make it available
   */
  registerTour(tour: Tour): void {
    this.registeredTours.set(tour.id, tour);
  }

  /**
   * Unregister a tour
   */
  unregisterTour(tourId: string): void {
    this.registeredTours.delete(tourId);
  }

  /**
   * Get all registered tours
   */
  getTours(): Tour[] {
    return Array.from(this.registeredTours.values());
  }

  /**
   * Get a specific tour by ID
   */
  getTour(tourId: string): Tour | undefined {
    return this.registeredTours.get(tourId);
  }

  /**
   * Start a tour by ID
   */
  async startTour(tourId: string): Promise<boolean> {
    const tour = this.registeredTours.get(tourId);
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`);
      return false;
    }

    // Check prerequisites
    if (tour.prerequisites) {
      const unmetPrereqs = tour.prerequisites.filter(
        prereqId => !this.isTourCompleted(prereqId)
      );
      if (unmetPrereqs.length > 0) {
        console.warn(`Tour "${tourId}" has unmet prerequisites:`, unmetPrereqs);
        return false;
      }
    }

    // Initialize progress if not exists
    if (!this.state.progress[tourId]) {
      this.state.progress[tourId] = {
        tourId,
        currentStepIndex: 0,
        completedSteps: [],
        startedAt: Date.now(),
      };
    }

    this.state.activeTour = tour;
    this.state.currentStepIndex = this.state.progress[tourId].currentStepIndex;
    this.state.isRunning = true;

    this.saveToStorage();
    this.notify();

    // Execute onShow callback for first step
    const firstStep = tour.steps[this.state.currentStepIndex];
    if (firstStep?.onShow) {
      await firstStep.onShow();
    }

    return true;
  }

  /**
   * Stop the current tour
   */
  async stopTour(markAsSkipped = false): Promise<void> {
    if (!this.state.activeTour) return;

    const currentStep = this.getCurrentStep();
    if (currentStep?.onHide) {
      await currentStep.onHide();
    }

    if (markAsSkipped) {
      this.state.progress[this.state.activeTour.id].skipped = true;
    }

    this.state.activeTour = null;
    this.state.currentStepIndex = 0;
    this.state.isRunning = false;

    this.saveToStorage();
    this.notify();
  }

  /**
   * Move to the next step
   */
  async nextStep(): Promise<boolean> {
    if (!this.state.activeTour) return false;

    const currentStep = this.getCurrentStep();
    if (currentStep?.onHide) {
      await currentStep.onHide();
    }

    // Mark current step as completed
    const progress = this.state.progress[this.state.activeTour.id];
    if (currentStep && !progress.completedSteps.includes(currentStep.id)) {
      progress.completedSteps.push(currentStep.id);
    }

    const nextIndex = this.state.currentStepIndex + 1;

    if (nextIndex >= this.state.activeTour.steps.length) {
      // Tour completed
      progress.completedAt = Date.now();
      await this.stopTour();
      return false;
    }

    this.state.currentStepIndex = nextIndex;
    progress.currentStepIndex = nextIndex;

    // Handle step delay
    const nextStep = this.getCurrentStep();
    if (nextStep?.delay) {
      await new Promise(resolve => setTimeout(resolve, nextStep.delay));
    }

    if (nextStep?.onShow) {
      await nextStep.onShow();
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Move to the previous step
   */
  async prevStep(): Promise<boolean> {
    if (!this.state.activeTour || this.state.currentStepIndex <= 0) return false;

    const currentStep = this.getCurrentStep();
    if (currentStep?.onHide) {
      await currentStep.onHide();
    }

    this.state.currentStepIndex--;
    this.state.progress[this.state.activeTour.id].currentStepIndex = this.state.currentStepIndex;

    const prevStep = this.getCurrentStep();
    if (prevStep?.onShow) {
      await prevStep.onShow();
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Jump to a specific step by index
   */
  async goToStep(index: number): Promise<boolean> {
    if (!this.state.activeTour) return false;
    if (index < 0 || index >= this.state.activeTour.steps.length) return false;

    const currentStep = this.getCurrentStep();
    if (currentStep?.onHide) {
      await currentStep.onHide();
    }

    this.state.currentStepIndex = index;
    this.state.progress[this.state.activeTour.id].currentStepIndex = index;

    const newStep = this.getCurrentStep();
    if (newStep?.onShow) {
      await newStep.onShow();
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Get the current step
   */
  getCurrentStep(): TourStep | null {
    if (!this.state.activeTour) return null;
    return this.state.activeTour.steps[this.state.currentStepIndex] || null;
  }

  /**
   * Get the target element for the current step
   */
  getTargetElement(): HTMLElement | null {
    const step = this.getCurrentStep();
    if (!step) return null;

    if (typeof step.target === 'function') {
      return step.target();
    }

    return document.querySelector(step.target);
  }

  /**
   * Check if a tour is completed
   */
  isTourCompleted(tourId: string): boolean {
    return !!this.state.progress[tourId]?.completedAt;
  }

  /**
   * Check if a tour was skipped
   */
  isTourSkipped(tourId: string): boolean {
    return !!this.state.progress[tourId]?.skipped;
  }

  /**
   * Get progress percentage for a tour
   */
  getTourProgress(tourId: string): number {
    const tour = this.registeredTours.get(tourId);
    const progress = this.state.progress[tourId];

    if (!tour || !progress) return 0;
    if (progress.completedAt) return 100;

    return Math.round((progress.completedSteps.length / tour.steps.length) * 100);
  }

  /**
   * Unlock a feature for progressive disclosure
   */
  unlockFeature(featureId: string): void {
    this.state.unlockedFeatures.add(featureId);
    this.saveToStorage();
    this.notify();
  }

  /**
   * Check if a feature is unlocked
   */
  isFeatureUnlocked(featureId: string): boolean {
    return this.state.unlockedFeatures.has(featureId);
  }

  /**
   * Get all unlocked features
   */
  getUnlockedFeatures(): string[] {
    return Array.from(this.state.unlockedFeatures);
  }

  /**
   * Reset progress for a specific tour
   */
  resetTourProgress(tourId: string): void {
    delete this.state.progress[tourId];
    this.saveToStorage();
    this.notify();
  }

  /**
   * Reset all tutorial progress
   */
  resetAllProgress(): void {
    this.state.progress = {};
    this.state.unlockedFeatures = new Set();
    this.saveToStorage();
    this.notify();
  }

  /**
   * Get the current engine state
   */
  getState(): TourEngineState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: TourEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get suggested tours based on completion status
   */
  getSuggestedTours(): Tour[] {
    const tours = this.getTours();

    return tours
      .filter(tour => {
        // Not completed and not skipped
        if (this.isTourCompleted(tour.id) || this.isTourSkipped(tour.id)) {
          return false;
        }

        // Prerequisites met
        if (tour.prerequisites) {
          return tour.prerequisites.every(prereqId => this.isTourCompleted(prereqId));
        }

        return true;
      })
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }
}

// Singleton instance
export const TourEngine = new TourEngineImpl();

// Export types for external use
export type { TourEngineImpl };
