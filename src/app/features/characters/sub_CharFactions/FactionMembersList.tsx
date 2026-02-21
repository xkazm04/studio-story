'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, ArrowUpDown, Edit } from 'lucide-react';
import { Character } from '@/app/types/Character';
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
      <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
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
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="sort-by-select"
              >
                <option value="rank">Sort by Rank</option>
                <option value="role">Sort by Role</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {members.length > 0 ? (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-purple-500/50 transition-all"
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
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {member.faction_role && (
                          <span className="flex items-center gap-1">
                            <Shield size={14} className="text-purple-400" />
                            {member.faction_role}
                          </span>
                        )}
                        <span className="text-gray-500">
                          Rank: {member.faction_rank ?? 0}
                        </span>
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
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No characters in this faction yet
          </p>
        )}

        {/* Show filter message if no results */}
        {members.length > 0 && filteredMembers.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            No members match the selected role filter
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default FactionMembersList;
