'use client';

import V2Layout from '@/workspace/layout/V2Layout';

/**
 * Studio Story — Single-page workspace app.
 *
 * No routing, no tabs, no v1/v2 toggle.
 * The workspace IS the entire application.
 */
export default function StudioPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <V2Layout />
    </div>
  );
}
