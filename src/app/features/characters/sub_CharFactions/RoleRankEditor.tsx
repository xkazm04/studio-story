'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Shield, TrendingUp, Crown, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { Character, FACTION_ROLES, FactionRole } from '@/app/types/Character';
import { characterApi } from '@/app/api/characters';
import { HierarchyRole, FactionHierarchy } from '@/lib/hierarchy/HierarchyEngine';
import { cn } from '@/app/lib/utils';

interface RoleRankEditorProps {
  character: Character;
  onClose: () => void;
  onUpdate: () => void;
  /** Optional: Hierarchy roles for this faction (enables hierarchy-aware mode) */
  hierarchyRoles?: HierarchyRole[];
  /** Optional: Auto-calculate rank from hierarchy level */
  autoRankFromHierarchy?: boolean;
}

const RoleRankEditor: React.FC<RoleRankEditorProps> = ({
  character,
  onClose,
  onUpdate,
  hierarchyRoles = [],
  autoRankFromHierarchy = true,
}) => {
  const hasHierarchy = hierarchyRoles.length > 0;
  const [useHierarchyMode, setUseHierarchyMode] = useState(hasHierarchy);
  const [factionRole, setFactionRole] = useState<string>(character.faction_role || '');
  const [selectedHierarchyRole, setSelectedHierarchyRole] = useState<string>('');
  const [customRole, setCustomRole] = useState('');
  const [factionRank, setFactionRank] = useState<number>(character.faction_rank || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort hierarchy roles by level
  const sortedHierarchyRoles = useMemo(() => {
    return [...hierarchyRoles].sort((a, b) => a.level - b.level);
  }, [hierarchyRoles]);

  // Find current hierarchy role if any
  const currentHierarchyRole = useMemo(() => {
    if (!character.faction_role) return null;
    return hierarchyRoles.find(
      (r) => r.title === character.faction_role || r.name === character.faction_role
    );
  }, [character.faction_role, hierarchyRoles]);

  // Auto-select hierarchy role on mount if matches
  React.useEffect(() => {
    if (currentHierarchyRole) {
      setSelectedHierarchyRole(currentHierarchyRole.id);
    }
  }, [currentHierarchyRole]);

  // Handle hierarchy role selection
  const handleHierarchyRoleChange = (roleId: string) => {
    setSelectedHierarchyRole(roleId);
    const role = hierarchyRoles.find((r) => r.id === roleId);
    if (role && autoRankFromHierarchy) {
      // Convert level to rank: level 0 = rank 100, level 5 = rank 50, etc.
      const calculatedRank = Math.max(0, 100 - role.level * 10);
      setFactionRank(calculatedRank);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let roleToSave: string | undefined;

      if (useHierarchyMode && selectedHierarchyRole) {
        // Use the hierarchy role title
        const role = hierarchyRoles.find((r) => r.id === selectedHierarchyRole);
        roleToSave = role?.title;
      } else {
        roleToSave = factionRole === 'Custom' ? customRole : factionRole;
      }

      await characterApi.updateCharacter(character.id, {
        faction_role: roleToSave || undefined,
        faction_rank: factionRank,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update character role/rank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-xl border border-purple-500/30 shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-purple-400" size={24} />
            Edit Role & Rank
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="close-role-editor-btn"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Character Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              {character.avatar_url && (
                <img
                  src={character.avatar_url}
                  alt={character.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-semibold text-white">{character.name}</div>
                <div className="text-sm text-gray-400">
                  Current: {character.faction_role || 'No role'} (Rank: {character.faction_rank || 0})
                </div>
              </div>
            </div>
          </div>

          {/* Mode Toggle (if hierarchy available) */}
          {hasHierarchy && (
            <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
              <button
                type="button"
                onClick={() => setUseHierarchyMode(true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  useHierarchyMode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <GitBranch size={14} />
                Hierarchy Roles
              </button>
              <button
                type="button"
                onClick={() => setUseHierarchyMode(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  !useHierarchyMode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Shield size={14} />
                Standard Roles
              </button>
            </div>
          )}

          {/* Hierarchy Role Selection */}
          <AnimatePresence mode="wait">
            {useHierarchyMode && hasHierarchy ? (
              <motion.div
                key="hierarchy"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Crown size={16} className="text-amber-400" />
                  Hierarchy Role
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sortedHierarchyRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleHierarchyRoleChange(role.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                        selectedHierarchyRole === role.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      )}
                    >
                      {role.color && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{role.title}</span>
                          <span className="text-xs text-gray-500">Level {role.level}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{role.description}</p>
                      </div>
                      {selectedHierarchyRole === role.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {sortedHierarchyRoles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hierarchy roles defined. Create roles in the organization chart first.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="standard"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {/* Standard Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Shield size={16} className="text-purple-400" />
                    Faction Role
                  </label>
                  <select
                    value={factionRole}
                    onChange={(e) => setFactionRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    data-testid="faction-role-select"
                  >
                    <option value="">-- No Role --</option>
                    {FACTION_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                    <option value="Custom">Custom Role...</option>
                  </select>
                </div>

                {/* Custom Role Input */}
                {factionRole === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Custom Role Name
                    </label>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Enter custom role..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      data-testid="custom-role-input"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rank Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Faction Rank
            </label>
            <div className="space-y-2">
              <input
                type="number"
                value={factionRank}
                onChange={(e) => setFactionRank(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                data-testid="faction-rank-input"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 = Lowest</span>
                <span>Higher = More Important</span>
                <span>100 = Highest</span>
              </div>
              {/* Visual Rank Indicator */}
              <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(factionRank, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || (factionRole === 'Custom' && !customRole.trim())}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
              data-testid="save-role-rank-btn"
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              data-testid="cancel-role-edit-btn"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>Tip:</strong> {useHierarchyMode && hasHierarchy ? (
              <>Hierarchy roles are defined in the Organization Chart. Rank is automatically calculated from the role level.</>
            ) : (
              <>Use roles to define positions (Leader, Guard, etc.) and ranks to establish hierarchy within those roles. Higher ranks appear first in sorted lists.</>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RoleRankEditor;
