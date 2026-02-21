'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileAudio, ChevronDown, ChevronRight, Sparkles, Copy, Check } from 'lucide-react';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

interface AudioTranscriptionsProps {
  audioFiles: File[];
  onTranscriptionsComplete: (transcriptions: any[]) => void;
}

interface TranscriptionResult {
  filename: string;
  text: string;
  enhanced_text?: string;
  word_count: number;
  duration?: number;
}

const AudioTranscriptions = ({ audioFiles, onTranscriptionsComplete }: AudioTranscriptionsProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { selectedProject } = useProjectStore();

  const cli = useCLIFeature({
    featureId: 'audio-transcription',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
  });

  const handleTranscribe = async () => {
    setIsTranscribing(true);

    try {
      // TODO: Implement actual transcription API call
      // This would call Whisper API, AssemblyAI, or similar service

      // Simulating transcription for UI demonstration
      const mockTranscriptions: TranscriptionResult[] = audioFiles.map((file, index) => ({
        filename: file.name,
        text: `This is a placeholder transcription for ${file.name}. In a real implementation, this would be the actual transcribed text from the audio file using services like Whisper, AssemblyAI, or ElevenLabs Scribe.`,
        word_count: 25,
        duration: 120,
      }));

      setTranscriptions(mockTranscriptions);
      onTranscriptionsComplete(mockTranscriptions);
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleEnhanceWithAI = (index: number) => {
    setEnhancingIndex(index);

    const transcription = transcriptions[index];
    const prompt = `You are a transcription editor who improves raw audio transcriptions.
Clean up filler words, fix obvious errors, add proper punctuation, and format the text for readability.
Maintain the original meaning and speaking style. Do not add or remove substantive content.

Improve this audio transcription:

${transcription.text}

Number of Speakers: 1

Provide:
1. Cleaned transcription with proper punctuation
2. Remove filler words (um, uh, like, you know) sparingly - keep if stylistically important
3. Fix obvious errors while preserving the speaker's voice
4. Format as readable paragraphs`;

    cli.executePrompt(prompt, 'Enhance Transcription');
  };

  const handleInsertEnhanced = (text: string) => {
    if (enhancingIndex !== null) {
      const updated = [...transcriptions];
      updated[enhancingIndex].enhanced_text = text.trim();
      setTranscriptions(updated);
      setEnhancingIndex(null);
    }
  };

  const toggleExpansion = (filename: string) => {
    setExpandedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Transcribe Button */}
      {transcriptions.length === 0 && (
        <button
          onClick={handleTranscribe}
          disabled={isTranscribing || audioFiles.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Transcribing {audioFiles.length} file(s)...
            </>
          ) : (
            <>
              <FileAudio className="w-5 h-5" />
              Transcribe Audio Files
            </>
          )}
        </button>
      )}

      {/* Transcription Results */}
      {transcriptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300">
              Transcriptions ({transcriptions.length})
            </h4>
            <button
              onClick={handleTranscribe}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Re-transcribe
            </button>
          </div>

          <div className="space-y-2">
            {transcriptions.map((transcription, index) => {
              const isExpanded = expandedFiles.includes(transcription.filename);
              const textToShow = transcription.enhanced_text || transcription.text;

              return (
                <motion.div
                  key={transcription.filename}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
                >
                  {/* Header */}
                  <div
                    onClick={() => toggleExpansion(transcription.filename)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 font-medium truncate">
                          {transcription.filename}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {transcription.word_count} words
                          </p>
                          {transcription.duration && (
                            <>
                              <span className="text-xs text-gray-600">•</span>
                              <p className="text-xs text-gray-500">
                                {Math.floor(transcription.duration / 60)}:{(transcription.duration % 60).toString().padStart(2, '0')}
                              </p>
                            </>
                          )}
                          {transcription.enhanced_text && (
                            <>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-purple-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Enhanced
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!transcription.enhanced_text && (
                        <button
                          onClick={() => handleEnhanceWithAI(index)}
                          disabled={cli.isRunning}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-900 text-purple-200 hover:bg-purple-800 transition-colors text-xs disabled:opacity-50"
                        >
                          {enhancingIndex === index ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Enhance with AI
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-700"
                      >
                        <div className="p-4 space-y-3">
                          <div className="relative">
                            <div className="p-4 bg-gray-950/50 rounded-lg text-sm text-gray-300 leading-relaxed max-h-64 overflow-y-auto">
                              {textToShow}
                            </div>
                            <button
                              onClick={() => copyToClipboard(textToShow, index)}
                              className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLI Terminal for AI enhancement */}
      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={handleInsertEnhanced}
      />

      {/* Info Note */}
      <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
        <h4 className="text-sm font-medium text-blue-300 mb-2">About Transcription:</h4>
        <p className="text-sm text-blue-200">
          Transcription uses AI models like Whisper to convert speech to text. The "Enhance with AI" feature
          uses your local LLM to clean up filler words, fix errors, and improve formatting.
        </p>
      </div>
    </div>
  );
};

export default AudioTranscriptions;
