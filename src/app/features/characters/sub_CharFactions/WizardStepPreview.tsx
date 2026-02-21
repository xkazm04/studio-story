'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Edit,
  CheckCircle,
  Calendar,
  Award,
  BookOpen,
  Users,
  Palette,
  ChevronRight
} from 'lucide-react';
import { AIGeneratedFaction, FactionWizardResponse } from '@/app/types/Faction';
import { cn } from '@/app/lib/utils';

interface WizardStepPreviewProps {
  faction: AIGeneratedFaction;
  metadata: FactionWizardResponse['metadata'] | null;
  onEdit: () => void;
  onConfirm: () => void;
}

const WizardStepPreview: React.FC<WizardStepPreviewProps> = ({
  faction,
  metadata,
  onEdit,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lore' | 'timeline' | 'achievements'>('overview');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Preview Header */}
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-green-200">Faction Generated Successfully!</p>
            <p className="text-xs text-green-300/70 mt-1">
              Review the details below. You can go back to regenerate or proceed to create the faction.
            </p>
          </div>
        </div>
      </div>

      {/* Faction Preview Card */}
      <div className="p-5 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-start gap-4">
          {/* Faction Emblem Preview */}
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              backgroundColor: `${faction.branding.primary_color}20`,
              color: faction.branding.primary_color,
              border: `2px solid ${faction.branding.primary_color}40`,
            }}
          >
            {faction.name.charAt(0).toUpperCase()}
          </div>

          {/* Faction Info */}
          <div className="flex-1">
            <h4 className="text-xl font-bold text-white mb-1">{faction.name}</h4>
            <div className="inline-block px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 mb-2">
              {faction.type.charAt(0).toUpperCase() + faction.type.slice(1)}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{faction.description}</p>
          </div>
        </div>
      </div>

      {/* Branding Colors */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-gray-400" />
          <h5 className="text-sm font-semibold text-white">Faction Branding</h5>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <div
              className="w-full h-12 rounded-lg mb-2"
              style={{ backgroundColor: faction.branding.primary_color }}
            />
            <p className="text-xs text-gray-400 text-center">Primary</p>
            <p className="text-xs text-gray-500 text-center font-mono">{faction.branding.primary_color}</p>
          </div>
          <div className="flex-1">
            <div
              className="w-full h-12 rounded-lg mb-2"
              style={{ backgroundColor: faction.branding.secondary_color }}
            />
            <p className="text-xs text-gray-400 text-center">Secondary</p>
            <p className="text-xs text-gray-500 text-center font-mono">{faction.branding.secondary_color}</p>
          </div>
          <div className="flex-1">
            <div
              className="w-full h-12 rounded-lg mb-2"
              style={{ backgroundColor: faction.branding.accent_color }}
            />
            <p className="text-xs text-gray-400 text-center">Accent</p>
            <p className="text-xs text-gray-500 text-center font-mono">{faction.branding.accent_color}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'lore', label: 'Lore', icon: BookOpen },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'achievements', label: 'Achievements', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn('flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            )}
            data-testid={`preview-tab-${tab.id}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-gray-400" />
                <h5 className="text-sm font-semibold text-white">Member Archetypes</h5>
              </div>
              <div className="space-y-3">
                {faction.member_archetypes.map((archetype, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">{archetype.role}</p>
                    <p className="text-xs text-gray-400">{archetype.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h5 className="text-sm font-semibold text-white mb-2">Emblem Design Prompt</h5>
              <p className="text-xs text-gray-400 italic leading-relaxed">
                "{faction.emblem_design_prompt}"
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'lore' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {faction.lore.map((entry, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                    {entry.category}
                  </div>
                  <h5 className="text-sm font-semibold text-white">{entry.title}</h5>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{entry.content}</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {faction.timeline_events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  {idx < faction.timeline_events.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-700 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-500">{event.date}</p>
                      <div className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                        {event.event_type}
                      </div>
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">{event.title}</h5>
                    <p className="text-sm text-gray-400">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {faction.achievements.map((achievement, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                    <Award className="text-yellow-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-semibold text-white">{achievement.title}</h5>
                      <p className="text-xs text-gray-500">{achievement.earned_date}</p>
                    </div>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-500">
            Generated using {metadata.model_used} at {new Date(metadata.generated_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="edit-prompt-btn"
        >
          <Edit size={16} />
          Edit Prompt
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
          data-testid="confirm-preview-btn"
        >
          Continue to Create
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default WizardStepPreview;
