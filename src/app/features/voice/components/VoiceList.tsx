'use client';

import { motion } from 'framer-motion';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import VoiceRow from './VoiceRow';
import { MicOff, Loader2 } from 'lucide-react';
import { EmptyState } from '@/app/components/UI';

interface VoiceListProps {
  projectId: string;
}

const VoiceList = ({ projectId }: VoiceListProps) => {
  const { data: voices, isLoading, error, refetch } = useVoicesByProject(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-400">
        <MicOff className="h-12 w-12 mb-4 opacity-70" />
        <p className="text-lg font-medium mb-2">Failed to load voices</p>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 transition-colors rounded-lg text-sm flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!voices?.length) {
    return (
      <EmptyState
        icon={<MicOff />}
        title="No voices yet"
        subtitle="Create your first voice using the Voice Extraction tab"
        iconSize="lg"
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-200">
            Project Voices ({voices.length})
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {voices.map((voice, index) => (
          <motion.div
            key={voice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <VoiceRow voice={voice} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VoiceList;
