'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Shield,
  Copy,
  Check,
  X,
  Loader2,
  Search,
  Crown,
  Users,
  Briefcase,
  Church,
  Sword,
  Building2,
  Flame,
  Tent,
  Settings,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionHierarchy,
  HierarchyRole,
  RoleTemplate,
  OrganizationType,
  RolePermission,
  ROLE_TEMPLATES,
  ORGANIZATION_TYPE_CONFIG,
  ROLE_PERMISSION_CONFIG,
  generateRoleId,
} from '@/lib/hierarchy/HierarchyEngine';

// ============================================================================
// Types
// ============================================================================

interface RoleTemplateLibraryProps {
  hierarchy: FactionHierarchy;
  onHierarchyChange: (hierarchy: FactionHierarchy) => void;
  readOnly?: boolean;
}

interface RoleEditorModalProps {
  role: HierarchyRole | null;
  isNew: boolean;
  existingLevels: number[];
  onSave: (role: HierarchyRole) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const ORG_TYPE_ICONS: Record<OrganizationType, React.ReactNode> = {
  military: <Sword size={16} />,
  corporate: <Briefcase size={16} />,
  guild: <Users size={16} />,
  religious: <Church size={16} />,
  noble: <Crown size={16} />,
  tribal: <Tent size={16} />,
  custom: <Settings size={16} />,
};

// ============================================================================
// Sub-components
// ============================================================================

const TemplateCard: React.FC<{
  template: RoleTemplate;
  onApply: () => void;
  isApplying: boolean;
}> = ({ template, onApply, isApplying }) => {
  const [expanded, setExpanded] = useState(false);
  const config = ORGANIZATION_TYPE_CONFIG[template.organization_type];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              {ORG_TYPE_ICONS[template.organization_type]}
            </div>
            <div>
              <h4 className="font-medium text-white text-sm">{template.name}</h4>
              <p className="text-xs text-slate-500">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onApply}
            disabled={isApplying}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded transition-colors"
          >
            {isApplying ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Copy size={12} />
            )}
            Apply
          </button>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-300"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {template.roles.length} roles
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
            <div className="p-3 space-y-2">
              {template.roles.map((role, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-slate-900/50 rounded"
                >
                  {role.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-white">{role.title}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      Level {role.level}
                    </span>
                  </div>
                  {role.permissions.length > 0 && (
                    <span className="text-[10px] text-slate-600">
                      {role.permissions.length} perms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RoleCard: React.FC<{
  role: HierarchyRole;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ role, onEdit, onDelete, readOnly }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
      style={{ borderLeftColor: role.color || undefined, borderLeftWidth: role.color ? 3 : 1 }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className={cn(
              'p-2 rounded-lg',
              role.level === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
            )}>
              {role.level === 0 ? <Crown size={16} /> : <Shield size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white text-sm">{role.title}</h4>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                  Level {role.level}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-1 text-slate-500 hover:text-cyan-400"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-slate-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-300"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {role.permissions.length} permissions, {role.responsibilities.length} responsibilities
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
            <div className="p-3 space-y-3">
              {/* Permissions */}
              {role.permissions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Permissions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded"
                      >
                        {ROLE_PERMISSION_CONFIG[perm].label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {role.responsibilities.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Responsibilities
                  </p>
                  <ul className="space-y-0.5">
                    {role.responsibilities.map((resp, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                        <span className="text-cyan-500">•</span>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {role.requirements && role.requirements.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Requirements
                  </p>
                  <ul className="space-y-0.5">
                    {role.requirements.map((req, i) => (
                      <li key={i} className="text-xs text-amber-400 flex items-start gap-1">
                        <AlertTriangle size={10} className="mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Multi-holder info */}
              {role.can_have_multiple && (
                <p className="text-[10px] text-slate-500">
                  Can have multiple holders
                  {role.max_holders && ` (max: ${role.max_holders})`}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
  role,
  isNew,
  existingLevels,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<HierarchyRole>(
    role || {
      id: generateRoleId(),
      name: '',
      title: '',
      level: Math.max(0, ...existingLevels) + 1,
      description: '',
      responsibilities: [],
      permissions: [],
      can_have_multiple: true,
      color: '#6366f1',
    }
  );
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  const handleAddResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, responsibilityInput.trim()],
      });
      setResponsibilityInput('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index),
    });
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirementInput.trim()],
      });
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index),
    });
  };

  const togglePermission = (perm: RolePermission) => {
    const current = formData.permissions;
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter((p) => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  const isValid = formData.title.trim() && formData.name.trim();

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
            <Shield className="text-cyan-400" size={20} />
            {isNew ? 'Create Role' : 'Edit Role'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name & Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Internal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., captain"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Display Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Captain"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>
          </div>

          {/* Level & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Hierarchy Level
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: Math.max(0, +e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1">0 = highest (leader), higher = lower rank</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color || '#6366f1'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color || '#6366f1'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this role..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
            />
          </div>

          {/* Multi-holder settings */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_have_multiple}
                onChange={(e) => setFormData({ ...formData, can_have_multiple: e.target.checked })}
                className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-cyan-500"
              />
              <span className="text-sm text-slate-300">Multiple holders allowed</span>
            </label>
            {formData.can_have_multiple && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Max:</span>
                <input
                  type="number"
                  min={2}
                  value={formData.max_holders || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    max_holders: e.target.value ? +e.target.value : undefined,
                  })}
                  placeholder="∞"
                  className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
              </div>
            )}
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {(Object.keys(ROLE_PERMISSION_CONFIG) as RolePermission[]).map((perm) => {
                const isSelected = formData.permissions.includes(perm);
                return (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {isSelected && <Check size={12} />}
                    <span className="truncate">{ROLE_PERMISSION_CONFIG[perm].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Responsibilities
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResponsibility())}
                placeholder="Add responsibility..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.responsibilities.map((resp, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-2 py-1 rounded"
                >
                  <span className="flex-1">{resp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResponsibility(i)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Requirements (optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                placeholder="Add requirement..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.requirements?.map((req, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 px-2 py-1 rounded"
                >
                  <AlertTriangle size={12} />
                  <span className="flex-1">{req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(i)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={() => onSave(formData)}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {isNew ? 'Create Role' : 'Save Changes'}
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

const RoleTemplateLibrary: React.FC<RoleTemplateLibraryProps> = ({
  hierarchy,
  onHierarchyChange,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'roles'>('roles');
  const [editingRole, setEditingRole] = useState<HierarchyRole | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Existing role levels for new role defaults
  const existingLevels = useMemo(
    () => hierarchy.roles.map((r) => r.level),
    [hierarchy.roles]
  );

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return ROLE_TEMPLATES;
    return ROLE_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!searchQuery) return hierarchy.roles;
    return hierarchy.roles.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hierarchy.roles, searchQuery]);

  const handleApplyTemplate = async (template: RoleTemplate) => {
    if (!confirm(`Apply "${template.name}" template? This will replace existing roles.`)) {
      return;
    }

    setIsApplying(true);

    // Map template roles to actual roles with IDs
    const newRoles: HierarchyRole[] = template.roles.map((role) => ({
      ...role,
      id: generateRoleId(),
    }));

    // Update reports_to references to use new IDs
    const roleNameToId = new Map<string, string>();
    newRoles.forEach((role) => {
      roleNameToId.set(role.name, role.id);
    });

    const rolesWithUpdatedRefs = newRoles.map((role) => ({
      ...role,
      reports_to: role.reports_to ? roleNameToId.get(role.reports_to) : undefined,
    }));

    onHierarchyChange({
      ...hierarchy,
      organization_type: template.organization_type,
      roles: rolesWithUpdatedRefs,
      nodes: [], // Clear nodes when applying template
      succession_rules: [], // Clear succession rules
      updated_at: new Date().toISOString(),
    });

    setIsApplying(false);
    setActiveTab('roles');
  };

  const handleAddRole = () => {
    setIsNewRole(true);
    setEditingRole(null);
  };

  const handleEditRole = (role: HierarchyRole) => {
    setIsNewRole(false);
    setEditingRole(role);
  };

  const handleSaveRole = (role: HierarchyRole) => {
    let updatedRoles: HierarchyRole[];

    if (isNewRole) {
      updatedRoles = [...hierarchy.roles, role];
    } else {
      updatedRoles = hierarchy.roles.map((r) => (r.id === role.id ? role : r));
    }

    onHierarchyChange({
      ...hierarchy,
      roles: updatedRoles,
      updated_at: new Date().toISOString(),
    });

    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    // Check if any nodes use this role
    const nodesWithRole = hierarchy.nodes.filter((n) => n.role_id === roleId);
    if (nodesWithRole.length > 0) {
      alert(`Cannot delete: ${nodesWithRole.length} position(s) use this role. Remove them first.`);
      return;
    }

    if (!confirm('Delete this role?')) return;

    onHierarchyChange({
      ...hierarchy,
      roles: hierarchy.roles.filter((r) => r.id !== roleId),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <Library size={16} className="text-purple-400" />
            Role Library
          </span>

          {!readOnly && activeTab === 'roles' && (
            <button
              onClick={handleAddRole}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
            >
              <Plus size={12} />
              Add Role
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs rounded transition-colors',
              activeTab === 'roles'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            Current Roles ({hierarchy.roles.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs rounded transition-colors',
              activeTab === 'templates'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'roles' && (
          <div className="space-y-2">
            {filteredRoles
              .sort((a, b) => a.level - b.level)
              .map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={() => handleEditRole(role)}
                  onDelete={() => handleDeleteRole(role.id)}
                  readOnly={readOnly}
                />
              ))}

            {filteredRoles.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Shield className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">
                  {searchQuery
                    ? 'No roles match your search'
                    : 'No roles defined yet'}
                </p>
                {!searchQuery && !readOnly && (
                  <button
                    onClick={handleAddRole}
                    className="mt-2 text-xs text-cyan-400 hover:underline"
                  >
                    Create your first role
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={() => handleApplyTemplate(template)}
                isApplying={isApplying}
              />
            ))}

            {filteredTemplates.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">
                No templates match your search
              </p>
            )}
          </div>
        )}
      </div>

      {/* Role Editor Modal */}
      <AnimatePresence>
        {(editingRole !== null || isNewRole) && (
          <RoleEditorModal
            role={editingRole}
            isNew={isNewRole}
            existingLevels={existingLevels}
            onSave={handleSaveRole}
            onCancel={() => {
              setEditingRole(null);
              setIsNewRole(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleTemplateLibrary;
