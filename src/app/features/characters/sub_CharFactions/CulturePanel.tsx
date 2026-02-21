'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Heart,
  Flame,
  Calendar,
  ScrollText,
  Users,
  Shield,
  MessageCircle,
  Sparkles,
  Loader2,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Handshake,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionCulture,
  FactionValue,
  Ritual,
  Tradition,
  SocialNorm,
  Taboo,
  GreetingConvention,
  Honorific,
  CulturalCalendar as CulturalCalendarType,
  CulturalCompatibility,
  CultureGenerator,
  calculateCulturalCompatibility,
  generateBehaviorGuidelines,
  NORM_SEVERITY_CONFIG,
  generateCultureId,
  generateNormId,
} from '@/lib/culture/CultureGenerator';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';
import ValuesEditor from './ValuesEditor';
import RitualDesigner from './RitualDesigner';
import CulturalCalendar from './CulturalCalendar';

// ============================================================================
// Types
// ============================================================================

interface CulturePanelProps {
  factionId: string;
  factionName: string;
  factionDescription?: string;
  culture: FactionCulture | null;
  onCultureChange: (culture: FactionCulture) => void;
  otherCultures?: FactionCulture[]; // For compatibility analysis
  readOnly?: boolean;
}

type CultureTab = 'overview' | 'values' | 'rituals' | 'norms' | 'greetings' | 'calendar' | 'compatibility';

// ============================================================================
// Constants
// ============================================================================

const TABS: { id: CultureTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Globe size={16} /> },
  { id: 'values', label: 'Values', icon: <Heart size={16} /> },
  { id: 'rituals', label: 'Rituals', icon: <Flame size={16} /> },
  { id: 'norms', label: 'Norms & Taboos', icon: <Shield size={16} /> },
  { id: 'greetings', label: 'Greetings', icon: <MessageCircle size={16} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
  { id: 'compatibility', label: 'Compatibility', icon: <Handshake size={16} /> },
];

const FULL_CULTURE_GENERATION_PROMPT = {
  system: `You are a master worldbuilder specializing in faction cultures.
Create comprehensive, cohesive cultural profiles that:
- Feel authentic and internally consistent
- Have depth suitable for storytelling
- Include specific, actionable details
- Balance uniqueness with plausibility`,
  user: (context: { factionName: string; factionDescription?: string }) => {
    let prompt = `Generate a complete cultural profile for the faction "${context.factionName}".\n`;
    if (context.factionDescription) {
      prompt += `Description: ${context.factionDescription}\n\n`;
    }

    prompt += `Create a comprehensive culture including:

1. VALUES (at least 3 core, 2 secondary, 1 aspirational):
Each with: name, description, manifestations, origin

2. RITUALS (at least 3, mix of frequencies):
Each with: name, description, frequency, purpose, participants, steps, significance

3. TRADITIONS (at least 2):
Each with: name, description, category, how passed down, significance

4. SOCIAL NORMS (at least 4, range of severities):
Each with: name, description, severity, who it applies to, punishment

5. TABOOS (at least 2):
Each with: name, description, origin, punishment, severity

6. GREETINGS (formal and casual):
Each with: context, greeting text, response, physical gesture

7. HONORIFICS (at least 2):
Each with: title, used for, placement

8. CALENDAR EVENTS (at least 2):
Each with: name, description, date, type, activities

Return as a valid JSON object with this structure:
{
  "values": { "core_philosophy": "...", "guiding_principle": "...", "values": [...] },
  "rituals": [...],
  "traditions": [...],
  "social_norms": [...],
  "taboos": [...],
  "greetings": [...],
  "honorifics": [...],
  "calendar": { "calendar_system": "...", "year_start": "...", "seasons": [...], "events": [...], "observances": [...] },
  "cultural_summary": "2-3 sentence summary"
}`;

    return prompt;
  },
};

// ============================================================================
// Sub-components
// ============================================================================

