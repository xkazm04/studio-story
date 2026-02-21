'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake,
  Scroll,
  Swords,
  Target,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Send,
  Shield,
  Heart,
  Scale,
  Flag,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Faction } from '@/app/types/Faction';
import {
  FactionRelationship,
  FactionPolitics,
  DiplomaticAction,
  DiplomaticActionType,
  Treaty,
  PoliticalGoal,
  FactionSecret,
  RelationshipPrediction,
  RELATIONSHIP_TYPE_CONFIG,
  DIPLOMATIC_ACTION_CONFIG,
  POLITICAL_STANCE_CONFIG,
  getAvailableDiplomaticActions,
  generateTreatyId,
  generateGoalId,
  generateSecretId,
} from '@/lib/politics/PoliticsEngine';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface DiplomacyPanelProps {
  faction: Faction;
  factionPolitics: FactionPolitics | null;
  relationships: FactionRelationship[];
  allFactions: Faction[];
  onUpdatePolitics?: (updates: Partial<FactionPolitics>) => void;
  onExecuteAction?: (action: DiplomaticAction) => void;
  onAddTreaty?: (relationshipId: string, treaty: Treaty) => void;
  onBreakTreaty?: (relationshipId: string, treatyId: string) => void;
  onAddGoal?: (goal: PoliticalGoal) => void;
  onRemoveGoal?: (goalId: string) => void;
  onAddSecret?: (secret: FactionSecret) => void;
  onRevealSecret?: (secretId: string) => void;
  predictions?: Map<string, RelationshipPrediction>;
  readOnly?: boolean;
}

type TabView = 'overview' | 'actions' | 'treaties' | 'goals' | 'secrets';

// ============================================================================
// Sub-Components
// ============================================================================

interface RelationshipSummaryProps {
  relationship: FactionRelationship;
  otherFaction: Faction | undefined;
  prediction?: RelationshipPrediction;
  onClick?: () => void;
}

const RelationshipSummary: React.FC<RelationshipSummaryProps> = ({
  relationship,
  otherFaction,
  prediction,
  onClick,
}) => {
  const config = RELATIONSHIP_TYPE_CONFIG[relationship.relationship_type];
  const activeTreaties = relationship.treaties.filter((t) => t.is_active);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg p-3 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <div>
            <div className="font-medium text-white">{otherFaction?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500" style={{ color: config.color }}>
              {config.label} ({relationship.relationship_value})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!relationship.is_public && (
            <span title="Secret relationship">
              <EyeOff size={14} className="text-amber-400" />
            </span>
          )}
          {activeTreaties.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              <Scroll size={12} />
              {activeTreaties.length}
            </div>
          )}
          {prediction && (
            <div className="flex items-center">
              {prediction.change_direction === 'improving' && (
                <TrendingUp size={14} className="text-green-400" />
              )}
              {prediction.change_direction === 'worsening' && (
                <TrendingDown size={14} className="text-red-400" />
              )}
              {prediction.change_direction === 'stable' && (
                <Minus size={14} className="text-gray-400" />
              )}
            </div>
          )}
          <ChevronRight size={16} className="text-gray-500" />
        </div>
      </div>
    </button>
  );
};

interface DiplomaticActionCardProps {
  action: DiplomaticAction;
  targetFaction: Faction | undefined;
  onExecute?: () => void;
  disabled?: boolean;
}

const DiplomaticActionCard: React.FC<DiplomaticActionCardProps> = ({
  action,
  targetFaction,
  onExecute,
  disabled = false,
}) => {
  const config = DIPLOMATIC_ACTION_CONFIG[action.action_type];

  const getActionIcon = (type: DiplomaticActionType) => {
    switch (type) {
      case 'propose_alliance':
        return <Handshake size={16} />;
      case 'propose_trade':
        return <Scale size={16} />;
      case 'declare_war':
        return <Swords size={16} />;
      case 'propose_peace':
        return <Heart size={16} />;
      case 'send_aid':
        return <Shield size={16} />;
      case 'send_spy':
        return <Eye size={16} />;
      case 'demand_tribute':
        return <Flag size={16} />;
      default:
        return <Send size={16} />;
    }
  };

  const successColor =
    action.success_chance >= 70
      ? 'text-green-400'
      : action.success_chance >= 40
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
            {getActionIcon(action.action_type)}
          </div>
          <div>
            <div className="font-medium text-white">{config.label}</div>
            <div className="text-xs text-gray-500">Target: {targetFaction?.name || 'Unknown'}</div>
          </div>
        </div>
        <div className={cn('text-sm font-medium', successColor)}>
          {action.success_chance}% success
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-3">{action.description}</p>

      {action.cost && (
        <div className="mt-2 text-xs text-amber-400">
          Cost: {action.cost.amount} {action.cost.type}
        </div>
      )}

      {/* Potential Outcomes */}
      <div className="mt-3 space-y-2">
        {action.potential_outcomes.map((outcome, index) => (
          <div
            key={index}
            className={cn(
              'text-xs p-2 rounded',
              outcome.relationship_change >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'
            )}
          >
            <div className="flex items-center justify-between">
              <span className={outcome.relationship_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                {outcome.description}
              </span>
              <span className="text-gray-500">{outcome.probability}%</span>
            </div>
          </div>
        ))}
      </div>

      {onExecute && (
        <button
          type="button"
          onClick={onExecute}
          disabled={disabled}
          className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          Execute Action
        </button>
      )}
    </div>
  );
};

