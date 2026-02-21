'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Calendar, Swords, Handshake, Compass, Award, Flame, Trophy, Info } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FactionEvent } from '@/app/types/Faction';

interface TimelineViewProps {
  events: FactionEvent[];
}

const eventIcons = {
  founding: Trophy,
  battle: Swords,
  alliance: Handshake,
  discovery: Compass,
  ceremony: Award,
  conflict: Flame,
  achievement: Award,
};

const eventColors = {
  founding: 'from-yellow-500 to-amber-600',
  battle: 'from-red-500 to-rose-600',
  alliance: 'from-green-500 to-emerald-600',
  discovery: 'from-blue-500 to-cyan-600',
  ceremony: 'from-purple-500 to-violet-600',
  conflict: 'from-orange-500 to-red-600',
  achievement: 'from-indigo-500 to-purple-600',
};

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect user's animation preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return { year, month, day };
  };

  // Flip card component with parallax effect
  const FlipCard: React.FC<{
    event: FactionEvent;
    colorGradient: string;
    Icon: React.ComponentType<{ className?: string; size?: number }>;
    index: number;
  }> = ({ event, colorGradient, Icon, index }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Parallax effect - transforms mouse position to rotation
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [prefersReducedMotion ? 0 : 5, prefersReducedMotion ? 0 : -5]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [prefersReducedMotion ? 0 : -5, prefersReducedMotion ? 0 : 5]);

    const date = formatDate(event.date);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
      setIsFlipped(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="relative pl-20"
        data-testid={`timeline-event-${event.id}`}
      >
        {/* Timeline node */}
        <motion.div
          className={cn('absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg', colorGradient)}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.1, rotate: prefersReducedMotion ? 0 : 360 }}
          transition={{ duration: 0.6 }}
          data-testid={`timeline-node-${event.event_type}`}
        >
          <Icon className="text-white" size={28} />
        </motion.div>

        {/* 3D perspective container */}
        <div
          className="perspective-1000"
          style={{ perspective: '1000px' }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={handleMouseLeave}
          data-testid={`timeline-card-container-${event.id}`}
        >
          <motion.div
            className="relative w-full h-64"
            style={{
              transformStyle: 'preserve-3d',
              rotateX,
              rotateY,
            }}
            animate={{
              rotateZ: prefersReducedMotion ? 0 : (isFlipped ? 180 : 0),
            }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.6,
              ease: 'easeInOut',
            }}
          >
            {/* Front face */}
            <motion.div
              className="absolute inset-0 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden cursor-pointer"
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
              }}
              data-testid={`timeline-card-front-${event.id}`}
            >
              {/* Colored top border */}
              <div className={cn('h-1 bg-gradient-to-r', colorGradient)} />

              <div className="p-6 h-full flex flex-col justify-between">
                {/* Date and title */}
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <Calendar size={14} />
                    <span>
                      {date.month} {date.day}, {date.year}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-xs capitalize">
                      {event.event_type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{event.title}</h3>

                  {/* Truncated description preview */}
                  <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Hover hint */}
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mt-4">
                  <Info size={16} />
                  <span>Hover to flip and see details</span>
                </div>
              </div>

              {/* Animated particles on hover */}
              <motion.div
                className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: isFlipped ? 0.3 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {!prefersReducedMotion && [...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn('absolute w-2 h-2 rounded-full bg-gradient-to-r', colorGradient)}
                    animate={{
                      x: [0, Math.random() * 100 - 50],
                      y: [0, Math.random() * 100 - 50],
                      opacity: [0, 0.6, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + i * 10}%`,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Back face */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden cursor-pointer"
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                rotateZ: 180,
              }}
              data-testid={`timeline-card-back-${event.id}`}
            >
              {/* Colored top border */}
              <div className={cn('h-1 bg-gradient-to-r', colorGradient)} />

              <div className="p-6 h-full flex flex-col">
                {/* Header with icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center', colorGradient)}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">{event.title}</h4>
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                      <Calendar size={12} />
                      <span>
                        {date.month} {date.day}, {date.year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full description */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                        Event Details
                      </h5>
                      <p className="text-gray-300 leading-relaxed text-sm">
                        {event.description}
                      </p>
                    </div>

                    {/* Event metadata */}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 block mb-1">Type</span>
                          <span className={cn('px-2 py-1 bg-gradient-to-r text-white rounded capitalize font-medium inline-block', colorGradient)}>
                            {event.event_type}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Created</span>
                          <span className="text-gray-300">
                            {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back hint */}
                <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-medium mt-4 pt-4 border-t border-gray-700">
                  <span>Move cursor away to flip back</span>
                </div>
              </div>

              {/* Gradient overlay for depth */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background: `radial-gradient(circle at 50% 50%, transparent 0%, ${colorGradient.includes('yellow') ? '#fbbf24' : colorGradient.includes('red') ? '#ef4444' : colorGradient.includes('green') ? '#10b981' : colorGradient.includes('blue') ? '#3b82f6' : colorGradient.includes('purple') ? '#a855f7' : colorGradient.includes('orange') ? '#f97316' : '#6366f1'} 100%)`,
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative" data-testid="timeline-view">
      {/* Vertical timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />

      {/* Timeline events */}
      <div className="space-y-8">
        {events.map((event, index) => {
          const Icon = eventIcons[event.event_type];
          const colorGradient = eventColors[event.event_type];

          return (
            <FlipCard
              key={event.id}
              event={event}
              colorGradient={colorGradient}
              Icon={Icon}
              index={index}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12" data-testid="timeline-empty-state">
          <div className="text-gray-500 mb-2">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No events in the timeline yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
