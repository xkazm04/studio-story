'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Send, Sparkles } from "lucide-react";
import { beatApi } from "@/app/hooks/integration/useBeats";
import { useProjectStore } from "@/app/store/projectStore";
import { actApi } from "@/app/hooks/integration/useActs";
import { sceneApi } from "@/app/hooks/integration/useScenes";
import { useActRecommendations } from "@/app/hooks/useActRecommendations";
import { RecommendationResponse } from "@/app/types/Recommendation";
import { motion, AnimatePresence } from "framer-motion";
import { useCharacters } from "@/app/hooks/useCharacters";
import { SmartNameInput } from "@/app/components/UI/SmartNameInput";
import { NameSuggestion } from "@/app/types/NameSuggestion";
import InlineTerminal from "@/cli/InlineTerminal";

type Props = {
    refetch: () => void;
    onRecommendationsReceived?: (recommendations: RecommendationResponse) => void;
}

const BeatsTableAdd = ({ refetch, onRecommendationsReceived }: Props) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const { selectedProject, selectedAct } = useProjectStore();
    const [beatName, setBeatName] = useState<string>('');
    const [beatDescription, setBeatDescription] = useState<string>('');
    const [beatType, setBeatType] = useState<"act" | "story">('story');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { generateRecommendations, isGenerating, handleInsertResult, terminalProps } = useActRecommendations(selectedProject?.id || '');

    // Fetch all acts and scenes for context
    const { data: allActs } = actApi.useProjectActs(selectedProject?.id || '', !!selectedProject);
    const { data: allScenes } = sceneApi.useProjectScenes(selectedProject?.id || '', !!selectedProject);
    const { data: allBeats } = beatApi.useGetBeats(selectedProject?.id);
    const { data: allCharacters } = useCharacters(selectedProject?.id || '', !!selectedProject);

    // Get relevant beats based on beat type
    const relevantBeats = beatType === 'act' && selectedAct
        ? allBeats?.filter(b => b.act_id === selectedAct.id && b.type === 'act')
        : allBeats?.filter(b => b.type === 'story');

    // Get preceding beats (last 3)
    const precedingBeats = relevantBeats?.slice(-3) || [];

    // Extract character names
    const characterNames = allCharacters?.map(c => c.name) || [];

    // Build context for name suggestions
    const nameContext = useMemo(() => ({
        partialName: beatName,
        projectTitle: selectedProject?.name,
        projectDescription: selectedProject?.description,
        actName: beatType === 'act' && selectedAct ? selectedAct.name : undefined,
        actDescription: beatType === 'act' && selectedAct ? selectedAct.description : undefined,
        beatType,
        existingBeats: relevantBeats?.map(b => ({ name: b.name, description: b.description })),
        characters: characterNames,
        precedingBeats: precedingBeats.map(b => ({ name: b.name, description: b.description })),
    }), [beatName, selectedProject, selectedAct, beatType, relevantBeats, characterNames, precedingBeats]);

    const handleSuggestionSelect = (suggestion: NameSuggestion) => {
        setBeatName(suggestion.name);
        setBeatDescription(suggestion.description);
    };

    const handleRecommendationInsert = (text: string) => {
        const result = handleInsertResult(text);
        if (result && onRecommendationsReceived) {
            onRecommendationsReceived(result);
        }
    };

    const saveNewBeat = async () => {
        if (!beatName || !selectedProject) return;

        setLoading(true);
        setError(null);

        try {
            let newBeatData: { name: string; description?: string; act_id?: string; project_id: string };

            if (beatType === "act" && selectedAct) {
                await beatApi.createActBeat({
                    name: beatName,
                    project_id: selectedProject.id,
                    act_id: selectedAct.id,
                    description: beatDescription
                });

                newBeatData = {
                    name: beatName,
                    description: beatDescription,
                    act_id: selectedAct.id,
                    project_id: selectedProject.id
                };

                // Generate recommendations for Act beats
                if (allActs && selectedAct) {
                    const targetAct = allActs.find(a => a.id === selectedAct.id);

                    if (targetAct) {
                        const existingActBeats: Record<string, any[]> = {};
                        allActs.forEach(act => {
                            existingActBeats[act.id] = allBeats?.filter(b => b.act_id === act.id && b.type === 'act') || [];
                        });

                        const storyBeats = allBeats?.filter(b => b.type === 'story') || [];

                        generateRecommendations({
                            newBeat: {
                                name: beatName,
                                description: beatDescription,
                                act_id: selectedAct.id
                            },
                            targetAct: {
                                id: targetAct.id,
                                name: targetAct.name,
                                description: targetAct.description
                            },
                            allActs: allActs.map(act => ({
                                id: act.id,
                                name: act.name,
                                description: act.description,
                                order: act.order
                            })),
                            existingActBeats,
                            projectTitle: selectedProject.name,
                            projectDescription: selectedProject.description,
                            storyBeats: storyBeats.map(b => ({
                                name: b.name,
                                description: b.description
                            })),
                            allScenes: allScenes?.map(s => ({
                                id: s.id,
                                name: s.name,
                                description: s.description,
                                act_id: s.act_id
                            }))
                        });
                    }
                }
            } else {
                await beatApi.createStoryBeat({
                    name: beatName,
                    project_id: selectedProject.id,
                    description: beatDescription
                });
            }

            refetch();
            setBeatName('');
            setBeatDescription('');
            setIsAddingNew(false);
        } catch (err) {
            setError("Failed to create beat");
            console.error('Error creating beat:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                disabled={isGenerating}
                data-testid="add-beat-btn"
            >
                {isGenerating ? (
                    <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        Add Beat
                    </>
                )}
            </button>
            
            <AnimatePresence>
                {isAddingNew && (
                    <motion.div
                        className="flex flex-col bg-gray-900 rounded-lg p-3 mt-2 gap-2 border border-gray-800"
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SmartNameInput
                                    entityType="beat"
                                    context={nameContext}
                                    value={beatName}
                                    onChange={(e) => setBeatName(e.target.value)}
                                    onSuggestionSelect={handleSuggestionSelect}
                                    placeholder="Beat name (AI suggestions available)"
                                    size="sm"
                                    enableSuggestions={isAddingNew}
                                    disabled={loading}
                                    data-testid="beat-name-input"
                                />
                            </div>
                            <select
                                value={beatType}
                                onChange={(e) => setBeatType(e.target.value as "act" | "story")}
                                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                data-testid="beat-type-select"
                                disabled={loading}
                            >
                                <option value="story">Story</option>
                                <option value="act">Act</option>
                            </select>
                            <button
                                onClick={saveNewBeat}
                                disabled={!beatName || loading}
                                className={`px-3 py-1 rounded transition ${
                                    !beatName || loading
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                                data-testid="save-beat-btn"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <textarea
                            value={beatDescription}
                            onChange={(e) => setBeatDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm resize-none"
                            rows={2}
                            data-testid="beat-description-input"
                            disabled={loading}
                        />
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                        <InlineTerminal
                            {...terminalProps}
                            height={120}
                            collapsible
                            onInsert={handleRecommendationInsert}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default BeatsTableAdd;


