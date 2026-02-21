'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Act } from '@/app/types/Act';
import { actApi } from '@/app/hooks/integration/useActs';
import { useProjectStore } from '@/app/store/slices/projectSlice';

interface ActListItemProps {
  act: Act;
  onSelect: (act: Act) => void;
  onRefetch: () => void;
}

const ActListItem: React.FC<ActListItemProps> = ({ act, onSelect, onRefetch }) => {
  const { selectedAct } = useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(act.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSelected = selectedAct?.id === act.id;

  const handleRename = async () => {
    if (!name.trim() || name === act.name) {
      setIsEditing(false);
      setName(act.name);
      return;
    }

    try {
      await actApi.renameAct(act.id, name);
      onRefetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming act:', error);
      setName(act.name);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${act.name}"? This will also delete all scenes in this act.`)) return;

    setIsDeleting(true);
    try {
      await actApi.deleteAct(act.id);
      onRefetch();
    } catch (error) {
      console.error('Error deleting act:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'group flex items-center justify-between p-3 rounded-lg mb-1 cursor-pointer transition-all',
        isSelected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800',
        isDeleting && 'opacity-50'
      )}
      onClick={() => !isEditing && onSelect(act)}
    >
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setName(act.name);
              }
            }}
            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleRename}
            className="p-1 hover:bg-gray-700 rounded text-green-500"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setName(act.name);
            }}
            className="p-1 hover:bg-gray-700 rounded text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium">{act.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className={cn(
                'p-1.5 rounded hover:bg-gray-700 transition-colors',
                isSelected ? 'text-white' : 'text-gray-400'
              )}
              title="Rename"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              className={cn(
                'p-1.5 rounded hover:bg-red-600 transition-colors',
                isSelected ? 'text-white' : 'text-gray-400'
              )}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ActListItem;

