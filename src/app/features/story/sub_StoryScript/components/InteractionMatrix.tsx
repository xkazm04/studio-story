'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Grid3X3, ChevronDown, ChevronRight } from 'lucide-react';
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

export interface InteractionEntry {
    characterA: string;
    characterB: string;
    sharedScenes: number;
    linesA: number;
    linesB: number;
    totalLines: number;
}

export function computeInteractionMatrix(blocks: ScriptBlock[]): {
    characters: string[];
    matrix: Map<string, InteractionEntry>;
} {
    const dialogueBlocks = blocks.filter(b => b.type === 'dialogue' && b.speaker);

    // Group dialogue blocks by scene
    const sceneDialogue = new Map<string, ScriptBlock[]>();
    for (const block of dialogueBlocks) {
        if (!sceneDialogue.has(block.sceneId)) sceneDialogue.set(block.sceneId, []);
        sceneDialogue.get(block.sceneId)!.push(block);
    }

    // Collect all unique characters (sorted by total word count)
    const charWordCount = new Map<string, number>();
    for (const block of dialogueBlocks) {
        const name = block.speaker!;
        const words = block.content.trim().split(/\s+/).filter(Boolean).length;
        charWordCount.set(name, (charWordCount.get(name) || 0) + words);
    }
    const characters = [...charWordCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);

    // Build pairwise interaction data
    const matrix = new Map<string, InteractionEntry>();

    for (const [, sceneBlocks] of sceneDialogue) {
        // Characters speaking in this scene
        const speakersInScene = new Map<string, number>();
        for (const block of sceneBlocks) {
            const name = block.speaker!;
            speakersInScene.set(name, (speakersInScene.get(name) || 0) + 1);
        }

        const speakerList = [...speakersInScene.keys()];
        for (let i = 0; i < speakerList.length; i++) {
            for (let j = i + 1; j < speakerList.length; j++) {
                const a = speakerList[i] < speakerList[j] ? speakerList[i] : speakerList[j];
                const b = speakerList[i] < speakerList[j] ? speakerList[j] : speakerList[i];
                const key = `${a}::${b}`;

                const linesA = speakersInScene.get(a) || 0;
                const linesB = speakersInScene.get(b) || 0;

                if (!matrix.has(key)) {
                    matrix.set(key, { characterA: a, characterB: b, sharedScenes: 0, linesA: 0, linesB: 0, totalLines: 0 });
                }
                const entry = matrix.get(key)!;
                entry.sharedScenes += 1;
                entry.linesA += linesA;
                entry.linesB += linesB;
                entry.totalLines += linesA + linesB;
            }
        }
    }

    return { characters, matrix };
}

interface InteractionMatrixProps {
    blocks: ScriptBlock[];
}

export default function InteractionMatrix({ blocks }: InteractionMatrixProps) {
    const [expanded, setExpanded] = useState(true);
    const { characters, matrix } = useMemo(() => computeInteractionMatrix(blocks), [blocks]);

    if (characters.length < 2) return null;

    // Find max total lines for color intensity scaling
    const entries = [...matrix.values()];
    const maxLines = Math.max(...entries.map(e => e.totalLines), 1);

    function getCellData(charA: string, charB: string): InteractionEntry | null {
        const a = charA < charB ? charA : charB;
        const b = charA < charB ? charB : charA;
        return matrix.get(`${a}::${b}`) || null;
    }

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
                <Grid3X3 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                    Character Interactions
                </span>
            </button>

            {expanded && (
                <div className="mt-3 overflow-x-auto">
                    <table className="text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="p-1" />
                                {characters.map(name => (
                                    <th
                                        key={name}
                                        className="p-1 text-slate-400 font-medium text-center max-w-[60px] truncate"
                                        title={name}
                                    >
                                        <span className="inline-block max-w-[56px] truncate text-xs">
                                            {name}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {characters.map((rowChar) => (
                                <tr key={rowChar}>
                                    <td className="p-1 text-slate-400 font-medium text-right pr-2 max-w-[80px] truncate text-xs" title={rowChar}>
                                        {rowChar}
                                    </td>
                                    {characters.map((colChar) => {
                                        if (rowChar === colChar) {
                                            return (
                                                <td key={colChar} className="p-1">
                                                    <div className="w-8 h-8 rounded bg-slate-800/30 flex items-center justify-center">
                                                        <span className="text-slate-600 text-xs">-</span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        const data = getCellData(rowChar, colChar);
                                        if (!data) {
                                            return (
                                                <td key={colChar} className="p-1">
                                                    <div className="w-8 h-8 rounded bg-slate-800/20" />
                                                </td>
                                            );
                                        }

                                        const intensity = Math.max(0.15, data.totalLines / maxLines);

                                        return (
                                            <td key={colChar} className="p-1">
                                                <Tooltip
                                                    content={`${data.characterA} & ${data.characterB}: ${data.sharedScenes} shared scene${data.sharedScenes !== 1 ? 's' : ''}, ${data.totalLines} dialogue lines`}
                                                    position="top"
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded flex items-center justify-center cursor-default transition-transform hover:scale-110"
                                                        style={{
                                                            backgroundColor: `rgba(168, 85, 247, ${intensity})`,
                                                        }}
                                                    >
                                                        <span className="text-white text-xs font-medium">
                                                            {data.sharedScenes}
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {entries.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <span>Intensity = dialogue volume</span>
                            <div className="flex items-center gap-0.5">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }} />
                                <span>low</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(168, 85, 247, 1)' }} />
                                <span>high</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
