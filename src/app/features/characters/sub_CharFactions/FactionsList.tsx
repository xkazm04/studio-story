/**
 * FactionsList - Grid display of faction cards
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { factionApi } from '@/app/api/factions';
import { Faction } from '@/app/types/Faction';
import FactionCard from './FactionCard';
import FactionDetails from './FactionDetails';
import CreateFactionForm from '../components/CreateFactionForm';

const FactionsList: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const { data: factions = [], isLoading, refetch } = factionApi.useFactions(
    selectedProject?.id || '',
    !!selectedProject
  );

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <div className="w-6 h-6 border-2 border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-slate-500">loading_factions...</span>
      </div>
    );
  }

  // Show faction details view
  if (selectedFaction) {
    return (
      <FactionDetails
        faction={selectedFaction}
        onBack={() => setSelectedFaction(null)}
        onUpdate={() => {
          refetch();
          const updated = factions.find(f => f.id === selectedFaction.id);
          if (updated) setSelectedFaction(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wide text-slate-300">// factions</h2>
          <p className="text-xs text-slate-500 mt-1">
            organize characters into groups and allegiances
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs
                     bg-cyan-600 hover:bg-cyan-500 text-white
                     transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">new_faction</span>
        </button>
      </div>

      {/* Factions Grid */}
      {factions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Shield className="w-10 h-10 text-slate-600" />
          <span className="font-mono text-xs text-slate-500">// no_factions_yet</span>
          <p className="text-xs text-slate-500 text-center max-w-md">
            create factions to organize characters into groups
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
          >
            create_first_faction
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {factions.map((faction, index) => (
              <motion.div
                key={faction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <FactionCard
                  faction={faction}
                  onSelect={setSelectedFaction}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Faction Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateFactionForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FactionsList;
