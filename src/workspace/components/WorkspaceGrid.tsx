'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getLayoutTemplate, assignPanelsToSlots } from '../engine/layoutEngine';
import WorkspacePanelWrapper from './WorkspacePanelWrapper';
import WorkspaceToolbar from './WorkspaceToolbar';
import EmptyWelcomePanel from '../panels/shared/EmptyWelcomePanel';

const panelVariants = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 6 },
};

interface WorkspaceGridProps {
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onTriggerPrompt?: (text: string, label?: string) => void;
}

export default function WorkspaceGrid({ onTriggerSkill, onTriggerPrompt }: WorkspaceGridProps) {
  const panels = useWorkspaceStore((s) => s.panels);
  const layout = useWorkspaceStore((s) => s.layout);

  // Empty state
  if (panels.length === 0) {
    return (
      <div className="h-full p-4">
        <EmptyWelcomePanel />
      </div>
    );
  }

  const template = getLayoutTemplate(layout);
  const assignedPanels = assignPanelsToSlots(panels, layout);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar />
      <div
        className="flex-1 min-h-0 gap-3 overflow-hidden p-3 pt-2"
        style={{
          display: 'grid',
          gridTemplateRows: template.gridTemplateRows,
          gridTemplateColumns: template.gridTemplateColumns,
          gridAutoRows: 'minmax(0, 1fr)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {assignedPanels.map((panel, idx) => {
            const slotStyle = template.slots[idx]?.style ?? {};
            return (
              <motion.div
                key={panel.id}
                layout
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={slotStyle}
                className="min-h-0 min-w-0 overflow-hidden"
              >
                <WorkspacePanelWrapper
                  panel={panel}
                  onTriggerSkill={onTriggerSkill}
                  onTriggerPrompt={onTriggerPrompt}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