const NormCard: React.FC<{
  norm: SocialNorm;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ norm, onEdit, onDelete, readOnly }) => {
  const severityConfig = NORM_SEVERITY_CONFIG[norm.severity];

  return (
    <div className={cn('p-3 rounded-lg border', severityConfig.color)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white text-sm">{norm.name}</h4>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded', severityConfig.color)}>
              {severityConfig.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{norm.description}</p>
          {norm.punishment && (
            <p className="text-[10px] text-red-400 mt-1">
              Punishment: {norm.punishment}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1 text-slate-500 hover:text-cyan-400">
              <ScrollText size={12} />
            </button>
            <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400">
              <AlertTriangle size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TabooCard: React.FC<{
  taboo: Taboo;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ taboo, onDelete, readOnly }) => {
  const severityColors = {
    serious: 'border-orange-500/30 bg-orange-500/10',
    grave: 'border-red-500/30 bg-red-500/10',
    unforgivable: 'border-red-700/50 bg-red-700/20',
  };

  return (
    <div className={cn('p-3 rounded-lg border', severityColors[taboo.severity])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={14} />
            <h4 className="font-medium text-white text-sm">{taboo.name}</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 capitalize">
              {taboo.severity}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{taboo.description}</p>
          {taboo.origin && (
            <p className="text-[10px] text-slate-500 mt-1 italic">Origin: {taboo.origin}</p>
          )}
          <p className="text-[10px] text-red-400 mt-1">Punishment: {taboo.punishment}</p>
        </div>
        {!readOnly && (
          <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400">
            <AlertTriangle size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const GreetingCard: React.FC<{
  greeting: GreetingConvention;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ greeting, onDelete, readOnly }) => {
  const contextColors: Record<string, string> = {
    formal: 'border-purple-500/30 bg-purple-500/10',
    casual: 'border-green-500/30 bg-green-500/10',
    military: 'border-red-500/30 bg-red-500/10',
    sacred: 'border-amber-500/30 bg-amber-500/10',
    diplomatic: 'border-blue-500/30 bg-blue-500/10',
  };

  return (
    <div className={cn('p-3 rounded-lg border', contextColors[greeting.context] || 'border-slate-700')}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-cyan-400" />
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">
              {greeting.context}
            </span>
          </div>
          <p className="text-sm text-white mt-2 font-medium">&quot;{greeting.greeting}&quot;</p>
          {greeting.response && (
            <p className="text-xs text-slate-400 mt-1">Response: &quot;{greeting.response}&quot;</p>
          )}
          {greeting.physical_gesture && (
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Gesture: {greeting.physical_gesture}
            </p>
          )}
        </div>
        {!readOnly && (
          <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400">
            <AlertTriangle size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const CompatibilityCard: React.FC<{
  culture: FactionCulture;
  compatibility: CulturalCompatibility;
}> = ({ culture, compatibility }) => {
  const [expanded, setExpanded] = useState(false);

  const allianceColors = {
    natural_allies: 'text-green-400 bg-green-500/20',
    possible: 'text-blue-400 bg-blue-500/20',
    difficult: 'text-amber-400 bg-amber-500/20',
    unlikely: 'text-orange-400 bg-orange-500/20',
    impossible: 'text-red-400 bg-red-500/20',
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {culture.faction_name.charAt(0)}
          </div>
          <div>
            <h4 className="font-medium text-white">{culture.faction_name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-xs px-2 py-0.5 rounded', allianceColors[compatibility.alliance_potential])}>
                {compatibility.alliance_potential.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">
                Score: {compatibility.overall_score}%
              </span>
            </div>
          </div>
        </div>

        <div className="w-16 h-16 relative">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${(compatibility.overall_score / 100) * 176} 176`}
              className={
                compatibility.overall_score >= 60
                  ? 'text-green-500'
                  : compatibility.overall_score >= 40
                  ? 'text-amber-500'
                  : 'text-red-500'
              }
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            {compatibility.overall_score}
          </span>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-3 text-xs text-slate-500 hover:text-slate-300"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide analysis' : 'Show analysis'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <p className="text-sm text-slate-300">{compatibility.diplomatic_notes}</p>

            {compatibility.shared_values.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">Shared Values</p>
                <div className="flex flex-wrap gap-1">
                  {compatibility.shared_values.map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {compatibility.conflicting_values.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">Conflicting Values</p>
                <div className="flex flex-wrap gap-1">
                  {compatibility.conflicting_values.map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {compatibility.potential_friction_points.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">Friction Points</p>
                <ul className="space-y-1">
                  {compatibility.potential_friction_points.map((p, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                      <AlertTriangle size={10} className="text-amber-500 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const CulturePanel: React.FC<CulturePanelProps> = ({
  factionId,
  factionName,
  factionDescription,
  culture,
  onCultureChange,
  otherCultures = [],
  readOnly = false,
}) => {
  const { selectedProject } = useProjectStore();
  const cli = useCLIFeature({
    featureId: 'faction-culture',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['faction-creation', 'faction-lore', 'faction-description'],
  });
  const [activeTab, setActiveTab] = useState<CultureTab>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize empty culture if none exists
  const currentCulture: FactionCulture = culture || {
    id: generateCultureId(),
    faction_id: factionId,
    faction_name: factionName,
    values: {
      faction_id: factionId,
      values: [],
      core_philosophy: '',
      guiding_principle: '',
    },
    rituals: [],
    traditions: [],
    social_norms: [],
    taboos: [],
    greetings: [],
    honorifics: [],
    calendar: {
      faction_id: factionId,
      calendar_system: 'solar',
      year_start: 'Spring Equinox',
      seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
      events: [],
      observances: [],
    },
    cultural_summary: '',
    behavior_guidelines: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Calculate compatibilities
  const compatibilities = useMemo(() => {
    if (!culture) return [];
    return otherCultures
      .filter((c) => c.faction_id !== factionId)
      .map((other) => ({
        culture: other,
        compatibility: calculateCulturalCompatibility(culture, other),
      }))
      .sort((a, b) => b.compatibility.overall_score - a.compatibility.overall_score);
  }, [culture, otherCultures, factionId]);

  // Derived data
  const valueNames = useMemo(
    () => currentCulture.values.values.map((v) => v.name),
    [currentCulture.values.values]
  );

  const ritualNames = useMemo(
    () => currentCulture.rituals.map((r) => r.name),
    [currentCulture.rituals]
  );

  const behaviorGuidelines = useMemo(
    () => generateBehaviorGuidelines(currentCulture),
    [currentCulture]
  );

  // Handlers
  const handleUpdateCulture = useCallback(
    (updates: Partial<FactionCulture>) => {
      const updated: FactionCulture = {
        ...currentCulture,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      onCultureChange(updated);
    },
    [currentCulture, onCultureChange]
  );

  const handleGenerateFullCulture = () => {
    setIsGenerating(true);

    let prompt = `Generate a complete cultural profile for the faction "${factionName}".\n`;
    if (factionDescription) {
      prompt += `Description: ${factionDescription}\n\n`;
    }

    prompt += `Create a comprehensive culture including:

1. VALUES (at least 3 core, 2 secondary, 1 aspirational):
Each with: name, description, manifestations, origin

2. RITUALS (at least 3, mix of frequencies):
Each with: name, description, frequency, purpose, participants, steps, significance

3. TRADITIONS (at least 2):
Each with: name, description, category, how passed down, significance

4. SOCIAL NORMS (at least 4, range of severities):
Each with: name, description, severity, who it applies to, punishment

5. TABOOS (at least 2):
Each with: name, description, origin, punishment, severity

6. GREETINGS (formal and casual):
Each with: context, greeting text, response, physical gesture

7. HONORIFICS (at least 2):
Each with: title, used for, placement

8. CALENDAR EVENTS (at least 2):
Each with: name, description, date, type, activities

Return as a valid JSON object with this structure:
{
  "values": { "core_philosophy": "...", "guiding_principle": "...", "values": [...] },
  "rituals": [...],
  "traditions": [...],
  "social_norms": [...],
  "taboos": [...],
  "greetings": [...],
  "honorifics": [...],
  "calendar": { "calendar_system": "...", "year_start": "...", "seasons": [...], "events": [...], "observances": [...] },
  "cultural_summary": "2-3 sentence summary"
}`;

    cli.executePrompt(prompt, 'Generate Full Culture');
  };

  const handleInsertCulture = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const newCulture: FactionCulture = {
          ...currentCulture,
          values: {
            faction_id: factionId,
            core_philosophy: parsed.values?.core_philosophy || '',
            guiding_principle: parsed.values?.guiding_principle || '',
            values: (parsed.values?.values || []).map((v: any, i: number) => ({
              id: `value_${Date.now()}_${i}`,
              name: v.name || '',
              description: v.description || '',
              category: v.category || 'secondary',
              priority: v.priority || 5,
              manifestations: v.manifestations || [],
              conflicts_with: v.conflicts_with || [],
              origin: v.origin || '',
            })),
          },
          rituals: (parsed.rituals || []).map((r: any, i: number) => ({
            id: `ritual_${Date.now()}_${i}`,
            name: r.name || '',
            description: r.description || '',
            frequency: r.frequency || 'annual',
            purpose: r.purpose || '',
            participants: r.participants || '',
            location: r.location,
            duration: r.duration,
            required_items: r.required_items || [],
            steps: r.steps || [],
            significance: r.significance || '',
            origin_story: r.origin_story,
            related_values: r.related_values || [],
          })),
          traditions: (parsed.traditions || []).map((t: any, i: number) => ({
            id: `tradition_${Date.now()}_${i}`,
            name: t.name || '',
            description: t.description || '',
            category: t.category || 'social',
            practiced_since: t.practiced_since,
            passed_down_by: t.passed_down_by || '',
            significance: t.significance || '',
            variations: t.variations || [],
          })),
          social_norms: (parsed.social_norms || []).map((n: any, i: number) => ({
            id: `norm_${Date.now()}_${i}`,
            name: n.name || '',
            description: n.description || '',
            severity: n.severity || 'expectation',
            applies_to: n.applies_to || 'all members',
            punishment: n.punishment,
            exceptions: n.exceptions || [],
            related_values: n.related_values || [],
          })),
          taboos: (parsed.taboos || []).map((t: any, i: number) => ({
            id: `taboo_${Date.now()}_${i}`,
            name: t.name || '',
            description: t.description || '',
            origin: t.origin || '',
            punishment: t.punishment || '',
            severity: t.severity || 'serious',
            known_violators: t.known_violators || [],
          })),
          greetings: (parsed.greetings || []).map((g: any, i: number) => ({
            id: `greeting_${Date.now()}_${i}`,
            context: g.context || 'formal',
            greeting: g.greeting || '',
            response: g.response,
            physical_gesture: g.physical_gesture,
            rank_modifiers: g.rank_modifiers || {},
            time_of_day_variants: g.time_of_day_variants || {},
          })),
          honorifics: (parsed.honorifics || []).map((h: any, i: number) => ({
            id: `honorific_${Date.now()}_${i}`,
            title: h.title || '',
            used_for: h.used_for || '',
            placement: h.placement || 'prefix',
            formal_level: h.formal_level || 3,
            gender_variants: h.gender_variants || {},
            historical_origin: h.historical_origin,
          })),
          calendar: {
            faction_id: factionId,
            calendar_system: parsed.calendar?.calendar_system || 'solar',
            year_start: parsed.calendar?.year_start || 'Spring Equinox',
            seasons: parsed.calendar?.seasons || ['Spring', 'Summer', 'Autumn', 'Winter'],
            events: (parsed.calendar?.events || []).map((e: any, i: number) => ({
              id: `event_${Date.now()}_${i}`,
              name: e.name || '',
              description: e.description || '',
              date: e.date || '',
              event_type: e.event_type || 'festival',
              duration_days: e.duration_days || 1,
              activities: e.activities || [],
              traditional_foods: e.traditional_foods || [],
              traditional_dress: e.traditional_dress,
              gifts_exchanged: e.gifts_exchanged || false,
              public_or_private: e.public_or_private || 'members_only',
              related_rituals: e.related_rituals || [],
              historical_significance: e.historical_significance,
            })),
            observances: parsed.calendar?.observances || [],
          },
          cultural_summary: parsed.cultural_summary || '',
          updated_at: new Date().toISOString(),
        };

        onCultureChange(newCulture);
      }
    } catch (parseError) {
      console.error('Failed to parse generated culture:', parseError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(currentCulture, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${factionName.toLowerCase().replace(/\s+/g, '-')}-culture.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyGuidelines = () => {
    const text = behaviorGuidelines.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">{factionName} Culture</h2>
              <p className="text-xs text-slate-500">
                {currentCulture.values.values.length} values · {currentCulture.rituals.length} rituals · {currentCulture.social_norms.length} norms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={handleGenerateFullCulture}
                disabled={isGenerating || cli.isRunning}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate Full Culture
              </button>
            )}
            <button
              onClick={handleExport}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CLI Terminal for AI generation */}
      <InlineTerminal
        {...cli.terminalProps}
        height={150}
        collapsible
        onInsert={handleInsertCulture}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cultural Summary */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <h3 className="text-sm font-medium text-white mb-2">Cultural Summary</h3>
              <textarea
                value={currentCulture.cultural_summary}
                onChange={(e) => handleUpdateCulture({ cultural_summary: e.target.value })}
                disabled={readOnly}
                placeholder="A brief summary of this faction's culture..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm disabled:opacity-50"
              />
            </div>

            {/* Behavior Guidelines */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Behavior Guidelines</h3>
                <button
                  onClick={handleCopyGuidelines}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {behaviorGuidelines.length > 0 ? (
                <ul className="space-y-2">
                  {behaviorGuidelines.map((guideline, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-cyan-500 mt-0.5">•</span>
                      {guideline}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Add values, norms, and rituals to generate behavior guidelines.
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Core Values', count: currentCulture.values.values.filter((v) => v.category === 'core').length, color: 'text-cyan-400' },
                { label: 'Rituals', count: currentCulture.rituals.length, color: 'text-orange-400' },
                { label: 'Taboos', count: currentCulture.taboos.length, color: 'text-red-400' },
                { label: 'Calendar Events', count: currentCulture.calendar.events.length, color: 'text-purple-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/30 rounded-lg p-3 text-center">
                  <div className={cn('text-2xl font-bold', stat.color)}>{stat.count}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'values' && (
          <ValuesEditor
            factionId={factionId}
            factionName={factionName}
            values={currentCulture.values.values}
            corePhilosophy={currentCulture.values.core_philosophy}
            guidingPrinciple={currentCulture.values.guiding_principle}
            onValuesChange={(values) =>
              handleUpdateCulture({
                values: { ...currentCulture.values, values },
              })
            }
            onPhilosophyChange={(philosophy) =>
              handleUpdateCulture({
                values: { ...currentCulture.values, core_philosophy: philosophy },
              })
            }
            onPrincipleChange={(principle) =>
              handleUpdateCulture({
                values: { ...currentCulture.values, guiding_principle: principle },
              })
            }
            readOnly={readOnly}
          />
        )}

        {activeTab === 'rituals' && (
          <RitualDesigner
            factionId={factionId}
            factionName={factionName}
            rituals={currentCulture.rituals}
            valueNames={valueNames}
            onRitualsChange={(rituals) => handleUpdateCulture({ rituals })}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'norms' && (
          <div className="space-y-6">
            {/* Social Norms */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Shield size={16} className="text-blue-400" />
                  Social Norms
                </h3>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newNorm: SocialNorm = {
                        id: generateNormId(),
                        name: 'New Norm',
                        description: '',
                        severity: 'expectation',
                        applies_to: 'all members',
                        related_values: [],
                      };
                      handleUpdateCulture({
                        social_norms: [...currentCulture.social_norms, newNorm],
                      });
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Add Norm
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {currentCulture.social_norms.map((norm) => (
                  <NormCard
                    key={norm.id}
                    norm={norm}
                    onEdit={() => {}}
                    onDelete={() =>
                      handleUpdateCulture({
                        social_norms: currentCulture.social_norms.filter((n) => n.id !== norm.id),
                      })
                    }
                    readOnly={readOnly}
                  />
                ))}
                {currentCulture.social_norms.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No social norms defined yet.</p>
                )}
              </div>
            </div>

            {/* Taboos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  Taboos
                </h3>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newTaboo: Taboo = {
                        id: `taboo_${Date.now()}`,
                        name: 'New Taboo',
                        description: '',
                        origin: '',
                        punishment: '',
                        severity: 'serious',
                      };
                      handleUpdateCulture({
                        taboos: [...currentCulture.taboos, newTaboo],
                      });
                    }}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Add Taboo
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {currentCulture.taboos.map((taboo) => (
                  <TabooCard
                    key={taboo.id}
                    taboo={taboo}
                    onDelete={() =>
                      handleUpdateCulture({
                        taboos: currentCulture.taboos.filter((t) => t.id !== taboo.id),
                      })
                    }
                    readOnly={readOnly}
                  />
                ))}
                {currentCulture.taboos.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No taboos defined yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'greetings' && (
          <div className="space-y-6">
            {/* Greetings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <MessageCircle size={16} className="text-cyan-400" />
                  Greeting Conventions
                </h3>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newGreeting: GreetingConvention = {
                        id: `greeting_${Date.now()}`,
                        context: 'formal',
                        greeting: '',
                      };
                      handleUpdateCulture({
                        greetings: [...currentCulture.greetings, newGreeting],
                      });
                    }}
                    className="text-xs px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                  >
                    Add Greeting
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentCulture.greetings.map((greeting) => (
                  <GreetingCard
                    key={greeting.id}
                    greeting={greeting}
                    onDelete={() =>
                      handleUpdateCulture({
                        greetings: currentCulture.greetings.filter((g) => g.id !== greeting.id),
                      })
                    }
                    readOnly={readOnly}
                  />
                ))}
              </div>
              {currentCulture.greetings.length === 0 && (
                <p className="text-sm text-slate-500 italic">No greetings defined yet.</p>
              )}
            </div>

            {/* Honorifics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Users size={16} className="text-purple-400" />
                  Honorifics & Titles
                </h3>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const newHonorific: Honorific = {
                        id: `honorific_${Date.now()}`,
                        title: '',
                        used_for: '',
                        placement: 'prefix',
                        formal_level: 3,
                      };
                      handleUpdateCulture({
                        honorifics: [...currentCulture.honorifics, newHonorific],
                      });
                    }}
                    className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    Add Honorific
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {currentCulture.honorifics.map((honorific) => (
                  <div
                    key={honorific.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-purple-500/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{honorific.title || 'Untitled'}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded capitalize">
                          {honorific.placement}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Used for: {honorific.used_for || 'Not specified'}</p>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          handleUpdateCulture({
                            honorifics: currentCulture.honorifics.filter((h) => h.id !== honorific.id),
                          })
                        }
                        className="p-1 text-slate-500 hover:text-red-400"
                      >
                        <AlertTriangle size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {currentCulture.honorifics.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No honorifics defined yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CulturalCalendar
            factionId={factionId}
            factionName={factionName}
            calendar={currentCulture.calendar}
            ritualNames={ritualNames}
            onCalendarChange={(calendar) => handleUpdateCulture({ calendar })}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'compatibility' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Handshake className="text-cyan-400" size={20} />
              <h3 className="font-medium text-white">Cultural Compatibility Analysis</h3>
            </div>

            {compatibilities.length > 0 ? (
              <div className="space-y-3">
                {compatibilities.map(({ culture: otherCulture, compatibility }) => (
                  <CompatibilityCard
                    key={otherCulture.faction_id}
                    culture={otherCulture}
                    compatibility={compatibility}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Handshake className="mx-auto mb-3 opacity-50" size={48} />
                <p className="text-sm">No other faction cultures available for comparison.</p>
                <p className="text-xs mt-1">Create cultures for other factions to see compatibility analysis.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CulturePanel;
