import { useState } from 'react';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { Scene } from '@/app/types/Scene';
import type { DialogueLine } from './DialogueViewer';

interface UseScriptGenerationOptions {
  selectedScene: Scene | null;
  selectedProjectId: string | undefined;
  scenes: Scene[];
}

export function useScriptGeneration({
  selectedScene,
  selectedProjectId,
  scenes,
}: UseScriptGenerationOptions) {
  const [script, setScript] = useState(selectedScene?.script || '');
  const [overview, setOverview] = useState('');
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [error, setError] = useState('');

  const cli = useCLIFeature({
    featureId: 'scene-script',
    projectId: selectedProjectId || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['scene-generation', 'scene-dialogue', 'scene-description'],
  });

  const handleSmartGenerate = () => {
    if (!selectedScene || !selectedProjectId) {
      setError('No scene or project selected');
      return;
    }
    setError('');
    cli.execute('scene-generation', { sceneId: selectedScene.id });
  };

  const handleGenerateDialogue = () => {
    if (!script) {
      setError('Please write or generate a script first.');
      return;
    }
    setError('');
    cli.execute('scene-dialogue', { sceneId: selectedScene?.id || '' });
  };

  const handleAddDescription = () => {
    if (!script) {
      setError('Please write or generate a script first.');
      return;
    }
    setError('');
    cli.execute('scene-description', { sceneId: selectedScene?.id || '' });
  };

  const handleInsertScript = (text: string) => {
    const cleaned = text
      .replace(/\*\*/g, '')
      .replace(/^#+\s/gm, '')
      .trim();
    setScript(cleaned);
  };

  const handleInsertDialogue = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.lines && Array.isArray(parsed.lines)) {
          setDialogueLines(parsed.lines);
        }
      }
    } catch {
      setError('Failed to parse dialogue JSON.');
    }
  };

  const handleInsertOverview = (text: string) => {
    setOverview(text);
  };

  const handleFormat = () => {
    setScript((prev) => prev.replace(/\n{3,}/g, '\n\n').trim());
  };

  const handleExport = () => {
    const data = {
      scene: selectedScene?.name,
      description: selectedScene?.description,
      script,
      overview,
      dialogue: dialogueLines,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-${selectedScene?.id || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    script,
    setScript,
    overview,
    dialogueLines,
    error,
    isGenerating: cli.isRunning,
    isGeneratingDialogue: cli.isRunning,
    isGeneratingDescription: cli.isRunning,
    handleSmartGenerate,
    handleGenerateDialogue,
    handleAddDescription,
    handleInsertScript,
    handleInsertDialogue,
    handleInsertOverview,
    handleFormat,
    handleExport,
    terminalProps: cli.terminalProps,
  };
}
