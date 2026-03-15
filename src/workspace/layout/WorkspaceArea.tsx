'use client';

import React from 'react';
import WorkspaceGrid from '../components/WorkspaceGrid';

/**
 * WorkspaceArea — Container for the dynamic panel grid.
 */
export default function WorkspaceArea() {
  return (
    <div className="relative h-full min-h-0 bg-slate-950/30">
      <WorkspaceGrid />
    </div>
  );
}
