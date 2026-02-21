/**
 * StoryScript Component
 * Infinite notepad-style script editor with right-click context menu
 * Supports multiple block types: Scene, Description, Content, Script, Actor
 * Now includes Audio Narration System with voice assignment and timeline
 */

'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from "@/app/store/slices/projectSlice";
import { actApi } from "@/app/hooks/integration/useActs";
import { sceneApi } from "@/app/hooks/integration/useScenes";
import { characterApi } from "@/app/hooks/integration/useCharacters";
import { cn } from '@/lib/utils';
import { EmptyState } from '@/app/components/UI';
import {
    FileText,
    Film,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    MapPin,
    User,
    Mic,
    Edit3,
    Check,
    X,
    Plus,
    Trash2,
    GripVertical,
    Volume2,
    Play,
    Square,
    Loader2,
    BookOpen,
    Type,
    AlignLeft,
    Search,
    MoreHorizontal,
    Quote,
    Users,
    Settings2,
    Headphones,
    Radio,
    Download,
} from 'lucide-react';
import { VoiceAssigner } from './components/VoiceAssigner';
import { AudioTimeline } from './components/AudioTimeline';
import { ScriptRenderer } from './components/ScriptRenderer';
import { ExportDialog } from './components/ExportDialog';
import {
    narrationGenerator,
    type NarrationBlock,
    type CharacterVoiceAssignment,
    type NarratorConfig,
    type ChapterAudio,
    PRESET_VOICES,
} from '@/lib/audio';
import { type ScriptData } from '@/lib/export';

// Script view modes
type ScriptViewMode = 'edit' | 'narrate' | 'voices';

// Block types for the notepad
type BlockType = 'scene-header' | 'description' | 'content' | 'dialogue' | 'actor' | 'direction';

interface ScriptBlock {
    id: string;
    sceneId: string;
    type: BlockType;
    content: string;
    speaker?: string;
    speakerType?: 'character' | 'narrator' | 'system';
    audioUrl?: string;
    order: number;
}

interface Scene {
    id: string;
    name: string;
    description?: string;
    content?: string;
    location?: string;
    order: number;
    act_id: string;
    message?: string;
    speaker?: string;
    speaker_type?: 'character' | 'narrator' | 'system';
}

interface Act {
    id: string;
    name: string;
    description?: string;
    order?: number;
}

// Context Menu Component
function ContextMenu({
    x,
    y,
    onClose,
    onAddBlock,
}: {
    x: number;
    y: number;
    onClose: () => void;
    onAddBlock: (type: BlockType) => void;
}) {
    const menuItems = [
        { type: 'scene-header' as BlockType, label: 'Scene Header', icon: Film, color: 'text-cyan-400' },
        { type: 'description' as BlockType, label: 'Description', icon: Type, color: 'text-slate-400' },
        { type: 'content' as BlockType, label: 'Content', icon: AlignLeft, color: 'text-emerald-400' },
        { type: 'dialogue' as BlockType, label: 'Dialogue', icon: Quote, color: 'text-purple-400' },
        { type: 'actor' as BlockType, label: 'Actor/Character', icon: Users, color: 'text-amber-400' },
        { type: 'direction' as BlockType, label: 'Stage Direction', icon: Settings2, color: 'text-rose-400' },
    ];

    useEffect(() => {
        const handleClickOutside = () => onClose();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[180px]"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                Add Block
            </div>
            {menuItems.map((item) => (
                <button
                    key={item.type}
                    onClick={() => {
                        onAddBlock(item.type);
                        onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <item.icon className={cn('w-4 h-4', item.color)} />
                    {item.label}
                </button>
            ))}
        </motion.div>
    );
}

// Audio Player for ElevenLabs TTS
function AudioPlayer({
    text,
    audioUrl,
    onGenerate,
    onDelete,
    isGenerating,
}: {
    text: string;
    audioUrl?: string;
    onGenerate: () => void;
    onDelete: () => void;
    isGenerating: boolean;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleRegenerate = () => {
        setShowMenu(false);
        onDelete();
        onGenerate();
    };

    const handleDelete = () => {
        setShowMenu(false);
        onDelete();
    };

    return (
        <div className="flex items-center gap-1 relative">
            {audioUrl ? (
                <>
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                    />
                    <button
                        onClick={handlePlayPause}
                        className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            isPlaying
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-slate-800 text-slate-400 hover:text-purple-400'
                        )}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Audio options"
                    >
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 z-10 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[120px]">
                            <button
                                onClick={handleRegenerate}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                            >
                                <Mic className="w-3 h-3" />
                                Regenerate
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-800"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete audio
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || !text.trim()}
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors',
                        'bg-slate-800 text-slate-400 hover:text-purple-400',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    title="Generate audio with ElevenLabs"
                >
                    {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Volume2 className="w-3 h-3" />
                    )}
                    {isGenerating ? 'Generating...' : 'Voice'}
                </button>
            )}
        </div>
    );
}

