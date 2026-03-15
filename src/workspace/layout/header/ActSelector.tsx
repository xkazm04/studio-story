'use client';

import React, { useEffect } from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { Act } from '@/app/types/Act';
import { useQueryClient } from '@tanstack/react-query';
import HeaderDropdown from './HeaderDropdown';

const ActSelector: React.FC = () => {
  const { selectedProject, selectedAct, setSelectedAct } = useProjectStore();
  const queryClient = useQueryClient();

  const { data: acts = [], refetch } = actApi.useProjectActs(
    selectedProject?.id || '',
    !!selectedProject
  );

  const { data: scenes = [] } = sceneApi.useProjectScenes(
    selectedProject?.id || '',
    !!selectedProject
  );

  const { data: beats = [] } = beatApi.useGetBeats(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Pre-select first act when none is selected
  useEffect(() => {
    if (acts && acts.length > 0 && !selectedAct) {
      setSelectedAct(acts[0]);
    }
  }, [acts, selectedAct, setSelectedAct]);

  const items = acts.map((act: Act) => {
    const actScenes = scenes.filter((s) => s.act_id === act.id);
    const actBeats = beats.filter((b) => b.act_id === act.id);
    
    const scenesWithContent = actScenes.filter(s => s.content || s.script || s.description).length;
    const progress = actScenes.length > 0 ? (scenesWithContent / actScenes.length) * 100 : 0;
    
    return {
      id: act.id,
      label: act.name,
      sublabel: act.description || undefined,
      suffix: (
        <div className="flex items-center gap-2">
          {actBeats.length > 0 && (
            <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
              {actBeats.length} beat{actBeats.length !== 1 ? 's' : ''}
            </span>
          )}
          {actScenes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                {actScenes.length} scene{actScenes.length !== 1 ? 's' : ''}
              </span>
              <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden flex" title={`${scenesWithContent} of ${actScenes.length} scenes have content`}>
                <div 
                  className="h-full bg-cyan-500/50 rounded-full transition-all" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  const handleCreateAct = async (name: string) => {
    if (!selectedProject) return;
    const maxOrder = acts.length > 0
      ? Math.max(...acts.map((act: Act) => act.order || 0))
      : -1;

    try {
      const newAct = await actApi.createAct({
        name,
        project_id: selectedProject.id,
        description: '',
        order: maxOrder + 1,
      });
      queryClient.invalidateQueries({ queryKey: ['acts', 'project', selectedProject.id] });
      await refetch();
      setSelectedAct(newAct);
    } catch (error) {
      console.error('Error creating act:', error);
    }
  };

  return (
    <HeaderDropdown
      triggerContent={
        <span className={`font-medium ${!selectedAct ? 'text-slate-400' : ''}`}>
          {selectedAct?.name || 'Select Act'}
        </span>
      }
      items={items}
      selectedId={selectedAct?.id}
      selectedItemClassName="bg-cyan-500/10 text-cyan-300"
      onSelect={(id) => {
        const act = acts.find((a: Act) => a.id === id);
        if (act) setSelectedAct(act);
      }}
      minWidth={280}
      createForm={{
        triggerLabel: 'New Act',
        placeholder: 'Act name...',
        accentColorClass: 'bg-cyan-600/80 hover:bg-cyan-600',
        onSubmit: handleCreateAct,
      }}
    />
  );
};

export default ActSelector;
