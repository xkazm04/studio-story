'use client';

import { BeatTableItem } from '../BeatsOverview';
import { BeatDependency } from '@/app/types/Beat';
import { motion } from 'framer-motion';
import { DATA_VIZ, ChartLegend, chartAnimations } from '../dataVizTheme';

interface GanttTimelineProps {
  beats: BeatTableItem[];
  dependencies: BeatDependency[];
  onBeatClick: (beatId: string) => void;
  selectedBeat: string | null;
}

const GanttTimeline = ({
  beats,
  dependencies,
  onBeatClick,
  selectedBeat,
}: GanttTimelineProps) => {
  // Sort beats by order
  const sortedBeats = [...beats].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Calculate cumulative duration for timeline
  const beatsWithPosition = sortedBeats.map((beat, index) => {
    const duration = beat.estimated_duration || 10; // Default 10 min
    const startTime = sortedBeats
      .slice(0, index)
      .reduce((sum, b) => sum + (b.estimated_duration || 10), 0);

    return {
      ...beat,
      startTime,
      duration,
      endTime: startTime + duration,
    };
  });

  const totalDuration = beatsWithPosition.reduce((sum, b) => sum + b.duration, 0);
  const pixelsPerMinute = totalDuration > 0 ? 800 / totalDuration : 1;

  return (
    <motion.div
      {...chartAnimations.slideUp}
      className={`absolute bottom-4 left-4 right-4 ${DATA_VIZ.tooltipBg} ${DATA_VIZ.tooltipBlur} border ${DATA_VIZ.tooltipBorder} rounded-lg p-4 shadow-2xl`}
      data-testid="gantt-timeline"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={DATA_VIZ.headingText}>Timeline Overview</h3>
        <div className={DATA_VIZ.labelText}>
          Total: {totalDuration} minutes
        </div>
      </div>

      <div className="relative">
        {/* Timeline ruler */}
        <div className={`flex items-center mb-2 ${DATA_VIZ.labelText}`}>
          {Array.from({ length: 11 }).map((_, i) => {
            const time = (totalDuration * i) / 10;
            return (
              <div
                key={i}
                className="flex-1 text-center"
                style={{ minWidth: '80px' }}
              >
                {Math.round(time)}m
              </div>
            );
          })}
        </div>

        {/* Timeline bars */}
        <div className={`relative h-16 rounded overflow-hidden ${DATA_VIZ.barTrackBg} border ${DATA_VIZ.containerBorder}`}>
          {beatsWithPosition.map((beat) => {
            const left = (beat.startTime * pixelsPerMinute) / 800 * 100;
            const width = (beat.duration * pixelsPerMinute) / 800 * 100;
            const isSelected = selectedBeat === beat.id;

            return (
              <motion.div
                key={beat.id}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DATA_VIZ.animDuration, delay: beat.order ? chartAnimations.stagger(beat.order) : 0 }}
                className={`
                  absolute top-2 h-12 rounded cursor-pointer
                  transition-all duration-200
                  ${
                    beat.completed
                      ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/40 border border-green-400/50'
                      : 'bg-gradient-to-r from-blue-500/60 to-purple-500/40 border border-blue-400/50'
                  }
                  ${isSelected ? 'ring-2 ring-blue-400 shadow-lg scale-105 z-10' : 'hover:scale-105'}
                `}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  transformOrigin: 'left center',
                }}
                onClick={() => onBeatClick(beat.id)}
                data-testid={`gantt-bar-${beat.id}`}
              >
                <div className="px-2 py-1 h-full flex flex-col justify-center">
                  <div className="text-sm font-medium text-white truncate">
                    {beat.order !== undefined ? `${beat.order + 1}.` : ''} {beat.name}
                  </div>
                  <div className={`${DATA_VIZ.valueText} opacity-70`}>
                    {beat.duration}m
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dependency indicators */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ marginTop: '24px' }}
        >
          {dependencies.map((dep) => {
            const sourceBeat = beatsWithPosition.find((b) => b.id === dep.source_beat_id);
            const targetBeat = beatsWithPosition.find((b) => b.id === dep.target_beat_id);

            if (!sourceBeat || !targetBeat) return null;

            const sourceX = ((sourceBeat.endTime * pixelsPerMinute) / 800) * 100;
            const targetX = ((targetBeat.startTime * pixelsPerMinute) / 800) * 100;

            if (targetX <= sourceX) return null; // Don't show backwards dependencies

            return (
              <g key={dep.id}>
                <line
                  x1={`${sourceX}%`}
                  y1="24"
                  x2={`${targetX}%`}
                  y2="24"
                  stroke={dep.dependency_type === 'causal' ? '#10b981' : '#3b82f6'}
                  strokeWidth="1.5"
                  strokeDasharray={dep.strength === 'optional' ? '3,3' : 'none'}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <ChartLegend
        items={[
          { color: '#3b82f6', label: 'In Progress' },
          { color: '#10b981', label: 'Completed' },
          { color: '#60a5fa', label: 'Sequential', isLine: true },
          { color: '#34d399', label: 'Causal', isLine: true },
        ]}
        className="mt-3"
      />
    </motion.div>
  );
};

export default GanttTimeline;
