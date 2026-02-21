'use client';

import { useState } from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import VoiceList from './components/VoiceList';
import VoiceExtraction from './extraction/VoiceExtraction';
import ProductionPanel from './components/ProductionPanel';
import PerformancePanel from './components/PerformancePanel';
import AuditionPanel from './components/AuditionPanel';
import { Mic, Download, FileAudio, Sliders, Users } from 'lucide-react';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import { characterApi } from '@/app/hooks/integration/useCharacters';

type VoiceTab = 'voices' | 'extraction' | 'casting' | 'performance' | 'production';

const VoiceFeature = () => {
  const { selectedProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<VoiceTab>('voices');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();

  // Fetch data for production panel
  const { data: acts = [] } = actApi.useProjectActs(selectedProject?.id || '', !!selectedProject);
  const { data: scenes = [] } = sceneApi.useProjectScenes(selectedProject?.id || '', !!selectedProject);
  const { data: voices = [] } = useVoicesByProject(selectedProject?.id || '');
  const { data: characters = [] } = characterApi.useProjectCharacters(selectedProject?.id || '', !!selectedProject);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project to manage voices</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'voices' as const, label: 'Voices', icon: Mic },
    { id: 'extraction' as const, label: 'Voice Extraction', icon: Download },
    { id: 'casting' as const, label: 'Casting', icon: Users },
    { id: 'performance' as const, label: 'Performance', icon: Sliders },
    { id: 'production' as const, label: 'Production', icon: FileAudio },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 px-6 py-4 bg-gray-900 border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'voices' && <VoiceList projectId={selectedProject.id} />}
        {activeTab === 'extraction' && <VoiceExtraction projectId={selectedProject.id} />}
        {activeTab === 'casting' && (
          <AuditionPanel
            characters={characters}
            voices={voices}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onCastVoice={(characterId, voiceId) => {
              console.log(`Cast ${voiceId} for ${characterId}`);
            }}
          />
        )}
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'production' && (
          <ProductionPanel
            projectId={selectedProject.id}
            acts={acts}
            scenes={scenes}
            voices={voices}
            characters={characters}
          />
        )}
      </div>
    </div>
  );
};

export default VoiceFeature;
