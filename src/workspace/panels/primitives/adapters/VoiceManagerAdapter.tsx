'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import LazyContainer from '../LazyContainer';

const VoiceList = React.lazy(() => import('@/app/features/voice/components/VoiceList'));

interface VoiceManagerAdapterProps {
  onClose?: () => void;
}

export default function VoiceManagerAdapter({ onClose }: VoiceManagerAdapterProps) {
  const { selectedProject } = useProjectStore();

  return (
    <LazyContainer
      title="Voices"
      icon={Mic}
      headerAccent="emerald"
      onClose={onClose}
      component={VoiceList}
      componentProps={selectedProject?.id ? { projectId: selectedProject.id } : {}}
      isEmpty={!selectedProject?.id}
      emptyIcon={Mic}
      emptyTitle="No project selected"
      emptyDescription="Select a project to manage voice profiles and casting assets."
    />
  );
}
