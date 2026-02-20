'use client';

import React from 'react';
import WorkspaceGrid from '../components/WorkspaceGrid';

/**
 * WorkspaceArea — Container for the dynamic panel grid.
 */
export default function WorkspaceArea() {
  return (
    <div className="h-full overflow-hidden">
      <WorkspaceGrid />
    </div>
  );
}
