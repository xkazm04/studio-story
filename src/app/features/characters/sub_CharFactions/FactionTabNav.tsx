'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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

const PILL_COLORS: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/20 text-orange-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  amber: 'bg-amber-500/20 text-amber-400',
};

const FactionTabNav: React.FC<FactionTabNavProps> = ({
  activeTab,
  onTabChange,
  memberCount,
  mediaCount,
  isLeader,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const visibleTabs = tabs.filter((tab) => tab.showCondition !== false);
  const activeColor = visibleTabs.find((t) => t.id === activeTab)?.color || 'blue';

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  // Scroll active tab into view on mount / tab change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div className="relative">
      {/* Fade gradient - left */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none bg-gradient-to-r from-slate-950 to-transparent" />
      )}
      {/* Fade gradient - right */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none bg-gradient-to-l from-slate-950 to-transparent" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-none py-1 px-1 snap-x snap-mandatory scroll-pl-2 scroll-pr-2"
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors shrink-0 snap-start',
                isActive
                  ? PILL_COLORS[activeColor] || PILL_COLORS.blue
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
              data-testid={`${tab.id}-tab-btn`}
            >
              {isActive && (
                <motion.span
                  layoutId="faction-tab-pill"
                  className={cn(
                    'absolute inset-0 rounded-md',
                    PILL_COLORS[tab.color] || PILL_COLORS.blue
                  )}
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {Icon && <Icon size={15} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-0.5 text-xs tabular-nums',
                  isActive ? 'opacity-80' : 'opacity-60'
                )}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FactionTabNav;
