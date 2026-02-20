'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, Database, Users, FolderOpen } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCharacterStore } from '@/app/store/slices/characterSlice';

type StoreValue = string | number | boolean | null | undefined | object | unknown[];

interface StoreChange {
  timestamp: number;
  store: 'project' | 'character';
  key: string;
  oldValue: StoreValue;
  newValue: StoreValue;
}

interface StoreDevtoolsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * StoreDevtools - Visual Store State Debugger
 *
 * A development-only component that provides real-time visualization of
 * Zustand store state changes with animated transitions. Helps developers
 * understand store mutations without external tooling.
 *
 * Features:
 * - Real-time state tracking with change history
 * - Animated transitions for state changes
 * - Collapsible store sections
 * - Change diff visualization
 * - Performance metrics
 *
 * Usage:
 * <StoreDevtools isOpen={true} />
 */
type StoreState = Record<string, StoreValue | ((...args: unknown[]) => unknown)>;

// Helper to track store state changes
const detectStoreChanges = (
  currentState: StoreState,
  previousState: StoreState | null,
  storeName: 'project' | 'character'
): StoreChange[] => {
  if (!previousState) return [];

  const changes: StoreChange[] = [];
  Object.keys(currentState).forEach((key) => {
    if (typeof currentState[key] !== 'function') {
      const oldValue = previousState[key];
      const newValue = currentState[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          timestamp: Date.now(),
          store: storeName,
          key,
          oldValue: oldValue as StoreValue,
          newValue: newValue as StoreValue,
        });
      }
    }
  });
  return changes;
};

const StoreDevtools: React.FC<StoreDevtoolsProps> = ({ isOpen = false, onClose }) => {
  const [visible, setVisible] = useState(isOpen);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set(['project', 'character']));
  const [changeHistory, setChangeHistory] = useState<StoreChange[]>([]);
  const [maxHistory] = useState(50);
  const prevProjectState = useRef<StoreState | null>(null);
  const prevCharacterState = useRef<StoreState | null>(null);

  // Subscribe to store changes
  const projectState = useProjectStore() as unknown as StoreState;
  const characterState = useCharacterStore() as unknown as StoreState;

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  // Track project store changes
  useEffect(() => {
    const changes = detectStoreChanges(projectState, prevProjectState.current, 'project');
    if (changes.length > 0) {
      setChangeHistory((prev) => [...changes, ...prev].slice(0, maxHistory));
    }
    prevProjectState.current = { ...projectState };
  }, [projectState, maxHistory]);

  // Track character store changes
  useEffect(() => {
    const changes = detectStoreChanges(characterState, prevCharacterState.current, 'character');
    if (changes.length > 0) {
      setChangeHistory((prev) => [...changes, ...prev].slice(0, maxHistory));
    }
    prevCharacterState.current = { ...characterState };
  }, [characterState, maxHistory]);

  const toggleStore = (store: string) => {
    setExpandedStores((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(store)) {
        newSet.delete(store);
      } else {
        newSet.add(store);
      }
      return newSet;
    });
  };

  const renderValue = (value: StoreValue): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `Array(${value.length})`;
      return 'Object';
    }
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  };

  const getStoreIcon = (store: string) => {
    switch (store) {
      case 'project':
        return <FolderOpen size={16} className="text-blue-400" />;
      case 'character':
        return <Users size={16} className="text-purple-400" />;
      default:
        return <Database size={16} className="text-gray-400" />;
    }
  };

  // Reusable store section component
  const StoreSection: React.FC<{
    storeName: 'project' | 'character';
    storeState: StoreState;
    colorClass: string;
  }> = ({ storeName, storeState, colorClass }) => {
    const storeDisplayName = storeName.charAt(0).toUpperCase() + storeName.slice(1) + ' Store';
    const keyCount = Object.keys(storeState).filter((k) => typeof storeState[k] !== 'function').length;

    return (
      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleStore(storeName)}
          className="w-full flex items-center gap-2 p-3 hover:bg-gray-800 transition-colors"
        >
          {expandedStores.has(storeName) ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
          {getStoreIcon(storeName)}
          <span className="text-sm font-medium text-white">{storeDisplayName}</span>
          <span className="text-xs text-gray-500 ml-auto">{keyCount} keys</span>
        </button>
        <AnimatePresence>
          {expandedStores.has(storeName) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-3 space-y-1"
            >
              {Object.entries(storeState)
                .filter(([_, value]) => typeof value !== 'function')
                .map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className={`${colorClass} font-mono`}>{key}:</span>
                    <span className="text-gray-300 flex-1 break-all font-mono">
                      {renderValue(value as StoreValue)}
                    </span>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-4 top-20 w-96 max-h-[80vh] bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Store Devtools</h3>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">DEV</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Current State */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Current State
        </div>

        {/* Project Store */}
        <StoreSection
          storeName="project"
          storeState={projectState}
          colorClass="text-blue-300"
        />

        {/* Character Store */}
        <StoreSection
          storeName="character"
          storeState={characterState}
          colorClass="text-purple-300"
        />

        {/* Change History */}
        <div className="pt-3 border-t border-gray-700">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Recent Changes ({changeHistory.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {changeHistory.map((change, index) => (
                <motion.div
                  key={`${change.timestamp}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-gray-800/30 rounded p-2 text-xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStoreIcon(change.store)}
                    <span className="font-medium text-white">{change.key}</span>
                    <span className="text-gray-500 ml-auto">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-0.5 pl-6">
                    <div className="flex gap-2">
                      <span className="text-red-400">-</span>
                      <span className="text-gray-400 font-mono">{renderValue(change.oldValue)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-400">+</span>
                      <span className="text-gray-200 font-mono">{renderValue(change.newValue)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-700 p-3 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Total Changes: {changeHistory.length}</span>
          <button
            onClick={() => setChangeHistory([])}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StoreDevtools;
