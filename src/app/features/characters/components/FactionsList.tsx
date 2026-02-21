'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { factionApi } from '@/app/api/factions';
import { Faction } from '@/app/types/Faction';
import FactionCard from '../sub_CharFactions/FactionCard';
import DynamicComponentLoader from '@/app/components/UI/DynamicComponentLoader';
import SkeletonLoader from '@/app/components/UI/SkeletonLoader';

/**
 * Dynamic imports for heavy faction components:
 * - FactionDetails: Contains heavy media galleries and branding panels
 * - CreateFactionForm: Only loaded when user clicks "Create Faction"
 */

const FactionsList: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const { data: factions = [], isLoading } = factionApi.useFactions(
    selectedProject?.id || '',
    !!selectedProject
  );

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFactionId, setNewFactionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading factions...</div>
      </div>
    );
  }

  // Show faction details view with dynamic loading
  if (selectedFaction) {
    return (
      <DynamicComponentLoader
        importFn={() => import('../sub_CharFactions/FactionDetails')}
        componentProps={{
          faction: selectedFaction,
          onBack: () => setSelectedFaction(null),
          onUpdate: () => {
            // Update selected faction with fresh data from optimistic mutation
            const updated = factions.find(f => f.id === selectedFaction.id);
            if (updated) setSelectedFaction(updated);
          },
        }}
        moduleName="FactionDetails"
        preloadOnVisible
        loadingComponent={<SkeletonLoader variant="details" color="purple" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Factions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Organize characters into factions and groups
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={16} />
          New Faction
        </button>
      </div>

      {/* Factions Grid */}
      {factions.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 text-gray-400 mb-4">
            <Plus size={28} />
          </div>
          <h3 className="text-lg text-white mb-2">No factions yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Create factions to organize your characters into groups, organizations, or allegiances.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create First Faction
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {factions.map((faction) => (
              <FactionCard
                key={faction.id}
                faction={faction}
                onSelect={setSelectedFaction}
                isNew={faction.id === newFactionId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Faction Form Modal - Dynamically loaded */}
      <AnimatePresence>
        {showCreateForm && (
          <DynamicComponentLoader
            importFn={() => import('./CreateFactionForm')}
            componentProps={{
              onClose: () => setShowCreateForm(false),
              onSuccess: () => {
                // Optimistic mutation will handle query invalidation automatically
                setShowCreateForm(false);

                // Set the newly created faction ID for animation highlighting
                const latestFaction = factions[factions.length - 1];
                if (latestFaction) {
                  setNewFactionId(latestFaction.id);
                  // Clear the highlight after animation completes
                  setTimeout(() => setNewFactionId(null), 1500);
                }
              },
            }}
            moduleName="CreateFactionForm"
            loadingComponent={<SkeletonLoader variant="form" color="blue" />}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FactionsList;
