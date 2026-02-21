'use client';

import { motion } from 'framer-motion';
import { Upload, XCircle, CheckCircle, FileAudio } from 'lucide-react';

interface LocalAudioUploadProps {
  audioFiles: File[];
  setAudioFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const LocalAudioUpload = ({ audioFiles, setAudioFiles }: LocalAudioUploadProps) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAudioFiles = Array.from(files).filter((file) =>
      file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)
    );

    setAudioFiles((prev) => [...prev, ...newAudioFiles]);
  };

  const removeFile = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="audio-file-upload"
        />
        <label
          htmlFor="audio-file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer bg-gray-900 hover:bg-gray-800 transition-all duration-200"
        >
          <Upload className="w-16 h-16 text-gray-500 mb-4" />
          <p className="text-gray-300 font-medium mb-1">Click to upload audio files</p>
          <p className="text-sm text-gray-500">MP3, WAV, M4A, OGG, FLAC, AAC</p>
        </label>
      </div>

      {/* File List */}
      {audioFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300">
              Selected Files ({audioFiles.length})
            </h4>
            <button
              onClick={() => setAudioFiles([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {audioFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileAudio className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate font-medium">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <span className="text-xs text-gray-600">•</span>
                      <p className="text-xs text-gray-500 capitalize">
                        {file.type.split('/')[1] || 'audio'}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-3 p-1 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  <XCircle className="w-5 h-5 text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Note */}
      <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Tips for best results:</h4>
        <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
          <li>Upload clear, high-quality audio recordings</li>
          <li>Minimize background noise for better transcription accuracy</li>
          <li>Supported formats: MP3, WAV, M4A, OGG, FLAC, AAC</li>
          <li>Multiple files can be processed simultaneously</li>
        </ul>
      </div>
    </div>
  );
};

export default LocalAudioUpload;
