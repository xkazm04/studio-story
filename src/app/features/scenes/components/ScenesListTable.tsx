'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { EditableDataTable, ColumnDefinition, RowAction } from '@/app/components/UI/EditableDataTable';
import { Scene } from '@/app/types/Scene';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { ConfirmationModal } from '@/app/components/UI/ConfirmationModal';
import { useToast } from '@/app/components/UI/ToastContainer';

interface ScenesListTableProps {
  scenes: Scene[];
  refetch: () => void;
}

export default function ScenesListTable({ scenes, refetch }: ScenesListTableProps) {
  const { selectedSceneId, setSelectedSceneId } = useProjectStore();
  const { showToast } = useToast();
  const [deleteModalScene, setDeleteModalScene] = useState<Scene | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo<ColumnDefinition<Scene>[]>(
    () => [
      {
        key: 'order',
        header: 'Order',
        width: 'w-16',
        editable: false,
        className: 'text-gray-400',
      },
      {
        key: 'name',
        header: 'Scene Name',
        width: 'flex-1',
        type: 'text',
        editable: true,
        className: 'font-medium',
        validate: (value: unknown) => {
          const strValue = String(value || '');
          if (!strValue || strValue.trim() === '') {
            return 'Scene name is required';
          }
          if (strValue.length > 50) {
            return 'Scene name must be 50 characters or less';
          }
          return null;
        },
      },
    ],
    []
  );

  const handleRowUpdate = async (scene: Scene, updates: Partial<Scene>) => {
    if (updates.name !== undefined && updates.name !== scene.name) {
      try {
        await sceneApi.renameScene(scene.id, updates.name);
        showToast('Scene renamed successfully', 'success');
        refetch();
      } catch (error) {
        console.error('Error renaming scene:', error);
        showToast('Failed to rename scene', 'error');
        throw error;
      }
    }
  };

  const handleRowDelete = async (scene: Scene) => {
    setDeleteModalScene(scene);
  };

  const confirmDelete = async () => {
    if (!deleteModalScene) return;

    setIsDeleting(true);
    try {
      await sceneApi.deleteScene(deleteModalScene.id);
      showToast('Scene deleted successfully', 'success');
      refetch();
      setDeleteModalScene(null);
    } catch (error) {
      console.error('Error deleting scene:', error);
      showToast('Failed to delete scene', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const actions = useMemo<RowAction<Scene>[]>(
    () => [
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: 'Delete scene',
        onClick: handleRowDelete,
        variant: 'danger',
      },
    ],
    []
  );

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const reorderedScenes = Array.from(scenes);
    const [movedScene] = reorderedScenes.splice(fromIndex, 1);
    reorderedScenes.splice(toIndex, 0, movedScene);

    try {
      await sceneApi.reorderScene(movedScene.id, toIndex + 1);
      refetch();
    } catch (error) {
      console.error('Error reordering scene:', error);
      showToast('Failed to reorder scenes', 'error');
    }
  };

  const handleRowClick = (scene: Scene) => {
    setSelectedSceneId(scene.id);
  };

  return (
    <>
      <EditableDataTable
        columns={columns}
        data={scenes}
        rowKey="id"
        onRowUpdate={handleRowUpdate}
        onRowDelete={handleRowDelete}
        actions={actions}
        draggable={true}
        onReorder={handleReorder}
        showIndex={false}
        showHeader={true}
        showFooter={false}
        emptyMessage="No scenes yet. Add your first scene below."
        loading={false}
        onRowClick={handleRowClick}
        highlightRow={(scene) => scene.id === selectedSceneId}
        rowClassName={(scene) =>
          scene.id === selectedSceneId
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }
        data-testid="scenes-list-table"
      />

      {/* Delete Confirmation Modal */}
      {deleteModalScene && (
        <ConfirmationModal
          isOpen={!!deleteModalScene}
          onClose={() => setDeleteModalScene(null)}
          onConfirm={confirmDelete}
          type="danger"
          title="Delete Scene"
          message={`Are you sure you want to delete "${deleteModalScene.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
