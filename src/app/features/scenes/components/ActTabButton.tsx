'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { Act } from '@/app/types/Act';
import { useProjectStore } from '@/app/store/slices/projectSlice';

interface ActTabButtonProps {
  act: Act;
  onSelect: (act: Act) => void;
}

const ActTabButton: React.FC<ActTabButtonProps> = ({ act, onSelect }) => {
  const { selectedAct } = useProjectStore();
  const isSelected = selectedAct?.id === act.id;

  return (
    <motion.button
      onClick={() => onSelect(act)}
      className={cn(
        'relative px-4 py-2 rounded-lg text-sm font-medium transition-all',
        isSelected
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      {act.name}
    </motion.button>
  );
};

export default ActTabButton;

