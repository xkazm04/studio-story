'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Voice } from '@/app/types/Voice';
import { useDeleteVoice } from '@/app/hooks/useVoices';
import { AudioWaveform, Speaker, Settings, Trash2, Play, Pause, AlertCircle, Sparkles } from 'lucide-react';
import VoiceConfiguration from './VoiceConfiguration';
import VoiceDescription from './VoiceDescription';

interface VoiceRowProps {
  voice: Voice;
}

const VoiceRow = ({ voice }: VoiceRowProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { mutate: deleteVoice, isPending: isDeleting } = useDeleteVoice();

  useEffect(() => {
    const currentAudio = audioRef.current;

    if (currentAudio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      currentAudio.addEventListener('play', handlePlay);
      currentAudio.addEventListener('pause', handlePause);
      currentAudio.addEventListener('ended', handleEnded);

      return () => {
        currentAudio.removeEventListener('play', handlePlay);
        currentAudio.removeEventListener('pause', handlePause);
        currentAudio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const handlePlaySample = () => {
    if (!voice.audio_sample_url) {
      setError('No audio sample available');
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleDelete = () => {
    deleteVoice(
      { id: voice.id, projectId: voice.project_id },
      {
        onError: (error) => {
          setError('Failed to delete voice: ' + error.message);
        },
      }
    );
  };

  return (
    <motion.div
      className="relative"
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
        {/* Main Row */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isPlaying
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 animate-pulse'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800'
              }`}
            >
              {isPlaying ? (
                <AudioWaveform className="w-5 h-5 text-emerald-200" />
              ) : (
                <Speaker className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-100">{voice.name}</h3>
              {voice.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{voice.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                {voice.provider && (
                  <span className="text-xs text-gray-500 capitalize">{voice.provider}</span>
                )}
                {voice.language && (
                  <span className="text-xs text-gray-500">{voice.language}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* AI Description Enhancement */}
            <button
              onClick={() => setShowDescription(!showDescription)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showDescription
                  ? 'bg-purple-900 text-purple-200 border border-purple-600'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
              title="AI-Enhanced Description"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showConfig
                  ? 'bg-blue-900 text-blue-200 border border-blue-600'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
              title="Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Play Sample */}
            {voice.audio_sample_url && (
              <button
                onClick={handlePlaySample}
                className="p-2 rounded-lg bg-emerald-900 text-emerald-200 hover:bg-emerald-800 transition-all duration-200"
                title={isPlaying ? 'Pause' : 'Play Sample'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-all duration-200 disabled:opacity-50"
              title="Delete Voice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Element */}
        {voice.audio_sample_url && (
          <audio ref={audioRef} src={voice.audio_sample_url} />
        )}

        {/* Expandable Sections */}
        <AnimatePresence>
          {showDescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700/30"
            >
              <VoiceDescription voice={voice} />
            </motion.div>
          )}

          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700/30"
            >
              <VoiceConfiguration voice={voice} />
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-900/20 border-t border-red-900/30 px-5 py-3 text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showConfirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowConfirmDelete(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-md mx-4 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Delete Voice</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{voice.name}"? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowConfirmDelete(false);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VoiceRow;
