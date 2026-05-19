'use client';

import React, { useCallback } from 'react';
import { MessageCircle, Copy, Mic, Pencil } from 'lucide-react';
import ConversationView from '../ConversationView';
import type { BaseAdapterProps, DialogueLine } from '../types';
import type { ContextMenuItem } from '../ContextMenu';

interface DialogueViewAdapterProps extends BaseAdapterProps {
  sceneId?: string;
  lines?: DialogueLine[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function DialogueViewAdapter({
  lines = [],
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onClose,
  density,
  onTriggerSkill,
}: DialogueViewAdapterProps) {
  const getContextMenuItems = useCallback((_line: DialogueLine): ContextMenuItem[] => [
    { id: 'copy-text', label: 'Copy Line', icon: Copy },
    { id: 'edit-line', label: 'Edit Line', icon: Pencil },
    { id: 'generate-audio', label: 'Generate Audio', icon: Mic, separator: true },
  ], []);

  const handleContextMenuAction = useCallback((actionId: string, line: DialogueLine) => {
    switch (actionId) {
      case 'copy-text':
        navigator.clipboard.writeText(`${line.speaker}: ${line.text}`);
        break;
      case 'edit-line':
        onTriggerSkill?.('dialogue-edit', { speaker: line.speaker, text: line.text });
        break;
      case 'generate-audio':
        onTriggerSkill?.('dialogue-tts', { speaker: line.speaker, text: line.text });
        break;
    }
  }, [onTriggerSkill]);

  return (
    <ConversationView
      title="Dialogue"
      icon={MessageCircle}
      headerAccent="amber"
      onClose={onClose}
      density={density}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={onRetry}
      lines={lines}
      emptyTitle="No dialogue lines yet"
      emptyDescription="Generate dialogue via the terminal."
      contextMenuItems={getContextMenuItems}
      onContextMenuAction={handleContextMenuAction}
    />
  );
}
