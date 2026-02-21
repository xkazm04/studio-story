'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Youtube, Sparkles, FileAudio, Loader2 } from 'lucide-react';
import YouTubeAudioSampler from './YouTubeAudioSampler';
import LocalAudioUpload from './LocalAudioUpload';
import AudioTranscriptions from './AudioTranscriptions';
import CharacterPersonalityExtractor from './CharacterPersonalityExtractor';

interface AudioExtractionProps {
  projectId: string;
}

type ExtractionMode = 'youtube' | 'upload';

const AudioExtraction = ({ projectId }: AudioExtractionProps) => {
  const [mode, setMode] = useState<ExtractionMode>('youtube');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);

  const modes = [
    { id: 'youtube' as const, label: 'YouTube', icon: Youtube },
    { id: 'upload' as const, label: 'Upload Files', icon: Upload },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <FileAudio className="w-6 h-6 text-purple-400" />
            Audio Data Extraction
          </h2>
          <p className="text-gray-400 mt-1">
            Extract audio samples from YouTube or upload your own files for transcription and analysis
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex items-center gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                mode === m.id
                  ? 'bg-purple-900 text-white border border-purple-600'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'youtube' && (
          <motion.div
            key="youtube"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <YouTubeAudioSampler
              projectId={projectId}
              onSamplesExtracted={(files) => setAudioFiles(files)}
            />
          </motion.div>
        )}

        {mode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <LocalAudioUpload
              audioFiles={audioFiles}
              setAudioFiles={setAudioFiles}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcriptions Section */}
      {audioFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Transcription & Analysis
            </h3>

            <AudioTranscriptions
              audioFiles={audioFiles}
              onTranscriptionsComplete={(transcripts) => setTranscriptions(transcripts)}
            />
          </div>
        </motion.div>
      )}

      {/* Character Extraction Section */}
      {transcriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="border-t border-gray-800 pt-6">
            <CharacterPersonalityExtractor transcriptions={transcriptions} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AudioExtraction;
