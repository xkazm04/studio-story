import { useCallback } from 'react';
import { BeatTableItem } from './BeatsOverview';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useToast } from '@/app/components/UI/ToastContainer';
import { useUserSettingsStore } from '@/app/store/slices/userSettingsSlice';
import { triggerCheckboxConfetti, getCongratulationMessage } from '@/app/lib/celebration';

interface UseToggleBeatCompletionOptions {
  setBeats: React.Dispatch<React.SetStateAction<BeatTableItem[]>>;
  onSuccess?: () => void;
}

/**
 * Shared hook for toggling beat completion with optimistic update,
 * celebration on first completion, and consistent error handling.
 */
export function useToggleBeatCompletion({ setBeats, onSuccess }: UseToggleBeatCompletionOptions) {
  const { showToast } = useToast();
  const { celebrationsEnabled, isBeatCelebrated, markBeatCelebrated } = useUserSettingsStore();

  const toggleCompletion = useCallback(
    async (beat: BeatTableItem, checkboxEl?: HTMLElement | null) => {
      const newValue = !beat.completed;

      // Optimistic update
      setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, completed: newValue } : b)));

      try {
        await beatApi.editBeat(beat.id, 'completed', newValue);
        onSuccess?.();

        // Celebrate on first completion
        if (!beat.completed && newValue && celebrationsEnabled && !isBeatCelebrated(beat.id)) {
          if (checkboxEl) {
            triggerCheckboxConfetti(checkboxEl);
          }
          showToast(getCongratulationMessage(beat.name), 'success', 3000);
          markBeatCelebrated(beat.id);
        }
      } catch (error) {
        console.error('Failed to toggle completion:', error);
        // Revert optimistic update
        setBeats((prev) =>
          prev.map((b) => (b.id === beat.id ? { ...b, completed: !newValue } : b))
        );
        showToast('Failed to update beat completion', 'error');
      }
    },
    [setBeats, onSuccess, celebrationsEnabled, isBeatCelebrated, markBeatCelebrated, showToast]
  );

  return { toggleCompletion };
}
