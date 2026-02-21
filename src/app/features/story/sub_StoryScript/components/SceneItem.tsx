'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface SceneItemProps {
  scene: Scene;
  sceneNumber: string;
}

export default function SceneItem({ scene, sceneNumber }: SceneItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-700/50 rounded bg-gray-900/30 hover:bg-gray-800/30 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xs font-mono text-gray-500 flex-shrink-0">
            {sceneNumber}
          </span>
          <span className="text-sm text-gray-200 truncate">{scene.name}</span>
          {scene.location && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                {scene.location}
              </span>
            </div>
          )}
        </div>
        {scene.description && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.15 }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </motion.div>
        )}
      </button>

      {/* Scene Description */}
      <AnimatePresence>
        {isExpanded && scene.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 border-t border-gray-700/30">
              <p className="text-xs text-gray-400 leading-relaxed">
                {scene.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

