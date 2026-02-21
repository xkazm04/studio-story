'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { AIGeneratedFaction } from '@/app/types/Faction';
import { factionApi } from '@/app/api/factions';
import { useOptimisticMutation } from '@/app/hooks/useOptimisticMutation';

interface WizardStepConfirmProps {
  faction: AIGeneratedFaction;
  projectId: string;
  onBack: () => void;
  onSuccess: () => void;
}

const WizardStepConfirm: React.FC<WizardStepConfirmProps> = ({
  faction,
  projectId,
  onBack,
  onSuccess,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    setCreationProgress([]);

    try {
      // Step 1: Create base faction
      setCreationProgress(prev => [...prev, 'Creating faction profile...']);
      const newFaction = await factionApi.createFaction({
        name: faction.name,
        description: faction.description,
        project_id: projectId,
      });

      if (!newFaction.id) {
        throw new Error('Failed to create faction');
      }

      // Step 2: Update branding
      setCreationProgress(prev => [...prev, 'Applying branding and colors...']);
      await factionApi.updateFaction(newFaction.id, {
        color: faction.branding.primary_color,
        branding: {
          primary_color: faction.branding.primary_color,
          secondary_color: faction.branding.secondary_color,
          accent_color: faction.branding.accent_color,
          emblem_style: faction.branding.emblem_style,
          banner_template: faction.branding.banner_template,
          theme_tier: 'free',
        },
      });

      // Step 3: Create lore entries
      setCreationProgress(prev => [...prev, `Creating ${faction.lore.length} lore entries...`]);
      for (const loreEntry of faction.lore) {
        await factionApi.createFactionLore({
          faction_id: newFaction.id,
          title: loreEntry.title,
          content: loreEntry.content,
          category: loreEntry.category,
          created_at: new Date().toISOString(),
          updated_by: 'ai-wizard',
        });
      }

      // Step 4: Create timeline events
      setCreationProgress(prev => [...prev, `Creating ${faction.timeline_events.length} timeline events...`]);
      for (const event of faction.timeline_events) {
        await factionApi.createFactionEvent({
          faction_id: newFaction.id,
          title: event.title,
          description: event.description,
          date: event.date,
          event_type: event.event_type,
          created_by: 'ai-wizard',
        });
      }

      // Step 5: Create achievements
      setCreationProgress(prev => [...prev, `Creating ${faction.achievements.length} achievements...`]);
      for (const achievement of faction.achievements) {
        await factionApi.createFactionAchievement({
          faction_id: newFaction.id,
          title: achievement.title,
          description: achievement.description,
          earned_date: achievement.earned_date,
          members: [],
        });
      }

      setCreationProgress(prev => [...prev, 'Faction created successfully!']);

      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess();
    } catch (err) {
      console.error('Error creating faction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create faction');
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Confirmation Header */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          Ready to create your faction? This will save the faction profile along with all generated
          lore, timeline events, and achievements to your project.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Failed to create faction</div>
            <div className="text-xs text-red-300 mt-1">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="p-5 bg-gray-800 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">What will be created:</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-purple-400" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Faction Profile</p>
              <p className="text-xs text-gray-400">{faction.name} - {faction.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-purple-400" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Branding & Colors</p>
              <p className="text-xs text-gray-400">
                Custom color scheme and emblem style
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-purple-400" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Lore Entries</p>
              <p className="text-xs text-gray-400">{faction.lore.length} entries covering history and culture</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-purple-400" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Timeline Events</p>
              <p className="text-xs text-gray-400">{faction.timeline_events.length} key moments in faction history</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-purple-400" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Achievements</p>
              <p className="text-xs text-gray-400">{faction.achievements.length} notable accomplishments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Progress */}
      {isCreating && creationProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="text-purple-400 animate-spin" size={20} />
            <p className="text-sm font-medium text-white">Creating faction...</p>
          </div>
          <div className="space-y-2">
            {creationProgress.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs text-gray-400"
              >
                <CheckCircle2 size={12} className="text-green-400" />
                {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="back-to-preview-btn"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all"
          data-testid="create-faction-btn"
        >
          {isCreating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating Faction...
            </>
          ) : (
            <>
              <Save size={16} />
              Create Faction
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default WizardStepConfirm;
