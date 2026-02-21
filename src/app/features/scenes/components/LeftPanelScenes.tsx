'use client';

import React from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import ActManager from './ActManager';
import ScenesList from './ScenesList';
import SceneAdd from './SceneAdd';

/**
 * LeftPanelScenes Component
 *
 * This component manages the left panel navigation for acts and scenes.
 * It displays:
 * - ActManager: Horizontal tabs for switching between acts
 * - ScenesList: Drag-and-drop list of scenes for the selected act
 * - SceneAdd: Button to add new scenes (shown only when act is selected)
 */
const LeftPanelScenes: React.FC = () => {
  const { selectedProject, selectedAct } = useProjectStore();

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No project selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Act Manager - Always visible when project is selected */}
      <ActManager />

      {/* Scenes List and Add Button - Only visible when act is selected */}
      {selectedAct && (
        <div className="flex flex-col flex-1 justify-between space-y-4 overflow-hidden">
          {/* Scenes List with scroll */}
          <div className="flex-1 overflow-y-auto">
            <ScenesList />
          </div>

          {/* Add Scene Button */}
          <SceneAdd />
        </div>
      )}

      {/* No act selected state */}
      {!selectedAct && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center">
            Select or create an act to view scenes
          </p>
        </div>
      )}
    </div>
  );
};

export default LeftPanelScenes;
