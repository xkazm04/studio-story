/**
 * FactionCard - Individual faction display card
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Eye } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Faction } from '@/app/types/Faction';
import { characterApi } from '@/app/api/characters';
import { useProjectStore } from '@/app/store/slices/projectSlice';

interface FactionCardProps {
  faction: Faction;
  onSelect: (faction: Faction) => void;
  isNew?: boolean;
}

const FactionCard: React.FC<FactionCardProps> = ({ faction, onSelect, isNew = false }) => {
  const { selectedProject } = useProjectStore();
  const { data: characters = [] } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );

  const memberCount = characters.filter((char) => char.faction_id === faction.id).length;

  // Get branding colors with fallback
  const primaryColor = faction.branding?.primary_color || faction.color;
  const secondaryColor = faction.branding?.secondary_color;
  const accentColor = faction.branding?.accent_color;

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(faction)}
      className={cn('relative group cursor-pointer rounded-lg border overflow-hidden transition-all duration-200 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800/80',
        isNew
          ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          : 'border-slate-700/50 hover:border-slate-600'
      )}
      style={{
        borderColor: primaryColor && !isNew ? `${primaryColor}40` : undefined,
      }}
    >
      {/* Glow effect for new factions */}
      {isNew && (
        <motion.div
          className="absolute inset-0 bg-cyan-500/10 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      )}

      {/* Faction Color Accent */}
      {primaryColor && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: secondaryColor
              ? `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${accentColor || primaryColor} 100%)`
              : primaryColor,
          }}
        />
      )}

      <div className="p-5">
        {/* Logo/Icon */}
        {faction.logo_url ? (
          <div className="w-14 h-14 rounded-lg bg-slate-800/80 mb-4 overflow-hidden border border-slate-700/50">
            <img
              src={faction.logo_url}
              alt={faction.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-lg mb-4 flex items-center justify-center text-xl font-bold relative overflow-hidden border"
            style={{
              backgroundColor: primaryColor ? `${primaryColor}15` : 'rgb(30 41 59 / 0.8)',
              color: primaryColor || 'rgb(148 163 184)',
              borderColor: primaryColor ? `${primaryColor}30` : 'rgb(51 65 85 / 0.5)',
            }}
          >
            <span className="font-mono">{faction.name.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Faction Name */}
        <h3 className="font-medium text-slate-100 mb-1.5">{faction.name}</h3>

        {/* Description */}
        {faction.description && (
          <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {faction.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            <Users size={12} />
            <span>{memberCount} members</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(faction);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wide
                       text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10
                       transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Eye size={12} />
            view
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FactionCard;

