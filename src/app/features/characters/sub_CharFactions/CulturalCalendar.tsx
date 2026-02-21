'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  PartyPopper,
  Flame as Candle,
  Star,
  Building2,
  Leaf,
  Users,
  Gift,
  Save,
  X,
  Loader2,
  Clock,
  MapPin,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  CalendarEvent,
  CalendarEventType,
  CulturalCalendar as CulturalCalendarType,
  CALENDAR_EVENT_TYPES,
  generateEventId,
} from '@/lib/culture/CultureGenerator';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

// ============================================================================
// Types
// ============================================================================

interface CulturalCalendarProps {
  factionId: string;
  factionName: string;
  calendar: CulturalCalendarType;
  ritualNames: string[]; // For linking events to rituals
  onCalendarChange: (calendar: CulturalCalendarType) => void;
  readOnly?: boolean;
}

interface EventEditorModalProps {
  event: CalendarEvent | null;
  isNew: boolean;
  ritualNames: string[];
  onSave: (event: CalendarEvent) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_TYPE_ICONS: Record<CalendarEventType, React.ReactNode> = {
  festival: <PartyPopper className="w-4 h-4" />,
  memorial: <Candle className="w-4 h-4" />,
  ceremony: <Star className="w-4 h-4" />,
  holy_day: <Sun className="w-4 h-4" />,
  founding: <Building2 className="w-4 h-4" />,
  seasonal: <Leaf className="w-4 h-4" />,
};

const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  festival: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  memorial: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  ceremony: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  holy_day: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  founding: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  seasonal: 'text-green-400 bg-green-500/20 border-green-500/30',
};

const CALENDAR_SYSTEMS = [
  { value: 'solar', label: 'Solar Calendar' },
  { value: 'lunar', label: 'Lunar Calendar' },
  { value: 'custom', label: 'Custom Calendar' },
  { value: 'mixed', label: 'Lunisolar Calendar' },
];

