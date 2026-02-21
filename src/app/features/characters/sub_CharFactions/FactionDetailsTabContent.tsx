'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Faction, FactionMedia, FactionSummary } from '@/app/types/Faction';
import { Character } from '@/app/types/Character';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import FactionMediaGallery from './FactionMediaGallery';
import FactionBrandingPanel from './FactionBrandingPanel';
import FactionLoreGallery from './FactionLoreGallery';
import SemanticSearchPanel from './SemanticSearchPanel';
import FactionMembersList from './FactionMembersList';
import AllianceNetworkGraph from './AllianceNetworkGraph';
import InfluenceTracker from './InfluenceTracker';
import DiplomacyPanel from './DiplomacyPanel';
import { FactionTabType } from './FactionTabNav';
import {
  FactionPolitics,
  FactionRelationship,
  FactionInfluence,
  InfluenceType,
  Territory,
  PoliticalGoal,
  FactionSecret,
  DiplomaticAction,
} from '@/lib/politics/PoliticsEngine';

type FactionMember = FactionSummary['members'][number];

interface FactionDetailsTabContentProps {
  activeTab: FactionTabType;
  faction: Faction;
  factionMembers: FactionMember[];
  factionMedia: FactionMedia[];
  isLeader: boolean;
  onUploadClick: () => void;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdate: () => void;
  onEditCharacter: (character: Character) => void;
  // Politics props
  allFactions?: Faction[];
  politicsMap?: Map<string, FactionPolitics>;
  politicalRelationships?: FactionRelationship[];
  influencesMap?: Map<string, FactionInfluence>;
  factionInfluence?: FactionInfluence | null;
  allInfluences?: FactionInfluence[];
  factionPolitics?: FactionPolitics | null;
  onInfluenceChange?: (type: InfluenceType, value: number) => void;
  onAddTerritory?: (territory: Omit<Territory, 'id'>) => void;
  onRemoveTerritory?: (territoryId: string) => void;
  onUpdatePolitics?: (updates: Partial<FactionPolitics>) => void;
  onAddGoal?: (goal: PoliticalGoal) => void;
  onRemoveGoal?: (goalId: string) => void;
  onAddSecret?: (secret: FactionSecret) => void;
  onRevealSecret?: (secretId: string) => void;
  onExecuteAction?: (action: DiplomaticAction) => void;
}

const tabMotionProps = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2 },
};

const FactionDetailsTabContent: React.FC<FactionDetailsTabContentProps> = ({
  activeTab,
  faction,
  factionMembers,
  factionMedia,
  isLeader,
  onUploadClick,
  onDeleteMedia,
  onUpdate,
  onEditCharacter,
  allFactions = [],
  politicsMap,
  politicalRelationships = [],
  influencesMap,
  factionInfluence,
  allInfluences = [],
  factionPolitics,
  onInfluenceChange,
  onAddTerritory,
  onRemoveTerritory,
  onUpdatePolitics,
  onAddGoal,
  onRemoveGoal,
  onAddSecret,
  onRevealSecret,
  onExecuteAction,
}) => {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'info' && (
        <motion.div key="info" {...tabMotionProps}>
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color="blue" />
            <h3 className="text-lg font-semibold text-white mb-4">
              Faction Information
            </h3>
            <div className="space-y-4 text-gray-300">
              <div>
                <span className="font-medium text-gray-400">Name:</span> {faction.name}
              </div>
              {faction.description && (
                <div>
                  <span className="font-medium text-gray-400">Description:</span>
                  <p className="mt-1">{faction.description}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-400">Members:</span> {factionMembers.length}
              </div>
              <div>
                <span className="font-medium text-gray-400">Media:</span> {factionMedia.length} items
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'members' && (
        <FactionMembersList
          members={factionMembers}
          isLeader={isLeader}
          onEditCharacter={onEditCharacter}
        />
      )}

      {activeTab === 'media' && (
        <motion.div key="media" {...tabMotionProps}>
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color="purple" />
            <FactionMediaGallery
              media={factionMedia}
              factionId={faction.id}
              isLeader={isLeader}
              onUploadClick={onUploadClick}
              onDeleteMedia={onDeleteMedia}
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'branding' && isLeader && (
        <motion.div key="branding" {...tabMotionProps}>
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color="orange" />
            <FactionBrandingPanel
              faction={faction}
              onUpdate={onUpdate}
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div key="history" {...tabMotionProps}>
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color="purple" />
            <FactionLoreGallery
              faction={faction}
              characters={factionMembers}
              isLeader={isLeader}
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'politics' && politicsMap && influencesMap && (
        <motion.div key="politics" {...tabMotionProps}>
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ColoredBorder color="blue" />
            <AllianceNetworkGraph
              factions={allFactions.length > 0 ? allFactions : [faction]}
              politics={politicsMap}
              relationships={politicalRelationships}
              influences={influencesMap}
              selectedFactionId={faction.id}
              onFactionSelect={(id) => console.log('Selected faction:', id)}
            />
          </div>
        </motion.div>
      )}

      {activeTab === 'influence' && factionInfluence && onInfluenceChange && onAddTerritory && onRemoveTerritory && (
        <motion.div key="influence" {...tabMotionProps}>
          <InfluenceTracker
            faction={faction}
            influence={factionInfluence}
            allInfluences={allInfluences}
            onInfluenceChange={onInfluenceChange}
            onAddTerritory={onAddTerritory}
            onRemoveTerritory={onRemoveTerritory}
          />
        </motion.div>
      )}

      {activeTab === 'diplomacy' && onUpdatePolitics && onAddGoal && onRemoveGoal && onAddSecret && onRevealSecret && onExecuteAction && (
        <motion.div key="diplomacy" {...tabMotionProps}>
          <DiplomacyPanel
            faction={faction}
            factionPolitics={factionPolitics ?? null}
            relationships={politicalRelationships}
            allFactions={allFactions}
            onUpdatePolitics={onUpdatePolitics}
            onAddGoal={onAddGoal}
            onRemoveGoal={onRemoveGoal}
            onAddSecret={onAddSecret}
            onRevealSecret={onRevealSecret}
            onExecuteAction={onExecuteAction}
          />
        </motion.div>
      )}

      {activeTab === 'search' && (
        <motion.div key="search" {...tabMotionProps}>
          <SemanticSearchPanel
            factionId={faction.id}
            factionName={faction.name}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FactionDetailsTabContent;
