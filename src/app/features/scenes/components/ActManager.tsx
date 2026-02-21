'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { Act } from '@/app/types/Act';
import ActList from './ActList';
import ActTabButton from './ActTabButton';
import { useEventListenerGuard } from '@/app/hooks/useEventListenerGuard';
import EventListenerDebugPanel from '@/app/components/dev/EventListenerDebugPanel';

const ActManager: React.FC = () => {
  /**
   * Event Listener Guard Integration Pattern
   *
   * This hook tracks all event listeners added by this component and its children,
   * helping detect memory leaks during development.
   *
   * Integration checklist:
   * 1. Import useEventListenerGuard at the top of your component
   * 2. Call the hook early in component body with a descriptive component name
   * 3. Ensure all addEventListener calls have matching removeEventListener in cleanup
   * 4. Test by mounting/unmounting component and checking console for warnings
   *
   * Features:
   * - Automatic tracking of window/document event listeners
   * - Detailed console warnings when listeners aren't cleaned up
   * - Development-only (zero production overhead)
   * - Summary report on unmount showing cleanup percentage and suggestions
   */
  const listenerGuard = useEventListenerGuard('ActManager', {
    enabled: process.env.NODE_ENV !== 'production',
    warnOnUnmount: true,
    trackGlobalListeners: true,
  });

  const { selectedProject, selectedAct, setSelectedAct } = useProjectStore();
  const { data: acts = [], refetch, isLoading } = actApi.useProjectActs(
    selectedProject?.id || '',
    !!selectedProject
  );
  const { refetch: refetchScenes } = sceneApi.useScenesByProjectAndAct(
    selectedProject?.id || '',
    selectedAct?.id || '',
    !!selectedProject && !!selectedAct
  );

  const [error, setError] = useState<string | null>(null);
  const [showActsList, setShowActsList] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const actsListRef = useRef<HTMLDivElement>(null);

  // Get visible acts (show max 3)
  const getVisibleActs = () => {
    if (!acts || acts.length === 0) return [];
    if (acts.length <= 3) return acts;

    const selectedIndex = acts.findIndex((act: Act) => act.id === selectedAct?.id);
    
    if (selectedIndex === -1) return acts.slice(0, 3);
    if (selectedIndex === 0) return acts.slice(0, 3);
    if (selectedIndex === acts.length - 1) return acts.slice(-3);
    
    return [acts[selectedIndex - 1], acts[selectedIndex], acts[selectedIndex + 1]];
  };

  const visibleActs = getVisibleActs();
  const hasMoreActs = acts && acts.length > 3;

  const handleActChange = (act: Act) => {
    setSelectedAct(act);
    setError(null);
    setShowActsList(false);
    refetchScenes();
  };

  const handleAddAct = async () => {
    if (!selectedProject) return;

    setError(null);
    try {
      // Calculate the next order value
      const maxOrder = acts && acts.length > 0
        ? Math.max(...acts.map((act: Act) => act.order || 0))
        : -1;

      await actApi.createAct({
        name: `Act ${acts?.length ? acts.length + 1 : 1}`,
        project_id: selectedProject.id,
        description: '',
        order: maxOrder + 1,
      });
      refetch();
    } catch (err) {
      setError('Error creating new act. Please try again.');
      console.error('Error creating act:', err);
    }
  };

  // Set first act as selected when acts load
  useEffect(() => {
    if (acts && acts.length > 0 && !selectedAct) {
      handleActChange(acts[0]);
    }
  }, [acts, selectedAct]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showActsList &&
        actsListRef.current &&
        !actsListRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setShowActsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActsList]);

  // No acts state
  if ((!acts || acts.length === 0) && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center"
        data-testid="no-acts-state"
      >
        <p className="text-gray-400 font-medium mb-3">No acts available</p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          onClick={handleAddAct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          data-testid="create-first-act-btn"
        >
          <Plus size={16} />
          Create First Act
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="flex flex-col py-2" data-testid="act-manager">
        <div className="flex justify-center items-center relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              className="flex items-center justify-center gap-1.5 min-h-[40px] w-full"
              layout
            >
              {visibleActs.map((act: Act) => (
                <div key={act.id} className="flex items-center gap-2">
                  <ActTabButton act={act} onSelect={handleActChange} />
                  <div className="w-[1px] h-4 bg-gray-700" />
                </div>
              ))}

              {hasMoreActs && (
                <motion.div
                  ref={moreButtonRef}
                  className="inline-flex cursor-pointer px-3 py-2 rounded-md text-sm font-medium items-center gap-1 border border-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-300 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                  onClick={() => setShowActsList(!showActsList)}
                  data-testid="more-acts-btn"
                >
                  +{acts.length - visibleActs.length}
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', showActsList && 'rotate-180')}
                  />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
        )}

        {/* Acts List Dropdown */}
        <ActList
          showActsList={showActsList}
          setShowActsList={setShowActsList}
          moreButtonRef={moreButtonRef as React.RefObject<HTMLDivElement>}
          acts={acts}
          actsListRef={actsListRef as React.RefObject<HTMLDivElement>}
          onActChange={handleActChange}
          onRefetch={refetch}
        />
      </div>

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV !== 'production' && (
        <EventListenerDebugPanel
          guardResult={listenerGuard}
          componentName="ActManager"
        />
      )}
    </>
  );
};

export default ActManager;

