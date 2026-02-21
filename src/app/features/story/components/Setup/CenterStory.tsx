'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from "@/app/store/slices/projectSlice";
import ColoredBorder from "@/app/components/UI/ColoredBorder";
import StoryConfigSelect from './StoryConfigSelect';
import StoryConceptInput from './StoryConceptInput';
import StorySettingArea from './StorySettingArea';
import { cn } from '@/lib/utils';
import {
    FileText,
    Loader2,
    Check,
    ImageIcon,
    Sparkles,
    X,
    RefreshCw,
    Eye,
    EyeOff,
    Wand2,
    BookOpen,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { deleteGenerations } from '@/lib/services/sketchCleanup';

interface GeneratedCover {
    url: string;
    id?: string;
    generationId?: string;
}

interface ProjectDetails {
    name: string;
    description: string;
    coverImageUrl?: string | null;
}

const CenterStory = () => {
    const { selectedProject, updateProject } = useProjectStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Form state
    const [name, setName] = useState(selectedProject?.name || '');
    const [description, setDescription] = useState(selectedProject?.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Text generation state
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [textGenAvailable, setTextGenAvailable] = useState<boolean | null>(null);

    // Cover image generation state
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [generatedCovers, setGeneratedCovers] = useState<GeneratedCover[]>([]);
    const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
    const [generationIds, setGenerationIds] = useState<string[]>([]);
    const [imageGenAvailable, setImageGenAvailable] = useState<boolean | null>(null);

    // Check API availability
    useEffect(() => {
        const checkAvailability = async () => {
            try {
                const [textRes, imageRes] = await Promise.all([
                    fetch('/api/ai/generate-story-details'),
                    fetch('/api/ai/leonardo/status'),
                ]);
                const textData = await textRes.json();
                const imageData = await imageRes.json();
                setTextGenAvailable(textData.available);
                setImageGenAvailable(imageData.available);
            } catch {
                setTextGenAvailable(false);
                setImageGenAvailable(false);
            }
        };
        checkAvailability();
    }, []);

    // Sync local state when project changes
    useEffect(() => {
        if (selectedProject) {
            setName(selectedProject.name || '');
            setDescription(selectedProject.description || '');
        }
    }, [selectedProject?.id]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [description]);

    const hasChanges =
        name !== (selectedProject?.name || '') ||
        description !== (selectedProject?.description || '');

    // Save changes
    const handleSave = useCallback(async () => {
        if (!selectedProject || !hasChanges) return;
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            // Update local store
            updateProject({ ...selectedProject, name: name.trim(), description });

            // Save to backend (if API exists)
            await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description }),
            });
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    }, [selectedProject, name, description, hasChanges, updateProject]);

    // Generate name and description using LLM
    const handleGenerateText = useCallback(async () => {
        if (!textGenAvailable) return;
        setIsGeneratingText(true);
        try {
            const response = await fetch('/api/ai/generate-story-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'both',
                    userInput: description || name || undefined,
                    currentName: name || undefined,
                    currentDescription: description || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to generate');

            const data = await response.json();
            if (data.name) setName(data.name);
            if (data.description) setDescription(data.description);
        } catch (error) {
            console.error('Failed to generate story details:', error);
        } finally {
            setIsGeneratingText(false);
        }
    }, [name, description, textGenAvailable]);

    // Generate cover images
    const handleGenerateCover = useCallback(async () => {
        if (!selectedProject || !imageGenAvailable) return;

        // Cleanup previous generations
        if (generationIds.length > 0) {
            deleteGenerations(generationIds);
        }

        setIsGeneratingCover(true);
        setGeneratedCovers([]);
        setSelectedCoverIndex(null);
        setGenerationIds([]);

        try {
            // Step 1: Compose cover prompt
            const composeResponse = await fetch('/api/ai/compose-cover-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storyName: name || selectedProject.name,
                    storyDescription: description || selectedProject.description,
                }),
            });

            if (!composeResponse.ok) throw new Error('Failed to compose cover prompt');

            const { prompt: coverPrompt } = await composeResponse.json();

            // Step 2: Generate 4 image variants
            const newGenerationIds: string[] = [];
            const promises = Array.from({ length: 4 }).map(async (_, index) => {
                const variation = index === 0 ? '' : ` Variation ${index + 1}.`;

                const response = await fetch('/api/ai/generate-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: coverPrompt + variation,
                        numImages: 1,
                        width: 1024,
                        height: 1024,
                    }),
                });

                if (!response.ok) return null;

                const data = await response.json();
                const image = data.images?.[0];

                if (image) {
                    if (data.generationId) newGenerationIds.push(data.generationId);
                    return { url: image.url, id: image.id, generationId: data.generationId };
                }
                return null;
            });

            const results = await Promise.all(promises);
            const validCovers: GeneratedCover[] = results.filter((c) => c !== null);

            setGenerationIds(newGenerationIds);
            setGeneratedCovers(validCovers);
        } catch (error) {
            console.error('Failed to generate cover:', error);
        } finally {
            setIsGeneratingCover(false);
        }
    }, [selectedProject, name, description, generationIds, imageGenAvailable]);

    // Clear generated covers
    const handleClearCovers = useCallback(() => {
        if (generationIds.length > 0) {
            deleteGenerations(generationIds);
        }
        setGeneratedCovers([]);
        setSelectedCoverIndex(null);
        setGenerationIds([]);
    }, [generationIds]);

    // Set selected cover
    const handleSetCover = useCallback(async () => {
        if (!selectedProject || selectedCoverIndex === null || !generatedCovers[selectedCoverIndex]) return;

        const selectedCover = generatedCovers[selectedCoverIndex];

        try {
            // Delete unused generations
            const unusedIds = generationIds.filter(id => id !== selectedCover.generationId);
            if (unusedIds.length > 0) deleteGenerations(unusedIds);

            // Update project
            updateProject({ ...selectedProject, coverImageUrl: selectedCover.url });

            setGeneratedCovers([]);
            setSelectedCoverIndex(null);
            setGenerationIds([]);
        } catch (error) {
            console.error('Failed to set cover:', error);
        }
    }, [selectedProject, selectedCoverIndex, generatedCovers, generationIds, updateProject]);

    // Remove cover
    const handleRemoveCover = useCallback(() => {
        if (!selectedProject) return;
        updateProject({ ...selectedProject, coverImageUrl: null });
    }, [selectedProject, updateProject]);

    const Wrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={cn("relative group bg-slate-900/50 p-4 w-full backdrop-blur-sm transition-all duration-300 rounded-lg border border-slate-800/50", className)}>
            <ColoredBorder />
            {children}
        </div>
    );

    if (!selectedProject) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-400">Select a project to configure story setup</p>
            </div>
        );
    }

    const isLoading = isSaving || isGeneratingText || isGeneratingCover;

    // Completion progress
    const progress = {
        name: !!name.trim(),
        description: !!description.trim(),
        cover: !!selectedProject.coverImageUrl,
    };
    const completionPercent = Math.round(
        (Object.values(progress).filter(Boolean).length / Object.keys(progress).length) * 100
    );

    return (
        <motion.div
            className="inset-0 flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="h-full overflow-y-auto w-full max-w-6xl mx-auto text-gray-100 bg-gradient-to-b from-slate-900/40 to-slate-800/10 rounded-lg shadow-lg p-6">
                {/* Header with Progress */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                            <BookOpen className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Story Setup</h2>
                            <p className="text-xs text-slate-400">Configure your story's identity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Progress Indicator */}
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercent}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-xs text-slate-400">{completionPercent}%</span>
                        </div>
                        {/* Preview Toggle */}
                        <Button
                            size="sm"
                            variant={showPreview ? 'primary' : 'secondary'}
                            onClick={() => setShowPreview(!showPreview)}
                            className="gap-1.5"
                        >
                            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {showPreview ? (
                        /* Preview Mode */
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <Wrapper className="max-w-2xl mx-auto">
                                <div className="flex flex-col items-center text-center gap-4">
                                    {selectedProject.coverImageUrl ? (
                                        <img
                                            src={selectedProject.coverImageUrl}
                                            alt="Story cover"
                                            className="w-48 h-48 object-cover rounded-lg border border-slate-700"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-slate-800/50 rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-slate-600" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            {name || 'Untitled Story'}
                                        </h3>
                                        <p className="text-sm text-slate-400 max-w-md">
                                            {description || 'No description yet. Add one to help readers discover your story.'}
                                        </p>
                                    </div>
                                </div>
                            </Wrapper>
                        </motion.div>
                    ) : (
                        /* Edit Mode */
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Name & Description Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left: Name & Description */}
                                <Wrapper>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="w-4 h-4 text-cyan-400" />
                                            <h3 className="text-sm font-medium text-white">Story Identity</h3>
                                        </div>

                                        {/* Story Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-400">
                                                Story Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter story name..."
                                                disabled={isLoading}
                                                className={cn(
                                                    'w-full px-3 py-2 text-sm rounded-lg',
                                                    'bg-slate-800/60 border border-slate-700/50',
                                                    'text-white placeholder:text-slate-500',
                                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                                    'disabled:opacity-50'
                                                )}
                                            />
                                        </div>

                                        {/* Story Description */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-400">
                                                Description
                                            </label>
                                            <textarea
                                                ref={textareaRef}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Describe your story..."
                                                disabled={isLoading}
                                                rows={4}
                                                className={cn(
                                                    'w-full px-3 py-2 text-sm rounded-lg resize-none',
                                                    'bg-slate-800/60 border border-slate-700/50',
                                                    'text-white placeholder:text-slate-500',
                                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                                    'disabled:opacity-50'
                                                )}
                                            />
                                        </div>

                                        {/* Generate with AI */}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleGenerateText}
                                            disabled={isLoading || !textGenAvailable}
                                            className="w-full gap-1.5"
                                        >
                                            {isGeneratingText ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                    Generate with AI
                                                </>
                                            )}
                                        </Button>
                                        {textGenAvailable === false && (
                                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                AI generation unavailable
                                            </p>
                                        )}

                                        {/* Save Button */}
                                        {hasChanges && (
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={handleSave}
                                                disabled={isLoading || !name.trim()}
                                                className="w-full gap-1.5"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </Wrapper>

                                {/* Right: Cover Image */}
                                <Wrapper>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ImageIcon className="w-4 h-4 text-purple-400" />
                                            <h3 className="text-sm font-medium text-white">Cover Image</h3>
                                        </div>

                                        {/* Current Cover or Placeholder */}
                                        {selectedProject.coverImageUrl ? (
                                            <div className="relative group aspect-square max-w-[200px] mx-auto">
                                                <img
                                                    src={selectedProject.coverImageUrl}
                                                    alt="Story cover"
                                                    className="w-full h-full object-cover rounded-lg border border-slate-700"
                                                />
                                                <button
                                                    onClick={handleRemoveCover}
                                                    disabled={isLoading}
                                                    className={cn(
                                                        'absolute top-2 right-2 p-1.5 rounded-full',
                                                        'bg-red-500/80 text-white',
                                                        'opacity-0 group-hover:opacity-100 transition-opacity',
                                                        'hover:bg-red-500'
                                                    )}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : generatedCovers.length === 0 ? (
                                            <div className="aspect-square max-w-[200px] mx-auto rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center gap-2">
                                                <ImageIcon className="w-8 h-8 text-slate-600" />
                                                <p className="text-xs text-slate-500">No cover image</p>
                                            </div>
                                        ) : null}

                                        {/* Generated Covers Grid */}
                                        {generatedCovers.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {generatedCovers.map((cover, index) => (
                                                        <button
                                                            key={cover.id || index}
                                                            onClick={() => setSelectedCoverIndex(index)}
                                                            disabled={isLoading}
                                                            className={cn(
                                                                'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                                                                selectedCoverIndex === index
                                                                    ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                                                                    : 'border-slate-700 hover:border-cyan-500/50'
                                                            )}
                                                        >
                                                            <img
                                                                src={cover.url}
                                                                alt={`Cover option ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {selectedCoverIndex === index && (
                                                                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                                                    <Check className="w-8 h-8 text-cyan-400" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={handleClearCovers}
                                                        disabled={isLoading}
                                                        className="flex-1 gap-1"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                        Regenerate
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={handleSetCover}
                                                        disabled={isLoading || selectedCoverIndex === null}
                                                        className="flex-1 gap-1"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Use Selected
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Generate Cover Button */}
                                        {generatedCovers.length === 0 && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleGenerateCover}
                                                disabled={isLoading || !imageGenAvailable}
                                                className="w-full gap-1.5"
                                            >
                                                {isGeneratingCover ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Generating covers...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        Generate Cover Images
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {imageGenAvailable === false && (
                                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Image generation unavailable
                                            </p>
                                        )}
                                    </div>
                                </Wrapper>
                            </div>

                            {/* Short Config Row */}
                            <div className="flex flex-row gap-4">
                                {[
                                    { id: 1, component: <StoryConfigSelect column={undefined} type='genre' /> },
                                    { id: 2, component: <StoryConfigSelect column={undefined} type='audience' /> },
                                    { id: 3, component: <StoryConfigSelect column={undefined} type='time' /> }
                                ].map((item) => (
                                    <div key={item.id} className="flex-1">
                                        <Wrapper>{item.component}</Wrapper>
                                    </div>
                                ))}
                            </div>

                            {/* Long Config Column */}
                            <div className="grid grid-cols-1 gap-4">
                                <Wrapper><StoryConceptInput column={undefined} /></Wrapper>
                                <Wrapper><StorySettingArea column={undefined} /></Wrapper>
                            </div>

                            {/* Info Footer */}
                            <div className="p-4 rounded-lg bg-slate-800/30 border-l-4 border-cyan-500/30">
                                <p className="pl-4 font-light italic text-xs text-slate-400">
                                    A well-crafted story overview serves as your creative compass, guiding your narrative toward a cohesive and compelling destination.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CenterStory;
