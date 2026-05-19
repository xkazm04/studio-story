'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Users, Save, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Faction } from '@/app/types/Faction';
import { Character } from '@/app/types/Character';
import { factionApi } from '@/app/api/factions';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import MediaUploadForm from './MediaUploadForm';
import RoleRankEditor from './RoleRankEditor';
import FactionTabNav, { FactionTabType } from './FactionTabNav';
import FactionDetailsTabContent from './FactionDetailsTabContent';
import { FACTION_PRESET_COLORS } from './factionTheme';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/app/components/UI/ConfirmationModal';
import {
  FactionPolitics,
  FactionRelationship,
  FactionInfluence,
  createDefaultFactionPolitics,
  createDefaultInfluence,
  InfluenceType,
  Territory,
  PoliticalGoal,
  FactionSecret,
  DiplomaticAction,
} from '@/lib/politics/PoliticsEngine';
import { CulturalCompatibility } from '@/lib/culture/CultureGenerator';

interface FactionDetailsProps {
  faction: Faction;
  onBack: () => void;
  onUpdate: () => void;
  allFactions?: Faction[];
  culturalCompatibilities?: Map<string, CulturalCompatibility>;
}

type TabType = FactionTabType;

const FactionDetails: React.FC<FactionDetailsProps> = ({
  faction,
  onBack,
  onUpdate,
  allFactions = [],
  culturalCompatibilities,
}) => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProjectStore();

  // Use the new aggregated summary endpoint to fetch all data in one call
  const { data: factionSummary, isLoading: isSummaryLoading } = factionApi.useFactionSummary(faction.id);

  // Extract data from summary or use empty defaults
  const factionMembers = factionSummary?.members || [];
  const factionMedia = factionSummary?.media || [];
  const factionRelationships = factionSummary?.relationships || [];
  const factionLore = factionSummary?.lore || [];
  const factionAchievements = factionSummary?.achievements || [];
  const factionEvents = factionSummary?.events || [];

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(faction.name);
  const [description, setDescription] = useState(faction.description || '');
  const [color, setColor] = useState(faction.color || FACTION_PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  // Politics state - in production, these would come from API
  const [factionPolitics, setFactionPolitics] = useState<FactionPolitics | null>(() =>
    createDefaultFactionPolitics(faction.id, faction.name)
  );
  const [factionInfluence, setFactionInfluence] = useState<FactionInfluence | null>(() =>
    createDefaultInfluence(faction.id)
  );
  const [politicalRelationships, setPoliticalRelationships] = useState<FactionRelationship[]>([]);

  // All influences for power rankings
  const allInfluences = useMemo(() => {
    const influences: FactionInfluence[] = [];
    if (factionInfluence) {
      influences.push(factionInfluence);
    }
    // Add placeholder influences for other factions
    allFactions.forEach((f) => {
      if (f.id !== faction.id) {
        influences.push(createDefaultInfluence(f.id));
      }
    });
    return influences;
  }, [factionInfluence, allFactions, faction.id]);

  // Politics and Influences Maps for AllianceNetworkGraph
  const politicsMap = useMemo(() => {
    const map = new Map<string, FactionPolitics>();
    if (factionPolitics) {
      map.set(faction.id, factionPolitics);
    }
    // Add default politics for other factions
    allFactions.forEach((f) => {
      if (f.id !== faction.id) {
        map.set(f.id, createDefaultFactionPolitics(f.id, f.name));
      }
    });
    return map;
  }, [factionPolitics, faction.id, faction.name, allFactions]);

  const influencesMap = useMemo(() => {
    const map = new Map<string, FactionInfluence>();
    allInfluences.forEach((inf) => {
      map.set(inf.faction_id, inf);
    });
    return map;
  }, [allInfluences]);

  // Handlers for politics components
  const handleInfluenceChange = (type: InfluenceType, value: number) => {
    if (!factionInfluence) return;
    setFactionInfluence({
      ...factionInfluence,
      influence_breakdown: {
        ...factionInfluence.influence_breakdown,
        [type]: Math.max(0, value),
      },
    });
  };

  const handleAddTerritory = (territory: Omit<Territory, 'id'>) => {
    if (!factionInfluence) return;
    const newTerritory: Territory = {
      ...territory,
      id: `territory_${Date.now()}`,
    };
    setFactionInfluence({
      ...factionInfluence,
      territories: [...factionInfluence.territories, newTerritory],
    });
  };

  const handleRemoveTerritory = (territoryId: string) => {
    if (!factionInfluence) return;
    setFactionInfluence({
      ...factionInfluence,
      territories: factionInfluence.territories.filter((t) => t.id !== territoryId),
    });
  };

  const handleUpdatePolitics = (updates: Partial<FactionPolitics>) => {
    if (!factionPolitics) return;
    setFactionPolitics({ ...factionPolitics, ...updates });
  };

  const handleAddGoal = (goal: PoliticalGoal) => {
    if (!factionPolitics) return;
    setFactionPolitics({
      ...factionPolitics,
      goals: [...factionPolitics.goals, goal],
    });
  };

  const handleRemoveGoal = (goalId: string) => {
    if (!factionPolitics) return;
    setFactionPolitics({
      ...factionPolitics,
      goals: factionPolitics.goals.filter((g) => g.id !== goalId),
    });
  };

  const handleAddSecret = (secret: FactionSecret) => {
    if (!factionPolitics) return;
    setFactionPolitics({
      ...factionPolitics,
      secrets: [...factionPolitics.secrets, secret],
    });
  };

  const handleRevealSecret = (secretId: string) => {
    if (!factionPolitics) return;
    setFactionPolitics({
      ...factionPolitics,
      secrets: factionPolitics.secrets.map((s) =>
        s.id === secretId ? { ...s, revealed: true } : s
      ),
    });
  };

  const handleExecuteDiplomaticAction = (action: DiplomaticAction) => {
    // In production, this would call an API and update relationships
    console.log('Executing diplomatic action:', action);
  };

  // Check if current user is faction leader (for simplicity, the user who has the first character in the faction)
  // In a real app, this would be based on user roles/permissions
  const isLeader = true; // For now, always true for demo purposes

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await factionApi.updateFaction(faction.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update faction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await factionApi.deleteFaction(faction.id);
      onUpdate();
      onBack();
    } catch (error) {
      console.error('Failed to delete faction:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancel = () => {
    setName(faction.name);
    setDescription(faction.description || '');
    setColor(faction.color || FACTION_PRESET_COLORS[0]);
    setIsEditing(false);
  };

  const handleMediaUpload = async (file: File, type: string, description: string) => {
    await factionApi.uploadFactionMedia(faction.id, file, type, description);
    // Invalidate and refetch the summary query to get updated media
    queryClient.invalidateQueries({ queryKey: ['factions', faction.id, 'summary'] });
    setShowUploadForm(false);
  };

  const handleMediaDelete = async (mediaId: string) => {
    await factionApi.deleteFactionMedia(mediaId);
    // Invalidate and refetch the summary query to get updated media
    queryClient.invalidateQueries({ queryKey: ['factions', faction.id, 'summary'] });
  };

  const handleRoleRankUpdate = () => {
    // Invalidate and refetch the summary query to get updated member data
    queryClient.invalidateQueries({ queryKey: ['factions', faction.id, 'summary'] });
    setEditingCharacter(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Factions
        </button>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<Edit size={16} />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                loading={isDeleting}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={16} />}
                onClick={handleSave}
                disabled={isSubmitting || !name.trim()}
                loading={isSubmitting}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Faction Info */}
      <div className="relative bg-slate-900 rounded-lg border border-slate-800 p-6">
        <ColoredBorder color="blue" />
        
        {faction.color && !isEditing && (
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
            style={{ backgroundColor: faction.color }}
          />
        )}

        <div className="flex gap-6">
          {/* Logo/Icon */}
          <div
            className="w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-bold flex-shrink-0"
            style={{
              backgroundColor: (isEditing ? color : faction.color)
                ? `${isEditing ? color : faction.color}20`
                : '#1f2937',
              color: (isEditing ? color : faction.color) || '#9ca3af',
            }}
          >
            {(isEditing ? name : faction.name).charAt(0).toUpperCase()}
          </div>

          {/* Faction Details */}
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[100px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FACTION_PRESET_COLORS.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => setColor(presetColor)}
                        className={cn('w-8 h-8 rounded-lg transition-all ring-offset-1 ring-offset-slate-900',
                          color === presetColor
                            ? 'ring-2 ring-[var(--ms-cyan,#06b6d4)] scale-110'
                            : 'hover:scale-105 hover:ring-1 hover:ring-slate-500'
                        )}
                        style={{ backgroundColor: presetColor }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white">{faction.name}</h2>
                {faction.description && (
                  <p className="text-slate-400">{faction.description}</p>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={16} />
                  <span>{factionMembers.length} members</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <FactionTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        memberCount={factionMembers.length}
        mediaCount={factionMedia.length}
        isLeader={isLeader}
      />

      {/* Tab Content */}
      <FactionDetailsTabContent
        activeTab={activeTab}
        faction={faction}
        factionMembers={factionMembers}
        factionMedia={factionMedia}
        isLeader={isLeader}
        onUploadClick={() => setShowUploadForm(true)}
        onDeleteMedia={handleMediaDelete}
        onUpdate={onUpdate}
        onEditCharacter={setEditingCharacter}
        allFactions={allFactions}
        politicsMap={politicsMap}
        politicalRelationships={politicalRelationships}
        influencesMap={influencesMap}
        factionInfluence={factionInfluence}
        allInfluences={allInfluences}
        factionPolitics={factionPolitics}
        onInfluenceChange={handleInfluenceChange}
        onAddTerritory={handleAddTerritory}
        onRemoveTerritory={handleRemoveTerritory}
        onUpdatePolitics={handleUpdatePolitics}
        onAddGoal={handleAddGoal}
        onRemoveGoal={handleRemoveGoal}
        onAddSecret={handleAddSecret}
        onRevealSecret={handleRevealSecret}
        onExecuteAction={handleExecuteDiplomaticAction}
        culturalCompatibilities={culturalCompatibilities}
      />

      {/* Media Upload Modal */}
      <AnimatePresence>
        {showUploadForm && (
          <MediaUploadForm
            factionId={faction.id}
            onClose={() => setShowUploadForm(false)}
            onUpload={handleMediaUpload}
          />
        )}
      </AnimatePresence>

      {/* Role & Rank Editor Modal */}
      <AnimatePresence>
        {editingCharacter && (
          <RoleRankEditor
            character={editingCharacter}
            onClose={() => setEditingCharacter(null)}
            onUpdate={handleRoleRankUpdate}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        type="danger"
        title="Delete Faction"
        message={`Are you sure you want to delete "${faction.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </motion.div>
  );
};

export default FactionDetails;

