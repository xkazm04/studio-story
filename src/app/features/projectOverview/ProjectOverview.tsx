'use client';

import React from 'react';
import OverviewStats from './components/OverviewStats';

const ProjectOverview: React.FC = () => {
  return (
    <div className="h-full w-full p-4 space-y-4 overflow-y-auto">
      {/* Overview Stats */}
      <OverviewStats />

      {/* Future components can be added here */}
      <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-6 text-center">
        <p className="text-gray-500 text-sm">
          More overview components coming soon...
        </p>
      </div>
    </div>
  );
};

export default ProjectOverview;
