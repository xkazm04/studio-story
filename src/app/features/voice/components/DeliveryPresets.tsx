'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Drama,
  Heart,
  Zap,
  CloudRain,
  Laugh,
  Shield,
  Volume,
  Plus,
  Trash2,
  Check,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import {
  emotionController,
  type DeliveryPreset,
  type PerformanceConfig,
} from '@/lib/voice';

interface DeliveryPresetsProps {
  selectedPreset?: string;
  onSelectPreset: (preset: DeliveryPreset) => void;
  currentConfig?: PerformanceConfig;
  onSaveAsPreset?: (name: string) => void;
  className?: string;
}

// Icon mapping for built-in presets
const PRESET_ICONS: Record<string, React.ElementType> = {
  narration: BookOpen,
  dramatic: Drama,
  intimate: Heart,
  urgent: Zap,
  melancholic: CloudRain,
  comedic: Laugh,
  authoritative: Shield,
  whisper: Volume,
};

export default function DeliveryPresets({
  selectedPreset,
  onSelectPreset,
  currentConfig,
  onSaveAsPreset,
  className = '',
}: DeliveryPresetsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Get all presets
  const presets = useMemo(() => emotionController.getPresets(), []);

  // Separate built-in and custom presets
  const builtInPresets = presets.filter((p) => !p.id.startsWith('custom_'));
  const customPresets = presets.filter((p) => p.id.startsWith('custom_'));

  // Handle preset selection
  const handleSelect = (preset: DeliveryPreset) => {
    onSelectPreset(preset);
  };

  // Handle creating new preset
  const handleCreate = () => {
    if (!newPresetName.trim() || !onSaveAsPreset) return;
    onSaveAsPreset(newPresetName.trim());
    setNewPresetName('');
    setShowCreateForm(false);
  };

  // Handle deleting custom preset
  const handleDelete = (id: string) => {
    emotionController.deletePreset(id);
    // Force re-render by selecting nothing or re-fetching
  };

  // Handle rename
  const handleStartEdit = (preset: DeliveryPreset) => {
    setEditingPreset(preset.id);
    setEditName(preset.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      emotionController.updatePreset(id, { name: editName.trim() });
    }
    setEditingPreset(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
  };

  // Get icon for preset
  const getPresetIcon = (preset: DeliveryPreset): React.ElementType => {
    return PRESET_ICONS[preset.id] || Sparkles;
  };

  // Format preset details
  const formatDetails = (preset: DeliveryPreset): string => {
    const parts: string[] = [];
    parts.push(`${preset.emotion.type} (${Math.round(preset.emotion.intensity * 100)}%)`);
    parts.push(`${(preset.pacing.speed * 100).toFixed(0)}% speed`);
    return parts.join(' • ');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Built-in Presets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-200">Delivery Styles</h4>
        <div className="grid grid-cols-2 gap-2">
          {builtInPresets.map((preset) => {
            const Icon = getPresetIcon(preset);
            const isSelected = selectedPreset === preset.id;

            return (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelect(preset)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-cyan-500/20' : 'bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-slate-100' : 'text-slate-200'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Presets */}
      {(customPresets.length > 0 || showCreateForm) && (
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-200">Custom Presets</h4>
            {!showCreateForm && onSaveAsPreset && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Current
              </button>
            )}
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') setShowCreateForm(false);
                    }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newPresetName.trim()}
                    className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom preset list */}
          {customPresets.length > 0 && (
            <div className="space-y-1">
              {customPresets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                const isEditing = editingPreset === preset.id;

                return (
                  <div
                    key={preset.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-slate-200 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(preset.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(preset.id)}
                          className="p-1 rounded bg-cyan-500/20 text-cyan-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 rounded bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelect(preset)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <Sparkles
                            className={`w-4 h-4 ${
                              isSelected ? 'text-cyan-400' : 'text-slate-500'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isSelected ? 'text-slate-100' : 'text-slate-300'
                            }`}
                          >
                            {preset.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleStartEdit(preset)}
                          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {customPresets.length === 0 && !showCreateForm && (
            <p className="text-xs text-slate-500 italic">
              No custom presets yet. Adjust settings and save to create one.
            </p>
          )}
        </div>
      )}

      {/* Selected Preset Details */}
      {selectedPreset && (
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/50">
          {(() => {
            const preset = emotionController.getPreset(selectedPreset);
            if (!preset) return null;
            const Icon = getPresetIcon(preset);

            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-200">
                    {preset.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{preset.description}</p>
                <div className="text-[10px] text-slate-500 grid grid-cols-2 gap-1">
                  <span>Emotion: {preset.emotion.type}</span>
                  <span>Speed: {(preset.pacing.speed * 100).toFixed(0)}%</span>
                  <span>Volume: {Math.round(preset.volume * 100)}%</span>
                  <span>Pitch: {preset.pitch >= 0 ? '+' : ''}{Math.round(preset.pitch * 100)}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
