'use client';

import { useCallback, useMemo } from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { SmartGenerateButton } from '@/app/components/UI/SmartGenerateButton';
import { ScriptQuickActions } from './ScriptQuickActions';
import { DialogueViewer } from './DialogueViewer';
import { useScriptGeneration } from './useScriptGeneration';
import { useSceneEditingKernel, type SaveState } from '@/app/hooks/useSceneEditingKernel';

const SAVE_STATE_LABEL: Record<SaveState, string> = {
    idle: '',
    dirty: 'Unsaved changes',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
};

const ScriptEditor = () => {
    const { selectedScene, selectedProject, selectedAct } = useProjectStore();
    const { data: scenes = [] } = sceneApi.useScenesByProjectAndAct(
        selectedProject?.id || '',
        selectedAct?.id || '',
        !!selectedProject && !!selectedAct
    );

    // ─── Editing kernel (auto-save for script field) ───────
    const initialFields = useMemo(() => ({
        script: selectedScene?.script || '',
    }), [selectedScene?.script]);

    const saveFn = useCallback(async (id: string, changed: Partial<{ script: string }>) => {
        await sceneApi.updateScene(id, changed);
    }, []);

    const kernel = useSceneEditingKernel<{ script: string }>({
        sceneId: selectedScene?.id || '',
        initialFields,
        saveFn,
        autoSaveDelay: 1500,
        savedFeedbackMs: 2000,
    });

    const { fields, setField, saveState, save } = kernel;
    const script = fields.script;

    const {
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

    if (!selectedScene) {
        return (
            <div className="text-center py-10 text-slate-400">
                No scene selected
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="ms-h3">Script Editor</h3>
                    <div className="flex items-center gap-3">
                        {saveState !== 'idle' && (
                            <span className={`text-xs font-mono ${
                                saveState === 'saved' ? 'text-emerald-400' :
                                saveState === 'error' ? 'text-red-400' :
                                saveState === 'saving' ? 'text-slate-400 animate-pulse' :
                                'text-amber-400'
                            }`}>
                                {SAVE_STATE_LABEL[saveState]}
                            </span>
                        )}
                        <SmartGenerateButton
                            onClick={handleSmartGenerate}
                            isLoading={isGenerating}
                            disabled={isGenerating}
                            label="Generate Scene"
                            size="sm"
                            variant="secondary"
                        />
                        <button
                            onClick={() => save()}
                            disabled={!kernel.isDirty || saveState === 'saving'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="mb-4 p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</h4>
                        <p className="text-slate-300 text-sm italic">{overview}</p>
                    </div>
                )}

                <textarea
                    value={script}
                    onChange={(e) => setField('script', e.target.value)}
                    placeholder="Write your scene script here..."
                    className="w-full h-96 bg-slate-950 border border-slate-800 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 transition"
                />

                <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
                    <div>
                        Words: {script.split(/\s+/).filter((w: string) => w).length}
                    </div>
                    <div className="flex items-center gap-3">
                        <span>Characters: {script.length}</span>
                        <span className="text-slate-500 font-mono text-xs">auto-save: on</span>
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
