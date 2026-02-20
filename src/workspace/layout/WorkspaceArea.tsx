'use client';

import React from 'react';
import WorkspaceGrid from '../components/WorkspaceGrid';

/**
 * WorkspaceArea — Container for the dynamic panel grid.
 */
export default function WorkspaceArea() {
  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-950/30">
      <WorkspaceGrid />
    </div>
  );
}
