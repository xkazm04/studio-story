import confetti from 'canvas-confetti';

/**
 * Celebration utility for triggering confetti and animations
 * when users complete tasks or reach milestones.
 */

interface CelebrationOptions {
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

/**
 * Triggers a gentle confetti burst at a specific position
 * @param options - Confetti customization options
 */
export const triggerConfetti = (options: CelebrationOptions = {}) => {
  const {
    duration = 1500,
    particleCount = 50,
    spread = 70,
    origin = { x: 0.5, y: 0.5 }
  } = options;

  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleRatio = particleCount / 100;

    confetti({
      ...defaults,
      particleCount: Math.floor(particleRatio * 15),
      origin: { x: randomInRange(origin.x - 0.1, origin.x + 0.1), y: origin.y },
      colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    });
  }, 150);
};

/**
 * Triggers confetti at checkbox position
 * @param element - The checkbox element that was clicked
 */
export const triggerCheckboxConfetti = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  triggerConfetti({
    duration: 1200,
    particleCount: 40,
    spread: 60,
    origin: { x, y }
  });
};

/**
 * CSS class for checkmark animation
 * Add this class to trigger the animation
 */
export const CHECKMARK_ANIMATION_CLASS = 'celebrate-checkmark';

/**
 * Get congratulatory message based on beat completion
 * @param beatName - Name of the completed beat
 * @returns A personalized congratulatory message
 */
export const getCongratulationMessage = (beatName: string): string => {
  const messages = [
    `Great work on "${beatName}"!`,
    `"${beatName}" is complete! 🎉`,
    `Well done! "${beatName}" finished!`,
    `Nice! "${beatName}" checked off!`,
    `Achievement unlocked: "${beatName}"!`,
    `"${beatName}" conquered! Keep going!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};