// Editable Block Component
function EditableBlock({
    block,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    onGenerateAudio,
    onDeleteAudio,
    isGeneratingAudio,
}: {
    block: ScriptBlock;
    onUpdate: (id: string, content: string, speaker?: string) => void;
    onDelete: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    isFirst: boolean;
    isLast: boolean;
    onGenerateAudio: (id: string) => void;
    onDeleteAudio: (id: string) => void;
    isGeneratingAudio: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(block.content);
    const [editSpeaker, setEditSpeaker] = useState(block.speaker || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = () => {
        onUpdate(block.id, editContent, block.type === 'dialogue' || block.type === 'actor' ? editSpeaker : undefined);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditContent(block.content);
        setEditSpeaker(block.speaker || '');
        setIsEditing(false);
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, [isEditing]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editContent]);

    const blockStyles: Record<BlockType, { border: string; bg: string; icon: typeof FileText; iconColor: string; label: string }> = {
        'scene-header': { border: 'border-cyan-500/50', bg: 'bg-cyan-500/5', icon: Film, iconColor: 'text-cyan-400', label: 'SCENE' },
        'description': { border: 'border-slate-600/50', bg: 'bg-slate-800/30', icon: Type, iconColor: 'text-slate-400', label: 'DESCRIPTION' },
        'content': { border: 'border-emerald-500/50', bg: 'bg-emerald-500/5', icon: AlignLeft, iconColor: 'text-emerald-400', label: 'CONTENT' },
        'dialogue': { border: 'border-purple-500/50', bg: 'bg-purple-500/5', icon: Quote, iconColor: 'text-purple-400', label: 'DIALOGUE' },
        'actor': { border: 'border-amber-500/50', bg: 'bg-amber-500/5', icon: Users, iconColor: 'text-amber-400', label: 'ACTOR' },
        'direction': { border: 'border-rose-500/50', bg: 'bg-rose-500/5', icon: Settings2, iconColor: 'text-rose-400', label: 'DIRECTION' },
    };

    const style = blockStyles[block.type];
    const Icon = style.icon;
    const showAudioControls = block.type === 'dialogue' || block.type === 'content';

    return (
        <div className={cn('group relative rounded-lg border-l-2 pl-4 py-3 pr-3', style.border, style.bg)}>
            {/* Drag Handle and Controls */}
            <div className="absolute -left-5 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-0.5 text-slate-600 hover:text-slate-400 cursor-grab">
                    <GripVertical className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Block Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className={cn('w-3.5 h-3.5', style.iconColor)} />
                    <span className={cn('text-[9px] uppercase tracking-wider', style.iconColor)}>{style.label}</span>
                    {(block.type === 'dialogue' || block.type === 'actor') && (
                        isEditing ? (
                            <input
                                type="text"
                                value={editSpeaker}
                                onChange={(e) => setEditSpeaker(e.target.value)}
                                placeholder="Speaker name..."
                                className="ml-2 px-2 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 w-32"
                            />
                        ) : block.speaker ? (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300">
                                {block.speaker}
                            </span>
                        ) : null
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {showAudioControls && (
                        <AudioPlayer
                            text={block.content}
                            audioUrl={block.audioUrl}
                            onGenerate={() => onGenerateAudio(block.id)}
                            onDelete={() => onDeleteAudio(block.id)}
                            isGenerating={isGeneratingAudio}
                        />
                    )}
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleSave}
                                className="p-1.5 rounded text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onDelete(block.id)}
                                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Block Content */}
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={cn(
                        'w-full min-h-[60px] p-2 rounded-lg resize-none',
                        'bg-slate-800 border border-slate-700',
                        'text-slate-100 placeholder:text-slate-500',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                        'text-sm leading-relaxed font-serif'
                    )}
                    placeholder={`Enter ${style.label.toLowerCase()}...`}
                />
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className={cn(
                        'cursor-text text-sm leading-relaxed',
                        block.type === 'dialogue' ? 'font-serif italic text-white' : 'text-slate-300',
                        block.type === 'scene-header' && 'font-semibold text-white text-base',
                        block.type === 'direction' && 'text-slate-400 uppercase text-xs tracking-wider',
                        !block.content && 'text-slate-500 italic'
                    )}
                >
                    {block.content || `Click to add ${style.label.toLowerCase()}...`}
                </div>
            )}
        </div>
    );
}

