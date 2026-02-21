'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateGenerator } from '@/app/hooks/useTemplateGenerator';
import { ProjectTemplate } from '@/app/constants/templateCorpus';

interface StepperAITemplateProps {
  projectType: 'story' | 'short' | 'edu';
  onTemplateGenerated: (template: ProjectTemplate) => void;
  onSkip: () => void;
}

const StepperAITemplate = ({ projectType, onTemplateGenerated, onSkip }: StepperAITemplateProps) => {
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { generateTemplate, isGenerating, error, generatedTemplate, source, matchScore } = useTemplateGenerator();

  const handleGenerate = async () => {
    const result = await generateTemplate({
      projectType,
      genre: genre || undefined,
      description: description || undefined,
      useAI: true,
    });

    if (result) {
      setShowPreview(true);
    }
  };

  const handleAcceptTemplate = () => {
    if (generatedTemplate) {
      onTemplateGenerated(generatedTemplate);
    }
  };

  const handleRegenerate = () => {
    setShowPreview(false);
  };

  const canGenerate = description.length >= 10;

  return (
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col space-y-6 h-full"
          >
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">✨ AI-Powered Template Generator</h3>
              <p className="text-sm text-gray-300">
                Describe your project and let AI create a complete template with characters, objectives, and story beats.
                Save hours of planning!
              </p>
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium mb-2 text-blue-300">
                Genre <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Fantasy Adventure, Mystery, Sci-Fi..."
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                data-testid="ai-template-genre-input"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="ai-description" className="block text-sm font-medium mb-2 text-blue-300">
                Project Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="ai-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project idea in detail... What's the story about? Who are the main characters? What themes do you want to explore?"
                rows={8}
                className={`w-full p-3 rounded-lg bg-gray-800/50 border ${
                  description.length >= 10 ? 'border-green-700/40' : 'border-red-700/40'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all`}
                data-testid="ai-template-description-input"
              />
              <p className="text-xs text-gray-400 mt-1">
                {description.length} characters (minimum 10 required)
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-900/30 border border-red-500/50 rounded-lg p-3"
              >
                <p className="text-sm text-red-300">⚠️ {error}</p>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  canGenerate && !isGenerating
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="generate-template-btn"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Template...
                  </span>
                ) : (
                  '✨ Generate Template with AI'
                )}
              </button>

              <button
                onClick={onSkip}
                className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-all"
                data-testid="skip-ai-template-btn"
              >
                Skip
              </button>
            </div>

            <div className="text-xs text-gray-400 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
              💡 <strong>Pro Tip:</strong> The more detailed your description, the better the AI can customize your template.
              Include character types, plot points, and themes for best results.
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="template-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-500/30 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-300">🎉 Template Generated!</h3>
                  <p className="text-sm text-gray-300">
                    Based on: <strong>{generatedTemplate?.name}</strong>
                    {source === 'ai-enhanced' && ' (AI-Enhanced)'}
                  </p>
                  {matchScore !== null && matchScore !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      Match Score: {Math.round(matchScore)}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {generatedTemplate && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                  <h4 className="text-md font-semibold text-blue-300 mb-2">Template: {generatedTemplate.name}</h4>
                  <p className="text-sm text-gray-300 mb-2">{generatedTemplate.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedTemplate.keywords.slice(0, 5).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full border border-blue-700/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {generatedTemplate.characters.length > 0 && (
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-md font-semibold text-purple-300 mb-3">
                      Characters ({generatedTemplate.characters.length})
                    </h4>
                    <div className="space-y-2">
                      {generatedTemplate.characters.map((char, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              char.type === 'protagonist'
                                ? 'bg-green-900/40 text-green-300'
                                : char.type === 'antagonist'
                                ? 'bg-red-900/40 text-red-300'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {char.type}
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-medium">{char.name}</p>
                            {char.description && (
                              <p className="text-gray-400 text-xs">{char.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedTemplate.objectives.length > 0 && (
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-md font-semibold text-yellow-300 mb-3">
                      Objectives ({generatedTemplate.objectives.length})
                    </h4>
                    <ul className="space-y-2">
                      {generatedTemplate.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{obj.name}</p>
                            {obj.description && (
                              <p className="text-gray-400 text-xs">{obj.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedTemplate.beats.length > 0 && (
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-md font-semibold text-cyan-300 mb-3">
                      Story Beats ({generatedTemplate.beats.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {generatedTemplate.beats.map((beat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-cyan-400 font-mono text-xs mt-0.5">
                            {String(beat.order || idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-medium">{beat.name}</p>
                            <p className="text-gray-400 text-xs">{beat.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
              <button
                onClick={handleAcceptTemplate}
                className="flex-1 py-3 rounded-lg font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white transition-all"
                data-testid="accept-template-btn"
              >
                ✓ Use This Template
              </button>

              <button
                onClick={handleRegenerate}
                className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-all"
                data-testid="regenerate-template-btn"
              >
                ← Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepperAITemplate;
