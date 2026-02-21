'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationData {
  name: string;
  description?: string;
  type?: string; // indoor, outdoor, urban, rural, etc.
  features?: string[];
  atmosphere?: string;
}

export interface SceneMetadata {
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'midnight';
  weather?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'windy';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  mood?: string;
  temperature?: 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  lighting?: string;
  soundscape?: string;
  customNotes?: string;
}

interface LocationReferenceProps {
  location?: LocationData;
  metadata?: SceneMetadata;
  onLocationChange?: (location: LocationData) => void;
  onMetadataChange?: (metadata: SceneMetadata) => void;
  className?: string;
}

const TIME_OF_DAY_OPTIONS: Array<{ value: SceneMetadata['timeOfDay']; label: string; icon: React.ReactNode }> = [
  { value: 'dawn', label: 'Dawn', icon: <Sun className="w-3 h-3 text-orange-300" /> },
  { value: 'morning', label: 'Morning', icon: <Sun className="w-3 h-3 text-amber-400" /> },
  { value: 'noon', label: 'Noon', icon: <Sun className="w-3 h-3 text-yellow-400" /> },
  { value: 'afternoon', label: 'Afternoon', icon: <Sun className="w-3 h-3 text-amber-500" /> },
  { value: 'evening', label: 'Evening', icon: <Sun className="w-3 h-3 text-orange-500" /> },
  { value: 'night', label: 'Night', icon: <Moon className="w-3 h-3 text-blue-400" /> },
  { value: 'midnight', label: 'Midnight', icon: <Moon className="w-3 h-3 text-indigo-400" /> },
];

const WEATHER_OPTIONS: Array<{ value: SceneMetadata['weather']; label: string; icon: React.ReactNode }> = [
  { value: 'clear', label: 'Clear', icon: <Sun className="w-3 h-3 text-yellow-400" /> },
  { value: 'cloudy', label: 'Cloudy', icon: <Cloud className="w-3 h-3 text-slate-400" /> },
  { value: 'rainy', label: 'Rainy', icon: <CloudRain className="w-3 h-3 text-blue-400" /> },
  { value: 'stormy', label: 'Stormy', icon: <CloudRain className="w-3 h-3 text-purple-400" /> },
  { value: 'snowy', label: 'Snowy', icon: <Snowflake className="w-3 h-3 text-cyan-300" /> },
  { value: 'foggy', label: 'Foggy', icon: <Cloud className="w-3 h-3 text-slate-500" /> },
  { value: 'windy', label: 'Windy', icon: <Wind className="w-3 h-3 text-teal-400" /> },
];

const TEMPERATURE_OPTIONS: Array<{ value: SceneMetadata['temperature']; label: string }> = [
  { value: 'freezing', label: 'Freezing' },
  { value: 'cold', label: 'Cold' },
  { value: 'cool', label: 'Cool' },
  { value: 'mild', label: 'Mild' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
];

/**
 * LocationReference - Quick reference panel for scene location and metadata
 */
export const LocationReference: React.FC<LocationReferenceProps> = ({
  location,
  metadata = {},
  onLocationChange,
  onMetadataChange,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLocationName, setEditLocationName] = useState(location?.name || '');
  const [editLocationDesc, setEditLocationDesc] = useState(location?.description || '');

  // Save location edit
  const handleSaveLocation = () => {
    onLocationChange?.({
      ...location,
      name: editLocationName,
      description: editLocationDesc,
    });
    setIsEditingLocation(false);
  };

  // Cancel location edit
  const handleCancelLocation = () => {
    setEditLocationName(location?.name || '');
    setEditLocationDesc(location?.description || '');
    setIsEditingLocation(false);
  };

  // Update metadata
  const updateMetadata = (updates: Partial<SceneMetadata>) => {
    onMetadataChange?.({ ...metadata, ...updates });
  };

  // Option button component
  const OptionButton: React.FC<{
    selected: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
  }> = ({ selected, onClick, icon, label }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors',
        selected
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-300'
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className={cn('bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200">Location & Setting</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Location */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Location
                  </span>
                  {!isEditingLocation && (
                    <button
                      onClick={() => setIsEditingLocation(true)}
                      className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isEditingLocation ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editLocationName}
                      onChange={(e) => setEditLocationName(e.target.value)}
                      placeholder="Location name..."
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      autoFocus
                    />
                    <textarea
                      value={editLocationDesc}
                      onChange={(e) => setEditLocationDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSaveLocation}
                        className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-[10px] hover:bg-cyan-500/30 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelLocation}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] hover:text-slate-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : location?.name ? (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2">
                    <div className="text-xs font-medium text-slate-200">{location.name}</div>
                    {location.description && (
                      <div className="text-[10px] text-slate-500 mt-1">{location.description}</div>
                    )}
                    {location.features && location.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {location.features.map((feature, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-slate-700/50 text-slate-400 text-[9px] rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className="w-full px-3 py-2 border border-dashed border-slate-700 rounded text-[10px] text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors"
                  >
                    + Set location
                  </button>
                )}
              </div>

              {/* Time of Day */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Time of Day
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TIME_OF_DAY_OPTIONS.map(opt => (
                    <OptionButton
                      key={opt.value}
                      selected={metadata.timeOfDay === opt.value}
                      onClick={() => updateMetadata({ timeOfDay: opt.value })}
                      icon={opt.icon}
                      label={opt.label}
                    />
                  ))}
                </div>
              </div>

              {/* Weather */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Cloud className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Weather
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {WEATHER_OPTIONS.map(opt => (
                    <OptionButton
                      key={opt.value}
                      selected={metadata.weather === opt.value}
                      onClick={() => updateMetadata({ weather: opt.value })}
                      icon={opt.icon}
                      label={opt.label}
                    />
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    Temperature
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TEMPERATURE_OPTIONS.map(opt => (
                    <OptionButton
                      key={opt.value}
                      selected={metadata.temperature === opt.value}
                      onClick={() => updateMetadata({ temperature: opt.value })}
                      label={opt.label}
                    />
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  Scene Mood
                </span>
                <input
                  type="text"
                  value={metadata.mood || ''}
                  onChange={(e) => updateMetadata({ mood: e.target.value })}
                  placeholder="e.g., tense, romantic, mysterious..."
                  className="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Custom Notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  Notes
                </span>
                <textarea
                  value={metadata.customNotes || ''}
                  onChange={(e) => updateMetadata({ customNotes: e.target.value })}
                  placeholder="Additional scene notes..."
                  rows={2}
                  className="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* Quick Summary */}
              {(metadata.timeOfDay || metadata.weather || location?.name) && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-500">
                    <span className="text-slate-400">Setting: </span>
                    {[
                      metadata.timeOfDay && TIME_OF_DAY_OPTIONS.find(t => t.value === metadata.timeOfDay)?.label,
                      metadata.weather && WEATHER_OPTIONS.find(w => w.value === metadata.weather)?.label,
                      location?.name,
                    ].filter(Boolean).join(' • ')}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationReference;
