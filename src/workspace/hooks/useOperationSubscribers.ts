'use client';

/**
 * useOperationSubscribers — Wires existing tool-use consumers to the OperationBus.
 *
 * Call once from the workspace root (V2Provider). Each consumer subscribes
 * independently via the bus, so adding new consumers never requires editing
 * CommandBar or this hook.
 *
 * Current subscribers:
 * 1. Query invalidation (useCLIDataSync.trackToolUse)
 * 2. Workflow hint learning (workflowHintStore.recordTool)
 * 3. Advisor event batching (agentStore.recordToolEvent)
 * 4. Immediate panel hints (TOOL_PANEL_HINTS → showPanels)
 * 5. Dynamic workspace composition interceptor (useWorkspaceComposition)
 */

import { useEffect, useCallback } from 'react';
import { operationBus, type ToolOperation } from '../operationBus';
import { useWorkflowHintStore } from '../store/workflowHintStore';
import { useAgentStore } from '@/agents/store/agentStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useWorkspaceComposition } from './useWorkspaceComposition';
import { useCLIDataSync } from './useCLIDataSync';
import { TOOL_PANEL_HINTS } from '../config/workflowHints';

export function useOperationSubscribers() {
  const { trackToolUse } = useCLIDataSync();
  const recordTool = useWorkflowHintStore((s) => s.recordTool);
  const recordToolEvent = useAgentStore((s) => s.recordToolEvent);
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const getPanelByType = useWorkspaceStore((s) => s.getPanelByType);
  const { handleToolUse: handleWorkspaceToolUse } = useWorkspaceComposition();

  // Subscriber 1: Query invalidation
  useEffect(() => {
    return operationBus.subscribe((op) => {
      trackToolUse(op.toolName);
    });
  }, [trackToolUse]);

  // Subscriber 2: Workflow hint learning
  useEffect(() => {
    return operationBus.subscribe((op) => {
      recordTool(op.baseName);
    });
  }, [recordTool]);

  // Subscriber 3: Advisor event batching
  useEffect(() => {
    return operationBus.subscribe((op) => {
      recordToolEvent(op.baseName, op.toolInput);
    });
  }, [recordToolEvent]);

  // Subscriber 4: Immediate panel hints
  const applyPanelHints = useCallback(
    (op: ToolOperation) => {
      const hintedPanels = TOOL_PANEL_HINTS[op.baseName];
      if (hintedPanels?.length) {
        const missingPanels = hintedPanels.filter(
          (directive) => !getPanelByType(directive.type)
        );
        if (missingPanels.length > 0) {
          showPanels(missingPanels);
        }
      }
    },
    [getPanelByType, showPanels]
  );

  useEffect(() => {
    return operationBus.subscribe(applyPanelHints);
  }, [applyPanelHints]);

  // Interceptor 5: Dynamic workspace composition
  useEffect(() => {
    return operationBus.intercept((op) => {
      return handleWorkspaceToolUse(op.toolName, op.toolInput);
    });
  }, [handleWorkspaceToolUse]);
}
