'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, ArrowUpDown, Edit, Crown, CircleDot } from 'lucide-react';
import { Character } from '@/app/types/Character';
import { cn } from '@/app/lib/utils';
import ColoredBorder from '@/app/components/UI/ColoredBorder';

interface FactionMember {
  id: string;
  name: string;
  avatar_url?: string;
  faction_role?: string | null;
  faction_rank?: number | null;
}

interface FactionMembersListProps {
  members: FactionMember[];
  isLeader: boolean;
  onEditCharacter: (character: Character) => void;
}

type SortByType = 'name' | 'role' | 'rank';

// ============================================================================
// Tier helpers
// ============================================================================

type Tier = 'gold' | 'silver' | 'bronze';

function getTier(rank: number): Tier {
  if (rank >= 8) return 'gold';
  if (rank >= 5) return 'silver';
  return 'bronze';
}

const TIER_CONFIG: Record<Tier, {
  label: string;
  border: string;
  bg: string;
  text: string;
  glow: string;
  icon: React.ReactNode;
}> = {
  gold: {
    label: 'Gold',
    border: 'border-l-amber-400',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_8px_rgba(251,191,36,0.2)]',
    icon: <Crown size={13} />,
  },
  silver: {
    label: 'Silver',
    border: 'border-l-slate-300',
    bg: 'bg-slate-300/10',
    text: 'text-slate-300',
    glow: '',
    icon: <Shield size={13} />,
  },
  bronze: {
    label: 'Bronze',
    border: 'border-l-orange-700',
    bg: 'bg-orange-800/15',
    text: 'text-orange-600',
    glow: '',
    icon: <CircleDot size={13} />,
  },
};

// ============================================================================
// TierBadge
// ============================================================================

const TierBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const tier = getTier(rank);
  const config = TIER_CONFIG[tier];

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums',
      config.bg, config.text, config.glow
    )}>
      {config.icon}
      {rank}
    </span>
  );
};

// ============================================================================
// TierDistributionBar
// ============================================================================

const TierDistributionBar: React.FC<{ members: FactionMember[] }> = ({ members }) => {
  const counts = useMemo(() => {
    const c = { gold: 0, silver: 0, bronze: 0 };
    members.forEach((m) => {
      c[getTier(m.faction_rank ?? 0)]++;
    });
    return c;
  }, [members]);

  const total = members.length;
  if (total === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-1.5">
        {(['gold', 'silver', 'bronze'] as Tier[]).map((tier) => (
          <span key={tier} className={cn('flex items-center gap-1 text-xs font-mono', TIER_CONFIG[tier].text)}>
            {TIER_CONFIG[tier].icon}
            <span>{counts[tier]}</span>
          </span>
        ))}
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800">
        {counts.gold > 0 && (
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${(counts.gold / total) * 100}%` }}
          />
        )}
        {counts.silver > 0 && (
          <div
            className="bg-slate-300 transition-all"
            style={{ width: `${(counts.silver / total) * 100}%` }}
          />
        )}
        {counts.bronze > 0 && (
          <div
            className="bg-orange-700 transition-all"
            style={{ width: `${(counts.bronze / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const FactionMembersList: React.FC<FactionMembersListProps> = ({
  members,
  isLeader,
  onEditCharacter,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByType>('rank');

  // Get unique roles for filtering
  const uniqueRoles = useMemo(() => {
    return Array.from(
      new Set(members.map((m) => m.faction_role).filter(Boolean))
    ).sort() as string[];
  }, [members]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.faction_role === roleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'role') {
        const roleA = a.faction_role || 'zzz';
        const roleB = b.faction_role || 'zzz';
        return roleA.localeCompare(roleB);
      } else if (sortBy === 'rank') {
        const rankA = a.faction_rank ?? 0;
        const rankB = b.faction_rank ?? 0;
        return rankB - rankA;
      }
      return 0;
    });

    return filtered;
  }, [members, roleFilter, sortBy]);

  return (
    <motion.div
      key="members"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative bg-slate-900 rounded-lg border border-slate-800 p-6">
        <ColoredBorder color="purple" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={18} />
            Faction Members ({members.length})
          </h3>

          {/* Filter and Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-purple-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="role-filter-select"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-purple-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortByType)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="sort-by-select"
              >
                <option value="rank">Sort by Rank</option>
                <option value="role">Sort by Role</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tier Distribution Bar */}
        {members.length > 0 && <TierDistributionBar members={members} />}

        {members.length > 0 ? (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const rank = member.faction_rank ?? 0;
              const tier = getTier(rank);
              const tierConfig = TIER_CONFIG[tier];

              return (
                <div
                  key={member.id}
                  className={cn(
                    'bg-slate-800/50 rounded-lg border border-slate-700 border-l-[3px] p-4 hover:border-purple-500/50 transition-all',
                    tierConfig.border
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {member.avatar_url && (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          {member.faction_role && (
                            <span className="flex items-center gap-1">
                              <Shield size={14} className="text-purple-400" />
                              {member.faction_role}
                            </span>
                          )}
                          <TierBadge rank={rank} />
                        </div>
                      </div>
                    </div>
                    {isLeader && (
                      <button
                        onClick={() => onEditCharacter(member as Character)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                        data-testid={`edit-role-${member.id}-btn`}
                      >
                        <Edit size={14} />
                        Edit Role
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">
            No characters in this faction yet
          </p>
        )}

        {/* Show filter message if no results */}
        {members.length > 0 && filteredMembers.length === 0 && (
          <p className="text-slate-400 text-center py-8">
            No members match the selected role filter
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default FactionMembersList;
