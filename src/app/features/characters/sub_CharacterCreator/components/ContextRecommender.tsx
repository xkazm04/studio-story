'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Cloud,
  Clock,
  Tag,
  Shirt,
  Check,
  ChevronRight,
  AlertCircle,
  Info,
  Zap,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  Outfit,
  SceneContext,
  OutfitRecommendation,
  useCharacterOutfits,
  getOutfitRecommendations,
} from '@/app/hooks/integration/useCharacterOutfits';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ContextRecommenderProps {
  characterId: string;
  sceneContext?: SceneContext;
  onOutfitSelect: (outfit: Outfit) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LOCATION_OPTIONS = [
  { value: 'castle', label: 'Castle', icon: '🏰' },
  { value: 'tavern', label: 'Tavern', icon: '🍺' },
  { value: 'forest', label: 'Forest', icon: '🌲' },
  { value: 'city', label: 'City', icon: '🏙️' },
  { value: 'village', label: 'Village', icon: '🏘️' },
  { value: 'battlefield', label: 'Battlefield', icon: '⚔️' },
  { value: 'court', label: 'Royal Court', icon: '👑' },
  { value: 'ship', label: 'Ship', icon: '🚢' },
  { value: 'temple', label: 'Temple', icon: '⛩️' },
  { value: 'dungeon', label: 'Dungeon', icon: '🗝️' },
  { value: 'market', label: 'Market', icon: '🏪' },
  { value: 'mountains', label: 'Mountains', icon: '🏔️' },
];

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Sunny', icon: '☀️' },
  { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { value: 'rainy', label: 'Rainy', icon: '🌧️' },
  { value: 'snowy', label: 'Snowy', icon: '❄️' },
  { value: 'stormy', label: 'Stormy', icon: '⛈️' },
  { value: 'foggy', label: 'Foggy', icon: '🌫️' },
  { value: 'indoor', label: 'Indoor', icon: '🏠' },
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌆' },
  { value: 'night', label: 'Night', icon: '🌙' },
];

const ACTIVITY_OPTIONS = [
  { value: 'combat', label: 'Combat', icon: '⚔️' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'negotiation', label: 'Negotiation', icon: '🤝' },
  { value: 'stealth', label: 'Stealth', icon: '🥷' },
  { value: 'travel', label: 'Travel', icon: '🚶' },
  { value: 'rest', label: 'Rest', icon: '😴' },
  { value: 'work', label: 'Work', icon: '⚒️' },
  { value: 'investigation', label: 'Investigation', icon: '🔍' },
];

// ============================================================================
// Subcomponents
// ============================================================================

interface ContextSelectorProps {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; icon: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? undefined : option.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all',
              value === option.value
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            )}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: OutfitRecommendation;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  rank,
  isSelected,
  onSelect,
}) => {
  const { outfit, score, matchReasons } = recommendation;

  // Score color
  const scoreColor = score >= 70
    ? 'text-green-400 bg-green-600/20'
    : score >= 40
      ? 'text-yellow-400 bg-yellow-600/20'
      : 'text-gray-400 bg-gray-600/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      onClick={onSelect}
      className={cn(
        'relative p-4 bg-gray-800/50 border rounded-lg cursor-pointer transition-all',
        isSelected
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-gray-700 hover:border-gray-600'
      )}
    >
      {/* Rank Badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
        {rank + 1}
      </div>

      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          {outfit.thumbnail_url ? (
            <img
              src={outfit.thumbnail_url}
              alt={outfit.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Shirt size={24} className="text-gray-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white truncate">{outfit.name}</h4>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', scoreColor)}>
              {score}%
            </span>
          </div>

          <p className="text-xs text-gray-400 capitalize mb-2">
            {outfit.outfit_type} outfit
          </p>

          {/* Match Reasons */}
          {matchReasons.length > 0 && (
            <div className="space-y-1">
              {matchReasons.slice(0, 3).map((reason, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-gray-400"
                >
                  <Check size={12} className="text-green-400" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Select Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <Check size={20} className="text-purple-400" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ContextRecommender: React.FC<ContextRecommenderProps> = ({
  characterId,
  sceneContext: initialContext,
  onOutfitSelect,
  className,
}) => {
  const { outfits, isLoading } = useCharacterOutfits(characterId);

  // Context state
  const [context, setContext] = useState<SceneContext>(initialContext || {});
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

  // Update context field
  const updateContext = (field: keyof SceneContext, value: string | undefined) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  // Get recommendations
  const recommendations = useMemo(() => {
    if (outfits.length === 0) return [];
    return getOutfitRecommendations(outfits, context);
  }, [outfits, context]);

  // Top recommendation
  const topRecommendation = recommendations[0];

  // Check if context is set
  const hasContext = !!(context.location || context.weather || context.timeOfDay || context.activityType);

  // Handle selection
  const handleSelect = (outfit: Outfit) => {
    setSelectedOutfitId(outfit.id);
    onOutfitSelect(outfit);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Outfit Recommender</h2>
            <p className="text-sm text-gray-400">
              Find the perfect outfit for any scene
            </p>
          </div>
        </div>
      </div>

      {/* Context Selection */}
      <div className="p-4 space-y-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Scene Context</h3>

        <ContextSelector
          label="Location"
          icon={<MapPin size={14} />}
          options={LOCATION_OPTIONS}
          value={context.location}
          onChange={(v) => updateContext('location', v)}
        />

        <ContextSelector
          label="Weather"
          icon={<Cloud size={14} />}
          options={WEATHER_OPTIONS}
          value={context.weather}
          onChange={(v) => updateContext('weather', v)}
        />

        <ContextSelector
          label="Time of Day"
          icon={<Clock size={14} />}
          options={TIME_OPTIONS}
          value={context.timeOfDay}
          onChange={(v) => updateContext('timeOfDay', v)}
        />

        <ContextSelector
          label="Activity"
          icon={<Zap size={14} />}
          options={ACTIVITY_OPTIONS}
          value={context.activityType}
          onChange={(v) => updateContext('activityType', v)}
        />
      </div>

      {/* Recommendations */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Shirt size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No outfits available</p>
            <p className="text-sm">Create some outfits in the wardrobe first</p>
          </div>
        ) : !hasContext ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Info size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Set the scene context above</p>
            <p className="text-sm">Select location, weather, time, or activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Pick Highlight */}
            {topRecommendation && topRecommendation.score >= 50 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp size={16} className="text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Top Recommendation</span>
                </div>
                <p className="text-white font-medium">{topRecommendation.outfit.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {topRecommendation.score}% match • {topRecommendation.matchReasons[0]}
                </p>
                <button
                  onClick={() => handleSelect(topRecommendation.outfit)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Check size={16} />
                  Use This Outfit
                </button>
              </motion.div>
            )}

            {/* All Recommendations */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">
                All Matches ({recommendations.length})
              </h4>

              {recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.outfit.id}
                  recommendation={rec}
                  rank={index}
                  isSelected={selectedOutfitId === rec.outfit.id}
                  onSelect={() => handleSelect(rec.outfit)}
                />
              ))}

              {recommendations.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-400" />
                  <p className="text-sm text-yellow-300">
                    No outfits match this context. Consider creating more outfits with varied context tags.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Selected */}
      {selectedOutfitId && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-4 border-t border-gray-700 bg-gray-900/90"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-400">Selected: </span>
              <span className="text-white font-medium">
                {outfits.find(o => o.id === selectedOutfitId)?.name}
              </span>
            </div>
            <button
              onClick={() => {
                const outfit = outfits.find(o => o.id === selectedOutfitId);
                if (outfit) onOutfitSelect(outfit);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Check size={16} />
              Confirm Selection
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ContextRecommender;
