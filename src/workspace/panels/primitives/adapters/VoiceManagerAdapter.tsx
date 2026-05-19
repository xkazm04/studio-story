'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import type { BaseAdapterProps } from '../types';
import LazyContainer from '../LazyContainer';
import { useResolvedProjectId } from './useResolvedProjectId';

const VoiceList = React.lazy(() => import('@/app/features/voice/components/VoiceList'));

type VoiceManagerAdapterProps = BaseAdapterProps;

export default function VoiceManagerAdapter({ onClose, density }: VoiceManagerAdapterProps) {
  const { projectId, hasProject } = useResolvedProjectId();

  return (
    <LazyContainer
      title="Voices"
      icon={Mic}
      headerAccent="emerald"
      onClose={onClose}
      density={density}
      component={VoiceList}
      componentProps={hasProject ? { projectId } : {}}
      isEmpty={!hasProject}
      emptyIcon={Mic}
      emptyTitle="No project selected"
      emptyDescription="Select a project to manage voice profiles and casting assets."
    />
  );
}
