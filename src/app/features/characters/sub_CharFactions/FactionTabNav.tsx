'use client';

import React from 'react';
import { Users, Image as ImageIcon, Trophy, Search, Edit, Network, BarChart3, Handshake } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export type FactionTabType = 'info' | 'members' | 'media' | 'branding' | 'history' | 'search' | 'politics' | 'influence' | 'diplomacy';

interface FactionTabNavProps {
  activeTab: FactionTabType;
  onTabChange: (tab: FactionTabType) => void;
  memberCount: number;
  mediaCount: number;
  isLeader: boolean;
}

interface TabConfig {
  id: FactionTabType;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  color: string;
  count?: number;
  showCondition?: boolean;
}

const FactionTabNav: React.FC<FactionTabNavProps> = ({
  activeTab,
  onTabChange,
  memberCount,
  mediaCount,
  isLeader,
}) => {
  const tabs: TabConfig[] = [
    { id: 'info', label: 'Information', color: 'blue' },
    { id: 'members', label: 'Members', icon: Users, color: 'purple', count: memberCount },
    { id: 'media', label: 'Media', icon: ImageIcon, color: 'purple', count: mediaCount },
    { id: 'branding', label: 'Branding', icon: Edit, color: 'orange', showCondition: isLeader },
    { id: 'history', label: 'History & Achievements', icon: Trophy, color: 'purple' },
    { id: 'politics', label: 'Politics', icon: Network, color: 'cyan' },
    { id: 'influence', label: 'Influence', icon: BarChart3, color: 'purple' },
    { id: 'diplomacy', label: 'Diplomacy', icon: Handshake, color: 'amber' },
    { id: 'search', label: 'Search Knowledge', icon: Search, color: 'indigo' },
  ];

  const getTabClasses = (tab: TabConfig) => {
    const isActive = activeTab === tab.id;
    const colorMap: Record<string, { active: string; inactive: string }> = {
      blue: { active: 'text-blue-400 border-b-2 border-blue-400', inactive: 'text-gray-400 hover:text-gray-300' },
      purple: { active: 'text-purple-400 border-b-2 border-purple-400', inactive: 'text-gray-400 hover:text-gray-300' },
      orange: { active: 'text-orange-400 border-b-2 border-orange-400', inactive: 'text-gray-400 hover:text-gray-300' },
      indigo: { active: 'text-indigo-400 border-b-2 border-indigo-400', inactive: 'text-gray-400 hover:text-gray-300' },
      cyan: { active: 'text-cyan-400 border-b-2 border-cyan-400', inactive: 'text-gray-400 hover:text-gray-300' },
      amber: { active: 'text-amber-400 border-b-2 border-amber-400', inactive: 'text-gray-400 hover:text-gray-300' },
    };
    return colorMap[tab.color]?.[isActive ? 'active' : 'inactive'] || '';
  };

  return (
    <div className="flex gap-2 border-b border-gray-800">
      {tabs.map((tab) => {
        if (tab.showCondition === false) return null;

        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn('flex items-center gap-2 px-6 py-3 font-medium transition-all', getTabClasses(tab))}
            data-testid={`${tab.id}-tab-btn`}
          >
            {Icon && <Icon size={18} />}
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        );
      })}
    </div>
  );
};

export default FactionTabNav;
