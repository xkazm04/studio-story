'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip } from '@/app/components/UI/Tooltip';

interface ScriptBlock {
    id: string;
    sceneId: string;
    type: string;
    content: string;
    speaker?: string;
    speakerType?: 'character' | 'narrator' | 'system';
    order: number;
}

export interface CharacterMetrics {
    name: string;
    dialogueLines: number;
    wordCount: number;
    percentOfTotal: number;
    avgLineLength: number;
    sceneCount: number;
    dialogueToActionRatio: number;
    topWords: string[];
}

interface CharacterDialogueStatsProps {
    blocks: ScriptBlock[];
}

// Common words to exclude from frequency analysis
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very', 'just',
    'that', 'this', 'it', 'i', 'you', 'he', 'she', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'about', 'up', 'out', 'don\'t', 'i\'m', 'it\'s', 'he\'s', 'she\'s',
]);

function getTopWords(text: string, count: number): string[] {
    const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
    const freq = new Map<string, number>();
    for (const w of words) {
        if (w.length > 2 && !STOP_WORDS.has(w)) {
            freq.set(w, (freq.get(w) || 0) + 1);
        }
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([word]) => word);
}

export function computeCharacterMetrics(blocks: ScriptBlock[]): CharacterMetrics[] {
    const dialogueBlocks = blocks.filter(b => b.type === 'dialogue' && b.speaker);
    const totalDialogueLines = dialogueBlocks.length;
    if (totalDialogueLines === 0) return [];

    // Group by speaker
    const byCharacter = new Map<string, ScriptBlock[]>();
    for (const block of dialogueBlocks) {
        const name = block.speaker!;
        if (!byCharacter.has(name)) byCharacter.set(name, []);
        byCharacter.get(name)!.push(block);
    }

    // Count action/direction blocks per scene for ratio calculation
    const actionBlocksByScene = new Map<string, number>();
    for (const block of blocks) {
        if (block.type === 'direction' || block.type === 'description') {
            actionBlocksByScene.set(block.sceneId, (actionBlocksByScene.get(block.sceneId) || 0) + 1);
        }
    }

    const metrics: CharacterMetrics[] = [];

    for (const [name, charBlocks] of byCharacter) {
        const allText = charBlocks.map(b => b.content).join(' ');
        const words = allText.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const dialogueLines = charBlocks.length;
        const sceneIds = new Set(charBlocks.map(b => b.sceneId));

        // Dialogue-to-action ratio: character's dialogue blocks / action blocks in their scenes
        let actionCount = 0;
        for (const sid of sceneIds) {
            actionCount += actionBlocksByScene.get(sid) || 0;
        }
        const dialogueToActionRatio = actionCount > 0 ? dialogueLines / actionCount : dialogueLines;

        metrics.push({
            name,
            dialogueLines,
            wordCount,
            percentOfTotal: (dialogueLines / totalDialogueLines) * 100,
            avgLineLength: dialogueLines > 0 ? Math.round(wordCount / dialogueLines) : 0,
            sceneCount: sceneIds.size,
            dialogueToActionRatio: Math.round(dialogueToActionRatio * 100) / 100,
            topWords: getTopWords(allText, 5),
        });
    }

    return metrics.sort((a, b) => b.wordCount - a.wordCount);
}

// Color palette for characters (cycles)
const CHAR_COLORS = [
    { bar: '#06B6D4', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { bar: '#A855F7', text: 'text-purple-400', bg: 'bg-purple-500/10' },
    { bar: '#F59E0B', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    { bar: '#10B981', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { bar: '#F43F5E', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    { bar: '#3B82F6', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    { bar: '#EC4899', text: 'text-pink-400', bg: 'bg-pink-500/10' },
    { bar: '#8B5CF6', text: 'text-violet-400', bg: 'bg-violet-500/10' },
];

export default function CharacterDialogueStats({ blocks }: CharacterDialogueStatsProps) {
    const [expanded, setExpanded] = useState(true);
    const metrics = useMemo(() => computeCharacterMetrics(blocks), [blocks]);

    if (metrics.length === 0) return null;

    const maxWordCount = Math.max(...metrics.map(m => m.wordCount));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 rounded-lg border border-slate-800/50 p-3"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 w-full text-left"
            >
                {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                    Character Dialogue ({metrics.length})
                </span>
            </button>

            {expanded && (
                <div className="mt-3 space-y-2">
                    {metrics.map((char, i) => {
                        const color = CHAR_COLORS[i % CHAR_COLORS.length];
                        const barWidth = (char.wordCount / maxWordCount) * 100;

                        return (
                            <div key={char.name} className="group">
                                {/* Name + bar */}
                                <div className="flex items-center gap-2">
                                    <span className={cn('text-sm font-medium w-28 truncate', color.text)}>
                                        {char.name}
                                    </span>
                                    <div className="flex-1 h-4 bg-slate-800/50 rounded overflow-hidden">
                                        <Tooltip
                                            content={`${char.wordCount} words (${char.percentOfTotal.toFixed(1)}%)`}
                                            position="top"
                                        >
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${barWidth}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                                className="h-full rounded"
                                                style={{ backgroundColor: color.bar }}
                                            />
                                        </Tooltip>
                                    </div>
                                    <span className="text-sm text-slate-400 w-16 text-right tabular-nums">
                                        {char.percentOfTotal.toFixed(1)}%
                                    </span>
                                </div>

                                {/* Detail row */}
                                <div className="ml-[7.5rem] flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                    <span>{char.dialogueLines} lines</span>
                                    <span>{char.wordCount} words</span>
                                    <span>~{char.avgLineLength} words/line</span>
                                    <span>{char.sceneCount} scene{char.sceneCount !== 1 ? 's' : ''}</span>
                                    <span>D:A {char.dialogueToActionRatio}</span>
                                    {char.topWords.length > 0 && (
                                        <span className="text-slate-600 truncate max-w-[200px]">
                                            {char.topWords.join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
