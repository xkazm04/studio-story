'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Calendar } from 'lucide-react';
import { FactionAchievement } from '@/app/types/Faction';
import { Character } from '@/app/types/Character';

interface AchievementBadgesProps {
  achievements: FactionAchievement[];
  characters: Character[];
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ achievements, characters }) => {
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMemberNames = (memberIds: string[]) => {
    return characters
      .filter(char => memberIds.includes(char.id))
      .map(char => char.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 text-gray-300">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <h3 className="text-lg font-semibold text-white">Faction Achievements</h3>
          <p className="text-sm text-gray-400">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} earned
          </p>
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => {
          const isHovered = hoveredAchievement === achievement.id;
          const memberNames = getMemberNames(achievement.members);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              onHoverStart={() => setHoveredAchievement(achievement.id)}
              onHoverEnd={() => setHoveredAchievement(null)}
              className="relative"
            >
              <motion.div
                className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-full cursor-pointer overflow-hidden"
                whileHover={{ scale: 1.05, borderColor: '#fbbf24' }}
                transition={{ duration: 0.3 }}
              >
                {/* Gradient background effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-amber-500/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Badge icon with particle effect */}
                  <div className="relative mb-4">
                    <motion.div
                      className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-4xl shadow-lg"
                      animate={{
                        boxShadow: isHovered
                          ? '0 0 30px rgba(251, 191, 36, 0.6)'
                          : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {achievement.icon_url || <Trophy className="w-6 h-6 text-amber-400" />}
                    </motion.div>

                    {/* Particle effects around badge */}
                    <AnimatePresence>
                      {isHovered && (
                        <>
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-yellow-400"
                              initial={{ scale: 0, x: -4, y: -4 }}
                              animate={{
                                scale: [0, 1, 0],
                                x: [
                                  -4,
                                  -4 + Math.cos((i * Math.PI * 2) / 6) * 40,
                                ],
                                y: [
                                  -4,
                                  -4 + Math.sin((i * Math.PI * 2) / 6) * 40,
                                ],
                                opacity: [0, 1, 0],
                              }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 0.5,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Achievement title */}
                  <h4 className="text-lg font-semibold text-white text-center mb-2">
                    {achievement.title}
                  </h4>

                  {/* Description */}
                  <p className="text-gray-400 text-sm text-center mb-4 line-clamp-3">
                    {achievement.description}
                  </p>

                  {/* Date earned */}
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-3">
                    <Calendar size={12} />
                    <span>Earned {formatDate(achievement.earned_date)}</span>
                  </div>

                  {/* Members who earned it */}
                  <AnimatePresence>
                    {isHovered && memberNames.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-800 pt-3 mt-3"
                      >
                        <div className="flex items-start gap-2 text-xs">
                          <Users size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-500 mb-1">Earned by:</div>
                            <div className="text-gray-300 space-y-1">
                              {memberNames.map((name, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-center gap-1"
                                >
                                  <span className="text-yellow-500">•</span>
                                  {name}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: isHovered ? '100%' : '-100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-500">No achievements earned yet</p>
          <p className="text-gray-600 text-sm mt-2">
            Complete challenges to unlock faction achievements
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;
