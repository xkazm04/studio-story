'use client';

import { useState } from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import AudioExtraction from './audio/AudioExtraction';
import ImageDatasets from './images/ImageDatasets';
import { Music, Image, Database } from 'lucide-react';

type DatasetTab = 'audio' | 'images';

const DatasetsFeature = () => {
  const { selectedProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<DatasetTab>('audio');

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project to manage datasets</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'audio' as const, label: 'Audio Extraction', icon: Music },
    { id: 'images' as const, label: 'Image Datasets', icon: Image },
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
                  ? 'bg-purple-900 text-white shadow-lg shadow-purple-500/30'
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
        {activeTab === 'audio' && <AudioExtraction projectId={selectedProject.id} />}
        {activeTab === 'images' && <ImageDatasets projectId={selectedProject.id} />}
      </div>
    </div>
  );
};

export default DatasetsFeature;
