'use client';

import React from 'react';
import { Network } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';
import type { PanelDensity } from '@/workspace/types';

const RelationshipMap = React.lazy(
  () => import('@/app/features/relationships/RelationshipMap')
);

interface RelationshipMapPanelProps {
  projectId?: string;
  onClose?: () => void;
  density?: PanelDensity;
}

export default function RelationshipMapPanel({
  projectId: propProjectId,
  onClose,
  density,
}: RelationshipMapPanelProps) {
  const { selectedProject } = useProjectStore();
  const resolvedProjectId = propProjectId || selectedProject?.id || '';

  // Micro density: show badge with network icon
  if (density === 'micro') {
    return (
      <PanelFrame title="Relationships" icon={Network} onClose={onClose} headerAccent="purple" density={density}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-slate-300">Relationship Map</span>
        </div>
      </PanelFrame>
    );
  }

  if (!resolvedProjectId) {
    return (
      <PanelFrame title="Relationship Map" icon={Network} onClose={onClose} headerAccent="purple" density={density}>
        <PanelEmptyState
          icon={Network}
          title="No project selected"
          description="Select a project to view the relationship map."
        />
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Relationship Map" icon={Network} onClose={onClose} headerAccent="purple" density={density}>
      <div className="h-full w-full">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading relationship map...
            </div>
          }
        >
          <RelationshipMap projectId={resolvedProjectId} />
        </React.Suspense>
      </div>
    </PanelFrame>
  );
}
