'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Film,
    ChevronDown,
    Clock,
    MessageSquare,
    MapPin,
    User,
    Mic,
    FileText,
} from 'lucide-react';

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

interface ActItemStudioProps {
    act: {
        id: string;
        name: string;
        description?: string;
        order?: number;
    };
    actIndex: number;
    scenes: Scene[];
    viewMode: 'outline' | 'reading';
    forceExpand?: boolean;
}

// Simple syntax highlighting for dialogue
function highlightDialogue(text: string) {
    if (!text) return null;

    // Split text by dialogue patterns (text in quotes)
    const parts = text.split(/(".*?")/g);

    return parts.map((part, index) => {
        if (part.startsWith('"') && part.endsWith('"')) {
            return (
                <span key={index} className="text-amber-300 italic">
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

function SceneItemStudio({ scene, sceneNumber, viewMode }: {
    scene: Scene;
    sceneNumber: string;
    viewMode: 'outline' | 'reading';
}) {
    const [isExpanded, setIsExpanded] = useState(viewMode === 'reading');

    useEffect(() => {
        setIsExpanded(viewMode === 'reading');
    }, [viewMode]);

    const wordCount = useMemo(() => {
        const text = scene.content || scene.description || '';
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }, [scene.content, scene.description]);

    const hasDialogue = !!(scene.message || scene.speaker);

    return (
        <div className={cn(
            'rounded-lg border transition-all',
            isExpanded
                ? 'bg-slate-800/40 border-slate-700/50'
                : 'bg-slate-900/30 border-slate-800/30 hover:bg-slate-800/30'
        )}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Scene Number */}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700/50 text-cyan-400 flex-shrink-0">
                        {sceneNumber}
                    </span>

                    {/* Scene Name */}
                    <span className="text-sm font-medium text-white truncate">
                        {scene.name || 'Untitled Scene'}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {scene.location && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">
                                <MapPin className="w-3 h-3" />
                                {scene.location}
                            </span>
                        )}
                        {hasDialogue && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                <MessageSquare className="w-3 h-3" />
                                Dialogue
                            </span>
                        )}
                        {wordCount > 0 && (
                            <span className="text-xs text-slate-500">
                                {wordCount} words
                            </span>
                        )}
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {/* Scene Description/Action */}
                            {scene.description && (
                                <div className="pl-4 border-l-2 border-slate-700">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                        Description
                                    </p>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {scene.description}
                                    </p>
                                </div>
                            )}

                            {/* Scene Content with Dialogue Highlighting */}
                            {scene.content && (
                                <div className="pl-4 border-l-2 border-cyan-500/50">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                        Content
                                    </p>
                                    <p className="text-sm text-slate-200 leading-relaxed font-serif">
                                        {highlightDialogue(scene.content)}
                                    </p>
                                </div>
                            )}

                            {/* Dialogue Block */}
                            {hasDialogue && (
                                <div className="pl-4 border-l-2 border-purple-500/50 bg-purple-500/5 rounded-r-lg py-2 pr-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        {scene.speaker_type === 'narrator' ? (
                                            <Mic className="w-4 h-4 text-purple-400" />
                                        ) : (
                                            <User className="w-4 h-4 text-purple-400" />
                                        )}
                                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                                            {scene.speaker || (scene.speaker_type === 'narrator' ? 'Narrator' : 'Character')}
                                        </span>
                                        {scene.speaker_type && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                                {scene.speaker_type}
                                            </span>
                                        )}
                                    </div>
                                    {scene.message && (
                                        <p className="text-sm text-white italic leading-relaxed">
                                            "{scene.message}"
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Empty State */}
                            {!scene.description && !scene.content && !hasDialogue && (
                                <div className="py-4 text-center">
                                    <FileText className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">No content yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ActItemStudio({
    act,
    actIndex,
    scenes,
    viewMode,
    forceExpand = false,
}: ActItemStudioProps) {
    const [isOpen, setIsOpen] = useState(forceExpand);

    useEffect(() => {
        if (forceExpand) setIsOpen(true);
    }, [forceExpand]);

    const sortedScenes = useMemo(() =>
        scenes
            .filter(scene => scene.act_id === act.id)
            .sort((a, b) => a.order - b.order),
        [scenes, act.id]
    );

    const actStats = useMemo(() => {
        const totalWords = sortedScenes.reduce((acc, scene) => {
            const text = scene.content || scene.description || '';
            return acc + (text.trim() ? text.trim().split(/\s+/).length : 0);
        }, 0);
        const readingMinutes = Math.ceil(totalWords / 200);
        return { words: totalWords, minutes: readingMinutes };
    }, [sortedScenes]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 rounded-xl border border-slate-800/50 overflow-hidden"
        >
            {/* Act Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                        <Film className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Act {actIndex + 1}: {act.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-500">
                                {sortedScenes.length} {sortedScenes.length === 1 ? 'scene' : 'scenes'}
                            </span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">
                                {actStats.words.toLocaleString()} words
                            </span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ~{actStats.minutes} min
                            </span>
                        </div>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                </motion.div>
            </button>

            {/* Act Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {/* Act Description */}
                            {act.description && (
                                <div className="p-3 rounded-lg bg-slate-800/30 border-l-2 border-cyan-500/50">
                                    <p className="text-sm text-slate-300 leading-relaxed italic">
                                        {act.description}
                                    </p>
                                </div>
                            )}

                            {/* Scenes */}
                            {sortedScenes.length > 0 ? (
                                <div className="space-y-2">
                                    {sortedScenes.map((scene, sceneIdx) => (
                                        <SceneItemStudio
                                            key={scene.id}
                                            scene={scene}
                                            sceneNumber={`${actIndex + 1}.${sceneIdx + 1}`}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-xs text-slate-500 italic">
                                        No scenes in this act yet
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
