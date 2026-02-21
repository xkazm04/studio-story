'use client';

import { lazy, Suspense, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useProjectStore } from "@/app/store/slices/projectSlice";
import { useAppShellStore, StorySubtab } from "@/app/store/appShellStore";
import { Tabs, type TabItem } from "@/app/components/UI";
import ActOverview from "./components/ActOverview";
import BeatsOverview from "./components/Beats/BeatsOverview";
import CenterStory from "./components/Setup/CenterStory";
import StoryScript from "./sub_StoryScript/StoryScript";
import { SceneEditorProvider } from "@/contexts/SceneEditorContext";
import { Loader2 } from "lucide-react";
import { Scene } from "@/app/types/Scene";
import { SceneChoice } from "@/app/types/SceneChoice";

// Phase 2 features
import { CommandPaletteProvider, CommandPalette, useCommands } from "./sub_CommandPalette";

// CLI integration
import { useCLIFeature } from "@/app/hooks/useCLIFeature";
import CompactTerminal from "@/cli/CompactTerminal";

// Lazy load heavy components
const SceneEditor = lazy(() => import("./sub_SceneEditor/SceneEditor"));
const SceneGraph = lazy(() => import("./sub_SceneGraph/SceneGraph"));
const PromptComposer = lazy(() => import("./sub_PromptComposer/PromptComposer"));
const AICompanion = lazy(() => import("./sub_AICompanion/AICompanion"));
const ArtStyleEditor = lazy(() => import("./sub_StoryArtstyle/ArtStyleEditor"));

// ============================================
// HARDCODED MOCK DATA FOR UI TESTING
// ============================================

const MOCK_SCENES: Scene[] = [
    {
        id: 'scene-1',
        name: 'The Crossroads',
        project_id: 'proj-1',
        act_id: 'act-1',
        order: 1,
        description: 'You stand at a crossroads in the ancient forest.',
        content: 'The morning mist parts before you as you reach the crossroads. Three paths stretch into the unknown - one leads to the mountain fortress, another to the shadowy woods, and the third to the riverside village.',
        image_url: 'https://cdn.leonardo.ai/users/a6457d6b-367e-4a65-9ee2-e5b5d7d2b5a0/generations/7a8f4c3e-3b1e-4f7a-8c1e-2d3f4a5b6c7d/Leonardo_Phoenix_A_mystical_crossroads_in_an_ancient_forest_wi_0.jpg',
    },
    {
        id: 'scene-2',
        name: 'Mountain Fortress',
        project_id: 'proj-1',
        act_id: 'act-1',
        order: 2,
        description: 'The towering fortress looms above.',
        content: 'After a steep climb, the fortress gates stand before you. Guards patrol the walls, their armor gleaming in the afternoon sun. A herald approaches to ask your business.',
        image_url: 'https://cdn.leonardo.ai/users/a6457d6b-367e-4a65-9ee2-e5b5d7d2b5a0/generations/8b9f5d4e-4c2f-5g8b-9d2f-3e4g5a6b7c8e/Leonardo_Phoenix_A_towering_medieval_fortress_on_a_mountain_pe_0.jpg',
    },
    {
        id: 'scene-3',
        name: 'Shadow Woods',
        project_id: 'proj-1',
        act_id: 'act-1',
        order: 3,
        description: 'Darkness envelops the twisted trees.',
        content: 'The canopy thickens overhead, blocking out the sun. Strange whispers echo between the gnarled trunks. Something watches from the shadows - you can feel eyes upon you.',
    },
    {
        id: 'scene-4',
        name: 'Riverside Village',
        project_id: 'proj-1',
        act_id: 'act-1',
        order: 4,
        description: 'A peaceful village by the river.',
        content: 'Smoke rises from cottage chimneys. Children play by the waterside while merchants call out their wares in the village square. The innkeeper waves you over.',
    },
    {
        id: 'scene-5',
        name: 'The Hidden Chamber',
        project_id: 'proj-1',
        act_id: 'act-2',
        order: 1,
        description: 'A secret room within the fortress.',
        content: 'Behind the tapestry, you discover a hidden chamber filled with ancient maps and forgotten relics. A glowing artifact catches your eye - an orb pulsing with arcane energy.',
        speaker: 'Narrator',
        speaker_type: 'narrator',
    },
    {
        id: 'scene-6',
        name: 'Forest Guardian',
        project_id: 'proj-1',
        act_id: 'act-2',
        order: 2,
        description: 'Meeting the ancient protector.',
        content: 'A towering figure of bark and moss steps from the shadows. Its eyes glow with ancient wisdom.',
        message: 'Why do you trespass in my domain, mortal?',
        speaker: 'Forest Guardian',
        speaker_type: 'character',
    },
    {
        id: 'scene-7',
        name: 'Orphaned Scene',
        project_id: 'proj-1',
        act_id: 'act-2',
        order: 3,
        description: 'This scene has no incoming connections.',
        content: 'This is an orphaned scene that demonstrates the orphan detection feature. No choices lead here.',
    },
];

