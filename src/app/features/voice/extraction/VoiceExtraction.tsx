'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useCreateVoice } from '@/app/hooks/useVoices';

interface VoiceExtractionProps {
  projectId: string;
}

const VoiceExtraction = ({ projectId }: VoiceExtractionProps) => {
  const [voiceName, setVoiceName] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { mutate: createVoice } = useCreateVoice();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const audioFiles = Array.from(files).filter((file) =>
      file.type.startsWith('audio/')
    );

    setAudioFiles((prev) => [...prev, ...audioFiles]);
    setError('');
  };

  const removeFile = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!voiceName.trim()) {
      setError('Please enter a voice name');
      return;
    }

    if (audioFiles.length === 0) {
      setError('Please select at least one audio file');
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual voice training/upload logic
      // This would typically involve:
      // 1. Uploading audio files to storage (Supabase Storage)
      // 2. Sending files to TTS provider (ElevenLabs) for voice cloning
      // 3. Getting back a voice_id
      // 4. Creating the voice record in database

      // For now, creating a placeholder voice
      createVoice(
        {
          name: voiceName,
          voice_id: `voice_${Date.now()}`, // Placeholder - would come from TTS provider
          project_id: projectId,
          provider: 'custom',
          description: `Voice created from ${audioFiles.length} audio sample(s)`,
        },
        {
          onSuccess: () => {
            setSuccess('Voice created successfully!');
            setVoiceName('');
            setAudioFiles([]);
          },
          onError: (error) => {
            setError('Failed to create voice: ' + error.message);
          },
        }
      );
    } catch (err) {
      setError('An error occurred while processing the voice');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-100">Voice Extraction</h2>
        <p className="text-gray-400">
          Upload audio samples to create a custom voice for your project
        </p>
      </div>

      {/* Voice Name Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Voice Name</label>
        <input
          type="text"
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          placeholder="e.g., Hero Voice, Narrator, etc."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Audio Samples</label>
        <div className="relative">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">Click to upload audio files</p>
            <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A, OGG</p>
          </label>
        </div>
      </div>

      {/* File List */}
      {audioFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-gray-200">
            Selected Files ({audioFiles.length})
          </label>
          <div className="space-y-2">
            {audioFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-gray-800 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-900/20 border border-red-900/30 rounded-lg text-red-300 text-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-emerald-900/20 border border-emerald-900/30 rounded-lg text-emerald-300 text-sm"
        >
          {success}
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || !voiceName.trim() || audioFiles.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Create Voice
          </>
        )}
      </button>

      {/* Info Note */}
      <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Tips for best results:</h4>
        <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
          <li>Upload at least 3-5 audio samples (1-10 minutes each)</li>
          <li>Use clear, high-quality recordings without background noise</li>
          <li>Include varied emotional expressions for better range</li>
          <li>Consistent voice throughout all samples produces better results</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceExtraction;
