'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavStore } from "@/app/store/navigationStore";
import BeatsTable from "./BeatsTable";
import { beatApi } from "@/app/hooks/integration/useBeats";
import { useProjectStore } from "@/app/store/projectStore";
import { Beat } from "@/app/types/Beat";
import BeatsTableAdd from "./BeatsTableAdd";
import { Button } from "@/app/components/UI/Button";
import ActRecommendations from "./ActRecommendations";
import { RecommendationResponse } from "@/app/types/Recommendation";
import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BEAT_ANIMATIONS } from '@/workspace/theme/tokens';
import { LayoutGrid, List, Map as MapIcon, CheckCircle2, Circle, Clock, Sparkles, Tags, GitBranch, GripVertical } from 'lucide-react';
import NarrativeMap from './NarrativeMap';
import { BeatFilterPanel, BeatFilters, filterBeats } from './BeatFilterPanel';
import { cn } from '@/lib/utils';
import { useToggleBeatCompletion } from './useToggleBeatCompletion';
import DistributionChart from './DistributionChart';
import { BeatClassifierCompact } from './BeatClassifier';
import {
  type BeatClassification,
  classifyBeatContent,
  analyzeEmotions,
  suggestFunctions,
} from '@/lib/beats/TaxonomyLibrary';
import { type Dependency, DependencyManager } from '@/lib/beats/DependencyManager';
import DependencyEditor from './DependencyEditor';
import DependencyGraph, { CausalityChainDisplay } from './DependencyGraph';
import ValidationPanel from './ValidationPanel';

export type BeatTableItem = {
    id: string;
    name: string;
    type: "act" | "story";
    act_id?: string;
    description?: string;
    default_flag?: boolean;
    paragraph_id?: string;
    paragraph_title?: string;
    order?: number;
    completed?: boolean;
    x_position?: number;
    y_position?: number;
    duration?: number;
    estimated_duration?: number;
    pacing_score?: number;
}

// Compact Beat Card for Cards View
function BeatCard({
    beat,
    index,
    onToggleCompletion,
    dragHandleProps,
}: {
    beat: BeatTableItem;
    index: number;
    onToggleCompletion: (id: string) => void;
    dragHandleProps?: any;
}) {
    const typeColors = {
        story: 'border-purple-500/40 bg-purple-500/5',
        act: 'border-cyan-500/40 bg-cyan-500/5',
    };

    const statusBadge = beat.completed ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Done
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <Circle className="w-3 h-3" />
            Pending
        </span>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...BEAT_ANIMATIONS.quick, delay: BEAT_ANIMATIONS.stagger(index) }}
            className={cn(
                'group p-3 rounded-lg border transition-all text-left flex flex-col h-full',
                'hover:shadow-lg hover:shadow-cyan-500/5',
                typeColors[beat.type] || typeColors.act,
                beat.completed && 'opacity-70'
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    {dragHandleProps && (
                        <div 
                            {...dragHandleProps} 
                            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 py-1"
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}
                    <span className={cn(
                        'w-6 h-6 rounded flex items-center justify-center text-sm font-bold shrink-0',
                        beat.type === 'story' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                    )}>
                        {beat.order !== undefined ? beat.order + 1 : index + 1}
                    </span>
                    <h3 className="text-sm font-medium text-slate-100 line-clamp-1">{beat.name}</h3>
                </div>
                <button
                    type="button"
                    aria-label={`Toggle beat: ${beat.name}`}
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none shrink-0"
                    onClick={() => onToggleCompletion(beat.id)}
                >
                    {statusBadge}
                </button>
            </div>

            {beat.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-2 flex-1">{beat.description}</p>
            )}

            <div className="flex items-center gap-3 text-sm text-slate-400 mt-auto pt-2">
                <span className={cn(
                    'uppercase font-medium px-1.5 py-0.5 rounded',
                    beat.type === 'story' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
                )}>
                    {beat.type}
                </span>
                {beat.estimated_duration && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(beat.estimated_duration / 60)}m
                    </span>
                )}
                {beat.pacing_score && (
                    <span>Pace: {beat.pacing_score}/10</span>
                )}
            </div>
        </motion.div>
    );
}

// Progress Bar Component
function BeatsProgressBar({ beats }: { beats: BeatTableItem[] }) {
    const completed = beats.filter(b => b.completed).length;
    const total = beats.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300 font-medium">Progress</span>
                    <span className="text-slate-400">{completed}/{total} beats</span>
                </div>
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={completed}
                    className="h-2 bg-slate-700 rounded-full overflow-hidden"
                >
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={BEAT_ANIMATIONS.slow}
                    />
                </div>
            </div>
            <div className="text-lg font-bold text-cyan-400 tabular-nums">
                {percent}%
            </div>
        </div>
    );
}

