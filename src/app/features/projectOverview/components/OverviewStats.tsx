'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { projectStatsApi } from '@/app/hooks/integration/useProjectStats';
import {
  ProgressCard,
  ProgressCardGrid,
  ProgressSummaryCard,
  ProgressSummaryGrid,
} from '@/app/components/UI/ProgressCard';

const OverviewStats: React.FC = () => {
  const { selectedProject } = useProjectStore();

  const { data: stats, isLoading } = projectStatsApi.useProjectStats(
    selectedProject?.id || '',
    !!selectedProject
  );

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No project selected
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 rounded-lg border border-slate-700/50 p-6 space-y-6"
        data-testid="project-overview-stats-loading"
      >
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
          Loading statistics...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 rounded-lg border border-slate-700/50 p-6 space-y-6"
      data-testid="project-overview-stats"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="ms-h3" data-testid="overview-title">
          Project Overview
        </h3>
        <div className="text-sm text-slate-400 font-mono" data-testid="overview-project-name">
          {selectedProject.name}
        </div>
      </div>

      {/* Stats */}
      <ProgressCardGrid data-testid="overview-progress-cards">
        <ProgressCard
          title="Acts"
          current={stats.acts.count}
          target={stats.acts.target}
          color="bg-blue-500"
          data-testid="acts-progress-card"
        />

        <ProgressCard
          title="Scenes"
          current={stats.scenes.count}
          target={stats.scenes.target}
          color="bg-purple-500"
          data-testid="scenes-progress-card"
        />

        <ProgressCard
          title="Completed Beats"
          current={stats.beats.completed}
          target={stats.beats.total || 1}
          color="bg-green-500"
          data-testid="beats-progress-card"
        />
      </ProgressCardGrid>

      {/* Summary */}
      <div className="pt-4 border-t border-slate-700/50">
        <ProgressSummaryGrid data-testid="overview-summary-cards">
          <ProgressSummaryCard
            value={stats.acts.count}
            label="Acts"
            color="text-blue-400"
            data-testid="acts-summary-card"
          />

          <ProgressSummaryCard
            value={stats.scenes.count}
            label="Scenes"
            color="text-purple-400"
            data-testid="scenes-summary-card"
          />

          <ProgressSummaryCard
            value={`${stats.beats.completionPercentage}%`}
            label="Complete"
            color="text-green-400"
            data-testid="completion-summary-card"
          />
        </ProgressSummaryGrid>
      </div>
    </motion.div>
  );
};

export default OverviewStats;
