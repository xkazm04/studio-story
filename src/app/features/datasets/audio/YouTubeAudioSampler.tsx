'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Loader2, Play, Download, AlertCircle } from 'lucide-react';

interface YouTubeAudioSamplerProps {
  projectId: string;
  onSamplesExtracted: (files: File[]) => void;
}

const YouTubeAudioSampler = ({ projectId, onSamplesExtracted }: YouTubeAudioSamplerProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [sampleLength, setSampleLength] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [extractedSamples, setExtractedSamples] = useState<Array<{
    id: string;
    name: string;
    duration: number;
    url: string;
  }>>([]);

  const handleExtract = async () => {
    setError('');

    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual YouTube audio extraction
      // This would call a backend API that:
      // 1. Downloads the YouTube video audio
      // 2. Splits it into samples of specified length
      // 3. Returns the audio files

      // For now, showing the UI pattern
      const response = await fetch('/api/youtube-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl,
          sampleLength,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract audio from YouTube');
      }

      const data = await response.json();
      setExtractedSamples(data.samples || []);

      // Convert to File objects (placeholder)
      // In real implementation, would download the audio files
      onSamplesExtracted([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during extraction');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = (sample: typeof extractedSamples[0]) => {
    // TODO: Implement sample download
    console.log('Downloading sample:', sample);
  };

  return (
    <div className="space-y-6">
      {/* YouTube Input Section */}
      <div className="bg-gradient-to-br from-red-900/20 to-red-950/40 border border-red-900/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-red-900/50 rounded-lg">
            <Youtube className="w-5 h-5 text-red-200" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200">YouTube Audio Extractor</h3>
        </div>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              YouTube URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Sample Length */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Length (minutes)
              </label>
              <input
                type="number"
                value={sampleLength}
                onChange={(e) => setSampleLength(Math.max(1, Math.min(5, Number(e.target.value))))}
                min={1}
                max={5}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={isProcessing}
              className="mt-7 flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Extract Audio
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-900/30 border border-red-900/50 rounded-lg text-red-300 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs text-gray-400">
          <p>
            <strong>Note:</strong> This feature requires a backend service to extract audio from YouTube.
            Samples will be automatically split into {sampleLength}-minute segments.
          </p>
        </div>
      </div>

      {/* Extracted Samples */}
      {extractedSamples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-semibold text-gray-300">
            Extracted Samples ({extractedSamples.length})
          </h4>

          <div className="space-y-2">
            {extractedSamples.map((sample, index) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-900/30 rounded-lg">
                    <Youtube className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{sample.name}</p>
                    <p className="text-xs text-gray-500">{sample.duration}s duration</p>
                  </div>
                </div>

                <button
                  onClick={() => downloadSample(sample)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Implementation Note */}
      <div className="p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-300 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Backend Implementation Required
        </h4>
        <p className="text-sm text-yellow-200">
          YouTube audio extraction requires a backend API endpoint at <code className="px-1 py-0.5 bg-yellow-900/30 rounded text-xs">/api/youtube-extract</code> that handles:
        </p>
        <ul className="text-sm text-yellow-200 mt-2 space-y-1 list-disc list-inside ml-4">
          <li>YouTube video download (using yt-dlp or similar)</li>
          <li>Audio extraction and format conversion</li>
          <li>Splitting into specified sample lengths</li>
          <li>Storage in Supabase Storage</li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeAudioSampler;