const BeatsOverview = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef(null);
    const { selectedProject } = useProjectStore();
    const { data: backendBeats, isLoading, refetch: refreshBeats } = beatApi.useGetBeats(selectedProject?.id);
    const [sortedBeats, setBeats] = useState<BeatTableItem[]>([]);
    const { setRightMode } = useNavStore();
    const [view, setView] = useState<'table' | 'map' | 'cards' | 'taxonomy' | 'dependencies'>('table');
    const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [filters, setFilters] = useState<BeatFilters>({
        searchQuery: '',
        type: 'all',
        completionStatus: 'all'
    });
    const beatClassificationsRecord = useMemo<Record<string, BeatClassification>>(() => ({}), []);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
    const [highlightChain, setHighlightChain] = useState<string[] | undefined>(undefined);
    const shortcutModifier = useMemo(() => {
        if (typeof navigator === 'undefined') return 'Cmd/Ctrl';
        const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
        return isMac ? 'Cmd' : 'Ctrl';
    }, []);

    useEffect(() => {
        setRightMode('beats');
    }, [setRightMode]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isMeta = event.metaKey || event.ctrlKey;
            if (!isMeta) return;
            if (!rootRef.current) return;
            if (!rootRef.current.contains(document.activeElement)) return;
            const keyMap: Record<string, typeof view> = {
                '1': 'table',
                '2': 'cards',
                '3': 'map',
                '4': 'taxonomy',
                '5': 'dependencies',
            };
            const nextView = keyMap[event.key];
            if (!nextView) return;
            event.preventDefault();
            setView(nextView);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (backendBeats && backendBeats.length > 0) {
            const formattedBeats: BeatTableItem[] = backendBeats.map((beat: Beat) => ({
                id: beat.id,
                name: beat.name,
                type: beat.type as "act" | "story",
                description: beat.description,
                default_flag: beat.default_flag,
                paragraph_id: beat.paragraph_id,
                paragraph_title: beat.paragraph_title,
                order: beat.order || 0,
                completed: beat.completed,
                x_position: beat.x_position,
                y_position: beat.y_position,
                duration: beat.duration,
                estimated_duration: beat.estimated_duration,
                pacing_score: beat.pacing_score
            }));

            const sorted = formattedBeats.sort((a, b) => (a.order || 0) - (b.order || 0));
            setBeats(sorted);
        }
    }, [backendBeats]);

    const { toggleCompletion } = useToggleBeatCompletion({ setBeats, onSuccess: refreshBeats });

    const toggleBeatCompletion = (id: string) => {
        const beat = sortedBeats.find(b => b.id === id);
        if (!beat) return;
        toggleCompletion(beat);
    };

    const handleBeatUpdate = async (beatId: string, updates: Partial<Beat>) => {
        setBeats(prevBeats => prevBeats.map(b =>
            b.id === beatId ? { ...b, ...updates } as BeatTableItem : b
        ));

        try {
            for (const [field, value] of Object.entries(updates)) {
                if (value !== undefined && !(value instanceof Date)) {
                    await beatApi.editBeat(beatId, field, value);
                }
            }
            refreshBeats();
        } catch (error) {
            console.error('Failed to update beat:', error);
            refreshBeats();
        }
    };

    const handleReorder = async (beatId: string, newOrder: number) => {
        const beatIndex = sortedBeats.findIndex(b => b.id === beatId);
        if (beatIndex === -1) return;

        const reorderedBeats = Array.from(sortedBeats);
        const [movedBeat] = reorderedBeats.splice(beatIndex, 1);
        reorderedBeats.splice(newOrder, 0, movedBeat);

        const updatedBeats = reorderedBeats.map((beat, index) => ({
            ...beat,
            order: index
        }));

        setBeats(updatedBeats);
        setIsReordering(true);

        try {
            await Promise.all(
                updatedBeats.map(beat =>
                    beatApi.editBeat(beat.id, 'order', beat.order || 0)
                )
            );
            setIsReordering(false);
        } catch (error) {
            console.error('Failed to update beat order:', error);
            refreshBeats();
            setIsReordering(false);
        }
    };

    const handleRecommendationsReceived = (recs: RecommendationResponse) => {
        setRecommendations(recs);
    };

    const handleRecommendationsClose = () => {
        setRecommendations(null);
    };

    const handleRecommendationsApply = () => {
        setRecommendations(null);
        refreshBeats();
    };

    const handleDragEndCards = (result: DropResult) => {
        if (!result.destination) return;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        
        if (sourceIndex === destinationIndex) return;

        const beatId = filteredBeats[sourceIndex]?.id;
        if (!beatId) return;

        let newOrder = destinationIndex;
        if (filteredBeats.length !== sortedBeats.length) {
             const destBeat = filteredBeats[destinationIndex];
             const realDestIndex = sortedBeats.findIndex(b => b.id === destBeat?.id);
             if (realDestIndex !== -1) {
                 newOrder = realDestIndex;
             }
        }
        
        handleReorder(beatId, newOrder);
    };

    const filteredBeats = filterBeats(sortedBeats, filters);

    // Convert beats to summary format for dependency components
    const beatSummaries = useMemo(() => {
        return sortedBeats.map(beat => ({
            id: beat.id,
            title: beat.name,
            order: beat.order || 0,
            type: beat.type,
            sceneId: beat.paragraph_id,
            sceneName: beat.paragraph_title,
        }));
    }, [sortedBeats]);

    // Dependency manager instance for analysis
    const dependencyManager = useMemo(() => {
        const manager = new DependencyManager();
        dependencies.forEach(d => manager.addDependency(d));
        return manager;
    }, [dependencies]);

    // Causality chains for display
    const causalityChains = useMemo(() => {
        return dependencyManager.findCausalityChains();
    }, [dependencyManager]);

    // Beat map for lookups
    const beatMap = useMemo(() => {
        return new Map(beatSummaries.map(b => [b.id, b]));
    }, [beatSummaries]);

    // Dependency handlers
    const handleAddDependency = useCallback((dependency: Omit<Dependency, 'id'>) => {
        const newDependency: Dependency = {
            ...dependency,
            id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setDependencies(prev => [...prev, newDependency]);
    }, []);

    const handleRemoveDependency = useCallback((dependencyId: string) => {
        setDependencies(prev => prev.filter(d => d.id !== dependencyId));
    }, []);

    const handleUpdateDependency = useCallback((dependencyId: string, updates: Partial<Dependency>) => {
        setDependencies(prev => prev.map(d =>
            d.id === dependencyId ? { ...d, ...updates } : d
        ));
    }, []);

    const handleSelectBeat = useCallback((beatId: string) => {
        setSelectedBeatId(beatId);
        setHighlightChain(undefined);
    }, []);

    const handleSelectChain = useCallback((beatIds: string[]) => {
        setHighlightChain(beatIds);
        setSelectedBeatId(null);
    }, []);

    // Auto-classify beats based on content
    const classifications = useMemo(() => {
        const classificationArray: BeatClassification[] = [];

        sortedBeats.forEach((beat, index) => {
            // Check if we have a stored classification
            const stored = beatClassificationsRecord[beat.id];
            if (stored) {
                classificationArray.push(stored);
                return;
            }

            // Auto-classify based on content
            const content = `${beat.name} ${beat.description || ''}`;
            const suggestions = classifyBeatContent(content, beat.name);
            const emotions = analyzeEmotions(content);
            const position = sortedBeats.length > 0 ? index / sortedBeats.length : 0;
            const functions = suggestFunctions(content, position, sortedBeats.length);

            if (suggestions.length > 0) {
                classificationArray.push({
                    beatId: beat.id,
                    category: suggestions[0].category,
                    subtype: suggestions[0].subtype,
                    confidence: suggestions[0].confidence,
                    emotionalMarkers: emotions,
                    functionTags: functions,
                });
            }
        });

        return classificationArray;
    }, [sortedBeats, beatClassificationsRecord]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                Loading beats...
            </div>
        );
    }

    return (
        <div ref={rootRef} className="space-y-4 text-sm text-slate-200">
            {/* Recommendations Section */}
            <AnimatePresence>
                {recommendations && (
                    <ActRecommendations
                        recommendations={recommendations.recommendations}
                        overallAssessment={recommendations.overall_assessment}
                        onClose={handleRecommendationsClose}
                        onApply={handleRecommendationsApply}
                    />
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            {sortedBeats.length > 0 && (
                <BeatsProgressBar beats={sortedBeats} />
            )}

            {/* Filter Panel */}
            {sortedBeats.length > 0 && (
                <BeatFilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    totalBeats={sortedBeats.length}
                    filteredBeatsCount={filteredBeats.length}
                />
            )}

            {/* View Toggle */}
            <div className="flex justify-between items-center">
                <div className="group flex gap-1.5">
                    <Button
                        size="sm"
                        variant={view === 'table' ? 'primary' : 'secondary'}
                        onClick={() => setView('table')}
                        icon={<List />}
                        aria-keyshortcuts="Meta+1 Control+1"
                        data-testid="beats-table-view-btn"
                    >
                        Overview <kbd className="hidden group-hover:inline text-xs">{shortcutModifier}+1</kbd>
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'cards' ? 'primary' : 'secondary'}
                        onClick={() => setView('cards')}
                        icon={<LayoutGrid />}
                        aria-keyshortcuts="Meta+2 Control+2"
                        data-testid="beats-cards-view-btn"
                    >
                        Cards <kbd className="hidden group-hover:inline text-xs">{shortcutModifier}+2</kbd>
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'map' ? 'primary' : 'secondary'}
                        onClick={() => setView('map')}
                        icon={<MapIcon />}
                        aria-keyshortcuts="Meta+3 Control+3"
                        data-testid="beats-map-view-btn"
                    >
                        Narrative Map <kbd className="hidden group-hover:inline text-xs">{shortcutModifier}+3</kbd>
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'taxonomy' ? 'primary' : 'secondary'}
                        onClick={() => setView('taxonomy')}
                        icon={<Tags />}
                        aria-keyshortcuts="Meta+4 Control+4"
                        data-testid="beats-taxonomy-view-btn"
                    >
                        Taxonomy <kbd className="hidden group-hover:inline text-xs">{shortcutModifier}+4</kbd>
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'dependencies' ? 'primary' : 'secondary'}
                        onClick={() => setView('dependencies')}
                        icon={<GitBranch />}
                        aria-keyshortcuts="Meta+5 Control+5"
                        data-testid="beats-dependencies-view-btn"
                    >
                        Dependencies <kbd className="hidden group-hover:inline text-xs">{shortcutModifier}+5</kbd>
                    </Button>
                </div>
            </div>

            {/* Views */}
            {view === 'table' ? (
                <div className="space-y-3">
                    <BeatsTable
                        beats={filteredBeats}
                        setBeats={setBeats}
                        isReordering={isReordering}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">
                            {filteredBeats.length !== sortedBeats.length ? (
                                <>Showing {filteredBeats.length} of {sortedBeats.length}</>
                            ) : (
                                <>Total: {sortedBeats.length}</>
                            )}
                            {isReordering && <span className="ml-2 text-blue-400">(Updating order...)</span>}
                        </span>
                        <BeatsTableAdd
                            refetch={refreshBeats}
                            onRecommendationsReceived={handleRecommendationsReceived}
                        />
                    </div>
                </div>
            ) : view === 'cards' ? (
                <div className="space-y-4">
                    {/* Beat Cards Grid */}
                    <DragDropContext onDragEnd={handleDragEndCards}>
                        <Droppable droppableId="cards-grid" direction="horizontal" isDropDisabled={filteredBeats.length !== sortedBeats.length}>
                            {(provided) => (
                                <div 
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {filteredBeats.length === 0 && sortedBeats.length === 0 ? (
                                        <div className="col-span-full py-12 text-center text-slate-400">
                                            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                            <p className="text-sm">No beats available</p>
                                            <p className="text-sm text-slate-400 mt-1">Create your first beat to get started</p>
                                        </div>
                                    ) : filteredBeats.length === 0 ? (
                                        <div className="col-span-full py-12 text-center text-slate-400">
                                            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                            <p className="text-sm">No beats match your filters</p>
                                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                                        </div>
                                    ) : (
                                        filteredBeats.map((beat, index) => (
                                            <Draggable key={beat.id} draggableId={beat.id} index={index} isDragDisabled={filteredBeats.length !== sortedBeats.length}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            opacity: snapshot.isDragging ? 0.8 : 1,
                                                            zIndex: snapshot.isDragging ? 50 : 'auto',
                                                        }}
                                                    >
                                                        <BeatCard
                                                            beat={beat}
                                                            index={index}
                                                            onToggleCompletion={toggleBeatCompletion}
                                                            dragHandleProps={provided.dragHandleProps}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* Footer */}
                    {sortedBeats.length > 0 && (
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                            <span className="text-sm text-slate-400">
                                {filteredBeats.length !== sortedBeats.length ? (
                                    <>Showing {filteredBeats.length} of {sortedBeats.length} beats</>
                                ) : (
                                    <>Total: {sortedBeats.length} beats</>
                                )}
                            </span>
                            <BeatsTableAdd
                                refetch={refreshBeats}
                                onRecommendationsReceived={handleRecommendationsReceived}
                            />
                        </div>
                    )}
                </div>
            ) : view === 'taxonomy' ? (
                <div className="space-y-4">
                    {/* Distribution Chart */}
                    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                        <DistributionChart
                            classifications={classifications}
                            totalBeats={sortedBeats.length}
                            showRecommendations={true}
                        />
                    </div>

                    {/* Classified Beats List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">Beat Classifications</span>
                            <span className="text-sm text-slate-400">
                                {classifications.length} / {sortedBeats.length} classified
                            </span>
                        </div>
                        <div className="space-y-1">
                            {filteredBeats.map((beat, index) => {
                                const classification = classifications.find(c => c.beatId === beat.id);
                                return (
                                    <motion.div
                                        key={beat.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ ...BEAT_ANIMATIONS.quick, delay: BEAT_ANIMATIONS.stagger(index) }}
                                        className={cn(
                                            'flex items-center justify-between p-2 rounded-lg',
                                            'bg-slate-800/50 border border-slate-700/50',
                                            'hover:bg-slate-800 transition-colors'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm text-slate-400 w-6">
                                                {(beat.order || index) + 1}
                                            </span>
                                            <span className="text-sm text-slate-200 truncate">
                                                {beat.name}
                                            </span>
                                        </div>
                                        <BeatClassifierCompact
                                            category={classification?.category}
                                            subtype={classification?.subtype}
                                            emotionalMarkers={classification?.emotionalMarkers}
                                            functionTags={classification?.functionTags}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    {sortedBeats.length > 0 && (
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                            <span className="text-sm text-slate-400">
                                {filteredBeats.length !== sortedBeats.length ? (
                                    <>Showing {filteredBeats.length} of {sortedBeats.length} beats</>
                                ) : (
                                    <>Total: {sortedBeats.length} beats</>
                                )}
                            </span>
                            <BeatsTableAdd
                                refetch={refreshBeats}
                                onRecommendationsReceived={handleRecommendationsReceived}
                            />
                        </div>
                    )}
                </div>
            ) : view === 'dependencies' ? (
                <div className="space-y-4">
                    {/* Dependency Graph Visualization */}
                    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-slate-200">Dependency Graph</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>{dependencies.length} dependencies</span>
                                <span>•</span>
                                <span>{causalityChains.length} chains</span>
                            </div>
                        </div>
                        <DependencyGraph
                            beats={beatSummaries}
                            dependencies={dependencies}
                            selectedBeatId={selectedBeatId || undefined}
                            onSelectBeat={handleSelectBeat}
                            highlightChain={highlightChain}
                        />
                    </div>

                    {/* Two-column layout for editor and validation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Dependency Editor */}
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                            <DependencyEditor
                                beats={beatSummaries}
                                dependencies={dependencies}
                                onAddDependency={handleAddDependency}
                                onRemoveDependency={handleRemoveDependency}
                                onUpdateDependency={handleUpdateDependency}
                                selectedBeatId={selectedBeatId || undefined}
                            />
                        </div>

                        {/* Right: Validation Panel */}
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                            <ValidationPanel
                                beats={beatSummaries}
                                dependencies={dependencies}
                                onSelectBeat={handleSelectBeat}
                            />
                        </div>
                    </div>

                    {/* Causality Chains */}
                    {causalityChains.length > 0 && (
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                            <h3 className="text-sm font-medium text-slate-200 mb-3">Causality Chains</h3>
                            <CausalityChainDisplay
                                chains={causalityChains}
                                beatMap={beatMap}
                                onSelectChain={handleSelectChain}
                            />
                        </div>
                    )}

                    {/* Footer */}
                    {sortedBeats.length > 0 && (
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                            <span className="text-sm text-slate-400">
                                {sortedBeats.length} beats • {dependencies.length} dependencies
                            </span>
                            <BeatsTableAdd
                                refetch={refreshBeats}
                                onRecommendationsReceived={handleRecommendationsReceived}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <NarrativeMap
                    beats={filteredBeats}
                    onBeatUpdate={handleBeatUpdate}
                    onReorder={handleReorder}
                />
            )}
        </div>
    );
};

export default BeatsOverview;
