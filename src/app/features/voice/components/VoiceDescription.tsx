'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Voice } from '@/app/types/Voice';
import { useUpdateVoice } from '@/app/hooks/useVoices';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { Sparkles, Save, Loader2, Edit3, X } from 'lucide-react';
import InlineTerminal from '@/cli/InlineTerminal';

interface VoiceDescriptionProps {
  voice: Voice;
}

const VoiceDescription = ({ voice }: VoiceDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(voice.description || '');
  const { mutate: updateVoice, isPending: isSaving } = useUpdateVoice();
  const { selectedProject } = useProjectStore();

  const cli = useCLIFeature({
    featureId: 'voice-desc',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['voice-description'],
  });

  const handleEnhance = () => {
    const prompt = `Generate a voice description for "${voice.name}".
Provider: ${voice.provider || 'unknown'}, Language: ${voice.language || 'en'}, Gender: ${voice.gender || 'unknown'}.
${description ? `Current description to enhance: ${description}` : 'No existing description.'}
Write a 100-200 word voice description covering tone, pace, vocabulary, patterns, and distinctive markers.`;
    cli.executePrompt(prompt, 'Voice Description');
  };

  const handleInsertResult = (text: string) => {
    setDescription(text);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateVoice(
      {
        id: voice.id,
        updates: { description },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setDescription(voice.description || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-950/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Voice Description
        </h4>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                onClick={handleEnhance}
                disabled={cli.isRunning}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-900 text-purple-200 hover:bg-purple-800 transition-colors text-sm disabled:opacity-50"
              >
                {cli.isRunning ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    AI Enhance
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the voice characteristics, tone, and ideal use cases..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={6}
          />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {description ? (
            <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No description yet. Use AI Enhance to generate one or add your own.
            </p>
          )}
        </motion.div>
      )}

      {/* CLI Terminal for AI generation */}
      <InlineTerminal
        {...cli.terminalProps}
        height={150}
        collapsible
        onInsert={handleInsertResult}
      />
    </div>
  );
};

export default VoiceDescription;
