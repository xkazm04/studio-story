'use client';

import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { SmartGenerateButton } from '@/app/components/UI/SmartGenerateButton';
import { ScriptQuickActions } from './ScriptQuickActions';
import { DialogueViewer } from './DialogueViewer';
import { useScriptGeneration } from './useScriptGeneration';

const ScriptEditor = () => {
    const { selectedScene, selectedProject, selectedAct } = useProjectStore();
    const { data: scenes = [] } = sceneApi.useScenesByProjectAndAct(
        selectedProject?.id || '',
        selectedAct?.id || '',
        !!selectedProject && !!selectedAct
    );

    const {
        script,
        setScript,
        overview,
        dialogueLines,
        error,
        isGenerating,
        isGeneratingDialogue,
        isGeneratingDescription,
        handleSmartGenerate,
        handleGenerateDialogue,
        handleAddDescription,
        handleFormat,
        handleExport,
    } = useScriptGeneration({
        selectedScene,
        selectedProjectId: selectedProject?.id,
        scenes,
    });

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving script:', script);
    };

    if (!selectedScene) {
        return (
            <div className="text-center py-10 text-gray-400">
                No scene selected
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Script Editor</h3>
                    <div className="flex gap-2">
                        <SmartGenerateButton
                            onClick={handleSmartGenerate}
                            isLoading={isGenerating}
                            disabled={isGenerating}
                            label="Generate Scene"
                            size="sm"
                            variant="secondary"
                        />
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                            Save Script
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {overview && (
                    <div className="mb-4 p-4 bg-gray-950/50 border border-gray-800 rounded-lg">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Overview</h4>
                        <p className="text-gray-300 text-sm italic">{overview}</p>
                    </div>
                )}

                <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Write your scene script here..."
                    className="w-full h-96 bg-gray-950 border border-gray-800 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 transition"
                />

                <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                    <div>
                        Words: {script.split(/\s+/).filter((w: string) => w).length}
                    </div>
                    <div>
                        Characters: {script.length}
                    </div>
                </div>
            </div>

            <ScriptQuickActions
                onGenerateDialogue={handleGenerateDialogue}
                onAddDescription={handleAddDescription}
                onFormat={handleFormat}
                onExport={handleExport}
                isGeneratingDialogue={isGeneratingDialogue}
                isGeneratingDescription={isGeneratingDescription}
            />

            <DialogueViewer lines={dialogueLines} />
        </div>
    );
};

export default ScriptEditor;
