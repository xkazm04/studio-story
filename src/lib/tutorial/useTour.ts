/**
 * React hooks for the tutorial system
 */

import { useState, useEffect, useCallback } from 'react';
import { TourEngine, TourEngineState, Tour, TourStep } from './TourEngine';

/**
 * Hook to access and control the tour engine
 */
export function useTour() {
  const [state, setState] = useState<TourEngineState>(TourEngine.getState());

  useEffect(() => {
    const unsubscribe = TourEngine.subscribe(setState);
    return unsubscribe;
  }, []);

  const startTour = useCallback((tourId: string) => {
    return TourEngine.startTour(tourId);
  }, []);

  const stopTour = useCallback((markAsSkipped = false) => {
    return TourEngine.stopTour(markAsSkipped);
  }, []);

  const nextStep = useCallback(() => {
    return TourEngine.nextStep();
  }, []);

  const prevStep = useCallback(() => {
    return TourEngine.prevStep();
  }, []);

  const goToStep = useCallback((index: number) => {
    return TourEngine.goToStep(index);
  }, []);

  const getCurrentStep = useCallback(() => {
    return TourEngine.getCurrentStep();
  }, []);

  const getTargetElement = useCallback(() => {
    return TourEngine.getTargetElement();
  }, []);

  return {
    // State
    activeTour: state.activeTour,
    currentStepIndex: state.currentStepIndex,
    isRunning: state.isRunning,
    progress: state.progress,
    unlockedFeatures: state.unlockedFeatures,

    // Actions
    startTour,
    stopTour,
    nextStep,
    prevStep,
    goToStep,
    getCurrentStep,
    getTargetElement,

    // Progress queries
    isTourCompleted: TourEngine.isTourCompleted.bind(TourEngine),
    isTourSkipped: TourEngine.isTourSkipped.bind(TourEngine),
    getTourProgress: TourEngine.getTourProgress.bind(TourEngine),
    getSuggestedTours: TourEngine.getSuggestedTours.bind(TourEngine),

    // Feature disclosure
    isFeatureUnlocked: TourEngine.isFeatureUnlocked.bind(TourEngine),
    unlockFeature: TourEngine.unlockFeature.bind(TourEngine),
    getUnlockedFeatures: TourEngine.getUnlockedFeatures.bind(TourEngine),

    // Reset
    resetTourProgress: TourEngine.resetTourProgress.bind(TourEngine),
    resetAllProgress: TourEngine.resetAllProgress.bind(TourEngine),
  };
}

/**
 * Hook to register a tour on mount
 */
export function useRegisterTour(tour: Tour) {
  useEffect(() => {
    TourEngine.registerTour(tour);
    return () => TourEngine.unregisterTour(tour.id);
  }, [tour]);
}

/**
 * Hook for progressive feature disclosure
 */
export function useFeatureDisclosure(featureId: string) {
  const [isUnlocked, setIsUnlocked] = useState(TourEngine.isFeatureUnlocked(featureId));

  useEffect(() => {
    const unsubscribe = TourEngine.subscribe((state) => {
      setIsUnlocked(state.unlockedFeatures.has(featureId));
    });
    return unsubscribe;
  }, [featureId]);

  const unlock = useCallback(() => {
    TourEngine.unlockFeature(featureId);
  }, [featureId]);

  return { isUnlocked, unlock };
}

/**
 * Hook for getting target element position
 */
export function useTargetPosition() {
  const [position, setPosition] = useState<DOMRect | null>(null);
  const { isRunning, currentStepIndex, activeTour } = useTour();

  useEffect(() => {
    if (!isRunning) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = TourEngine.getTargetElement();
      if (element) {
        setPosition(element.getBoundingClientRect());
      } else {
        setPosition(null);
      }
    };

    // Initial position
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    // Poll for position changes (for dynamic content)
    const interval = setInterval(updatePosition, 100);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [isRunning, currentStepIndex, activeTour]);

  return position;
}
