/**
 * ActOverview / Evaluator Component
 * Compact table-based story evaluation with stats header and severity-sorted issues
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from "@/app/store/slices/projectSlice";
import { sceneApi } from "@/app/hooks/integration/useScenes";
import { USE_MOCK_DATA } from '@/app/utils/api';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    FileText,
    GitBranch,
    Clock,
    Download,
    Copy,
    Check,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    Terminal,
    Filter,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Scene } from '@/app/types/Scene';

// Mock data for the Evaluator
const MOCK_SCENES: Scene[] = [
    { id: 'scene-1', name: 'The Crossroads', project_id: 'proj-1', act_id: 'act-1', order: 1, description: 'You stand at a crossroads.', content: 'The morning mist parts before you as you reach the crossroads. Three paths stretch into the unknown.' },
    { id: 'scene-2', name: 'Mountain Fortress', project_id: 'proj-1', act_id: 'act-1', order: 2, description: 'The towering fortress looms.', content: 'After a steep climb, the fortress gates stand before you. Guards patrol the walls.' },
    { id: 'scene-3', name: 'Shadow Woods', project_id: 'proj-1', act_id: 'act-1', order: 3, description: 'Darkness envelops the trees.', content: 'The canopy thickens overhead, blocking out the sun. Strange whispers echo.' },
    { id: 'scene-4', name: 'Riverside Village', project_id: 'proj-1', act_id: 'act-1', order: 4, description: 'A peaceful village.', content: 'Smoke rises from cottage chimneys. Children play by the waterside.' },
    { id: 'scene-5', name: 'The Hidden Chamber', project_id: 'proj-1', act_id: 'act-2', order: 5, description: 'A secret room.', content: 'Behind the tapestry, you discover a hidden chamber filled with ancient maps.' },
];

const MOCK_CHOICES = [
    { id: 'c1', scene_id: 'scene-1', target_scene_id: 'scene-2', label: 'Climb to the fortress' },
    { id: 'c2', scene_id: 'scene-1', target_scene_id: 'scene-3', label: 'Enter the woods' },
    { id: 'c3', scene_id: 'scene-1', target_scene_id: 'scene-4', label: 'Visit the village' },
    { id: 'c4', scene_id: 'scene-2', target_scene_id: 'scene-5', label: 'Search for secrets' },
    { id: 'c5', scene_id: 'scene-2', target_scene_id: 'scene-1', label: 'Return' },
    { id: 'c6', scene_id: 'scene-3', target_scene_id: 'scene-1', label: 'Flee back' },
];

type IssueSeverity = 'error' | 'warning' | 'info';
type SortField = 'order' | 'name' | 'words' | 'choices' | 'status';
type SortDirection = 'asc' | 'desc';
type IssueFilter = 'all' | 'errors' | 'warnings';

interface Issue {
    sceneId: string;
    sceneName: string;
    type: string;
    severity: IssueSeverity;
    message: string;
}

const ActOverview = () => {
    const { selectedProject } = useProjectStore();
    const [copied, setCopied] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const [sortField, setSortField] = useState<SortField>('order');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');

    const { data: apiScenes, isLoading } = sceneApi.useScenesByProjectAndAct(
        selectedProject?.id || '',
        '',
        !USE_MOCK_DATA && !!selectedProject?.id
    );

    const scenes = USE_MOCK_DATA ? MOCK_SCENES : (apiScenes || []);
    const choices = USE_MOCK_DATA ? MOCK_CHOICES : [];

    // Calculate metrics and issues
    const { metrics, issues, sceneData } = useMemo(() => {
        const totalScenes = scenes.length;
        const totalChoices = choices.length;
        const totalWords = scenes.reduce((sum, s) => sum + (s.content?.split(/\s+/).length || 0), 0);
        const readingTime = Math.ceil(totalWords / 200);

        const branchingFactors = new Map<string, number>();
        choices.forEach(c => {
            branchingFactors.set(c.scene_id, (branchingFactors.get(c.scene_id) || 0) + 1);
        });

        const scenesWithChoices = new Set(choices.map(c => c.scene_id));
        const targetIds = new Set(choices.map(c => c.target_scene_id));

        const issues: Issue[] = [];
        const sceneData = scenes.map((scene, index) => {
            const choiceCount = branchingFactors.get(scene.id) || 0;
            const wordCount = scene.content?.split(/\s+/).length || 0;
            const isDeadEnd = !scenesWithChoices.has(scene.id);
            const isOrphaned = scene.order !== 1 && !targetIds.has(scene.id);
            const isIncomplete = wordCount < 20;

            let status: 'good' | 'warning' | 'error' = 'good';
            if (isDeadEnd) {
                status = 'error';
                issues.push({ sceneId: scene.id, sceneName: scene.name || 'Untitled', type: 'Dead End', severity: 'error', message: 'No outgoing choices' });
            }
            if (isOrphaned) {
                status = 'error';
                issues.push({ sceneId: scene.id, sceneName: scene.name || 'Untitled', type: 'Orphaned', severity: 'error', message: 'No incoming connections' });
            }
            if (isIncomplete) {
                if (status === 'good') status = 'warning';
                issues.push({ sceneId: scene.id, sceneName: scene.name || 'Untitled', type: 'Incomplete', severity: 'warning', message: `Only ${wordCount} words` });
            }

            return { scene, index, choiceCount, wordCount, isDeadEnd, isOrphaned, isIncomplete, status };
        });

        // Sort issues by severity (errors first, then warnings)
        issues.sort((a, b) => {
            const severityOrder = { error: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        return {
            metrics: {
                totalScenes,
                totalChoices,
                totalWords,
                readingTime,
                deadEnds: sceneData.filter(s => s.isDeadEnd).length,
                orphans: sceneData.filter(s => s.isOrphaned).length,
                incomplete: sceneData.filter(s => s.isIncomplete).length,
            },
            issues,
            sceneData,
        };
    }, [scenes, choices]);

    // Sort scene data
    const sortedSceneData = useMemo(() => {
        return [...sceneData].sort((a, b) => {
            let compare = 0;
            switch (sortField) {
                case 'order': compare = a.index - b.index; break;
                case 'name': compare = (a.scene.name || '').localeCompare(b.scene.name || ''); break;
                case 'words': compare = a.wordCount - b.wordCount; break;
                case 'choices': compare = a.choiceCount - b.choiceCount; break;
                case 'status':
                    const statusOrder = { error: 0, warning: 1, good: 2 };
                    compare = statusOrder[a.status] - statusOrder[b.status];
                    break;
            }
            return sortDirection === 'asc' ? compare : -compare;
        });
    }, [sceneData, sortField, sortDirection]);

    // Filter issues
    const filteredIssues = useMemo(() => {
        if (issueFilter === 'all') return issues;
        if (issueFilter === 'errors') return issues.filter(i => i.severity === 'error');
        return issues.filter(i => i.severity === 'warning');
    }, [issues, issueFilter]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleCopyMetrics = async () => {
        const text = `Scenes: ${metrics.totalScenes} | Choices: ${metrics.totalChoices} | Words: ${metrics.totalWords} | Issues: ${issues.length}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportJSON = () => {
        const exportData = { metrics, scenes, choices, issues, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-eval-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!USE_MOCK_DATA && isLoading) {
        return <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading...</div>;
    }

    const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className={cn(
                'flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold transition-colors',
                sortField === field ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            )}
        >
            {children}
            {sortField === field && (
                sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Collapsible Stats Header */}
            <div className="shrink-0 border-b border-slate-800">
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-slate-200">Story Evaluator</span>
                        <div className="flex items-center gap-2 text-xs">
                            {issues.length === 0 ? (
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <CheckCircle className="w-3 h-3" /> Valid
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-400">
                                    <AlertTriangle className="w-3 h-3" /> {issues.length} issues
                                </span>
                            )}
                        </div>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showStats && 'rotate-180')} />
                </button>

                <AnimatePresence>
                    {showStats && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-3 grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {[
                                    { label: 'Scenes', value: metrics.totalScenes, color: 'text-cyan-400' },
                                    { label: 'Choices', value: metrics.totalChoices, color: 'text-purple-400' },
                                    { label: 'Words', value: metrics.totalWords, color: 'text-blue-400' },
                                    { label: 'Time', value: `${metrics.readingTime}m`, color: 'text-slate-400' },
                                    { label: 'Dead Ends', value: metrics.deadEnds, color: metrics.deadEnds > 0 ? 'text-red-400' : 'text-emerald-400' },
                                    { label: 'Orphans', value: metrics.orphans, color: metrics.orphans > 0 ? 'text-amber-400' : 'text-emerald-400' },
                                    { label: 'Incomplete', value: metrics.incomplete, color: metrics.incomplete > 0 ? 'text-amber-400' : 'text-emerald-400' },
                                ].map(stat => (
                                    <div key={stat.label} className="text-center py-2 px-2 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className={cn('text-lg font-bold tabular-nums', stat.color)}>{stat.value}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 pb-3 flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={handleCopyMetrics} icon={copied ? <Check /> : <Copy />}>
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={handleExportJSON} icon={<Download />}>
                                    Export
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Issues Panel (if any) */}
            {issues.length > 0 && (
                <div className="shrink-0 border-b border-slate-800 bg-slate-900/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Issues ({filteredIssues.length})
                        </h3>
                        <div className="flex items-center gap-1">
                            {(['all', 'errors', 'warnings'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setIssueFilter(filter)}
                                    className={cn(
                                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                                        issueFilter === filter
                                            ? 'bg-slate-700 text-slate-200'
                                            : 'text-slate-500 hover:text-slate-300'
                                    )}
                                >
                                    {filter === 'all' ? 'All' : filter === 'errors' ? 'Errors' : 'Warnings'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredIssues.map((issue, i) => (
                            <div
                                key={`${issue.sceneId}-${issue.type}-${i}`}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
                                    issue.severity === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                                )}
                            >
                                {issue.severity === 'error' ? (
                                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                )}
                                <span className={cn('font-medium', issue.severity === 'error' ? 'text-red-300' : 'text-amber-300')}>
                                    {issue.type}
                                </span>
                                <span className="text-slate-400">in</span>
                                <span className="text-slate-200 truncate">{issue.sceneName}</span>
                                <span className="text-slate-500 ml-auto shrink-0">{issue.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Compact Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-3 py-2 w-10"><SortHeader field="order">#</SortHeader></th>
                            <th className="text-left px-3 py-2"><SortHeader field="name">Scene</SortHeader></th>
                            <th className="text-right px-3 py-2 w-16"><SortHeader field="words">Words</SortHeader></th>
                            <th className="text-right px-3 py-2 w-16"><SortHeader field="choices">Choices</SortHeader></th>
                            <th className="text-center px-3 py-2 w-20"><SortHeader field="status">Status</SortHeader></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {sortedSceneData.map(({ scene, index, choiceCount, wordCount, status }) => (
                            <tr
                                key={scene.id}
                                className={cn(
                                    'hover:bg-slate-800/30 transition-colors',
                                    status === 'error' && 'bg-red-500/5',
                                    status === 'warning' && 'bg-amber-500/5'
                                )}
                            >
                                <td className="px-3 py-2 text-slate-500 font-mono">{index + 1}</td>
                                <td className="px-3 py-2">
                                    <div className="font-medium text-slate-200 truncate max-w-xs">{scene.name || 'Untitled'}</div>
                                    <div className="text-slate-500 truncate max-w-xs">{scene.description || '—'}</div>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-400">{wordCount}</td>
                                <td className="px-3 py-2 text-right">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 tabular-nums',
                                        choiceCount === 0 ? 'text-red-400' : choiceCount >= 3 ? 'text-purple-400' : 'text-slate-400'
                                    )}>
                                        <GitBranch className="w-3 h-3" />
                                        {choiceCount}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {status === 'good' && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                                            <CheckCircle className="w-3 h-3" /> OK
                                        </span>
                                    )}
                                    {status === 'warning' && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                                            <AlertTriangle className="w-3 h-3" /> Warn
                                        </span>
                                    )}
                                    {status === 'error' && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px]">
                                            <XCircle className="w-3 h-3" /> Error
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {scenes.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-sm">No scenes to evaluate</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActOverview;
