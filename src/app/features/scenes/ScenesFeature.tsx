'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useProjectStore } from "@/app/store/slices/projectSlice";
import { Tabs, type TabItem } from "@/app/components/UI";
import { BannerProvider } from "@/app/components/UI/BannerContext";
import SmartBanner from "@/app/components/UI/SmartBanner";
import ScriptEditor from "./components/Script/ScriptEditor";
import { ArrowLeft } from "lucide-react";
import { useCLIFeature } from "@/app/hooks/useCLIFeature";
import InlineTerminal from "@/cli/InlineTerminal";

const SCENE_TAB_ITEMS: TabItem[] = [
    { value: "scene-editor", label: "Script Editor" },
    { value: "character-relationships", label: "Relationships" },
    { value: "scene-impact", label: "Impact" },
];

const ScenesFeature = () => {
    const { selectedSceneId, selectedScene } = useProjectStore();
    const [activeTab, setActiveTab] = useState("scene-editor");

    // CLI integration for scene skills
    const cli = useCLIFeature({
        featureId: 'scenes',
        projectId: selectedScene?.project_id || '',
        projectPath: typeof window !== 'undefined' ? window.location.origin : '',
        defaultSkills: ['scene-generation', 'scene-dialogue', 'scene-description'],
    });

    return (
        <BannerProvider>
            <div className="h-full w-full flex flex-col">
                <SmartBanner />

                {!selectedScene ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-400 flex items-center gap-2 justify-center">
                                <ArrowLeft className="w-5 h-5" />
                                Select a scene to display content
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-4">
                        {selectedScene && (
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-white">{selectedScene.name || 'Untitled Scene'}</h2>
                                <p className="text-sm text-gray-400">{selectedScene.description || 'No description'}</p>
                            </div>
                        )}
                        <div className="flex flex-col h-full">
                            <div className="shrink-0">
                                <Tabs items={SCENE_TAB_ITEMS} value={activeTab} onChange={setActiveTab} variant="pills" />
                            </div>
                            <div className="mt-4 flex-1 min-h-0">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    {activeTab === "scene-editor" && <ScriptEditor />}
                                    {activeTab === "character-relationships" && (
                                        <div className="text-center py-10 text-gray-400">
                                            Character Relationships - Coming soon
                                        </div>
                                    )}
                                    {activeTab === "scene-impact" && (
                                        <div className="text-center py-10 text-gray-400">
                                            Scene Impact Analysis - Coming soon
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* CLI Terminal — bottom panel for scene skills */}
                        <InlineTerminal
                            {...cli.terminalProps}
                            height={160}
                            collapsible
                            outputFormat="text"
                        />
                    </div>
                )}
            </div>
        </BannerProvider>
    );
}

export default ScenesFeature;
