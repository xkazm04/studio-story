'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Act } from '@/app/types/Act';
import { actApi } from '@/app/hooks/integration/useActs';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import ActListItem from './ActListItem';

interface ActListProps {
  showActsList: boolean;
  setShowActsList: (show: boolean) => void;
  moreButtonRef: React.RefObject<HTMLDivElement>;
  acts: Act[];
  actsListRef: React.RefObject<HTMLDivElement>;
  onActChange: (act: Act) => void;
  onRefetch: () => void;
}

const ActList: React.FC<ActListProps> = ({
  showActsList,
  setShowActsList,
  moreButtonRef,
  acts,
  actsListRef,
  onActChange,
  onRefetch,
}) => {
  const { selectedProject } = useProjectStore();

  const handleAddAct = async () => {
    if (!selectedProject) return;

    try {
      await actApi.createAct({
        name: `Act ${acts?.length ? acts.length + 1 : 1}`,
        project_id: selectedProject.id,
        description: '',
      });
      onRefetch();
    } catch (error) {
      console.error('Error creating act:', error);
    }
  };

  if (!showActsList) return null;

  const ActListComponent = () => (
    <motion.div
      ref={actsListRef}
      className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 min-w-[300px] max-h-[400px] overflow-y-auto"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-800 sticky top-0 z-10">
        <span className="text-sm font-semibold text-white">Project Acts</span>
        <div className="flex gap-2">
          <button
            onClick={handleAddAct}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Add Act"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setShowActsList(false)}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-2">
        <AnimatePresence>
          {acts && acts.map((act: Act) => (
            <ActListItem key={act.id} act={act} onSelect={onActChange} onRefetch={onRefetch} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return createPortal(
    <div
      className="fixed z-50"
      style={{
        top: (moreButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 5,
        left: (moreButtonRef.current?.getBoundingClientRect().left ?? 0) - 75,
      }}
    >
      <ActListComponent />
    </div>,
    document.body
  );
};

export default ActList;

