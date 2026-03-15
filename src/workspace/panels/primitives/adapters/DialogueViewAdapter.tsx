'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import ConversationView from '../ConversationView';
import type { DialogueLine } from '../types';

interface DialogueViewAdapterProps {
  sceneId?: string;
  lines?: DialogueLine[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export default function DialogueViewAdapter({
  lines = [],
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onClose,
}: DialogueViewAdapterProps) {
  return (
    <ConversationView
      title="Dialogue"
      icon={MessageCircle}
      headerAccent="amber"
      onClose={onClose}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={onRetry}
      lines={lines}
      emptyTitle="No dialogue lines yet"
      emptyDescription="Generate dialogue via the terminal."
    />
  );
}
