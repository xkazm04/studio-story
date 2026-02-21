'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User, Sparkles, Copy, Check, Download } from 'lucide-react';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

interface CharacterPersonalityExtractorProps {
  transcriptions: any[];
}

interface PersonalityAnalysis {
  personality_summary: string;
  traits: string[];
  speaking_style: string;
  emotional_range: string;
  key_values: string[];
  communication_patterns: string;
  notable_quotes: string[];
  confidence_score: number;
}

const CharacterPersonalityExtractor = ({ transcriptions }: CharacterPersonalityExtractorProps) => {
  const [characterName, setCharacterName] = useState('');
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { selectedProject } = useProjectStore();

  const cli = useCLIFeature({
    featureId: 'personality-extract',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['personality-extraction'],
  });

  const handleExtract = () => {
    if (!characterName.trim()) return;

    const combinedText = transcriptions
      .map((t: { enhanced_text?: string; text: string }) => t.enhanced_text || t.text)
      .join('\n\n');

    const prompt = `Analyze the following audio transcriptions to extract the personality profile for "${characterName}".

Transcription text:
${combinedText.slice(0, 3000)}

Return a JSON object with this structure:
{
  "personality_summary": "Overall personality description",
  "traits": ["trait1", "trait2", ...],
  "speaking_style": "Description of how they speak",
  "emotional_range": "Description of emotional expression",
  "key_values": ["value1", "value2", ...],
  "communication_patterns": "How they communicate",
  "notable_quotes": ["quote1", "quote2", ...],
  "confidence_score": 0.85
}`;

    cli.executePrompt(prompt, 'Personality Extraction');
  };

  const handleInsertResult = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
      }
    } catch {
      setAnalysis({
        personality_summary: text,
        traits: [],
        speaking_style: '',
        emotional_range: '',
        key_values: [],
        communication_patterns: '',
        notable_quotes: [],
        confidence_score: 0.7,
      });
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const exportAnalysis = () => {
    if (!analysis) return;

    const markdown = `# Character Analysis: ${characterName}

## Personality Summary
${analysis.personality_summary}

## Traits
${analysis.traits.map((t) => `- ${t}`).join('\n')}

## Speaking Style
${analysis.speaking_style}

## Emotional Range
${analysis.emotional_range}

## Key Values
${analysis.key_values.map((v) => `- ${v}`).join('\n')}

## Communication Patterns
${analysis.communication_patterns}

## Notable Quotes
${analysis.notable_quotes.map((q) => `> ${q}`).join('\n\n')}

## Confidence Score
${(analysis.confidence_score * 100).toFixed(0)}%
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterName.replace(/\s+/g, '_')}_personality_analysis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-purple-900/50 rounded-lg">
          <User className="w-5 h-5 text-purple-200" />
        </div>
        <h3 className="text-lg font-semibold text-gray-200">Character Personality Extractor</h3>
      </div>

      {/* Input Section */}
      {!analysis && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="e.g., Alice, Bob, Narrator..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={cli.isRunning || !characterName.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cli.isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Personality...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Extract Personality with AI
              </>
            )}
          </button>

          <InlineTerminal
            {...cli.terminalProps}
            height={150}
            collapsible
            onInsert={handleInsertResult}
          />

          <div className="p-4 bg-purple-900/20 border border-purple-900/30 rounded-lg">
            <p className="text-sm text-purple-200">
              AI will analyze the transcribed audio to extract personality traits, speaking style,
              values, and communication patterns for this character.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                {characterName}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAnalysis}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => setAnalysis(null)}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Analyze Another
                </button>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Confidence:</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.confidence_score * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                />
              </div>
              <span className="text-sm font-medium text-purple-400">
                {(analysis.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            {/* Personality Summary */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-200">Personality Summary</h5>
                <button
                  onClick={() => copyToClipboard(analysis.personality_summary, 'summary')}
                  className="p-1 rounded hover:bg-gray-800 transition-colors"
                >
                  {copiedSection === 'summary' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {analysis.personality_summary}
              </p>
            </div>

            {/* Grid Layout for Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Traits */}
              {analysis.traits.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-200 mb-3">Traits</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-full text-xs text-purple-200"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Values */}
              {analysis.key_values.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-200 mb-3">Key Values</h5>
                  <ul className="space-y-1">
                    {analysis.key_values.map((value, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Speaking Style */}
              {analysis.speaking_style && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-200 mb-3">Speaking Style</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {analysis.speaking_style}
                  </p>
                </div>
              )}

              {/* Emotional Range */}
              {analysis.emotional_range && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-200 mb-3">Emotional Range</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {analysis.emotional_range}
                  </p>
                </div>
              )}
            </div>

            {/* Communication Patterns */}
            {analysis.communication_patterns && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-200 mb-3">Communication Patterns</h5>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {analysis.communication_patterns}
                </p>
              </div>
            )}

            {/* Notable Quotes */}
            {analysis.notable_quotes.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-200 mb-3">Notable Quotes</h5>
                <div className="space-y-3">
                  {analysis.notable_quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="pl-4 border-l-2 border-purple-500 text-sm text-gray-300 italic"
                    >
                      "{quote}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CharacterPersonalityExtractor;
