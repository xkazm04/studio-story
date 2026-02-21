'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, Check } from 'lucide-react';
import { CharacterImageUpload } from './CharacterImageUpload';
import { ImageExtractionConfig } from '../types';
import { Appearance } from '@/app/types/Character';
import { extractFromImage, mergeExtractionResults } from '@/app/lib/services/imageExtraction';
import { characterAppearanceSchema, extractedDataToAppearance } from '@/app/lib/schemas/extractionSchemas';
import { cn } from '@/app/lib/utils';

interface CharacterImageExtractionProps {
  onExtracted: (appearance: Partial<Appearance>, prompt: string) => void;
  config?: ImageExtractionConfig;
}

/**
 * Character Image Extraction Component
 * Handles image upload and AI extraction of character appearance
 */
export function CharacterImageExtraction({
  onExtracted,
  config = { gemini: { enabled: true }, groq: { enabled: true } },
}: CharacterImageExtractionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setError(null);
    setSuccess(false);

    try {
      const anyModelEnabled = config.gemini.enabled || config.groq.enabled;

      if (!anyModelEnabled) {
        throw new Error('Please enable at least one AI model');
      }

      const results = await extractFromImage(selectedFile, characterAppearanceSchema, config);
      const mergedData = mergeExtractionResults(results, 'gemini');
      const { appearance, prompt } = extractedDataToAppearance(mergedData);

      onExtracted(appearance, prompt);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(message);
      console.error('Character extraction failed:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClearExtraction = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      <CharacterImageUpload
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onClearExtraction={handleClearExtraction}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-300"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-900/30 border border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-300"
        >
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Appearance extracted successfully!</span>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleExtract}
        disabled={!selectedFile || isExtracting}
        className={cn(
          'w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300',
          !selectedFile || isExtracting
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-purple-600/20'
        )}
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Extracting Appearance...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span>Extract Appearance with AI</span>
          </>
        )}
      </motion.button>

      <p className="text-xs text-gray-500 text-center">
        AI will analyze the image and fill in the appearance fields below
      </p>
    </div>
  );
}
