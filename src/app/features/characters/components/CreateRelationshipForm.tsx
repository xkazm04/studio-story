'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { relationshipApi } from '@/app/api/relationships';
import { characterApi } from '@/app/api/characters';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useAISuggestionStream } from '@/app/hooks/useAISuggestionStream';
import { AISuggestion } from '@/app/services/aiSuggestionService';
import AISuggestionSidebar from './AISuggestionSidebar';
import { IconButton } from '@/app/components/UI/Button';

interface CreateRelationshipFormProps {
  characterId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RELATIONSHIP_TYPES = [
  { value: 'positive', label: 'Positive', color: 'green' },
  { value: 'negative', label: 'Negative', color: 'red' },
  { value: 'neutral', label: 'Neutral', color: 'gray' },
  { value: 'complicated', label: 'Complicated', color: 'yellow' },
];

const CreateRelationshipForm: React.FC<CreateRelationshipFormProps> = ({
  characterId,
  onClose,
  onSuccess,
}) => {
  const { selectedProject } = useProjectStore();
  const { data: characters = [] } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );
  
  const [targetCharId, setTargetCharId] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [relType, setRelType] = useState<string>('positive');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter out the current character from the list
  const availableCharacters = characters.filter((char) => char.id !== characterId);

  // AI Suggestion Stream Hook
  const {
    suggestions,
    isLoading: isSuggestionsLoading,
    isStreaming,
    streamProgress,
    triggerSuggestions,
    clearSuggestions,
  } = useAISuggestionStream({
    projectId: selectedProject?.id || '',
    characterId,
    contextType: 'relationship',
    enabled: showSuggestions,
    debounceMs: 1500,
    minTextLength: 10,
  });

  // Trigger suggestions on description change
  useEffect(() => {
    if (showSuggestions && description.trim().length >= 10) {
      triggerSuggestions(description);
    }
  }, [description, showSuggestions, triggerSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCharId || !description.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await relationshipApi.createRelationship({
        character_a_id: characterId,
        character_b_id: targetCharId,
        description: description.trim(),
        event_date: eventDate || undefined,
        relationship_type: relType,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create relationship');
      console.error('Error creating relationship:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (description.trim().length === 0) {
      setDescription(suggestion.suggestion);
    } else {
      setDescription(prev => {
        const trimmed = prev.trim();
        return `${trimmed}\n\n${suggestion.suggestion}`;
      });
    }
  };

  const handleToggleSuggestions = () => {
    if (showSuggestions) {
      clearSuggestions();
    }
    setShowSuggestions(prev => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Create Relationship</h3>
          <div className="flex items-center gap-2">
            <IconButton
              icon={<Sparkles size={16} />}
              size="sm"
              variant={showSuggestions ? 'primary' : 'ghost'}
              onClick={handleToggleSuggestions}
              aria-label="Toggle AI suggestions"
              data-testid="toggle-relationship-suggestions-btn"
              className={showSuggestions ? 'animate-pulse' : ''}
            />
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="close-relationship-form-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Character Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character *
            </label>
            <select
              value={targetCharId}
              onChange={(e) => setTargetCharId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a character...</option>
              {availableCharacters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRelType(type.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    relType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Date (Optional)
            </label>
            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="e.g., Before the story, Act 1, etc."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship between these characters..."
              className="w-full min-h-[100px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !targetCharId || !description.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Relationship'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>

      {/* AI Suggestion Sidebar */}
      <AnimatePresence>
        {showSuggestions && (
          <AISuggestionSidebar
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            isStreaming={isStreaming}
            streamProgress={streamProgress}
            onApplySuggestion={handleApplySuggestion}
            onDismiss={handleToggleSuggestions}
            position="right"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreateRelationshipForm;