const MOCK_CHOICES: SceneChoice[] = [
    // From Crossroads (scene-1) - 3 choices
    {
        id: 'choice-1',
        scene_id: 'scene-1',
        target_scene_id: 'scene-2',
        label: 'Climb to the Mountain Fortress',
        order_index: 0,
    },
    {
        id: 'choice-2',
        scene_id: 'scene-1',
        target_scene_id: 'scene-3',
        label: 'Enter the Shadow Woods',
        order_index: 1,
    },
    {
        id: 'choice-3',
        scene_id: 'scene-1',
        target_scene_id: 'scene-4',
        label: 'Visit the Riverside Village',
        order_index: 2,
    },
    // From Mountain Fortress (scene-2) - 2 choices
    {
        id: 'choice-4',
        scene_id: 'scene-2',
        target_scene_id: 'scene-5',
        label: 'Search for hidden passages',
        order_index: 0,
    },
    {
        id: 'choice-5',
        scene_id: 'scene-2',
        target_scene_id: 'scene-1',
        label: 'Return to the crossroads',
        order_index: 1,
    },
    // From Shadow Woods (scene-3) - 2 choices
    {
        id: 'choice-6',
        scene_id: 'scene-3',
        target_scene_id: 'scene-6',
        label: 'Follow the whispers deeper',
        order_index: 0,
    },
    {
        id: 'choice-7',
        scene_id: 'scene-3',
        target_scene_id: 'scene-1',
        label: 'Flee back to safety',
        order_index: 1,
    },
    // From Village (scene-4) - 1 choice (demonstrates dead end if removed)
    {
        id: 'choice-8',
        scene_id: 'scene-4',
        target_scene_id: 'scene-1',
        label: 'Return to the crossroads',
        order_index: 0,
    },
    // From Hidden Chamber (scene-5) - no choices = dead end
    // From Forest Guardian (scene-6) - 1 choice
    {
        id: 'choice-9',
        scene_id: 'scene-6',
        target_scene_id: 'scene-3',
        label: 'Bow and ask for passage',
        order_index: 0,
    },
];

const FIRST_SCENE_ID = 'scene-1';

// ============================================

function LoadingFallback() {
    return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
    );
}

// Wrapper that provides SceneEditorContext with hardcoded data
function SceneEditorWrapper() {
    const { selectedProject } = useProjectStore();

    // Use hardcoded project ID if no project selected
    const projectId = selectedProject?.id || 'proj-1';

    return (
        <SceneEditorProvider
            projectId={projectId}
            firstSceneId={FIRST_SCENE_ID}
            initialScenes={MOCK_SCENES}
            initialChoices={MOCK_CHOICES}
        >
            <div className="h-full">
                <Suspense fallback={<LoadingFallback />}>
                    <SceneEditor />
                </Suspense>
            </div>
        </SceneEditorProvider>
    );
}

function SceneGraphWrapper() {
    const { selectedProject } = useProjectStore();

    // Use hardcoded project ID if no project selected
    const projectId = selectedProject?.id || 'proj-1';

    return (
        <SceneEditorProvider
            projectId={projectId}
            firstSceneId={FIRST_SCENE_ID}
            initialScenes={MOCK_SCENES}
            initialChoices={MOCK_CHOICES}
        >
            <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
                <Suspense fallback={<LoadingFallback />}>
                    <SceneGraph />
                </Suspense>
            </div>
        </SceneEditorProvider>
    );
}

// Phase 2 Wrappers
function PromptComposerWrapper() {
    return (
        <div className="h-[800px]">
            <Suspense fallback={<LoadingFallback />}>
                <PromptComposer />
            </Suspense>
        </div>
    );
}

function AICompanionWrapper() {
    const { selectedProject } = useProjectStore();
    const projectId = selectedProject?.id || 'proj-1';

    return (
        <SceneEditorProvider
            projectId={projectId}
            firstSceneId={FIRST_SCENE_ID}
            initialScenes={MOCK_SCENES}
            initialChoices={MOCK_CHOICES}
        >
            <div className="h-[600px]">
                <Suspense fallback={<LoadingFallback />}>
                    <AICompanion />
                </Suspense>
            </div>
        </SceneEditorProvider>
    );
}

// Phase 3: Art Style Wrapper
function ArtStyleWrapper() {
    const { selectedProject } = useProjectStore();
    const projectId = selectedProject?.id || 'proj-1';

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Suspense fallback={<LoadingFallback />}>
                <ArtStyleEditor
                    projectId={projectId}
                    initialStyleId="adventure_journal"
                    initialSource="preset"
                />
            </Suspense>
        </div>
    );
}

