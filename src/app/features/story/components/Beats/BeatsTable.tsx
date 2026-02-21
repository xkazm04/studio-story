'use client';

import { useMemo, useRef } from 'react';
import { Pencil, Trash2, Check } from 'lucide-react';
import { EditableDataTable, ColumnDefinition, RowAction } from '@/app/components/UI/EditableDataTable';
import { BeatTableItem } from './BeatsOverview';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { ConfirmationModal } from '@/app/components/UI/ConfirmationModal';
import { useToast } from '@/app/components/UI/ToastContainer';
import { useUserSettingsStore } from '@/app/store/slices/userSettingsSlice';
import { triggerCheckboxConfetti, getCongratulationMessage } from '@/app/lib/celebration';
import { useState } from 'react';
import BeatSceneSuggestions from './BeatSceneSuggestions';
import { BeatSceneSuggestion } from '@/app/types/Beat';
import { beatSceneMappingApi } from '@/app/hooks/integration/useBeatSceneMappings';
import { useProjectStore } from '@/app/store/projectStore';

interface BeatsTableProps {
  beats: BeatTableItem[];
  setBeats: React.Dispatch<React.SetStateAction<BeatTableItem[]>>;
  isReordering: boolean;
}

export default function BeatsTable({ beats, setBeats, isReordering }: BeatsTableProps) {
  const { showToast } = useToast();
  const { celebrationsEnabled, isBeatCelebrated, markBeatCelebrated } = useUserSettingsStore();
  const { selectedProject } = useProjectStore();
  const [deleteModalRow, setDeleteModalRow] = useState<BeatTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const checkboxRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const columns = useMemo<ColumnDefinition<BeatTableItem>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: 'w-1/6',
        type: 'text',
        editable: true,
        className: 'font-semibold',
        validate: (value) => {
          const strValue = String(value || '');
          if (!strValue || strValue.trim() === '') {
            return 'Name is required';
          }
          return null;
        },
      },
      {
        key: 'description',
        header: 'Description',
        width: 'flex-1',
        type: 'text',
        editable: true,
        className: 'text-xs text-gray-400',
        render: (value: unknown) => (value as string) || '-',
      },
      {
        key: 'type',
        header: 'Type',
        width: 'w-16',
        editable: false,
        className: 'capitalize text-gray-400',
      },
      {
        key: 'completed',
        header: 'Completed',
        width: 'w-24',
        type: 'boolean',
        editable: false,
        render: (value, row) => {
          const rowId = row.id;
          return (
            <div className="flex justify-end">
              <input
                ref={(el) => {
                  if (el) {
                    checkboxRefs.current.set(rowId, el);
                  } else {
                    checkboxRefs.current.delete(rowId);
                  }
                }}
                type="checkbox"
                checked={!!value}
                onChange={() => handleToggleCompletion(row)}
                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
                data-testid={`beat-completion-checkbox-${rowId}`}
              />
            </div>
          );
        },
      },
    ],
    []
  );

  const handleToggleCompletion = async (beat: BeatTableItem) => {
    const newValue = !beat.completed;
    const wasNotCompleted = !beat.completed;

    try {
      await beatApi.editBeat(beat.id, 'completed', newValue);
      setBeats((prev) =>
        prev.map((b) => (b.id === beat.id ? { ...b, completed: newValue } : b))
      );

      // Trigger celebration only on first completion
      if (wasNotCompleted && newValue && celebrationsEnabled && !isBeatCelebrated(beat.id)) {
        const checkboxEl = checkboxRefs.current.get(beat.id);
        if (checkboxEl) {
          triggerCheckboxConfetti(checkboxEl);
        }
        const message = getCongratulationMessage(beat.name);
        showToast(message, 'success', 3000);
        markBeatCelebrated(beat.id);
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      showToast('Failed to update beat completion', 'error');
    }
  };

  const handleRowUpdate = async (beat: BeatTableItem, updates: Partial<BeatTableItem>) => {
    const promises = [];

    if (updates.name !== undefined && updates.name !== beat.name) {
      promises.push(beatApi.editBeat(beat.id, 'name', updates.name));
    }
    if (updates.description !== undefined && updates.description !== beat.description) {
      promises.push(beatApi.editBeat(beat.id, 'description', updates.description || ''));
    }

    try {
      await Promise.all(promises);
      setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, ...updates } : b)));
      showToast('Beat updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update beat:', error);
      showToast('Failed to update beat', 'error');
      throw error;
    }
  };

  const handleRowDelete = async (beat: BeatTableItem) => {
    setDeleteModalRow(beat);
  };

  const confirmDelete = async () => {
    if (!deleteModalRow) return;

    setIsDeleting(true);
    try {
      await beatApi.deleteBeat(deleteModalRow.id);
      setBeats((prev) => prev.filter((b) => b.id !== deleteModalRow.id));
      showToast('Beat deleted successfully', 'success');
      setDeleteModalRow(null);
    } catch (error) {
      console.error('Failed to delete beat:', error);
      showToast('Failed to delete beat', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const actions = useMemo<RowAction<BeatTableItem>[]>(
    () => [
      {
        icon: <Pencil className="h-4 w-4" />,
        label: 'Edit beat',
        onClick: () => {}, // Handled by EditableRow internally
        variant: 'primary',
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: 'Delete beat',
        onClick: handleRowDelete,
        variant: 'danger',
      },
    ],
    []
  );

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const reorderedBeats = Array.from(beats);
    const [movedBeat] = reorderedBeats.splice(fromIndex, 1);
    reorderedBeats.splice(toIndex, 0, movedBeat);

    // Update order field for all affected beats
    const updatedBeats = reorderedBeats.map((beat, index) => ({
      ...beat,
      order: index,
    }));

    setBeats(updatedBeats);

    try {
      await Promise.all(
        updatedBeats.map((beat) => beatApi.editBeat(beat.id, 'order', beat.order || 0))
      );
    } catch (error) {
      console.error('Failed to update beat order:', error);
      showToast('Failed to reorder beats', 'error');
      // Revert on error
      setBeats(beats);
    }
  };

  return (
    <>
      <EditableDataTable
        columns={columns}
        data={beats}
        rowKey="id"
        onRowUpdate={handleRowUpdate}
        onRowDelete={handleRowDelete}
        actions={actions}
        draggable={true}
        onReorder={handleReorder}
        showIndex={true}
        indexHeader="#"
        showHeader={true}
        showFooter={false}
        emptyMessage="No beats available"
        loading={false}
        keyboardNavigation={true}
        undoable={false}
        data-testid="beats-table"
      />

      {/* Delete Confirmation Modal */}
      {deleteModalRow && (
        <ConfirmationModal
          isOpen={!!deleteModalRow}
          onClose={() => setDeleteModalRow(null)}
          onConfirm={confirmDelete}
          type="danger"
          title="Delete Beat"
          message={`Are you sure you want to delete "${deleteModalRow.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
