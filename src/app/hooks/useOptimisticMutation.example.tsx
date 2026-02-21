/**
 * useOptimisticMutation Hook - Usage Examples
 *
 * This file demonstrates various usage patterns for the enhanced
 * useOptimisticMutation hook with toast notifications and undo capability.
 */

import { useOptimisticMutation } from './useOptimisticMutation';
import { factionApi } from '@/app/api/factions';
import { characterApi } from '@/app/api/characters';

// ============================================================================
// Example 1: Basic Usage with Default Toast Notifications
// ============================================================================

function Example1_BasicUsage() {
  const { mutate, isLoading } = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string }) => {
      return await factionApi.createFaction(data);
    },
    affectedQueryKeys: [['factions', 'project-123']],
  });

  return (
    <button
      onClick={() => mutate({ name: 'New Faction', project_id: 'project-123' })}
      disabled={isLoading}
    >
      Create Faction
    </button>
  );
}

// ============================================================================
// Example 2: Custom Toast Message with Undo
// ============================================================================

function Example2_CustomToastMessage() {
  const { mutate, isLoading, undoAvailable } = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string; description?: string }) => {
      return await factionApi.createFaction(data);
    },
    affectedQueryKeys: [
      ['factions', 'project-123'],
      ['characters', 'project-123'],
    ],
    toastMessage: 'Creating your faction... (You can undo within 3 seconds)',
    enableUndo: true,
    onSuccess: (data) => {
      // Faction created successfully
    },
    onError: (error) => {
      // Failed to create faction
    },
  });

  return (
    <div>
      <button onClick={() => mutate({ name: 'Heroes Guild', project_id: 'project-123', description: 'A guild of heroes' })}>
        Create Faction
      </button>
      {undoAvailable && (
        <div className="text-xs text-yellow-400 mt-2">
          Undo available - check the toast notification in the top-right
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Disable Toast Notifications
// ============================================================================

function Example3_NoToast() {
  const { mutate, isLoading, isError, error } = useOptimisticMutation({
    mutationFn: async (id: string) => {
      return await factionApi.deleteFaction(id);
    },
    affectedQueryKeys: [['factions', 'project-123']],
    showToast: false, // No toast notifications
    onSuccess: () => {
      alert('Faction deleted successfully'); // Custom notification
    },
  });

  return (
    <div>
      <button onClick={() => mutate('faction-id-123')}>
        Delete Faction (No Toast)
      </button>
      {isError && error && (
        <div className="text-red-500">Error: {error.message}</div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Manual Undo Control
// ============================================================================

function Example4_ManualUndo() {
  const { mutate, isLoading, undoAvailable, manualUndo } = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string; type?: string; faction_id?: string }) => {
      return await characterApi.createCharacter(data);
    },
    affectedQueryKeys: [['characters', 'project-123']],
    toastMessage: 'Creating character...',
    enableUndo: true,
  });

  const handleCreate = () => {
    mutate({ name: 'Aragorn', project_id: 'project-123' });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Create Character
      </button>

      {/* Custom undo button in your UI (in addition to toast undo) */}
      {undoAvailable && (
        <button
          onClick={manualUndo}
          className="px-4 py-2 bg-yellow-600 text-white rounded"
        >
          Undo Last Action
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Complex Mutation with Multiple Affected Queries
// ============================================================================

function Example5_ComplexMutation() {
  const { mutate, isLoading, rollbackError } = useOptimisticMutation({
    mutationFn: async (data: {
      characterId: string;
      factionId: string;
    }) => {
      // Complex operation that affects multiple entities
      const character = await characterApi.updateCharacter(data.characterId, {
        faction_id: data.factionId,
      });

      // Additional side effects...
      return character;
    },
    affectedQueryKeys: [
      ['characters', 'project-123'],
      ['characters', 'detail', 'char-456'],
      ['factions', 'project-123'],
      ['factions', 'detail', 'faction-789'],
      ['relationships', 'project-123'],
    ],
    toastMessage: 'Assigning character to faction...',
    enableUndo: true,
    onSuccess: () => {
      // Character successfully assigned to faction
    },
  });

  return (
    <div>
      <button
        onClick={() => mutate({
          characterId: 'char-456',
          factionId: 'faction-789'
        })}
        disabled={isLoading}
      >
        Assign to Faction
      </button>

      {/* Show rollback error if it occurred */}
      {rollbackError && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
          {rollbackError}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Disable Optimistic Updates but Keep Toast
// ============================================================================

function Example6_NoOptimisticUpdate() {
  const { mutate, isLoading } = useOptimisticMutation({
    mutationFn: async (id: string) => {
      // Critical operation - wait for confirmation
      return await characterApi.deleteCharacter(id);
    },
    affectedQueryKeys: [['characters', 'project-123']],
    enableOptimisticUpdate: false, // Wait for server confirmation
    showToast: true,                // Still show toast notifications
    enableUndo: false,              // No undo needed (no optimistic update)
    toastMessage: 'Deleting character...',
  });

  return (
    <button onClick={() => mutate('char-123')}>
      Delete Character (Wait for Confirmation)
    </button>
  );
}

// ============================================================================
// Example 7: Form Integration with Real-time Feedback
// ============================================================================

function Example7_FormIntegration() {
  const { mutate, isLoading, isError, error, undoAvailable, rollbackError } = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string; description?: string }) => {
      return await factionApi.createFaction(data);
    },
    affectedQueryKeys: [['factions', 'project-123']],
    toastMessage: 'Creating faction...',
    enableUndo: true,
    onSuccess: () => {
      // Reset form or close modal
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutate({
      name: formData.get('name') as string,
      project_id: 'project-123',
      description: formData.get('description') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        placeholder="Faction Name"
        required
        disabled={isLoading}
      />
      <textarea
        name="description"
        placeholder="Description"
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Faction'}
      </button>

      {isError && error && (
        <div className="text-red-500 text-sm">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {rollbackError && (
        <div className="text-orange-500 text-sm">
          {rollbackError}
        </div>
      )}

      {undoAvailable && (
        <div className="text-blue-400 text-sm">
          Check the toast notification to undo this action
        </div>
      )}
    </form>
  );
}

// ============================================================================
// Example 8: Async/Await Pattern
// ============================================================================

async function Example8_AsyncAwait() {
  const { mutateAsync } = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string }) => {
      return await factionApi.createFaction(data);
    },
    affectedQueryKeys: [['factions', 'project-123']],
  });

  try {
    const result = await mutateAsync({ name: 'New Faction', project_id: 'project-123' });
    // Created faction successfully

    // Continue with dependent operations
    // const relatedData = await someOtherOperation(result.id);

    return { result };
  } catch (error) {
    // Failed to create faction
    throw error;
  }
}

// ============================================================================
// Example 9: Sequential Mutations with Toast
// ============================================================================

function Example9_SequentialMutations() {
  const createFaction = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string }) => {
      return await factionApi.createFaction(data);
    },
    affectedQueryKeys: [['factions', 'project-123']],
    toastMessage: 'Creating faction...',
  });

  const createCharacter = useOptimisticMutation({
    mutationFn: async (data: { name: string; project_id: string; type?: string; faction_id?: string }) => {
      return await characterApi.createCharacter(data);
    },
    affectedQueryKeys: [['characters', 'project-123']],
    toastMessage: 'Creating character...',
  });

  const handleCreateBoth = async () => {
    try {
      // Create faction first
      const faction = await createFaction.mutateAsync({ name: 'New Guild', project_id: 'project-123' });

      // Then create character in that faction
      const character = await createCharacter.mutateAsync({
        name: 'Guild Leader',
        project_id: 'project-123',
        faction_id: faction.id,
      });

      // Created both successfully
    } catch (error) {
      // Failed to create
    }
  };

  return (
    <button onClick={handleCreateBoth}>
      Create Faction + Character
    </button>
  );
}

// ============================================================================
// Integration Notes
// ============================================================================

/*
 * IMPORTANT: To use toast notifications, wrap your app with ToastProvider:
 *
 * // app/layout.tsx
 * import { ToastProvider } from '@/app/components/UI/OptimisticToastContext';
 * import OptimisticToast from '@/app/components/UI/OptimisticToast';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <ToastProvider>
 *           {children}
 *           <OptimisticToast />
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * The hook will work without ToastProvider, but toast notifications
 * will be disabled (graceful degradation).
 */

export {
  Example1_BasicUsage,
  Example2_CustomToastMessage,
  Example3_NoToast,
  Example4_ManualUndo,
  Example5_ComplexMutation,
  Example6_NoOptimisticUpdate,
  Example7_FormIntegration,
  Example8_AsyncAwait,
  Example9_SequentialMutations,
};
