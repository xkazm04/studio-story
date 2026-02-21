/**
 * PoseSelector - Choose character poses and angles for avatar generation
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides pose presets (portrait, action, sitting, etc.) and angle variations
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Swords,
  Armchair,
  Footprints,
  Camera,
  RotateCcw,
  Crown,
  Glasses,
  Hand,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Pose {
  id: string;
  name: string;
  label: string;
  description: string;
  promptModifier: string;
  icon: React.ReactNode;
  category: PoseCategory;
}

export interface Angle {
  id: string;
  name: string;
  label: string;
  promptModifier: string;
  visual: string; // Visual representation character
}

export type PoseCategory = 'portrait' | 'action' | 'casual' | 'dramatic';

export interface PoseSelectorProps {
  selectedPose: Pose | null;
  selectedAngle: Angle | null;
  onSelectPose: (pose: Pose | null) => void;
  onSelectAngle: (angle: Angle | null) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const POSE_PRESETS: Pose[] = [
  // Portrait poses
  {
    id: 'portrait_standard',
    name: 'Standard Portrait',
    label: 'portrait',
    description: 'Classic head and shoulders portrait composition',
    promptModifier: 'portrait composition, head and shoulders, centered framing',
    icon: <User size={16} />,
    category: 'portrait',
  },
  {
    id: 'portrait_bust',
    name: 'Bust Shot',
    label: 'bust',
    description: 'Chest up view showing upper body',
    promptModifier: 'bust shot composition, chest and head visible, upper body portrait',
    icon: <User size={16} />,
    category: 'portrait',
  },
  {
    id: 'portrait_close',
    name: 'Close-up',
    label: 'close_up',
    description: 'Detailed face close-up',
    promptModifier: 'close-up portrait, detailed face, intimate framing',
    icon: <Glasses size={16} />,
    category: 'portrait',
  },
  // Action poses
  {
    id: 'action_battle',
    name: 'Battle Ready',
    label: 'battle_ready',
    description: 'Combat stance with weapons drawn',
    promptModifier: 'dynamic battle stance, combat ready pose, weapons drawn, action pose',
    icon: <Swords size={16} />,
    category: 'action',
  },
  {
    id: 'action_heroic',
    name: 'Heroic Stance',
    label: 'heroic',
    description: 'Confident powerful standing pose',
    promptModifier: 'heroic standing pose, confident powerful stance, commanding presence',
    icon: <Crown size={16} />,
    category: 'action',
  },
  {
    id: 'action_dynamic',
    name: 'Dynamic Action',
    label: 'dynamic',
    description: 'Mid-movement action pose',
    promptModifier: 'dynamic action pose, mid-movement, dramatic motion blur effect',
    icon: <Footprints size={16} />,
    category: 'action',
  },
  // Casual poses
  {
    id: 'casual_sitting',
    name: 'Sitting',
    label: 'sitting',
    description: 'Relaxed seated position',
    promptModifier: 'sitting pose, relaxed seated position, comfortable demeanor',
    icon: <Armchair size={16} />,
    category: 'casual',
  },
  {
    id: 'casual_leaning',
    name: 'Leaning',
    label: 'leaning',
    description: 'Casual lean against surface',
    promptModifier: 'leaning pose, casual stance, relaxed leaning against surface',
    icon: <Hand size={16} />,
    category: 'casual',
  },
  {
    id: 'casual_walking',
    name: 'Walking',
    label: 'walking',
    description: 'Natural walking motion',
    promptModifier: 'walking pose, natural stride, mid-step motion',
    icon: <Footprints size={16} />,
    category: 'casual',
  },
  // Dramatic poses
  {
    id: 'dramatic_profile',
    name: 'Dramatic Profile',
    label: 'profile',
    description: 'Side profile silhouette',
    promptModifier: 'dramatic side profile, silhouette composition, cinematic framing',
    icon: <Camera size={16} />,
    category: 'dramatic',
  },
  {
    id: 'dramatic_mysterious',
    name: 'Mysterious',
    label: 'mysterious',
    description: 'Partially obscured, enigmatic pose',
    promptModifier: 'mysterious pose, partially shadowed, enigmatic presence, dramatic lighting',
    icon: <Circle size={16} />,
    category: 'dramatic',
  },
  {
    id: 'dramatic_regal',
    name: 'Regal',
    label: 'regal',
    description: 'Noble commanding presence',
    promptModifier: 'regal pose, noble commanding stance, aristocratic bearing',
    icon: <Crown size={16} />,
    category: 'dramatic',
  },
];

export const ANGLE_PRESETS: Angle[] = [
  {
    id: 'front',
    name: 'Front View',
    label: 'front',
    promptModifier: 'front view, facing viewer directly',
    visual: '◯',
  },
  {
    id: 'three_quarter',
    name: '3/4 View',
    label: '3/4',
    promptModifier: 'three-quarter view, slightly turned, 3/4 angle',
    visual: '◑',
  },
  {
    id: 'side',
    name: 'Side View',
    label: 'side',
    promptModifier: 'side view profile, 90 degree angle',
    visual: '◐',
  },
  {
    id: 'back_three_quarter',
    name: 'Back 3/4',
    label: 'back_3/4',
    promptModifier: 'back three-quarter view, looking over shoulder',
    visual: '◔',
  },
  {
    id: 'back',
    name: 'Back View',
    label: 'back',
    promptModifier: 'back view, from behind',
    visual: '●',
  },
];

const CATEGORY_CONFIG: Record<PoseCategory, { label: string; color: string }> = {
  portrait: { label: 'Portrait', color: 'border-blue-500/30 bg-blue-600/10' },
  action: { label: 'Action', color: 'border-red-500/30 bg-red-600/10' },
  casual: { label: 'Casual', color: 'border-green-500/30 bg-green-600/10' },
  dramatic: { label: 'Dramatic', color: 'border-purple-500/30 bg-purple-600/10' },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function buildPoseAnglePrompt(pose: Pose | null, angle: Angle | null): string {
  const parts: string[] = [];
  if (pose) parts.push(pose.promptModifier);
  if (angle) parts.push(angle.promptModifier);
  return parts.join(', ');
}

// ============================================================================
// Subcomponents
// ============================================================================

interface AngleSelectorProps {
  selectedAngle: Angle | null;
  onSelectAngle: (angle: Angle | null) => void;
  disabled?: boolean;
}

const AngleSelector: React.FC<AngleSelectorProps> = ({
  selectedAngle,
  onSelectAngle,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-2">
      {ANGLE_PRESETS.map((angle) => {
        const isSelected = selectedAngle?.id === angle.id;
        return (
          <button
            key={angle.id}
            onClick={() => onSelectAngle(isSelected ? null : angle)}
            disabled={disabled}
            title={angle.name}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg border transition-all',
              'font-mono text-lg',
              isSelected
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {angle.visual}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const PoseSelector: React.FC<PoseSelectorProps> = ({
  selectedPose,
  selectedAngle,
  onSelectPose,
  onSelectAngle,
  disabled = false,
  compact = false,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<PoseCategory | null>(null);

  // Group poses by category
  const posesByCategory = POSE_PRESETS.reduce((acc, pose) => {
    if (!acc[pose.category]) acc[pose.category] = [];
    acc[pose.category].push(pose);
    return acc;
  }, {} as Record<PoseCategory, Pose[]>);

  const handlePoseClick = (pose: Pose) => {
    if (disabled) return;
    if (selectedPose?.id === pose.id) {
      onSelectPose(null);
    } else {
      onSelectPose(pose);
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            pose & angle
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {POSE_PRESETS.slice(0, 6).map((pose) => {
            const isSelected = selectedPose?.id === pose.id;
            return (
              <button
                key={pose.id}
                onClick={() => handlePoseClick(pose)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-all',
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {pose.icon}
                <span className="font-mono">{pose.label}</span>
              </button>
            );
          })}
        </div>

        <AngleSelector
          selectedAngle={selectedAngle}
          onSelectAngle={onSelectAngle}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            pose_selector
          </h3>
          {selectedPose && (
            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 font-mono text-xs">
              {selectedPose.name}
            </span>
          )}
        </div>

        {selectedPose && (
          <button
            onClick={() => onSelectPose(null)}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/40
                       text-slate-500 hover:text-slate-300 transition-colors text-xs
                       disabled:opacity-50"
          >
            <RotateCcw size={12} />
            clear
          </button>
        )}
      </div>

      {/* Category Groups */}
      <div className="space-y-3 mb-4">
        {(Object.keys(posesByCategory) as PoseCategory[]).map((category) => {
          const poses = posesByCategory[category];
          const categoryConfig = CATEGORY_CONFIG[category];
          const isExpanded = expandedCategory === category;
          const hasCategorySelection = poses.some(p => p.id === selectedPose?.id);

          return (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all',
                  categoryConfig.color,
                  hasCategorySelection && 'ring-1 ring-cyan-500/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-slate-300">
                    {categoryConfig.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({poses.length} poses)
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={14} className="text-slate-500" />
                </motion.div>
              </button>

              {/* Poses Grid */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {poses.map((pose) => {
                        const isSelected = selectedPose?.id === pose.id;
                        return (
                          <motion.button
                            key={pose.id}
                            onClick={() => handlePoseClick(pose)}
                            disabled={disabled}
                            whileHover={{ scale: disabled ? 1 : 1.02 }}
                            whileTap={{ scale: disabled ? 1 : 0.98 }}
                            className={cn(
                              'p-3 rounded-lg border transition-all text-left',
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-500/40'
                                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                              disabled && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={isSelected ? 'text-cyan-400' : 'text-slate-400'}>
                                {pose.icon}
                              </span>
                              <span className={cn(
                                'font-mono text-xs uppercase',
                                isSelected ? 'text-cyan-400' : 'text-slate-300'
                              )}>
                                {pose.label}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-slate-500 line-clamp-2">
                              {pose.description}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Angle Selection */}
      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs uppercase text-slate-400">camera_angle</span>
          {selectedAngle && (
            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 font-mono text-xs">
              {selectedAngle.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <AngleSelector
            selectedAngle={selectedAngle}
            onSelectAngle={onSelectAngle}
            disabled={disabled}
          />

          {selectedAngle && (
            <button
              onClick={() => onSelectAngle(null)}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/40
                         text-slate-500 hover:text-slate-300 transition-colors text-xs
                         disabled:opacity-50"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Preview of combined prompt */}
      {(selectedPose || selectedAngle) && (
        <div className="mt-4 p-3 bg-slate-800/40 rounded border border-slate-700/30">
          <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            pose_prompt_modifier
          </span>
          <p className="font-mono text-[10px] text-slate-400">
            {buildPoseAnglePrompt(selectedPose, selectedAngle)}
          </p>
        </div>
      )}
    </div>
  );
};

export default PoseSelector;
