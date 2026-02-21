'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Info, Save } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { useQueryClient } from '@tanstack/react-query';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSaveStateBadge, PanelSectionTitle } from '../shared/PanelPrimitives';

interface SceneMetadataPanelProps {
  sceneId?: string;
  onClose?: () => void;
}

export default function SceneMetadataPanel({
  sceneId: propSceneId,
  onClose,
}: SceneMetadataPanelProps) {
  const { selectedScene } = useProjectStore();
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state with scene data
  useEffect(() => {
    if (scene) {
      setName(scene.name || '');
      setSaveState('idle');
    }
  }, [scene]);

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const timer = setTimeout(() => setSaveState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [saveState]);

  const isDirty = scene && name !== (scene.name || '');

  const handleSave = useCallback(async () => {
    if (!resolvedSceneId || !isDirty) return;
    setSaving(true);
    setSaveState('saving');
    try {
      await sceneApi.updateScene(resolvedSceneId, { name });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  }, [resolvedSceneId, name, isDirty, queryClient]);

  if (!resolvedSceneId) {
    return (
      <PanelFrame title="Scene Details" icon={Info} onClose={onClose} headerAccent="amber">
        <PanelEmptyState
          icon={Info}
          title="No scene selected"
          description="Pick a scene in the workspace to edit metadata."
        />
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title="Scene Details"
      icon={Info}
      onClose={onClose}
      headerAccent="amber"
      actions={
        <div className="flex items-center gap-1">
          <PanelSaveStateBadge state={isDirty ? 'dirty' : saveState} />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-amber-300 transition-colors hover:bg-amber-500/12 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="Save changes"
          >
            <span className="inline-flex items-center gap-1">
              <Save className="h-3 w-3" />
              Save
            </span>
          </button>
        </div>
      }
    >
      <div className="space-y-3 p-3">
        {/* Name */}
        <div>
          <PanelSectionTitle title="Name" subtitle="Display name used in the scene list and editor." className="mb-1.5" />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaveState('dirty');
            }}
            className="w-full rounded border border-slate-800/50 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 outline-none transition-colors focus:border-amber-500/40"
          />
        </div>

        {/* Scene info */}
        {scene && (
          <div className="space-y-1.5 border-t border-slate-800/50 pt-2">
            <PanelSectionTitle title="Info" subtitle="Read-only metadata from the current scene." className="mb-2" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600">Order</span>
              <span className="text-[10px] text-slate-400 font-mono">{scene.order ?? 'N/A'}</span>
            </div>
            {scene.act_id && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Act</span>
                <span className="max-w-30 truncate font-mono text-[10px] text-slate-400">{scene.act_id}</span>
              </div>
            )}
            {scene.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Created</span>
                <span className="text-[10px] text-slate-400">{new Date(scene.created_at).toLocaleDateString()}</span>
              </div>
            )}
            {scene.updated_at && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Updated</span>
                <span className="text-[10px] text-slate-400">{new Date(scene.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelFrame>
  );
}
