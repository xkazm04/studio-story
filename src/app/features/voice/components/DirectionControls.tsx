'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  ThermometerSun,
  Shield,
  Heart,
  Briefcase,
  Zap,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Slider } from '@/app/components/UI/Slider';
import {
  voiceMatcher,
  DEFAULT_DIRECTION,
  type VoiceDirection,
} from '@/lib/voice';

interface DirectionControlsProps {
  characterId: string;
  characterName: string;
  onSave?: (direction: VoiceDirection) => void;
  className?: string;
}

export default function DirectionControls({
  characterId,
  characterName,
  onSave,
  className = '',
}: DirectionControlsProps) {
  // Load current direction
  const [direction, setDirection] = useState<VoiceDirection>(() =>
    voiceMatcher.getDirection(characterId)
  );

  // UI state
  const [newDoItem, setNewDoItem] = useState('');
  const [newDontItem, setNewDontItem] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Handle parameter change
  const handleChange = useCallback(<K extends keyof VoiceDirection>(
    key: K,
    value: VoiceDirection[K]
  ) => {
    setDirection(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Handle adding do item
  const handleAddDoItem = useCallback(() => {
    if (!newDoItem.trim()) return;
    setDirection(prev => ({
      ...prev,
      doList: [...prev.doList, newDoItem.trim()],
    }));
    setNewDoItem('');
    setHasChanges(true);
  }, [newDoItem]);

  // Handle adding don't item
  const handleAddDontItem = useCallback(() => {
    if (!newDontItem.trim()) return;
    setDirection(prev => ({
      ...prev,
      dontList: [...prev.dontList, newDontItem.trim()],
    }));
    setNewDontItem('');
    setHasChanges(true);
  }, [newDontItem]);

  // Handle removing list item
  const handleRemoveItem = useCallback((list: 'doList' | 'dontList', index: number) => {
    setDirection(prev => ({
      ...prev,
      [list]: prev[list].filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    voiceMatcher.setDirection(characterId, direction);
    setHasChanges(false);
    onSave?.(direction);
  }, [characterId, direction, onSave]);

  // Handle reset
  const handleReset = useCallback(() => {
    setDirection({ ...DEFAULT_DIRECTION });
    setHasChanges(true);
  }, []);

  // Get slider label
  const getSliderLabel = (value: number, labels: [string, string, string]): string => {
    if (value < -0.3) return labels[0];
    if (value > 0.3) return labels[2];
    return labels[1];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            Voice Direction
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Guide the performance for {characterName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Tone Adjustments */}
      <div className="space-y-4 p-4 rounded-lg bg-slate-900/40 border border-slate-800/50">
        <h4 className="text-sm font-medium text-slate-300">Tone Adjustments</h4>

        {/* Warmth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThermometerSun className="w-4 h-4 text-orange-400" />
              <label className="text-sm text-slate-300">Warmth</label>
            </div>
            <span className="text-xs text-slate-500">
              {getSliderLabel(direction.warmth, ['Cold', 'Neutral', 'Warm'])}
            </span>
          </div>
          <Slider
            value={direction.warmth}
            min={-1}
            max={1}
            step={0.1}
            onChange={(value) => handleChange('warmth', value)}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Cold</span>
            <span>Neutral</span>
            <span>Warm</span>
          </div>
        </div>

        {/* Authority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <label className="text-sm text-slate-300">Authority</label>
            </div>
            <span className="text-xs text-slate-500">
              {getSliderLabel(direction.authority, ['Submissive', 'Balanced', 'Commanding'])}
            </span>
          </div>
          <Slider
            value={direction.authority}
            min={-1}
            max={1}
            step={0.1}
            onChange={(value) => handleChange('authority', value)}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Submissive</span>
            <span>Balanced</span>
            <span>Commanding</span>
          </div>
        </div>

        {/* Friendliness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <label className="text-sm text-slate-300">Friendliness</label>
            </div>
            <span className="text-xs text-slate-500">
              {getSliderLabel(direction.friendliness, ['Distant', 'Neutral', 'Friendly'])}
            </span>
          </div>
          <Slider
            value={direction.friendliness}
            min={-1}
            max={1}
            step={0.1}
            onChange={(value) => handleChange('friendliness', value)}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Distant</span>
            <span>Neutral</span>
            <span>Friendly</span>
          </div>
        </div>
      </div>

      {/* Delivery Style */}
      <div className="space-y-4 p-4 rounded-lg bg-slate-900/40 border border-slate-800/50">
        <h4 className="text-sm font-medium text-slate-300">Delivery Style</h4>

        {/* Formality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <label className="text-sm text-slate-300">Formality</label>
            </div>
            <span className="text-xs text-slate-500">
              {Math.round(direction.formality * 100)}%
            </span>
          </div>
          <Slider
            value={direction.formality}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => handleChange('formality', value)}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Casual</span>
            <span>Formal</span>
          </div>
        </div>

        {/* Intensity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <label className="text-sm text-slate-300">Intensity</label>
            </div>
            <span className="text-xs text-slate-500">
              {Math.round(direction.intensity * 100)}%
            </span>
          </div>
          <Slider
            value={direction.intensity}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => handleChange('intensity', value)}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Subdued</span>
            <span>Intense</span>
          </div>
        </div>
      </div>

      {/* Character Notes */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/40 border border-slate-800/50">
        <h4 className="text-sm font-medium text-slate-300">Character Notes</h4>
        <textarea
          value={direction.characterNotes}
          onChange={(e) => handleChange('characterNotes', e.target.value)}
          placeholder="Add notes about how this character should sound..."
          className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Do / Don't Lists */}
      <div className="grid grid-cols-2 gap-4">
        {/* Do List */}
        <div className="space-y-3 p-4 rounded-lg bg-green-900/10 border border-green-500/20">
          <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Do
          </h4>

          <div className="space-y-2">
            {direction.doList.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-slate-300"
              >
                <span className="flex-1">{item}</span>
                <button
                  onClick={() => handleRemoveItem('doList', index)}
                  className="p-1 text-slate-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDoItem}
              onChange={(e) => setNewDoItem(e.target.value)}
              placeholder="Add direction..."
              className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-green-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDoItem()}
            />
            <button
              onClick={handleAddDoItem}
              disabled={!newDoItem.trim()}
              className="p-1.5 rounded bg-green-500/20 text-green-400 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Don't List */}
        <div className="space-y-3 p-4 rounded-lg bg-red-900/10 border border-red-500/20">
          <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Don't
          </h4>

          <div className="space-y-2">
            {direction.dontList.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-slate-300"
              >
                <span className="flex-1">{item}</span>
                <button
                  onClick={() => handleRemoveItem('dontList', index)}
                  className="p-1 text-slate-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDontItem}
              onChange={(e) => setNewDontItem(e.target.value)}
              placeholder="Add direction..."
              className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDontItem()}
            />
            <button
              onClick={handleAddDontItem}
              disabled={!newDontItem.trim()}
              className="p-1.5 rounded bg-red-500/20 text-red-400 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-900/20 border border-amber-500/30"
        >
          <span className="text-xs text-amber-400">Unsaved changes</span>
        </motion.div>
      )}
    </div>
  );
}