// CommandPalette registration component
function CommandPaletteRegistration() {
    useCommands();
    return null;
}

// Tab definitions sorted alphabetically by label
const STORY_TAB_ITEMS: TabItem[] = [
    { value: "ai-terminal", label: "AI Terminal" },
    { value: "art-style", label: "Art Style" },
    { value: "beats", label: "Beats" },
    { value: "scene-editor", label: "Content" },
    { value: "act-evaluation", label: "Evaluator" },
    { value: "scene-graph", label: "Graph" },
    { value: "prompt-composer", label: "Prompts" },
    { value: "story-script", label: "Script" },
    { value: "story-setup", label: "Setup" },
];

function StoryTerminalWrapper() {
    const { selectedProject } = useProjectStore();
    const projectId = selectedProject?.id || 'proj-1';

    const cli = useCLIFeature({
        featureId: 'story',
        projectId,
        projectPath: typeof window !== 'undefined' ? window.location.origin : '',
        defaultSkills: [
            'story-next-steps', 'story-write-content', 'story-architect',
            'story-brainstorm', 'beat-suggestions', 'beat-description',
        ],
    });

    return (
        <div className="h-[600px]">
            <CompactTerminal
                {...cli.terminalProps}
                title="Story AI Terminal"
                className="h-full"
            />
        </div>
    );
}

function StoryTabContent({ activeTab }: { activeTab: string }) {
    return (
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            {activeTab === "ai-terminal" && <StoryTerminalWrapper />}
            {activeTab === "art-style" && <ArtStyleWrapper />}
            {activeTab === "beats" && <BeatsOverview />}
            {activeTab === "scene-editor" && <SceneEditorWrapper />}
            {activeTab === "act-evaluation" && <ActOverview />}
            {activeTab === "scene-graph" && <div className="h-[600px]"><SceneGraphWrapper /></div>}
            {activeTab === "prompt-composer" && <PromptComposerWrapper />}
            {activeTab === "story-script" && <StoryScript />}
            {activeTab === "story-setup" && <CenterStory />}
        </motion.div>
    );
}

const StoryFeature = () => {
    const { selectedProject } = useProjectStore();
    const { setStorySubtab } = useAppShellStore();
    const [activeTab, setActiveTab] = useState("art-style");

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
        setStorySubtab(tabId as StorySubtab);
    }, [setStorySubtab]);

    // Allow access even without selected project for testing
    if (!selectedProject) {
        // Still show tabs with hardcoded data for UI testing
        return (
            <CommandPaletteProvider>
                <SceneEditorProvider
                    projectId="proj-1"
                    firstSceneId={FIRST_SCENE_ID}
                    initialScenes={MOCK_SCENES}
                    initialChoices={MOCK_CHOICES}
                >
                    <CommandPaletteRegistration />
                    <CommandPalette />
                    <div className="flex flex-col items-center h-full max-w-[2000px] w-full relative px-4 pt-3 pb-4 text-sm text-slate-200">
                        <div className="w-full mb-2 px-2 py-1 bg-amber-900/30 border border-amber-500/30 rounded text-xs text-amber-400 text-center">
                            Demo Mode: Using hardcoded mock data (no project selected) • Press Ctrl+K for commands
                        </div>
                        <div className="w-full h-full flex flex-col">
                            <div className="shrink-0">
                                <Tabs items={STORY_TAB_ITEMS} value={activeTab} onChange={handleTabChange} variant="pills" />
                            </div>
                            <div className="mt-4 flex-1 min-h-0">
                                <StoryTabContent activeTab={activeTab} />
                            </div>
                        </div>
                    </div>
                </SceneEditorProvider>
            </CommandPaletteProvider>
        );
    }

    return (
        <CommandPaletteProvider>
            <SceneEditorProvider
                projectId={selectedProject.id}
                firstSceneId={FIRST_SCENE_ID}
                initialScenes={MOCK_SCENES}
                initialChoices={MOCK_CHOICES}
            >
                <CommandPaletteRegistration />
                <CommandPalette />
                <div className="flex flex-col items-center h-full max-w-[2000px] w-full relative px-4 pt-3 pb-4 text-sm text-slate-200">
                    <div className="w-full h-full flex flex-col">
                        <div className="shrink-0">
                            <Tabs items={STORY_TAB_ITEMS} value={activeTab} onChange={handleTabChange} variant="pills" />
                        </div>
                        <div className="mt-4 flex-1 min-h-0">
                            <StoryTabContent activeTab={activeTab} />
                        </div>
                    </div>
                </div>
            </SceneEditorProvider>
        </CommandPaletteProvider>
    );
}

export default StoryFeature;
