'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Faction } from '@/app/types/Faction';
import { Character } from '@/app/types/Character';
import { factionApi } from '@/app/api/factions';
import TimelineView from './TimelineView';
import AchievementBadges from './AchievementBadges';
import LoreRepository from './LoreRepository';

interface FactionLoreGalleryProps {
  faction: Faction;
  characters: Character[];
  isLeader: boolean;
}

type SectionType = 'timeline' | 'achievements' | 'lore';

const FactionLoreGallery: React.FC<FactionLoreGalleryProps> = ({
  faction,
  characters,
  isLeader,
}) => {
  const [activeSection, setActiveSection] = useState<SectionType>('timeline');
  const [storyMode, setStoryMode] = useState(false);

  // Fetch faction history data
  const { data: events = [] } = factionApi.useFactionEvents(faction.id);
  const { data: achievements = [] } = factionApi.useFactionAchievements(faction.id);
  const { data: lore = [] } = factionApi.useFactionLore(faction.id);

  const sections = [
    {
      id: 'timeline' as SectionType,
      label: 'Timeline',
      icon: Clock,
      color: 'blue',
      count: events.length,
    },
    {
      id: 'achievements' as SectionType,
      label: 'Achievements',
      icon: Trophy,
      color: 'yellow',
      count: achievements.length,
    },
    {
      id: 'lore' as SectionType,
      label: 'Lore',
      icon: BookOpen,
      color: 'purple',
      count: lore.length,
    },
  ];

  const handleAddLore = () => {
    // TODO: Open modal to add new lore entry
    console.log('Add lore');
  };

  const handleEditLore = (loreId: string) => {
    // TODO: Open modal to edit lore entry
    console.log('Edit lore:', loreId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            History & Achievements
          </h2>
          <p className="text-gray-400">
            Explore the rich history and accomplishments of {faction.name}
          </p>
        </div>

        {/* Story mode toggle */}
        <motion.button
          onClick={() => setStoryMode(!storyMode)}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            storyMode
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles size={18} />
          {storyMode ? 'Story Mode Active' : 'Story Mode'}
        </motion.button>
      </div>

      {/* Section navigation */}
      <div className="flex gap-2 border-b border-gray-800">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn('relative flex items-center gap-2 px-6 py-3 font-medium transition-all',
                isActive
                  ? `text-${section.color}-400`
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              <Icon size={18} />
              {section.label}
              <span
                className={cn('ml-1 px-2 py-0.5 rounded text-xs',
                  isActive
                    ? `bg-${section.color}-600/20 text-${section.color}-400`
                    : 'bg-gray-800 text-gray-500'
                )}
              >
                {section.count}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeSection"
                  className={cn('absolute bottom-0 left-0 right-0 h-0.5', `bg-${section.color}-400`)}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {activeSection === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {storyMode ? (
              <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-8">
                {/* Story mode presentation */}
                <div className="max-w-3xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                  >
                    <h3 className="text-3xl font-bold text-white mb-4">
                      The Story of {faction.name}
                    </h3>
                    <p className="text-gray-400">
                      A journey through time and triumph
                    </p>
                  </motion.div>

                  {/* Narration-style event display */}
                  <div className="space-y-8">
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.5, duration: 0.8 }}
                        className="text-center"
                      >
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(event.date).getFullYear()}
                        </div>
                        <h4 className="text-xl font-semibold text-white mb-3">
                          {event.title}
                        </h4>
                        <p className="text-gray-300 leading-relaxed">
                          {event.description}
                        </p>
                        {index < events.length - 1 && (
                          <motion.div
                            className="mt-8 flex items-center justify-center"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: (index + 1) * 0.5 }}
                          >
                            <div className="w-px h-12 bg-gradient-to-b from-blue-500/50 to-purple-500/50" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <TimelineView events={events} />
            )}
          </motion.div>
        )}

        {activeSection === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AchievementBadges
              achievements={achievements}
              characters={characters}
            />
          </motion.div>
        )}

        {activeSection === 'lore' && (
          <motion.div
            key="lore"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <LoreRepository
              loreEntries={lore}
              isLeader={isLeader}
              onAddLore={handleAddLore}
              onEditLore={handleEditLore}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {events.length}
          </div>
          <div className="text-sm text-gray-400">Historic Events</div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {achievements.length}
          </div>
          <div className="text-sm text-gray-400">Achievements</div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {lore.length}
          </div>
          <div className="text-sm text-gray-400">Lore Entries</div>
        </div>
      </motion.div>
    </div>
  );
};

export default FactionLoreGallery;
