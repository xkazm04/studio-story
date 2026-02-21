'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddImageToDataset } from '@/app/hooks/useDatasets';
import {
  X,
  Sparkles,
  Loader2,
  Trash2,
  Pencil,
  Check,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react';
import { Dataset } from '@/app/types/Dataset';
import { cn } from '@/app/lib/utils';

interface DatasetSketchWizardProps {
  dataset: Dataset;
  onClose: () => void;
}

type WizardStep = 'configure' | 'variations' | 'generating' | 'done';

interface PromptVariation {
  id: string;
  text: string;
}

interface GenerationStatus {
  promptId: string;
  generationId: string;
  status: 'pending' | 'polling' | 'complete' | 'failed';
  imageUrl?: string;
  error?: string;
}

const DatasetSketchWizard = ({ dataset, onClose }: DatasetSketchWizardProps) => {
  const [step, setStep] = useState<WizardStep>('configure');
  const [type, setType] = useState<'artstyle' | 'character'>('artstyle');
  const [basePrompt, setBasePrompt] = useState('');
  const [variationCount, setVariationCount] = useState(8);
  const [enhance, setEnhance] = useState(true);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [generations, setGenerations] = useState<GenerationStatus[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutate: addImage } = useAddImageToDataset();

  const handleGenerateVariations = async () => {
    if (!basePrompt.trim()) return;
    setError(null);
    setIsLoadingVariations(true);

    try {
      const res = await fetch('/api/ai/dataset-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrompt: basePrompt.trim(),
          type,
          count: variationCount,
          enhance,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate variations');
        return;
      }

      setVariations(data.prompts);
      setStep('variations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleRemoveVariation = (id: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
  };

  const handleStartEdit = (variation: PromptVariation) => {
    setEditingId(variation.id);
    setEditText(variation.text);
  };

  const handleSaveEdit = (id: string) => {
    setVariations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, text: editText } : v))
    );
    setEditingId(null);
    setEditText('');
  };

  const pollGeneration = useCallback(
    async (generationId: string, promptId: string, promptText: string) => {
      const maxAttempts = 60;
      let attempts = 0;

      const poll = async (): Promise<void> => {
        attempts++;
        if (attempts > maxAttempts) {
          setGenerations((prev) =>
            prev.map((g) =>
              g.generationId === generationId
                ? { ...g, status: 'failed', error: 'Timeout' }
                : g
            )
          );
          return;
        }

        try {
          const res = await fetch(
            `/api/ai/generate-images?generationId=${generationId}`
          );
          const data = await res.json();

          if (data.status === 'COMPLETE' && data.images?.[0]) {
            const imageUrl = data.images[0].url;

            setGenerations((prev) =>
              prev.map((g) =>
                g.generationId === generationId
                  ? { ...g, status: 'complete', imageUrl }
                  : g
              )
            );

            // Save to dataset
            addImage({
              dataset_id: dataset.id,
              image_url: imageUrl,
              internal_id: generationId,
              prompt: promptText,
              width: 768,
              height: 768,
            });
          } else if (data.status === 'FAILED') {
            setGenerations((prev) =>
              prev.map((g) =>
                g.generationId === generationId
                  ? { ...g, status: 'failed', error: 'Generation failed' }
                  : g
              )
            );
          } else {
            // Still pending — wait and retry
            await new Promise((r) => setTimeout(r, 2000));
            await poll();
          }
        } catch {
          setGenerations((prev) =>
            prev.map((g) =>
              g.generationId === generationId
                ? { ...g, status: 'failed', error: 'Polling error' }
                : g
            )
          );
        }
      };

      await poll();
    },
    [addImage, dataset.id]
  );

  const handleStartGeneration = async () => {
    if (variations.length === 0) return;
    setStep('generating');
    setError(null);

    // Initialize generation statuses
    const initial: GenerationStatus[] = variations.map((v) => ({
      promptId: v.id,
      generationId: '',
      status: 'pending',
    }));
    setGenerations(initial);

    try {
      const res = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: variations.map((v) => ({ id: v.id, text: v.text })),
          width: 768,
          height: 768,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to start generation');
        return;
      }

      // Update with generation IDs and start polling each
      const updated: GenerationStatus[] = data.generations.map(
        (g: { promptId: string; generationId: string; status: string; error?: string }) => ({
          promptId: g.promptId,
          generationId: g.generationId,
          status: g.status === 'failed' ? 'failed' : 'polling',
          error: g.error,
        })
      );
      setGenerations(updated);

      // Poll each started generation
      for (const gen of updated) {
        if (gen.status === 'polling' && gen.generationId) {
          const matchingVariation = variations.find((v) => v.id === gen.promptId);
          pollGeneration(gen.generationId, gen.promptId, matchingVariation?.text || '');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  const completedCount = generations.filter((g) => g.status === 'complete').length;
  const failedCount = generations.filter((g) => g.status === 'failed').length;
  const totalCount = generations.length;
  const allDone = totalCount > 0 && completedCount + failedCount === totalCount;

  // Auto-transition to done
  if (step === 'generating' && allDone) {
    setTimeout(() => setStep('done'), 500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Generate Images for &ldquo;{dataset.name}&rdquo;
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Configure */}
            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="flex gap-3">
                    {(['artstyle', 'character'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          type === t
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        )}
                      >
                        {t === 'artstyle' ? 'Art Style' : 'Character'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Base Prompt
                  </label>
                  <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder={
                      type === 'artstyle'
                        ? 'e.g. A cyberpunk cityscape at sunset with neon lights and flying cars...'
                        : 'e.g. A fierce warrior princess with silver armor and flowing red hair...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Variation count slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Variations: {variationCount}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={variationCount}
                    onChange={(e) => setVariationCount(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Enhance toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enhance}
                    onChange={(e) => setEnhance(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-sm text-gray-300">
                    Enhance with AI (create distinct variations using Claude)
                  </span>
                </label>

                {/* Generate button */}
                <button
                  onClick={handleGenerateVariations}
                  disabled={!basePrompt.trim() || isLoadingVariations}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingVariations ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Variations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Variations
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 2: Review Variations */}
            {step === 'variations' && (
              <motion.div
                key="variations"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    {variations.length} prompt variation(s) — edit or remove before generating
                  </p>
                  <button
                    onClick={() => setStep('configure')}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {variations.map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg group"
                    >
                      <span className="text-xs text-gray-500 font-mono mt-1 min-w-[1.5rem]">
                        {i + 1}.
                      </span>
                      {editingId === v.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-950 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(v.id)}
                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 text-sm text-gray-300 leading-relaxed">
                            {v.text}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(v)}
                              className="p-1 rounded hover:bg-gray-700 text-gray-400"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveVariation(v.id)}
                              className="p-1 rounded hover:bg-red-900/30 text-red-400"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {variations.length > 0 && (
                  <button
                    onClick={handleStartGeneration}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Start Image Generation ({variations.length})
                  </button>
                )}

                {variations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>All variations removed. Go back to regenerate.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Generating */}
            {(step === 'generating' || step === 'done') && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">
                      {step === 'done' ? 'Complete' : 'Generating images...'}
                    </span>
                    <span className="text-gray-400">
                      {completedCount}/{totalCount} complete
                      {failedCount > 0 && `, ${failedCount} failed`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalCount > 0 ? ((completedCount + failedCount) / totalCount) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Generation grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {generations.map((gen) => (
                    <div
                      key={gen.promptId}
                      className={cn(
                        'aspect-square rounded-lg border flex items-center justify-center overflow-hidden',
                        gen.status === 'complete'
                          ? 'border-green-600'
                          : gen.status === 'failed'
                            ? 'border-red-600 bg-red-900/20'
                            : 'border-gray-700 bg-gray-800'
                      )}
                    >
                      {gen.status === 'complete' && gen.imageUrl ? (
                        <img
                          src={gen.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : gen.status === 'failed' ? (
                        <X className="w-5 h-5 text-red-400" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      )}
                    </div>
                  ))}
                </div>

                {step === 'done' && (
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Done
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DatasetSketchWizard;
