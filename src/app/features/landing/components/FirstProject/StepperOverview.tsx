'use client';

import { motion } from "framer-motion";
import Image from "next/image";
import StepperOverviewObjectives from "./StepperOverviewObjectives";
import StepperOverviewCharacters from "./StepperOverviewCharacters";
import StepperOverviewResearch from "./StepperOverviewResearch";

/**
 * Selection option type (project type, narrator, template)
 */
interface SelectionOption {
    id: string;
    title: string;
    image?: string;
    description?: string;
}

/**
 * Objective type for story projects
 */
interface Objective {
    id: string;
    name: string;
}

/**
 * Character type for protagonist/antagonist/neutral characters
 */
type CharacterType = "protagonist" | "antagonist" | "neutral";

interface StoryCharacter {
    id: string;
    name: string;
    type: CharacterType;
}

type ProjectOverviewFormProps = {
    selections: {
        projectType: string | null;
        narrator: string | null;
        template: string | null;
        genre: string | null;
    };
    projectTypes: SelectionOption[];
    narratorSelection: SelectionOption[];
    templateSelection: SelectionOption[];
    projectName: string;
    setProjectName: (name: string) => void;
    projectDescription: string;
    setProjectDescription: (description: string) => void;
    objectives: Objective[];
    setObjectives: (objectives: Objective[]) => void;
    characters: StoryCharacter[];
    setCharacters: (characters: StoryCharacter[]) => void;
};

type SelectionItemProps = {
    item: SelectionOption | undefined;
    label: string;
};

// Reusable component for selection items (project type, narrator, template)
const SelectionItem = ({ item, label }: SelectionItemProps) => {
    if (!item) {
        return (
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <span className="text-gray-600 text-xl">?</span>
                </div>
                <div>
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="font-medium text-white">Not selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
                <Image
                    src={item.image || "/images/placeholder.jpg"}
                    alt={item.title}
                    fill
                    style={{ objectFit: "cover" }}
                />
            </div>
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="font-medium text-white">{item.title}</p>
            </div>
        </div>
    );
};

const StepperOverview = ({
    selections,
    projectTypes,
    narratorSelection,
    templateSelection,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    objectives,
    setObjectives,
    characters,
    setCharacters
}: ProjectOverviewFormProps) => {

    // Find selected items from previous steps
    const selectedProjectType = projectTypes.find(item => item.id === selections.projectType);
    const selectedNarrator = narratorSelection.find(item => item.id === selections.narrator);
    const selectedTemplate = templateSelection.find(item => item.id === selections.template);

    // Selection items configuration
    const selectionItems = [
        { item: selectedProjectType, label: "Project Type" },
        { item: selectedNarrator, label: "Narrator" },
        { item: selectedTemplate, label: "Template" }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 h-full px-2"
        >
            {/* Left Side - Project Info */}
            <div className="flex flex-col space-y-6">
                <div>
                    <label
                        htmlFor="projectName"
                        className="block text-sm font-medium mb-1 text-blue-300"
                    >
                        Project Name
                    </label>
                    <motion.div
                        whileTap={{ scale: 0.995 }}
                        className="relative"
                    >
                        <input
                            id="projectName"
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className={`w-full p-3 rounded-lg bg-gray-800/50 border ${projectName ? 'border-green-700/40' : 'border-red-700/40 border-opacity-50'
                                } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200`}
                        />
                        {projectName && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-3 border top-3 w-5 h-5 rounded-full flex items-center justify-center text-blue-400"
                            >
                                <span className="text-xs">✓</span>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                <div>
                    <label
                        htmlFor="projectDescription"
                        className="block text-sm font-medium mb-1 text-blue-300"
                    >
                        Project Description
                    </label>
                    <motion.div
                        whileTap={{ scale: 0.995 }}
                        className="relative"
                    >
                        <textarea
                            id="projectDescription"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="Describe your project in detail..."
                            rows={5}
                            className={`w-full p-3 rounded-lg bg-gray-800/50 border ${projectDescription ? 'border-green-700/40' : 'border-red-700/40 border-opacity-50'
                                } focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-all duration-200`}
                        />
                    </motion.div>
                </div>

                <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800">
                    <h3 className="text-lg font-medium mb-3 text-blue-300">Your Selections</h3>
                    <div className="space-y-4">
                        {selectionItems.map((selection, index) => (
                            <SelectionItem
                                key={`selection-${index}`}
                                item={selection.item}
                                label={selection.label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Objectives and Characters */}
           {selections.projectType === 'story' &&  <div className="flex flex-col">
                <StepperOverviewObjectives
                    objectives={objectives}
                    setObjectives={setObjectives}
                />

                {/* Characters Section */}
                <StepperOverviewCharacters
                    characters={characters}
                    setCharacters={setCharacters}
                />
                <motion.div
                    className="mt-4 bg-gray-900/40 rounded-lg p-3 border border-gray-800"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-xs text-gray-400">
                        <span className="text-blue-300 font-medium">You can add more objectives and characters later, no worries.</span>
                    </p>
                </motion.div>
            </div>}
            {selections.projectType === 'edu' && (
                <div className="flex flex-col">
                    <div className="mt-4 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
                        <StepperOverviewResearch />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default StepperOverview;