// Scene Separator
function SceneSeparator({ sceneName, actName }: { sceneName: string; actName: string }) {
    return (
        <div className="flex items-center gap-4 py-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
                <Film className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">{sceneName}</span>
                <span className="text-xs text-slate-500">|</span>
                <span className="text-xs text-slate-500">{actName}</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
    );
}

const StoryScript = () => {
    const { selectedProject } = useProjectStore();
    const { data: acts } = actApi.useProjectActs(selectedProject?.id || '', !!selectedProject);
    const { data: allScenes } = sceneApi.useProjectScenes(selectedProject?.id || '', !!selectedProject);
    const { data: characters } = characterApi.useProjectCharacters(selectedProject?.id || '', !!selectedProject);

    // Script blocks state (in real app, this would be persisted)
    const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sceneId: string } | null>(null);
    const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Audio Narration State
    const [viewMode, setViewMode] = useState<ScriptViewMode>('edit');
    const [voiceAssignments, setVoiceAssignments] = useState<CharacterVoiceAssignment[]>([]);
    const [narratorConfig, setNarratorConfig] = useState<NarratorConfig | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentBlockId, setCurrentBlockId] = useState<string | undefined>();
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [highlightMode, setHighlightMode] = useState<'word' | 'sentence' | 'block'>('sentence');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Export State
    const [showExportDialog, setShowExportDialog] = useState(false);

    const sortedActs = useMemo(() =>
        acts?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [],
        [acts]
    );

    // Group scenes by act
    const scenesByAct = useMemo(() => {
        const grouped: { act: Act; scenes: Scene[] }[] = [];
        sortedActs.forEach(act => {
            const actScenes = allScenes
                ?.filter(scene => scene.act_id === act.id)
                .sort((a, b) => a.order - b.order) || [];
            grouped.push({ act, scenes: actScenes });
        });
        return grouped;
    }, [sortedActs, allScenes]);

    // Initialize blocks from scenes if empty
    useEffect(() => {
        if (blocks.length === 0 && allScenes && allScenes.length > 0) {
            const initialBlocks: ScriptBlock[] = [];
            let orderCounter = 0;

            allScenes.forEach(scene => {
                // Add scene header
                initialBlocks.push({
                    id: `${scene.id}-header`,
                    sceneId: scene.id,
                    type: 'scene-header',
                    content: scene.name,
                    order: orderCounter++,
                });

                // Add description if exists
                if (scene.description) {
                    initialBlocks.push({
                        id: `${scene.id}-desc`,
                        sceneId: scene.id,
                        type: 'description',
                        content: scene.description,
                        order: orderCounter++,
                    });
                }

                // Add content if exists
                if (scene.content) {
                    initialBlocks.push({
                        id: `${scene.id}-content`,
                        sceneId: scene.id,
                        type: 'content',
                        content: scene.content,
                        order: orderCounter++,
                    });
                }

                // Add dialogue if exists
                if (scene.message) {
                    initialBlocks.push({
                        id: `${scene.id}-dialogue`,
                        sceneId: scene.id,
                        type: 'dialogue',
                        content: scene.message,
                        speaker: scene.speaker,
                        speakerType: scene.speaker_type,
                        order: orderCounter++,
                    });
                }
            });

            setBlocks(initialBlocks);
        }
    }, [allScenes, blocks.length]);

    // Get blocks for a scene
    const getBlocksForScene = useCallback((sceneId: string) => {
        return blocks
            .filter(b => b.sceneId === sceneId)
            .sort((a, b) => a.order - b.order);
    }, [blocks]);

    // Handle context menu
    const handleContextMenu = useCallback((e: React.MouseEvent, sceneId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, sceneId });
    }, []);

    // Add block
    const handleAddBlock = useCallback((type: BlockType) => {
        if (!contextMenu) return;

        const sceneBlocks = getBlocksForScene(contextMenu.sceneId);
        const maxOrder = sceneBlocks.length > 0 ? Math.max(...sceneBlocks.map(b => b.order)) : 0;

        const newBlock: ScriptBlock = {
            id: `${contextMenu.sceneId}-${type}-${Date.now()}`,
            sceneId: contextMenu.sceneId,
            type,
            content: '',
            order: maxOrder + 1,
        };

        setBlocks(prev => [...prev, newBlock]);
    }, [contextMenu, getBlocksForScene]);

    // Update block
    const handleUpdateBlock = useCallback((id: string, content: string, speaker?: string) => {
        setBlocks(prev => prev.map(b =>
            b.id === id ? { ...b, content, speaker: speaker ?? b.speaker } : b
        ));
    }, []);

    // Delete block
    const handleDeleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    }, []);

    // Move block
    const handleMoveBlock = useCallback((id: string, direction: 'up' | 'down') => {
        setBlocks(prev => {
            const blockIndex = prev.findIndex(b => b.id === id);
            if (blockIndex === -1) return prev;

            const block = prev[blockIndex];
            const sceneBlocks = prev.filter(b => b.sceneId === block.sceneId).sort((a, b) => a.order - b.order);
            const localIndex = sceneBlocks.findIndex(b => b.id === id);

            if (direction === 'up' && localIndex > 0) {
                const swapWith = sceneBlocks[localIndex - 1];
                return prev.map(b => {
                    if (b.id === id) return { ...b, order: swapWith.order };
                    if (b.id === swapWith.id) return { ...b, order: block.order };
                    return b;
                });
            } else if (direction === 'down' && localIndex < sceneBlocks.length - 1) {
                const swapWith = sceneBlocks[localIndex + 1];
                return prev.map(b => {
                    if (b.id === id) return { ...b, order: swapWith.order };
                    if (b.id === swapWith.id) return { ...b, order: block.order };
                    return b;
                });
            }

            return prev;
        });
    }, []);

    // Generate audio using ElevenLabs TTS API
    const handleGenerateAudio = useCallback(async (blockId: string) => {
        if (!selectedProject?.id) return;

        const block = blocks.find(b => b.id === blockId);
        if (!block || !block.content.trim()) return;

        setGeneratingAudioId(blockId);

        try {
            const response = await fetch('/api/ai/elevenlabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: block.content,
                    projectId: selectedProject.id,
                    sceneId: block.sceneId,
                }),
            });

            const data = await response.json();

            if (data.success && data.audioUrl) {
                setBlocks(prev => prev.map(b =>
                    b.id === blockId ? { ...b, audioUrl: data.audioUrl } : b
                ));
            } else {
                console.error('Failed to generate audio:', data.error);
            }
        } catch (error) {
            console.error('Error generating audio:', error);
        } finally {
            setGeneratingAudioId(null);
        }
    }, [blocks, selectedProject?.id]);

    // Delete audio from block and storage
    const handleDeleteAudio = useCallback(async (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block?.audioUrl) return;

        try {
            // Delete from storage
            await fetch('/api/ai/elevenlabs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl: block.audioUrl }),
            });

            // Remove from local state
            setBlocks(prev => prev.map(b =>
                b.id === blockId ? { ...b, audioUrl: undefined } : b
            ));
        } catch (error) {
            console.error('Error deleting audio:', error);
        }
    }, [blocks]);

    // Convert script blocks to narration blocks for the audio system
    const narrationBlocks = useMemo<NarrationBlock[]>(() => {
        return blocks
            .filter(b => b.type === 'content' || b.type === 'dialogue' || b.type === 'description')
            .map(b => ({
                id: b.id,
                sceneId: b.sceneId,
                blockType: b.type === 'dialogue' ? 'dialogue' as const :
                           b.type === 'description' ? 'description' as const : 'narration' as const,
                text: b.content,
                speaker: b.speaker,
                speakerType: b.speakerType || 'narrator',
                order: b.order,
                audioData: b.audioUrl ? {
                    url: b.audioUrl,
                    duration: 5000, // Estimated, would be actual from API
                    format: 'mp3' as const,
                    sampleRate: 44100,
                    bitRate: 128000,
                    generatedAt: Date.now(),
                    provider: 'elevenlabs' as const,
                } : undefined,
            }));
    }, [blocks]);

    // Calculate total duration
    const totalDuration = useMemo(() => {
        return narrationBlocks.reduce((sum, b) => sum + (b.audioData?.duration || 5000), 0);
    }, [narrationBlocks]);

    // Voice assignment handlers
    const handleVoiceAssign = useCallback((characterId: string, voiceId: string) => {
        const character = characters?.find(c => c.id === characterId);
        if (!character) return;

        const assignment = narrationGenerator.getVoiceManager().assignVoiceToCharacter(
            characterId,
            character.name,
            voiceId
        );

        if (assignment) {
            setVoiceAssignments(prev => {
                const filtered = prev.filter(a => a.characterId !== characterId);
                return [...filtered, assignment];
            });
        }
    }, [characters]);

    const handleVoiceUnassign = useCallback((characterId: string) => {
        narrationGenerator.getVoiceManager().removeCharacterAssignment(characterId);
        setVoiceAssignments(prev => prev.filter(a => a.characterId !== characterId));
    }, []);

    const handleNarratorChange = useCallback((voiceId: string, style: NarratorConfig['style']) => {
        const config = narrationGenerator.getVoiceManager().setNarratorConfig(voiceId, style);
        if (config) {
            setNarratorConfig(config);
        }
    }, []);

    const handlePreviewVoice = useCallback(async (voiceId: string, text: string) => {
        // For preview, we could generate a short sample
        console.log('Preview voice:', voiceId, text);
        // In production, this would call the TTS API
    }, []);

    // Playback handlers
    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        // Start audio playback
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
        // Pause audio playback
    }, []);

    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time);
        // Find which block this time falls into
        let runningTime = 0;
        for (const block of narrationBlocks) {
            const blockDuration = block.audioData?.duration || 5000;
            if (time < runningTime + blockDuration) {
                setCurrentBlockId(block.id);
                break;
            }
            runningTime += blockDuration;
        }
    }, [narrationBlocks]);

    const handleBlockSelect = useCallback((blockId: string) => {
        setCurrentBlockId(blockId);
        // Calculate time offset for this block
        let time = 0;
        for (const block of narrationBlocks) {
            if (block.id === blockId) break;
            time += block.audioData?.duration || 5000;
        }
        setCurrentTime(time);
    }, [narrationBlocks]);

    // Stats
    const stats = useMemo(() => {
        const totalBlocks = blocks.length;
        const contentBlocks = blocks.filter(b => b.type === 'content' || b.type === 'dialogue').length;
        const withAudio = blocks.filter(b => b.audioUrl).length;
        const totalWords = blocks.reduce((acc, b) => {
            return acc + (b.content.trim() ? b.content.trim().split(/\s+/).length : 0);
        }, 0);

        return { totalBlocks, contentBlocks, withAudio, totalWords, scenes: allScenes?.length || 0 };
    }, [blocks, allScenes]);

    // Prepare script data for export
    const scriptExportData = useMemo<ScriptData>(() => ({
        title: selectedProject?.name || 'Untitled Script',
        author: 'Author Name', // Would come from user profile
        blocks: blocks.map(b => ({
            id: b.id,
            sceneId: b.sceneId,
            type: b.type,
            content: b.content,
            speaker: b.speaker,
            order: b.order,
        })),
        scenes: allScenes?.map(s => ({
            id: s.id,
            name: s.name,
        })),
        metadata: {
            description: selectedProject?.description,
        },
    }), [selectedProject, blocks, allScenes]);

    if (!selectedProject) {
        return (
            <EmptyState
                icon={<FileText />}
                title="Select a project to view story script"
                variant="centered"
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-sm font-semibold text-white">
                                {viewMode === 'edit' ? 'Script Editor' :
                                 viewMode === 'narrate' ? 'Audio Narration' : 'Voice Assignment'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50 text-xs text-slate-400">
                            <span>{stats.scenes} Scenes</span>
                            <span>{stats.totalBlocks} Blocks</span>
                            <span>{stats.totalWords.toLocaleString()} words</span>
                            {stats.withAudio > 0 && (
                                <span className="flex items-center gap-1 text-purple-400">
                                    <Volume2 className="w-3 h-3" />
                                    {stats.withAudio} audio
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'edit' && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                                Right-click to add blocks
                            </span>
                        )}
                        <button
                            onClick={() => setShowExportDialog(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="shrink-0 flex border-b border-slate-800">
                <button
                    onClick={() => setViewMode('edit')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                        viewMode === 'edit'
                            ? 'bg-cyan-600/10 text-cyan-400 border-b-2 border-cyan-500 -mb-px'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    )}
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Script Editor</span>
                </button>
                <button
                    onClick={() => setViewMode('narrate')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                        viewMode === 'narrate'
                            ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500 -mb-px'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    )}
                >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Narration</span>
                </button>
                <button
                    onClick={() => setViewMode('voices')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                        viewMode === 'voices'
                            ? 'bg-amber-600/10 text-amber-400 border-b-2 border-amber-500 -mb-px'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    )}
                >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Voices</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {viewMode === 'edit' ? (
                        <motion.div
                            key="edit-mode"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="h-full"
                        >
                            {/* Edit Canvas */}
                            <div
                                ref={canvasRef}
                                className="h-full overflow-y-auto p-6"
                                onContextMenu={(e) => {
                                    const firstScene = allScenes?.[0];
                                    if (firstScene) {
                                        handleContextMenu(e, firstScene.id);
                                    }
                                }}
                            >
                                <div className="max-w-4xl mx-auto space-y-2">
                                    {scenesByAct.length > 0 ? (
                                        scenesByAct.map(({ act, scenes }, actIdx) => (
                                            <div key={act.id}>
                                                {/* Act Header */}
                                                <div className="flex items-center gap-3 py-4 mb-4">
                                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1 rounded bg-slate-900 border border-slate-800">
                                                        Act {actIdx + 1}: {act.name}
                                                    </div>
                                                    <div className="flex-1 h-px bg-slate-800" />
                                                </div>

                                                {/* Scenes */}
                                                {scenes.map((scene, sceneIdx) => {
                                                    const sceneBlocks = getBlocksForScene(scene.id);

                                                    return (
                                                        <div
                                                            key={scene.id}
                                                            className="mb-8"
                                                            onContextMenu={(e) => handleContextMenu(e, scene.id)}
                                                        >
                                                            <SceneSeparator
                                                                sceneName={scene.name || `Scene ${sceneIdx + 1}`}
                                                                actName={`Act ${actIdx + 1}`}
                                                            />

                                                            <div className="space-y-3 pl-8">
                                                                {sceneBlocks.length > 0 ? (
                                                                    sceneBlocks.map((block, idx) => (
                                                                        <EditableBlock
                                                                            key={block.id}
                                                                            block={block}
                                                                            onUpdate={handleUpdateBlock}
                                                                            onDelete={handleDeleteBlock}
                                                                            onMoveUp={(id) => handleMoveBlock(id, 'up')}
                                                                            onMoveDown={(id) => handleMoveBlock(id, 'down')}
                                                                            isFirst={idx === 0}
                                                                            isLast={idx === sceneBlocks.length - 1}
                                                                            onGenerateAudio={handleGenerateAudio}
                                                                            onDeleteAudio={handleDeleteAudio}
                                                                            isGeneratingAudio={generatingAudioId === block.id}
                                                                        />
                                                                    ))
                                                                ) : (
                                                                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-lg">
                                                                        <FileText className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                                                                        <p className="text-xs text-slate-500">Right-click to add content blocks</p>
                                                                    </div>
                                                                )}

                                                                <button
                                                                    onClick={(e) => handleContextMenu(e as any, scene.id)}
                                                                    className="w-full py-2 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add block
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    ) : (
                                        <EmptyState
                                            icon={<Film />}
                                            title="No scenes available"
                                            subtitle="Create acts and scenes to start writing your script"
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : viewMode === 'narrate' ? (
                        <motion.div
                            key="narrate-mode"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="h-full flex flex-col"
                        >
                            {/* Narration View with Timeline and Script */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Script Renderer with sync highlighting */}
                                <div className="flex-1 overflow-hidden">
                                    <ScriptRenderer
                                        blocks={narrationBlocks}
                                        currentBlockId={currentBlockId}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        highlightMode={highlightMode}
                                        showTimingMarkers={true}
                                        autoScroll={true}
                                        onSeek={handleSeek}
                                        onBlockClick={handleBlockSelect}
                                        className="h-full"
                                    />
                                </div>
                            </div>

                            {/* Audio Timeline */}
                            <div className="shrink-0 border-t border-slate-800">
                                <AudioTimeline
                                    blocks={narrationBlocks}
                                    currentBlockId={currentBlockId}
                                    currentTime={currentTime}
                                    duration={totalDuration}
                                    isPlaying={isPlaying}
                                    volume={volume}
                                    isMuted={isMuted}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onSeek={handleSeek}
                                    onBlockSelect={handleBlockSelect}
                                    onVolumeChange={setVolume}
                                    onMuteToggle={() => setIsMuted(!isMuted)}
                                    onExport={(format) => console.log('Export:', format)}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="voices-mode"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="h-full"
                        >
                            {/* Voice Assignment Panel */}
                            <VoiceAssigner
                                characters={(characters || []).map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    role: c.type || undefined,
                                    imageUrl: c.avatar_url || undefined,
                                }))}
                                assignments={voiceAssignments}
                                narratorConfig={narratorConfig}
                                availableVoices={PRESET_VOICES}
                                onAssign={handleVoiceAssign}
                                onUnassign={handleVoiceUnassign}
                                onNarratorChange={handleNarratorChange}
                                onPreviewVoice={handlePreviewVoice}
                                className="h-full"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Context Menu - Only shown in edit mode */}
            <AnimatePresence>
                {contextMenu && viewMode === 'edit' && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onAddBlock={handleAddBlock}
                    />
                )}
            </AnimatePresence>

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                scriptData={scriptExportData}
                projectName={selectedProject?.name}
            />
        </div>
    );
};

export default StoryScript;
