'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Film } from 'lucide-react';
import { CollapsibleSection } from '@/app/components/UI';
import SceneItem from './SceneItem';

interface Scene {
  id: string;
  name: string;
  description?: string;
  location?: string;
  order: number;
  act_id: string;
}

interface ActItemProps {
  act: {
    id: string;
    name: string;
    description?: string;
    order?: number;
  };
  actIndex: number;
  scenes: Scene[];
}

export default function ActItem({ act, actIndex, scenes }: ActItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedScenes = scenes
    .filter(scene => scene.act_id === act.id)
    .sort((a, b) => a.order - b.order);

  return (
    <CollapsibleSection
      title={`Act ${actIndex + 1}: ${act.name}`}
      icon={Film}
      iconColor="text-cyan-400"
      borderColor="blue"
      badge={`${sortedScenes.length} ${sortedScenes.length === 1 ? 'scene' : 'scenes'}`}
      defaultOpen={false}
      className="w-full"
    >
      {/* Act Description */}
      {act.description && (
        <div className="mb-3 pb-3 border-b border-gray-700/30">
          <p className="text-sm text-gray-300 leading-relaxed">{act.description}</p>
        </div>
      )}

      {/* Scenes List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Scenes</h4>
        {sortedScenes.length > 0 ? (
          <div className="space-y-1.5">
            {sortedScenes.map((scene, sceneIdx) => (
              <SceneItem
                key={scene.id}
                scene={scene}
                sceneNumber={`${actIndex + 1}.${sceneIdx + 1}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-2">No scenes in this act</p>
        )}
      </div>
    </CollapsibleSection>
  );
}

