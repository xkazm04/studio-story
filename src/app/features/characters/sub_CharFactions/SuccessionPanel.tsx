'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  Users,
  ArrowRight,
  History,
  Camera,
  RotateCcw,
  Award,
  Clock,
  Target,
  Flame,
  Star,
  Sparkles,
  Check,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionHierarchy,
  HierarchyRole,
  HierarchyNode,
  SuccessionRule,
  SuccessionRuleType,
  SuccessionCondition,
  HierarchySnapshot,
  VacancyCrisis,
  SuccessionCandidate,
  SUCCESSION_RULE_CONFIG,
  findVacancies,
  calculateSuccessionCandidates,
  generateRuleId,
  generateSnapshotId,
} from '@/lib/hierarchy/HierarchyEngine';
import { Character } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

interface SuccessionPanelProps {
  hierarchy: FactionHierarchy;
  characters: Character[];
  onHierarchyChange: (hierarchy: FactionHierarchy) => void;
  readOnly?: boolean;
}

interface RuleEditorModalProps {
  rule: SuccessionRule | null;
  isNew: boolean;
  roles: HierarchyRole[];
  onSave: (rule: SuccessionRule) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_ICONS: Record<SuccessionRuleType, React.ReactNode> = {
  hereditary: <Users size={14} />,
  elected: <Award size={14} />,
  appointed: <Target size={14} />,
  seniority: <Clock size={14} />,
  merit: <Star size={14} />,
  combat: <Flame size={14} />,
  divine: <Sparkles size={14} />,
  automatic: <ArrowRight size={14} />,
  custom: <Edit3 size={14} />,
};

const RULE_TYPE_COLORS: Record<SuccessionRuleType, string> = {
  hereditary: 'text-purple-400 bg-purple-500/20',
  elected: 'text-blue-400 bg-blue-500/20',
  appointed: 'text-cyan-400 bg-cyan-500/20',
  seniority: 'text-amber-400 bg-amber-500/20',
  merit: 'text-yellow-400 bg-yellow-500/20',
  combat: 'text-red-400 bg-red-500/20',
  divine: 'text-pink-400 bg-pink-500/20',
  automatic: 'text-green-400 bg-green-500/20',
  custom: 'text-slate-400 bg-slate-500/20',
};

const SEVERITY_CONFIG: Record<VacancyCrisis['severity'], { label: string; color: string }> = {
  minor: { label: 'Minor', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  moderate: { label: 'Moderate', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

// ============================================================================
// Sub-components
// ============================================================================

const VacancyCard: React.FC<{
  vacancy: VacancyCrisis;
  candidates: SuccessionCandidate[];
  onFillVacancy: (characterId: string) => void;
  readOnly?: boolean;
}> = ({ vacancy, candidates, onFillVacancy, readOnly }) => {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = SEVERITY_CONFIG[vacancy.severity];

  return (
    <div className={cn('rounded-lg border p-3', severityConfig.color)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className={severityConfig.color.split(' ')[0]} />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white text-sm">{vacancy.role_name}</h4>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', severityConfig.color)}>
                {severityConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {vacancy.affected_nodes.length} position(s) affected
            </p>
          </div>
        </div>
      </div>

      {vacancy.recommendations.length > 0 && (
        <p className="text-xs text-slate-400 mt-2 italic">
          {vacancy.recommendations[0]}
        </p>
      )}

      {candidates.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-300"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {candidates.length} potential successor(s)
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {candidates.map((candidate) => (
                  <div
                    key={candidate.character_id}
                    className="flex items-center justify-between p-2 bg-slate-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                        <User size={12} className="text-slate-400" />
                      </div>
                      <div>
                        <span className="text-xs text-white">{candidate.character_name}</span>
                        {candidate.current_role && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({candidate.current_role})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-400">
                        Score: {Math.round(candidate.succession_score)}
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => onFillVacancy(candidate.character_id)}
                          className="text-[10px] px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          Appoint
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

const SuccessionRuleCard: React.FC<{
  rule: SuccessionRule;
  role: HierarchyRole | undefined;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ rule, role, onEdit, onDelete, readOnly }) => {
  const typeConfig = SUCCESSION_RULE_CONFIG[rule.rule_type];
  const typeColor = RULE_TYPE_COLORS[rule.rule_type];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className={cn('p-1.5 rounded', typeColor)}>
            {RULE_TYPE_ICONS[rule.rule_type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Priority #{rule.priority}</span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', typeColor)}>
                {typeConfig.label}
              </span>
            </div>
            <p className="text-sm text-white mt-0.5">{rule.description}</p>
            {role && (
              <p className="text-[10px] text-slate-500 mt-1">
                For role: {role.title}
              </p>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1 text-slate-500 hover:text-cyan-400"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-500 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {rule.condition && (
        <div className="mt-2 p-2 bg-slate-900/50 rounded text-[10px] text-slate-400">
          Condition: {rule.condition.type} {rule.condition.comparison || 'equals'} {rule.condition.value}
          {rule.condition.minimum && ` (min: ${rule.condition.minimum})`}
        </div>
      )}
    </div>
  );
};

const SnapshotCard: React.FC<{
  snapshot: HierarchySnapshot;
  onRestore: () => void;
  readOnly?: boolean;
}> = ({ snapshot, onRestore, readOnly }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/30">
      <div className="flex items-center gap-2">
        <Camera size={14} className="text-purple-400" />
        <div>
          <p className="text-xs text-white">{snapshot.description}</p>
          <p className="text-[10px] text-slate-500">
            {new Date(snapshot.timestamp).toLocaleDateString()} - {snapshot.nodes.length} positions
          </p>
        </div>
      </div>
      {!readOnly && (
        <button
          onClick={onRestore}
          className="flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          <RotateCcw size={10} />
          Restore
        </button>
      )}
    </div>
  );
};

const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  rule,
  isNew,
  roles,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SuccessionRule>(
    rule || {
      id: generateRuleId(),
      role_id: roles[0]?.id || '',
      priority: 1,
      rule_type: 'appointed',
      description: '',
    }
  );

  const [hasCondition, setHasCondition] = useState(!!rule?.condition);
  const [condition, setCondition] = useState<SuccessionCondition>(
    rule?.condition || {
      type: 'role_held',
      value: '',
    }
  );

  const handleSave = () => {
    onSave({
      ...formData,
      condition: hasCondition ? condition : undefined,
    });
  };

  const isValid = formData.role_id && formData.description.trim();

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
        className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Crown className="text-amber-400" size={20} />
            {isNew ? 'Add Succession Rule' : 'Edit Rule'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Applies to Role
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Succession Type
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(SUCCESSION_RULE_CONFIG) as SuccessionRuleType[]).map((type) => {
                const isSelected = formData.rule_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, rule_type: type })}
                    className={cn(
                      'flex items-center gap-1 p-2 rounded text-xs transition-colors',
                      isSelected
                        ? RULE_TYPE_COLORS[type]
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {RULE_TYPE_ICONS[type]}
                    <span className="truncate">{SUCCESSION_RULE_CONFIG[type].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Priority (1 = highest)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Math.max(1, +e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe how succession works..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={hasCondition}
                onChange={(e) => setHasCondition(e.target.checked)}
                className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-amber-500"
              />
              <span className="text-sm text-slate-300">Add condition</span>
            </label>

            {hasCondition && (
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Type</label>
                    <select
                      value={condition.type}
                      onChange={(e) =>
                        setCondition({ ...condition, type: e.target.value as SuccessionCondition['type'] })
                      }
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    >
                      <option value="role_held">Role Held</option>
                      <option value="time_served">Time Served</option>
                      <option value="achievement">Achievement</option>
                      <option value="bloodline">Bloodline</option>
                      <option value="age">Age</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Value</label>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => setCondition({ ...condition, value: e.target.value })}
                      placeholder="e.g., direct, 5 years"
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Successor Role (for automatic type) */}
          {formData.rule_type === 'automatic' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Successor From Role
              </label>
              <select
                value={formData.successor_role_id || ''}
                onChange={(e) => setFormData({ ...formData, successor_role_id: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Select Role --</option>
                {roles
                  .filter((r) => r.id !== formData.role_id)
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {isNew ? 'Add Rule' : 'Save Changes'}
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

const SuccessionPanel: React.FC<SuccessionPanelProps> = ({
  hierarchy,
  characters,
  onHierarchyChange,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'vacancies' | 'rules' | 'history'>('vacancies');
  const [editingRule, setEditingRule] = useState<SuccessionRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [snapshotDescription, setSnapshotDescription] = useState('');

  // Calculate vacancies
  const vacancies = useMemo(
    () => findVacancies(hierarchy.nodes, hierarchy.roles),
    [hierarchy.nodes, hierarchy.roles]
  );

  // Calculate candidates for each vacancy
  const vacanciesWithCandidates = useMemo(() => {
    return vacancies.map((vacancy) => {
      const characterData = characters.map((c) => {
        const node = hierarchy.nodes.find((n) => n.character_id === c.id);
        const role = node ? hierarchy.roles.find((r) => r.id === node.role_id) : undefined;
        return {
          id: c.id,
          name: c.name,
          role_id: role?.id,
        };
      });

      const candidates = calculateSuccessionCandidates(
        vacancy.role_id,
        hierarchy.nodes,
        hierarchy.roles,
        hierarchy.succession_rules,
        characterData
      );

      return { vacancy, candidates };
    });
  }, [vacancies, hierarchy, characters]);

  // Group rules by role
  const rulesByRole = useMemo(() => {
    const grouped = new Map<string, SuccessionRule[]>();
    hierarchy.succession_rules.forEach((rule) => {
      const existing = grouped.get(rule.role_id) || [];
      grouped.set(rule.role_id, [...existing, rule].sort((a, b) => a.priority - b.priority));
    });
    return grouped;
  }, [hierarchy.succession_rules]);

  const handleAddRule = () => {
    setIsNewRule(true);
    setEditingRule(null);
  };

  const handleEditRule = (rule: SuccessionRule) => {
    setIsNewRule(false);
    setEditingRule(rule);
  };

  const handleSaveRule = (rule: SuccessionRule) => {
    let updatedRules: SuccessionRule[];

    if (isNewRule) {
      updatedRules = [...hierarchy.succession_rules, rule];
    } else {
      updatedRules = hierarchy.succession_rules.map((r) => (r.id === rule.id ? rule : r));
    }

    onHierarchyChange({
      ...hierarchy,
      succession_rules: updatedRules,
      updated_at: new Date().toISOString(),
    });

    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!confirm('Delete this succession rule?')) return;

    onHierarchyChange({
      ...hierarchy,
      succession_rules: hierarchy.succession_rules.filter((r) => r.id !== ruleId),
      updated_at: new Date().toISOString(),
    });
  };

  const handleFillVacancy = (roleId: string, characterId: string) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    // Find the vacant node
    const vacantNode = hierarchy.nodes.find(
      (n) => n.role_id === roleId && n.is_vacant
    );
    if (!vacantNode) return;

    const updatedNodes = hierarchy.nodes.map((n) => {
      if (n.id === vacantNode.id) {
        return {
          ...n,
          character_id: character.id,
          character_name: character.name,
          character_avatar: character.avatar_url,
          is_vacant: false,
          appointed_at: new Date().toISOString(),
        };
      }
      return n;
    });

    onHierarchyChange({
      ...hierarchy,
      nodes: updatedNodes,
      updated_at: new Date().toISOString(),
    });
  };

  const handleCreateSnapshot = () => {
    if (!snapshotDescription.trim()) return;

    const snapshot: HierarchySnapshot = {
      id: generateSnapshotId(),
      faction_id: hierarchy.faction_id,
      timestamp: new Date().toISOString(),
      description: snapshotDescription,
      nodes: JSON.parse(JSON.stringify(hierarchy.nodes)),
    };

    onHierarchyChange({
      ...hierarchy,
      snapshots: [...hierarchy.snapshots, snapshot],
      updated_at: new Date().toISOString(),
    });

    setSnapshotDescription('');
  };

  const handleRestoreSnapshot = (snapshotId: string) => {
    const snapshot = hierarchy.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    if (!confirm(`Restore organization to "${snapshot.description}"? Current structure will be replaced.`)) {
      return;
    }

    onHierarchyChange({
      ...hierarchy,
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <Crown size={16} className="text-amber-400" />
            Succession & History
          </span>

          {vacancies.length > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
              <AlertTriangle size={12} />
              {vacancies.length} vacanc{vacancies.length === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('vacancies')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs rounded transition-colors',
              activeTab === 'vacancies'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            Vacancies ({vacancies.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs rounded transition-colors',
              activeTab === 'rules'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            Rules ({hierarchy.succession_rules.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs rounded transition-colors',
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            History ({hierarchy.snapshots.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'vacancies' && (
          <div className="space-y-2">
            {vacanciesWithCandidates.map(({ vacancy, candidates }) => (
              <VacancyCard
                key={vacancy.role_id}
                vacancy={vacancy}
                candidates={candidates}
                onFillVacancy={(charId) => handleFillVacancy(vacancy.role_id, charId)}
                readOnly={readOnly}
              />
            ))}

            {vacancies.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Check className="mx-auto mb-2 text-green-400" size={32} />
                <p className="text-sm">All positions are filled</p>
                <p className="text-xs mt-1">No succession crises detected</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            {!readOnly && (
              <button
                onClick={handleAddRule}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                <Plus size={14} />
                Add Succession Rule
              </button>
            )}

            {hierarchy.roles.map((role) => {
              const roleRules = rulesByRole.get(role.id) || [];
              if (roleRules.length === 0 && readOnly) return null;

              return (
                <div key={role.id}>
                  <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Crown size={12} className="text-amber-400" />
                    {role.title}
                    <span className="text-slate-600">({roleRules.length} rules)</span>
                  </h4>

                  <div className="space-y-2 pl-4">
                    {roleRules.map((rule) => (
                      <SuccessionRuleCard
                        key={rule.id}
                        rule={rule}
                        role={role}
                        onEdit={() => handleEditRule(rule)}
                        onDelete={() => handleDeleteRule(rule.id)}
                        readOnly={readOnly}
                      />
                    ))}

                    {roleRules.length === 0 && (
                      <p className="text-xs text-slate-600 italic">No succession rules defined</p>
                    )}
                  </div>
                </div>
              );
            })}

            {hierarchy.roles.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">
                Add roles first to define succession rules
              </p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Create snapshot */}
            {!readOnly && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Save current organization state</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={snapshotDescription}
                    onChange={(e) => setSnapshotDescription(e.target.value)}
                    placeholder="Snapshot description..."
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 text-sm"
                  />
                  <button
                    onClick={handleCreateSnapshot}
                    disabled={!snapshotDescription.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded text-sm"
                  >
                    <Camera size={14} />
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Snapshot list */}
            <div className="space-y-2">
              {[...hierarchy.snapshots]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((snapshot) => (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    onRestore={() => handleRestoreSnapshot(snapshot.id)}
                    readOnly={readOnly}
                  />
                ))}

              {hierarchy.snapshots.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <History className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-sm">No snapshots saved</p>
                  <p className="text-xs mt-1">
                    Create snapshots to track organizational changes over time
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rule Editor Modal */}
      <AnimatePresence>
        {(editingRule !== null || isNewRule) && (
          <RuleEditorModal
            rule={editingRule}
            isNew={isNewRule}
            roles={hierarchy.roles}
            onSave={handleSaveRule}
            onCancel={() => {
              setEditingRule(null);
              setIsNewRule(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuccessionPanel;
