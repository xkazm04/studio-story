'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Filter } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { relationshipApi } from '@/app/api/relationships';
import { characterApi } from '@/app/api/characters';
import { CharRelationship } from '@/app/types/Character';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import RelationshipCard from './RelationshipCard';
import CreateRelationshipForm from './CreateRelationshipForm';
import { useEventListenerGuard } from '@/app/hooks/useEventListenerGuard';
import EventListenerDebugPanel from '@/app/components/dev/EventListenerDebugPanel';

interface CharacterRelationshipsProps {
  characterId: string;
}

const CharacterRelationships: React.FC<CharacterRelationshipsProps> = ({
  characterId,
}) => {
  /**
   * Event Listener Guard Integration Pattern
   *
   * This component uses React Query hooks (relationshipApi.useCharacterRelationships,
   * characterApi.useProjectCharacters) which may attach network listeners.
   * The guard helps verify these are properly cleaned up.
   *
   * React Query best practices:
   * - React Query handles its own cleanup automatically via AbortController
   * - The 'enabled' flag ensures queries don't run when dependencies are missing
   * - staleTime prevents unnecessary refetches and reduces listener churn
   *
   * When to use this pattern:
   * - Components with React Query hooks
   * - Components with window/document event listeners
   * - Parent components that need to monitor child listener behavior
   */
  const listenerGuard = useEventListenerGuard('CharacterRelationships', {
    enabled: process.env.NODE_ENV !== 'production',
    warnOnUnmount: true,
    trackGlobalListeners: true,
  });

  const { selectedProject } = useProjectStore();
  const { data: relationships = [], refetch, isLoading } = relationshipApi.useCharacterRelationships(characterId);
  const { data: characters = [] } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Filter relationships based on type
  const filteredRelationships =
    filter === 'all'
      ? relationships
      : relationships.filter((rel: CharRelationship) => rel.relationship_type === filter);

  // Get the other character in the relationship
  const getOtherCharacter = (relationship: CharRelationship) => {
    const otherCharId =
      relationship.character_a_id === characterId
        ? relationship.character_b_id
        : relationship.character_a_id;
    return characters.find((char) => char.id === otherCharId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Loading relationships...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Heart size={18} className="text-rose-500" />
              Character Relationships
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Define how this character relates to others in your story
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={16} />
            Add Relationship
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {['all', 'positive', 'negative', 'neutral', 'complicated'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type === 'all' && ` (${relationships.length})`}
            </button>
          ))}
        </div>

        {/* Relationships Grid */}
        {filteredRelationships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredRelationships.map((relationship: CharRelationship) => (
                <RelationshipCard
                  key={relationship.id}
                  relationship={relationship}
                  otherCharacter={getOtherCharacter(relationship)}
                  onDelete={refetch}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-800/50 text-gray-400 mb-4">
              <Heart size={28} />
            </div>
            <h4 className="text-lg text-white mb-2">
              {filter === 'all' ? 'No relationships yet' : `No ${filter} relationships`}
            </h4>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              {filter === 'all'
                ? 'Define how this character connects with others in your story by creating relationship events.'
                : `This character has no ${filter} relationships yet.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create First Relationship
              </button>
            )}
          </div>
        )}

        {/* Create Relationship Form Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <CreateRelationshipForm
              characterId={characterId}
              onClose={() => setShowCreateForm(false)}
              onSuccess={refetch}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV !== 'production' && (
        <EventListenerDebugPanel
          guardResult={listenerGuard}
          componentName="CharacterRelationships"
        />
      )}
    </>
  );
};

export default CharacterRelationships;

