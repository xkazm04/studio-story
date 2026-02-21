'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelRightOpen,
  PanelRightClose,
  Users,
  MapPin,
  BookOpen,
  Link2,
  History,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { PresenceTracker } from './PresenceTracker';
import { LocationReference, type LocationData, type SceneMetadata } from './LocationReference';
import type { Character, CharRelationship } from '@/app/types/Character';
import type { Scene } from '@/app/types/Scene';

interface ContextPanelProps {
  scene: Scene;
  content: string;
  characters: Character[];
  relationships?: CharRelationship[];
  scenes?: Scene[];
  isOpen: boolean;
  onToggle: () => void;
  onUpdateScene?: (updates: Partial<Scene>) => void;
  onNavigateToCharacter?: (characterId: string) => void;
  onNavigateToScene?: (sceneId: string) => void;
  className?: string;
}

interface SceneLink {
  sceneId: string;
  sceneName: string;
  type: 'previous' | 'next' | 'reference';
}

interface ContextHistory {
  timestamp: number;
  presentCharacters: string[];
  location?: string;
}

/**
 * ContextPanel - Smart context panel with character presence, location, and metadata
 */
export const ContextPanel: React.FC<ContextPanelProps> = ({
  scene,
  content,
  characters,
  relationships = [],
  scenes = [],
  isOpen,
  onToggle,
  onUpdateScene,
  onNavigateToCharacter,
  onNavigateToScene,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'presence' | 'location' | 'links' | 'history'>('presence');
  const [contextHistory, setContextHistory] = useState<ContextHistory[]>([]);

  // Parse location from scene
  const location: LocationData | undefined = useMemo(() => {
    if (!scene.location) return undefined;
    return {
      name: scene.location,
      description: scene.description,
    };
  }, [scene.location, scene.description]);

  // Parse metadata from scene (could be stored in a metadata field)
  const metadata: SceneMetadata = useMemo(() => {
    // For now, return empty metadata - this could be extended to parse from scene properties
    return {};
  }, []);

  // Find linked scenes
  const linkedScenes: SceneLink[] = useMemo(() => {
    const links: SceneLink[] = [];
    const currentIndex = scenes.findIndex(s => s.id === scene.id);

    // Previous scene
    if (currentIndex > 0) {
      links.push({
        sceneId: scenes[currentIndex - 1].id,
        sceneName: scenes[currentIndex - 1].name,
        type: 'previous',
      });
    }

    // Next scene
    if (currentIndex < scenes.length - 1 && currentIndex >= 0) {
      links.push({
        sceneId: scenes[currentIndex + 1].id,
        sceneName: scenes[currentIndex + 1].name,
        type: 'next',
      });
    }

    // Referenced scenes (mentioned by name in content)
    scenes.forEach(s => {
      if (s.id !== scene.id && content.toLowerCase().includes(s.name.toLowerCase())) {
        links.push({
          sceneId: s.id,
          sceneName: s.name,
          type: 'reference',
        });
      }
    });

    return links;
  }, [scenes, scene.id, content]);

  // Handle location update
  const handleLocationChange = useCallback((newLocation: LocationData) => {
    onUpdateScene?.({
      location: newLocation.name,
      description: newLocation.description,
    });
  }, [onUpdateScene]);

  // Handle metadata update
  const handleMetadataChange = useCallback((newMetadata: SceneMetadata) => {
    // Store metadata - could be extended with a dedicated metadata field
    console.log('Metadata updated:', newMetadata);
  }, []);

  // Add character mention to content
  const handleAddCharacter = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character && onUpdateScene) {
      const newContent = content ? `${content}\n\n${character.name}` : character.name;
      onUpdateScene({ content: newContent });
    }
  }, [characters, content, onUpdateScene]);

  // Record context snapshot
  const recordContextSnapshot = useCallback(() => {
    // This would typically be called when the scene content changes
    // For now, it's a manual action
  }, []);

  // Tab configuration
  const tabs = [
    { id: 'presence' as const, label: 'Characters', icon: Users },
    { id: 'location' as const, label: 'Setting', icon: MapPin },
    { id: 'links' as const, label: 'Links', icon: Link2 },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex flex-col items-center', className)}
      >
        <button
          onClick={onToggle}
          className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
          title="Open Context Panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'w-72 h-full flex flex-col bg-slate-900/80 border-l border-slate-800 backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Scene Context</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Close Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scene Info */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="text-xs font-medium text-slate-300 truncate">{scene.name || 'Untitled Scene'}</div>
        {scene.description && (
          <div className="text-[10px] text-slate-500 truncate mt-0.5">{scene.description}</div>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-2 py-1.5 border-b border-slate-800 flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {/* Presence Tab */}
          {activeTab === 'presence' && (
            <motion.div
              key="presence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PresenceTracker
                content={content}
                characters={characters}
                relationships={relationships}
                onCharacterClick={onNavigateToCharacter}
                onAddCharacter={handleAddCharacter}
              />
            </motion.div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LocationReference
                location={location}
                metadata={metadata}
                onLocationChange={handleLocationChange}
                onMetadataChange={handleMetadataChange}
              />
            </motion.div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <motion.div
              key="links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {linkedScenes.length === 0 ? (
                <div className="text-center py-6">
                  <Link2 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No linked scenes</p>
                </div>
              ) : (
                <>
                  {/* Previous/Next */}
                  {linkedScenes.filter(l => l.type === 'previous' || l.type === 'next').length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Sequence
                      </div>
                      {linkedScenes
                        .filter(l => l.type === 'previous' || l.type === 'next')
                        .map(link => (
                          <button
                            key={link.sceneId}
                            onClick={() => onNavigateToScene?.(link.sceneId)}
                            className="w-full flex items-center gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-left"
                          >
                            <div className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-medium',
                              link.type === 'previous' ? 'bg-slate-700 text-slate-300' : 'bg-cyan-500/20 text-cyan-300'
                            )}>
                              {link.type === 'previous' ? '← Prev' : 'Next →'}
                            </div>
                            <span className="text-xs text-slate-300 truncate">{link.sceneName}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Referenced */}
                  {linkedScenes.filter(l => l.type === 'reference').length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Referenced in Content
                      </div>
                      {linkedScenes
                        .filter(l => l.type === 'reference')
                        .map(link => (
                          <button
                            key={link.sceneId}
                            onClick={() => onNavigateToScene?.(link.sceneId)}
                            className="w-full flex items-center gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-left"
                          >
                            <Link2 className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-300 truncate">{link.sceneName}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {contextHistory.length === 0 ? (
                <div className="text-center py-6">
                  <History className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No history recorded</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Context snapshots will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contextHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg"
                    >
                      <div className="text-[10px] text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        {entry.presentCharacters.length} characters present
                      </div>
                      {entry.location && (
                        <div className="text-[10px] text-slate-500">@ {entry.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                size="xs"
                variant="secondary"
                onClick={recordContextSnapshot}
                className="w-full"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Record Snapshot
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - Quick Info */}
      <div className="shrink-0 px-3 py-2 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Info className="w-3 h-3" />
          <span>{content.length} chars • {content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ContextPanel;