interface TreatyCardProps {
  treaty: Treaty;
  otherFaction: Faction | undefined;
  onBreak?: () => void;
  readOnly?: boolean;
}

const TreatyCard: React.FC<TreatyCardProps> = ({ treaty, otherFaction, onBreak, readOnly }) => {
  const isExpired = treaty.expires_at && new Date(treaty.expires_at) < new Date();
  const typeColors: Record<string, string> = {
    alliance: 'text-green-400 bg-green-900/20',
    mutual_defense: 'text-blue-400 bg-blue-900/20',
    trade: 'text-amber-400 bg-amber-900/20',
    non_aggression: 'text-cyan-400 bg-cyan-900/20',
    vassalage: 'text-purple-400 bg-purple-900/20',
    tribute: 'text-orange-400 bg-orange-900/20',
    ceasefire: 'text-gray-400 bg-gray-700/50',
  };

  return (
    <div
      className={cn(
        'bg-gray-800/50 border rounded-lg p-4',
        treaty.is_active && !isExpired ? 'border-gray-700' : 'border-gray-800 opacity-60'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Scroll size={20} className="text-cyan-400" />
          <div>
            <div className="font-medium text-white">{treaty.name}</div>
            <div className="text-xs text-gray-500">
              with {otherFaction?.name || 'Unknown'}
            </div>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded text-xs', typeColors[treaty.type])}>
          {treaty.type.replace('_', ' ')}
        </span>
      </div>

      {/* Terms */}
      {treaty.terms.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Terms:</div>
          <ul className="space-y-1">
            {treaty.terms.map((term, index) => (
              <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-gray-600">•</span>
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {treaty.is_active && !isExpired ? (
            <CheckCircle size={12} className="text-green-400" />
          ) : (
            <XCircle size={12} className="text-red-400" />
          )}
          <span className={treaty.is_active && !isExpired ? 'text-green-400' : 'text-red-400'}>
            {isExpired ? 'Expired' : treaty.is_active ? 'Active' : 'Broken'}
          </span>
          {treaty.broken_by && (
            <span className="text-gray-500">by {treaty.broken_by}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Clock size={12} />
          {new Date(treaty.signed_at).toLocaleDateString()}
          {treaty.expires_at && ` - ${new Date(treaty.expires_at).toLocaleDateString()}`}
        </div>
      </div>

      {/* Break Treaty Button */}
      {!readOnly && treaty.is_active && !isExpired && onBreak && (
        <button
          type="button"
          onClick={onBreak}
          className="mt-3 w-full px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded text-xs transition-colors"
        >
          Break Treaty
        </button>
      )}
    </div>
  );
};

interface GoalCardProps {
  goal: PoliticalGoal;
  targetFaction: Faction | undefined;
  onRemove?: () => void;
  readOnly?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, targetFaction, onRemove, readOnly }) => {
  const typeIcons: Record<string, React.ReactNode> = {
    expansion: <Flag size={16} />,
    defense: <Shield size={16} />,
    alliance: <Handshake size={16} />,
    revenge: <Target size={16} />,
    dominance: <Swords size={16} />,
    survival: <AlertTriangle size={16} />,
    trade: <Scale size={16} />,
    influence: <TrendingUp size={16} />,
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-400">
            {typeIcons[goal.goal_type] || <Target size={16} />}
          </div>
          <div>
            <div className="font-medium text-white capitalize">{goal.goal_type}</div>
            {targetFaction && (
              <div className="text-xs text-gray-500">Target: {targetFaction.name}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!goal.is_public && <EyeOff size={14} className="text-amber-400" />}
          <span className="text-xs text-gray-500">Priority: {goal.priority}</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-400">{goal.description}</p>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{goal.progress}%</span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove Goal
        </button>
      )}
    </div>
  );
};

interface SecretCardProps {
  secret: FactionSecret;
  onReveal?: () => void;
  readOnly?: boolean;
}

const SecretCard: React.FC<SecretCardProps> = ({ secret, onReveal, readOnly }) => {
  const typeColors: Record<string, string> = {
    alliance: 'text-green-400',
    betrayal_plan: 'text-red-400',
    weakness: 'text-amber-400',
    infiltration: 'text-purple-400',
    scheme: 'text-cyan-400',
  };

  return (
    <div
      className={cn(
        'bg-gray-800/50 border rounded-lg p-4',
        secret.revealed ? 'border-gray-800 opacity-60' : 'border-amber-500/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {secret.revealed ? (
            <Eye size={20} className="text-gray-400" />
          ) : (
            <EyeOff size={20} className="text-amber-400" />
          )}
          <div>
            <div className={cn('font-medium capitalize', typeColors[secret.secret_type] || 'text-white')}>
              {secret.secret_type.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-500">
              Known by: {secret.known_by.length === 0 ? 'None' : `${secret.known_by.length} faction(s)`}
            </div>
          </div>
        </div>
        {secret.revealed && (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
            Revealed
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-400">{secret.description}</p>

      {secret.reveal_impact && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-300">
          <strong>If revealed:</strong> {secret.reveal_impact}
        </div>
      )}

      {!readOnly && !secret.revealed && onReveal && (
        <button
          type="button"
          onClick={onReveal}
          className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Reveal Secret
        </button>
      )}
    </div>
  );
};

interface AddGoalFormProps {
  factions: Faction[];
  onAdd: (goal: PoliticalGoal) => void;
  onCancel: () => void;
}

const AddGoalForm: React.FC<AddGoalFormProps> = ({ factions, onAdd, onCancel }) => {
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<PoliticalGoal['goal_type']>('influence');
  const [priority, setPriority] = useState(5);
  const [targetFactionId, setTargetFactionId] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAdd({
      id: generateGoalId(),
      description: description.trim(),
      goal_type: goalType,
      priority,
      target_faction_id: targetFactionId || undefined,
      progress: 0,
      is_public: isPublic,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-800/50 border border-amber-500/30 rounded-lg p-4 space-y-4"
    >
      <div>
        <label className="block text-sm text-gray-300 mb-1">Goal Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the political goal..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Type</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as PoliticalGoal['goal_type'])}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="expansion">Expansion</option>
            <option value="defense">Defense</option>
            <option value="alliance">Alliance</option>
            <option value="revenge">Revenge</option>
            <option value="dominance">Dominance</option>
            <option value="survival">Survival</option>
            <option value="trade">Trade</option>
            <option value="influence">Influence</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Priority (1-10)</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Math.max(1, Math.min(10, Number(e.target.value))))}
            min={1}
            max={10}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Target Faction (Optional)</label>
        <select
          value={targetFactionId}
          onChange={(e) => setTargetFactionId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">No specific target</option>
          {factions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500"
        />
        Publicly known goal
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!description.trim()}
          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Add Goal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

interface AddSecretFormProps {
  factions: Faction[];
  onAdd: (secret: FactionSecret) => void;
  onCancel: () => void;
}

const AddSecretForm: React.FC<AddSecretFormProps> = ({ factions, onAdd, onCancel }) => {
  const [description, setDescription] = useState('');
  const [secretType, setSecretType] = useState<FactionSecret['secret_type']>('scheme');
  const [revealImpact, setRevealImpact] = useState('');
  const [knownBy, setKnownBy] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAdd({
      id: generateSecretId(),
      secret_type: secretType,
      description: description.trim(),
      known_by: knownBy,
      revealed: false,
      reveal_impact: revealImpact.trim(),
    });
  };

  const toggleKnownBy = (factionId: string) => {
    setKnownBy((prev) =>
      prev.includes(factionId)
        ? prev.filter((id) => id !== factionId)
        : [...prev, factionId]
    );
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 space-y-4"
    >
      <div>
        <label className="block text-sm text-gray-300 mb-1">Secret Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the secret..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Secret Type</label>
        <select
          value={secretType}
          onChange={(e) => setSecretType(e.target.value as FactionSecret['secret_type'])}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="alliance">Secret Alliance</option>
          <option value="betrayal_plan">Betrayal Plan</option>
          <option value="weakness">Hidden Weakness</option>
          <option value="infiltration">Infiltration</option>
          <option value="scheme">Scheme</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Impact if Revealed</label>
        <input
          type="text"
          value={revealImpact}
          onChange={(e) => setRevealImpact(e.target.value)}
          placeholder="What happens when this secret is revealed?"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Known By</label>
        <div className="flex flex-wrap gap-2">
          {factions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleKnownBy(f.id)}
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                knownBy.includes(f.id)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!description.trim()}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Add Secret
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const DiplomacyPanel: React.FC<DiplomacyPanelProps> = ({
  faction,
  factionPolitics,
  relationships,
  allFactions,
  onUpdatePolitics,
  onExecuteAction,
  onAddTreaty,
  onBreakTreaty,
  onAddGoal,
  onRemoveGoal,
  onAddSecret,
  onRevealSecret,
  predictions,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddSecret, setShowAddSecret] = useState(false);

  // Get faction map for quick lookup
  const factionMap = useMemo(() => {
    const map = new Map<string, Faction>();
    allFactions.forEach((f) => map.set(f.id, f));
    return map;
  }, [allFactions]);

  // Get relationships for this faction
  const factionRelationships = useMemo(() => {
    return relationships.filter(
      (r) => r.faction_a_id === faction.id || r.faction_b_id === faction.id
    );
  }, [relationships, faction.id]);

  // Get available diplomatic actions for selected faction
  const availableActions = useMemo(() => {
    if (!selectedFactionId || !factionPolitics) return [];
    const relationship = factionRelationships.find(
      (r) =>
        (r.faction_a_id === faction.id && r.faction_b_id === selectedFactionId) ||
        (r.faction_b_id === faction.id && r.faction_a_id === selectedFactionId)
    );
    return getAvailableDiplomaticActions(faction.id, selectedFactionId, relationship, factionPolitics);
  }, [selectedFactionId, factionPolitics, faction.id, factionRelationships]);

  // Get all treaties across relationships
  const allTreaties = useMemo(() => {
    const treaties: Array<{ treaty: Treaty; relationship: FactionRelationship; otherFactionId: string }> = [];
    factionRelationships.forEach((rel) => {
      const otherFactionId = rel.faction_a_id === faction.id ? rel.faction_b_id : rel.faction_a_id;
      rel.treaties.forEach((treaty) => {
        treaties.push({ treaty, relationship: rel, otherFactionId });
      });
    });
    return treaties.sort((a, b) => {
      if (a.treaty.is_active !== b.treaty.is_active) return a.treaty.is_active ? -1 : 1;
      return new Date(b.treaty.signed_at).getTime() - new Date(a.treaty.signed_at).getTime();
    });
  }, [factionRelationships, faction.id]);

  const handleAddGoal = (goal: PoliticalGoal) => {
    onAddGoal?.(goal);
    setShowAddGoal(false);
  };

  const handleAddSecret = (secret: FactionSecret) => {
    onAddSecret?.(secret);
    setShowAddSecret(false);
  };

  if (!factionPolitics) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="text-center text-gray-500">
          <Handshake size={32} className="mx-auto mb-2 opacity-50" />
          <p>No political profile for {faction.name}</p>
          {!readOnly && (
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Initialize Diplomacy
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-amber-900/30 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="text-purple-400" size={20} />
              Diplomacy
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{faction.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-3 py-1 rounded-lg text-sm',
                POLITICAL_STANCE_CONFIG[factionPolitics.political_stance]?.color
                  ? `bg-opacity-20`
                  : 'bg-gray-800'
              )}
              style={{
                backgroundColor: `${POLITICAL_STANCE_CONFIG[factionPolitics.political_stance]?.color}20`,
                color: POLITICAL_STANCE_CONFIG[factionPolitics.political_stance]?.color,
              }}
            >
              {POLITICAL_STANCE_CONFIG[factionPolitics.political_stance]?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['overview', 'actions', 'treaties', 'goals', 'secrets'] as TabView[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 min-w-[80px] px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Reputation Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-white">{factionPolitics.diplomatic_reputation}</div>
                  <div className="text-xs text-gray-500">Reputation</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-white">{factionPolitics.trustworthiness}</div>
                  <div className="text-xs text-gray-500">Trustworthiness</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-white">{factionPolitics.aggression_level}</div>
                  <div className="text-xs text-gray-500">Aggression</div>
                </div>
              </div>

              {/* Relationships */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Relationships</h4>
                {factionRelationships.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No diplomatic relationships established
                  </div>
                ) : (
                  <div className="space-y-2">
                    {factionRelationships.map((rel) => {
                      const otherFactionId =
                        rel.faction_a_id === faction.id ? rel.faction_b_id : rel.faction_a_id;
                      return (
                        <RelationshipSummary
                          key={rel.id}
                          relationship={rel}
                          otherFaction={factionMap.get(otherFactionId)}
                          prediction={predictions?.get(otherFactionId)}
                          onClick={() => {
                            setSelectedFactionId(otherFactionId);
                            setActiveTab('actions');
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="text-gray-500 mb-1">Active Treaties</div>
                  <div className="text-white font-medium">
                    {allTreaties.filter((t) => t.treaty.is_active).length}
                  </div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="text-gray-500 mb-1">Political Goals</div>
                  <div className="text-white font-medium">{factionPolitics.goals.length}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Target Selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Target Faction</label>
                <select
                  value={selectedFactionId || ''}
                  onChange={(e) => setSelectedFactionId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a faction...</option>
                  {allFactions
                    .filter((f) => f.id !== faction.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Available Actions */}
              {selectedFactionId ? (
                availableActions.length > 0 ? (
                  <div className="space-y-3">
                    {availableActions.map((action) => (
                      <DiplomaticActionCard
                        key={action.id}
                        action={action}
                        targetFaction={factionMap.get(selectedFactionId)}
                        onExecute={
                          !readOnly && onExecuteAction ? () => onExecuteAction(action) : undefined
                        }
                        disabled={readOnly}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No diplomatic actions available for this faction
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a faction to see available diplomatic actions
                </div>
              )}
            </motion.div>
          )}

          {/* Treaties Tab */}
          {activeTab === 'treaties' && (
            <motion.div
              key="treaties"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {allTreaties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scroll size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No treaties signed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTreaties.map(({ treaty, relationship, otherFactionId }) => (
                    <TreatyCard
                      key={treaty.id}
                      treaty={treaty}
                      otherFaction={factionMap.get(otherFactionId)}
                      onBreak={
                        !readOnly && onBreakTreaty
                          ? () => onBreakTreaty(relationship.id, treaty.id)
                          : undefined
                      }
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!readOnly && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-sm transition-colors"
                  >
                    <Plus size={14} />
                    Add Goal
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showAddGoal && (
                  <AddGoalForm
                    factions={allFactions.filter((f) => f.id !== faction.id)}
                    onAdd={handleAddGoal}
                    onCancel={() => setShowAddGoal(false)}
                  />
                )}
              </AnimatePresence>

              {factionPolitics.goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No political goals defined</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {factionPolitics.goals
                    .sort((a, b) => b.priority - a.priority)
                    .map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        targetFaction={goal.target_faction_id ? factionMap.get(goal.target_faction_id) : undefined}
                        onRemove={!readOnly && onRemoveGoal ? () => onRemoveGoal(goal.id) : undefined}
                        readOnly={readOnly}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Secrets Tab */}
          {activeTab === 'secrets' && (
            <motion.div
              key="secrets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!readOnly && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddSecret(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm transition-colors"
                  >
                    <Plus size={14} />
                    Add Secret
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showAddSecret && (
                  <AddSecretForm
                    factions={allFactions.filter((f) => f.id !== faction.id)}
                    onAdd={handleAddSecret}
                    onCancel={() => setShowAddSecret(false)}
                  />
                )}
              </AnimatePresence>

              {factionPolitics.secrets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <EyeOff size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No secrets recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {factionPolitics.secrets
                    .sort((a, b) => (a.revealed === b.revealed ? 0 : a.revealed ? 1 : -1))
                    .map((secret) => (
                      <SecretCard
                        key={secret.id}
                        secret={secret}
                        onReveal={!readOnly && onRevealSecret ? () => onRevealSecret(secret.id) : undefined}
                        readOnly={readOnly}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Enhancement */}
      {!readOnly && (
        <div className="p-4 border-t border-gray-800">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-amber-600/20 hover:from-purple-600/30 hover:to-amber-600/30 border border-purple-500/30 text-purple-300 rounded-lg transition-colors"
          >
            <Sparkles size={16} />
            Generate Diplomatic Scenario
          </button>
        </div>
      )}
    </div>
  );
};

export default DiplomacyPanel;
