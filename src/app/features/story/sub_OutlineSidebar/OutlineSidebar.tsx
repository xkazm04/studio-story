/**
 * OutlineSidebar Component
 * Hierarchical list of scenes with quick navigation and filtering
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { useSceneGraphStore } from '@/app/store/sceneGraphStore';
import { OutlineItem } from './components/OutlineItem';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Search,
  Filter,
  ChevronDown,
  Link2,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';

type FilterMode = 'all' | 'connected' | 'orphaned' | 'deadends';

const FILTER_OPTIONS: { value: FilterMode; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Scenes', icon: <Layers className="w-3 h-3" /> },
  { value: 'connected', label: 'Connected', icon: <Link2 className="w-3 h-3" /> },
  { value: 'orphaned', label: 'Orphaned', icon: <AlertTriangle className="w-3 h-3" /> },
  { value: 'deadends', label: 'Dead Ends', icon: <XCircle className="w-3 h-3" /> },
];

export default function OutlineSidebar() {
  const {
    scenes,
    currentSceneId,
    setCurrentSceneId,
    firstSceneId,
    addScene,
    choices,
  } = useSceneEditor();

  const { filterMode, setFilterMode, searchQuery, setSearchQuery } = useSceneGraphStore();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Compute scene relationships
  const sceneAnalysis = useMemo(() => {
    // Map of scene_id to target scene IDs (outgoing connections)
    const outgoingMap = new Map<string, Set<string>>();
    // Map of target_scene_id to source scene IDs (incoming connections)
    const incomingMap = new Map<string, Set<string>>();

    choices.forEach(c => {
      // Outgoing from scene_id
      const outgoing = outgoingMap.get(c.scene_id) || new Set();
      if (c.target_scene_id) outgoing.add(c.target_scene_id);
      outgoingMap.set(c.scene_id, outgoing);

      // Incoming to target_scene_id
      if (c.target_scene_id) {
        const incoming = incomingMap.get(c.target_scene_id) || new Set();
        incoming.add(c.scene_id);
        incomingMap.set(c.target_scene_id, incoming);
      }
    });

    // All target scene IDs
    const targetSceneIds = new Set(choices.map(c => c.target_scene_id).filter(Boolean) as string[]);

    // Orphaned: no incoming connections (except first scene)
    const orphanedSceneIds = new Set(
      scenes
        .filter(s => s.id !== firstSceneId && !targetSceneIds.has(s.id))
        .map(s => s.id)
    );

    // Dead ends: no outgoing choices
    const scenesWithChoices = new Set(choices.map(c => c.scene_id));
    const deadEndSceneIds = new Set(
      scenes
        .filter(s => !scenesWithChoices.has(s.id))
        .map(s => s.id)
    );

    // Connected: current scene + scenes one layer away (directly connected via choices)
    const getConnectedScenes = (sceneId: string | null): Set<string> => {
      const connected = new Set<string>();
      if (!sceneId) return connected;

      connected.add(sceneId);

      // Add outgoing connections (scenes this one leads to)
      const outgoing = outgoingMap.get(sceneId);
      if (outgoing) {
        outgoing.forEach(id => connected.add(id));
      }

      // Add incoming connections (scenes that lead here)
      const incoming = incomingMap.get(sceneId);
      if (incoming) {
        incoming.forEach(id => connected.add(id));
      }

      return connected;
    };

    // Choice count per scene
    const choiceCountMap = new Map<string, number>();
    choices.forEach(c => {
      const count = choiceCountMap.get(c.scene_id) || 0;
      choiceCountMap.set(c.scene_id, count + 1);
    });

    return {
      outgoingMap,
      incomingMap,
      orphanedSceneIds,
      deadEndSceneIds,
      choiceCountMap,
      getConnectedScenes,
    };
  }, [scenes, choices, firstSceneId]);

  // Filter scenes based on filter mode and search
  const filteredScenes = useMemo(() => {
    let filtered = [...scenes];

    // Apply filter mode
    switch (filterMode) {
      case 'connected':
        const connectedIds = sceneAnalysis.getConnectedScenes(currentSceneId);
        filtered = filtered.filter(s => connectedIds.has(s.id));
        break;
      case 'orphaned':
        filtered = filtered.filter(s => sceneAnalysis.orphanedSceneIds.has(s.id));
        break;
      case 'deadends':
        filtered = filtered.filter(s => sceneAnalysis.deadEndSceneIds.has(s.id));
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      );
    }

    // Sort: first scene at top, then by order
    return filtered.sort((a, b) => {
      if (a.id === firstSceneId) return -1;
      if (b.id === firstSceneId) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  }, [scenes, filterMode, searchQuery, currentSceneId, firstSceneId, sceneAnalysis]);

  const handleAddScene = useCallback(async () => {
    await addScene({
      id: crypto.randomUUID(),
      name: 'New Scene',
      project_id: '',
      act_id: '',
      order: scenes.length,
    });
  }, [addScene, scenes.length]);

  const selectedFilter = FILTER_OPTIONS.find(f => f.value === filterMode) || FILTER_OPTIONS[0];

  return (
    <div className="h-full flex flex-col bg-slate-900/95 border-r border-slate-800/70">
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="font-mono font-medium text-xs uppercase tracking-wide">// scenes</h2>
            <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-md font-mono border border-slate-700/50">
              {filteredScenes.length}/{scenes.length}
            </span>
          </div>

          <button
            onClick={handleAddScene}
            className={cn(
              'p-1.5 rounded-md border border-slate-700/50',
              'text-slate-400 hover:text-cyan-400 hover:bg-slate-800',
              'transition-colors'
            )}
            title="Add new scene"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search_scenes..."
            className={cn(
              'w-full pl-8 pr-3 py-1.5 text-xs rounded-md font-mono',
              'bg-slate-800/80 border border-slate-700/50',
              'text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'
            )}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative mt-2">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md font-mono',
              'bg-slate-800/80 border border-slate-700/50',
              'text-slate-300 hover:border-slate-600 transition-colors',
              filterMode !== 'all' && 'border-cyan-500/50 text-cyan-400'
            )}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3" />
              <span className="uppercase tracking-wide">{selectedFilter.label}</span>
            </div>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showFilterDropdown && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-10 w-full mt-1 py-1 bg-slate-800/95 border border-slate-700/70 rounded-md shadow-xl backdrop-blur-sm"
              >
                {FILTER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterMode(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left font-mono',
                      'hover:bg-slate-700/80 transition-colors',
                      filterMode === option.value ? 'text-cyan-400' : 'text-slate-300'
                    )}
                  >
                    {option.icon}
                    <span className="uppercase tracking-wide">{option.label}</span>
                    {option.value === 'orphaned' && sceneAnalysis.orphanedSceneIds.size > 0 && (
                      <span className="ml-auto text-amber-400 text-[10px] font-mono">
                        {sceneAnalysis.orphanedSceneIds.size}
                      </span>
                    )}
                    {option.value === 'deadends' && sceneAnalysis.deadEndSceneIds.size > 0 && (
                      <span className="ml-auto text-red-400 text-[10px] font-mono">
                        {sceneAnalysis.deadEndSceneIds.size}
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredScenes.map((scene) => (
            <motion.div
              key={scene.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <OutlineItem
                scene={scene}
                isSelected={scene.id === currentSceneId}
                isFirst={scene.id === firstSceneId}
                isOrphaned={sceneAnalysis.orphanedSceneIds.has(scene.id)}
                isDeadEnd={sceneAnalysis.deadEndSceneIds.has(scene.id)}
                choiceCount={sceneAnalysis.choiceCountMap.get(scene.id) || 0}
                onClick={() => setCurrentSceneId(scene.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredScenes.length === 0 && scenes.length > 0 && (
          <div className="py-8 text-center text-slate-500">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">No scenes match filters</p>
            <button
              onClick={() => {
                setFilterMode('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs text-cyan-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {scenes.length === 0 && (
          <div className="py-8 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">No scenes yet</p>
            <button
              onClick={handleAddScene}
              className="mt-2 text-xs text-cyan-400 hover:underline"
            >
              Create your first scene
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {scenes.length > 0 && (
        <div className="shrink-0 p-3 border-t border-slate-800/70 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 uppercase tracking-wide">
              <span>{scenes.length} scenes</span>
              <span>{choices.length} choices</span>
            </div>
            {(sceneAnalysis.orphanedSceneIds.size > 0 || sceneAnalysis.deadEndSceneIds.size > 0) && (
              <div className="flex items-center gap-2">
                {sceneAnalysis.orphanedSceneIds.size > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {sceneAnalysis.orphanedSceneIds.size}
                  </span>
                )}
                {sceneAnalysis.deadEndSceneIds.size > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3 h-3" />
                    {sceneAnalysis.deadEndSceneIds.size}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