const EVENT_GENERATION_PROMPT = {
  system: `You are a worldbuilding expert specializing in faction cultures and celebrations.
Create calendar events that are:
- Meaningful and tied to faction history or values
- Rich with traditions and activities
- Unique to the faction's identity
- Practical for storytelling`,
  user: (context: { factionName: string; eventType: CalendarEventType; existingEvents: string[] }) => {
    let prompt = `Create a ${context.eventType.replace('_', ' ')} event for the faction "${context.factionName}".\n\n`;

    if (context.existingEvents.length > 0) {
      prompt += `Existing events: ${context.existingEvents.join(', ')}\n`;
      prompt += `Create something different from these.\n\n`;
    }

    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Event name (evocative, 2-4 words)",
  "description": "Brief overview of the event",
  "date": "When it occurs (can be 'First full moon of spring', 'Summer solstice', or specific date)",
  "duration_days": 1,
  "activities": ["List of 3-5 traditional activities"],
  "traditional_foods": ["2-3 special foods"],
  "traditional_dress": "Description of ceremonial attire",
  "gifts_exchanged": true or false,
  "public_or_private": "public" or "members_only",
  "historical_significance": "Why this event matters to the faction"
}`;

    return prompt;
  },
};

// ============================================================================
// Sub-components
// ============================================================================

const EventCard: React.FC<{
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ event, onEdit, onDelete, readOnly }) => {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = CALENDAR_EVENT_TYPES[event.event_type];
  const typeColor = EVENT_TYPE_COLORS[event.event_type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-slate-800/50 rounded-lg border overflow-hidden',
        typeColor.replace('text-', 'border-').replace('bg-', '').replace('/20', '/30')
      )}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={cn('p-1.5 rounded-lg', typeColor)}>
              {EVENT_TYPE_ICONS[event.event_type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-white text-sm">{event.name}</h4>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', typeColor)}>
                  {typeConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>
              {event.duration_days > 1 && (
                <span className="text-[10px] text-slate-600">
                  ({event.duration_days} days)
                </span>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1 text-slate-500 hover:text-cyan-400">
                <Edit3 size={12} />
              </button>
              <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{event.description}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-slate-500 hover:text-slate-300 mt-2"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50 overflow-hidden"
          >
            <div className="p-3 space-y-3 bg-slate-800/30 text-xs">
              {/* Activities */}
              {event.activities.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Traditional Activities
                  </p>
                  <ul className="space-y-0.5">
                    {event.activities.map((activity, i) => (
                      <li key={i} className="text-slate-400 flex items-start gap-1">
                        <span className="text-cyan-500">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Foods & Dress */}
              <div className="grid grid-cols-2 gap-3">
                {event.traditional_foods && event.traditional_foods.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                      Traditional Foods
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {event.traditional_foods.map((food, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px]"
                        >
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {event.traditional_dress && (
                  <div>
                    <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                      Traditional Dress
                    </p>
                    <p className="text-slate-400">{event.traditional_dress}</p>
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-1">
                  <Users size={10} />
                  {event.public_or_private === 'public'
                    ? 'Public'
                    : event.public_or_private === 'private'
                    ? 'Private'
                    : 'Members Only'}
                </span>
                {event.gifts_exchanged && (
                  <span className="flex items-center gap-1">
                    <Gift size={10} />
                    Gifts exchanged
                  </span>
                )}
              </div>

              {/* Historical Significance */}
              {event.historical_significance && (
                <div className="bg-slate-900/50 rounded p-2 border border-slate-700/30">
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-0.5">
                    Historical Significance
                  </p>
                  <p className="text-slate-400 italic">{event.historical_significance}</p>
                </div>
              )}

              {/* Related Rituals */}
              {event.related_rituals.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Associated Rituals
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {event.related_rituals.map((ritual, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-[10px]"
                      >
                        {ritual}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EventEditorModal: React.FC<EventEditorModalProps> = ({
  event,
  isNew,
  ritualNames,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CalendarEvent>(
    event || {
      id: generateEventId(),
      name: '',
      description: '',
      date: '',
      event_type: 'festival',
      duration_days: 1,
      activities: [],
      traditional_foods: [],
      traditional_dress: '',
      gifts_exchanged: false,
      public_or_private: 'members_only',
      related_rituals: [],
      historical_significance: '',
    }
  );
  const [activityInput, setActivityInput] = useState('');
  const [foodInput, setFoodInput] = useState('');

  const handleAddActivity = () => {
    if (activityInput.trim()) {
      setFormData({
        ...formData,
        activities: [...formData.activities, activityInput.trim()],
      });
      setActivityInput('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  const handleAddFood = () => {
    if (foodInput.trim()) {
      setFormData({
        ...formData,
        traditional_foods: [...(formData.traditional_foods || []), foodInput.trim()],
      });
      setFoodInput('');
    }
  };

  const handleRemoveFood = (index: number) => {
    setFormData({
      ...formData,
      traditional_foods: formData.traditional_foods?.filter((_, i) => i !== index),
    });
  };

  const toggleRitual = (ritual: string) => {
    const current = formData.related_rituals || [];
    if (current.includes(ritual)) {
      setFormData({ ...formData, related_rituals: current.filter((r) => r !== ritual) });
    } else {
      setFormData({ ...formData, related_rituals: [...current, ritual] });
    }
  };

  const isValid = formData.name.trim() && formData.date.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="text-cyan-400" size={20} />
            {isNew ? 'Add Calendar Event' : 'Edit Event'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Event Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Festival of Lights"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) =>
                  setFormData({ ...formData, event_type: e.target.value as CalendarEventType })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {Object.entries(CALENDAR_EVENT_TYPES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="e.g., Winter Solstice, March 15"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({ ...formData, duration_days: Math.max(1, +e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this event about?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Activities</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                placeholder="e.g., Procession through the streets"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-2 py-1 rounded"
                >
                  <span className="flex-1">{activity}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(i)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Traditional Foods */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Traditional Foods
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFood())}
                placeholder="e.g., Honeyed cakes"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddFood}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.traditional_foods?.map((food, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded"
                >
                  {food}
                  <button type="button" onClick={() => handleRemoveFood(i)} className="hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Traditional Dress */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Traditional Dress
            </label>
            <input
              type="text"
              value={formData.traditional_dress || ''}
              onChange={(e) => setFormData({ ...formData, traditional_dress: e.target.value })}
              placeholder="e.g., White robes with golden trim"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Visibility</label>
              <select
                value={formData.public_or_private}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    public_or_private: e.target.value as 'public' | 'private' | 'members_only',
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              >
                <option value="public">Public</option>
                <option value="members_only">Members Only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gifts_exchanged || false}
                  onChange={(e) => setFormData({ ...formData, gifts_exchanged: e.target.checked })}
                  className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-slate-300">Gifts exchanged</span>
              </label>
            </div>
          </div>

          {/* Historical Significance */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Historical Significance
            </label>
            <textarea
              value={formData.historical_significance || ''}
              onChange={(e) => setFormData({ ...formData, historical_significance: e.target.value })}
              placeholder="Why is this event important to the faction?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
            />
          </div>

          {/* Related Rituals */}
          {ritualNames.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Associated Rituals
              </label>
              <div className="flex flex-wrap gap-2">
                {ritualNames.map((ritual) => {
                  const isSelected = formData.related_rituals.includes(ritual);
                  return (
                    <button
                      key={ritual}
                      type="button"
                      onClick={() => toggleRitual(ritual)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                        isSelected
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {ritual}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={() => onSave(formData)}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {isNew ? 'Add Event' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const CulturalCalendar: React.FC<CulturalCalendarProps> = ({
  factionId,
  factionName,
  calendar,
  ritualNames,
  onCalendarChange,
  readOnly = false,
}) => {
  const { selectedProject } = useProjectStore();
  const cli = useCLIFeature({
    featureId: 'faction-calendar',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['faction-lore'],
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [generatingType, setGeneratingType] = useState<CalendarEventType | null>(null);

  // Group events by type for display
  const eventsByType = useMemo(() => {
    const grouped: Partial<Record<CalendarEventType, CalendarEvent[]>> = {};
    calendar.events.forEach((event) => {
      if (!grouped[event.event_type]) {
        grouped[event.event_type] = [];
      }
      grouped[event.event_type]!.push(event);
    });
    return grouped;
  }, [calendar.events]);

  const handleAddEvent = () => {
    setIsNewEvent(true);
    setEditingEvent({
      id: generateEventId(),
      name: '',
      description: '',
      date: '',
      event_type: 'festival',
      duration_days: 1,
      activities: [],
      public_or_private: 'members_only',
      related_rituals: [],
    });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setIsNewEvent(false);
    setEditingEvent(event);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    if (isNewEvent) {
      onCalendarChange({
        ...calendar,
        events: [...calendar.events, event],
      });
    } else {
      onCalendarChange({
        ...calendar,
        events: calendar.events.map((e) => (e.id === event.id ? event : e)),
      });
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    onCalendarChange({
      ...calendar,
      events: calendar.events.filter((e) => e.id !== eventId),
    });
  };

  const handleCalendarSettingsChange = (updates: Partial<CulturalCalendarType>) => {
    onCalendarChange({ ...calendar, ...updates });
  };

  const handleGenerateEvent = (eventType: CalendarEventType) => {
    setGeneratingType(eventType);
    const existingEvents = calendar.events.map((e) => e.name);

    let prompt = `Create a ${eventType.replace('_', ' ')} event for the faction "${factionName}".\n\n`;
    if (existingEvents.length > 0) {
      prompt += `Existing events: ${existingEvents.join(', ')}\nCreate something different from these.\n\n`;
    }
    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Event name (evocative, 2-4 words)",
  "description": "Brief overview of the event",
  "date": "When it occurs (can be 'First full moon of spring', 'Summer solstice', or specific date)",
  "duration_days": 1,
  "activities": ["List of 3-5 traditional activities"],
  "traditional_foods": ["2-3 special foods"],
  "traditional_dress": "Description of ceremonial attire",
  "gifts_exchanged": true or false,
  "public_or_private": "public" or "members_only",
  "historical_significance": "Why this event matters to the faction"
}`;

    cli.executePrompt(prompt, `Generate ${eventType} Event`);
  };

  const handleInsertEvent = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const eventType = generatingType || 'festival';
        const newEvent: CalendarEvent = {
          id: generateEventId(),
          name: parsed.name || 'Generated Event',
          description: parsed.description || '',
          date: parsed.date || '',
          event_type: eventType,
          duration_days: parsed.duration_days || 1,
          activities: parsed.activities || [],
          traditional_foods: parsed.traditional_foods,
          traditional_dress: parsed.traditional_dress,
          gifts_exchanged: parsed.gifts_exchanged,
          public_or_private: parsed.public_or_private || 'members_only',
          related_rituals: [],
          historical_significance: parsed.historical_significance,
        };
        onCalendarChange({
          ...calendar,
          events: [...calendar.events, newEvent],
        });
      }
    } catch (parseError) {
      console.error('Failed to parse generated event:', parseError);
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Settings */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="font-medium text-white">Calendar System</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Calendar Type</label>
            <select
              value={calendar.calendar_system}
              onChange={(e) => handleCalendarSettingsChange({ calendar_system: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {CALENDAR_SYSTEMS.map((sys) => (
                <option key={sys.value} value={sys.value}>
                  {sys.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Year Begins</label>
            <input
              type="text"
              value={calendar.year_start}
              onChange={(e) => handleCalendarSettingsChange({ year_start: e.target.value })}
              disabled={readOnly}
              placeholder="e.g., Spring Equinox"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Seasons ({calendar.seasons.length})
            </label>
            <input
              type="text"
              value={calendar.seasons.join(', ')}
              onChange={(e) =>
                handleCalendarSettingsChange({
                  seasons: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              disabled={readOnly}
              placeholder="Spring, Summer, Autumn, Winter"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Events Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white">Calendar Events</h3>
          <p className="text-xs text-slate-500">
            {calendar.events.length} event{calendar.events.length !== 1 ? 's' : ''} throughout the year
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Event
          </button>
        )}
      </div>

      {/* Events Grid by Type */}
      <div className="space-y-4">
        {(Object.entries(CALENDAR_EVENT_TYPES) as [CalendarEventType, typeof CALENDAR_EVENT_TYPES.festival][]).map(
          ([type, config]) => {
            const typeEvents = eventsByType[type] || [];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('p-1 rounded', EVENT_TYPE_COLORS[type])}>
                    {EVENT_TYPE_ICONS[type]}
                  </div>
                  <span className="text-sm font-medium text-white">{config.label}s</span>
                  <span className="text-xs text-slate-500">({typeEvents.length})</span>
                </div>

                {typeEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                    <AnimatePresence mode="popLayout">
                      {typeEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onEdit={() => handleEditEvent(event)}
                          onDelete={() => handleDeleteEvent(event.id)}
                          readOnly={readOnly}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic pl-7">No {config.label.toLowerCase()}s yet</p>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* AI Generation */}
      {!readOnly && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-400" size={16} />
            <span className="text-sm font-medium text-purple-300">Generate Event with AI</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CALENDAR_EVENT_TYPES) as [CalendarEventType, typeof CALENDAR_EVENT_TYPES.festival][]).map(
              ([type, config]) => {
                const isGenerating = generatingType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleGenerateEvent(type)}
                    disabled={cli.isRunning || generatingType !== null}
                    className={cn(
                      'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50',
                      EVENT_TYPE_COLORS[type]
                    )}
                  >
                    {isGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      EVENT_TYPE_ICONS[type]
                    )}
                    {config.label}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* CLI Terminal for AI generation */}
      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={handleInsertEvent}
      />

      {/* Regular Observances */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-medium text-white">Regular Observances</h4>
        </div>
        <textarea
          value={calendar.observances.join('\n')}
          onChange={(e) =>
            handleCalendarSettingsChange({
              observances: e.target.value.split('\n').filter(Boolean),
            })
          }
          disabled={readOnly}
          placeholder="One per line, e.g.:&#10;Weekly day of rest on seventh day&#10;Monthly remembrance on first moon&#10;Morning prayers at sunrise"
          rows={3}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none disabled:opacity-50"
        />
        {calendar.observances.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {calendar.observances.map((obs, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded"
              >
                {obs}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Event Editor Modal */}
      <AnimatePresence>
        {editingEvent && (
          <EventEditorModal
            event={editingEvent}
            isNew={isNewEvent}
            ritualNames={ritualNames}
            onSave={handleSaveEvent}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CulturalCalendar;
