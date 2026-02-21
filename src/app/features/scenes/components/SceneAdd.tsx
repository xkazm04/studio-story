'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { characterApi } from '@/app/api/characters';
import { SmartNameInput } from '@/app/components/UI/SmartNameInput';
import { NameSuggestion } from '@/app/types/NameSuggestion';
import { Button } from '@/app/components/UI/Button';

const SceneAdd: React.FC = () => {
  const { selectedProject, selectedAct } = useProjectStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sceneName, setSceneName] = useState('');
  const { data: scenes = [], refetch } = sceneApi.useScenesByProjectAndAct(
    selectedProject?.id || '',
    selectedAct?.id || '',
    !!selectedProject && !!selectedAct
  );
  const { data: characters = [] } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Build context for name suggestions
  const nameContext = useMemo(() => ({
    projectTitle: selectedProject?.name,
    projectDescription: selectedProject?.description,
    actName: selectedAct?.name,
    actDescription: selectedAct?.description,
    existingScenes: scenes.map(s => ({ title: s.name, location: s.location })),
    characters: characters.map(c => c.name),
    previousScene: scenes.length > 0 ? scenes[scenes.length - 1] : undefined,
  }), [selectedProject, selectedAct, scenes, characters]);

  const handleAddScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !selectedAct || !sceneName.trim()) return;
    if (scenes.length >= 10) return;

    try {
      await sceneApi.createScene({
        name: sceneName.trim(),
        project_id: selectedProject.id,
        act_id: selectedAct.id,
        order: scenes.length + 1,
      });
      setSceneName('');
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating scene:', error);
    }
  };

  if (!selectedProject || !selectedAct || scenes.length >= 10) {
    return null;
  }

  if (!isFormOpen) {
    return (
      <div className="flex justify-center py-3">
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-gray-300 transition-all group"
          title="Add Scene"
          data-testid="add-scene-btn"
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Add Scene</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 my-3 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
      <form onSubmit={handleAddScene} className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-300">New Scene</h4>
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(false);
              setSceneName('');
            }}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="close-scene-form-btn"
          >
            <X size={16} />
          </button>
        </div>

        <SmartNameInput
          entityType="scene"
          context={nameContext}
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
          onSuggestionSelect={(suggestion: NameSuggestion) => {
            setSceneName(suggestion.name);
          }}
          placeholder="Enter scene name or let AI suggest..."
          size="sm"
          enableSuggestions={true}
          data-testid="scene-name-input"
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!sceneName.trim()}
            data-testid="create-scene-btn"
          >
            Create
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsFormOpen(false);
              setSceneName('');
            }}
            data-testid="cancel-scene-btn"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SceneAdd;

