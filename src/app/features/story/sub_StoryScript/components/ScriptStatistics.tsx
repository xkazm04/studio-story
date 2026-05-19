'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    FileText,
    MessageSquare,
    MapPin,
    Check,
} from 'lucide-react';
import { Tooltip } from '@/app/components/UI/Tooltip';
import CharacterDialogueStats from './CharacterDialogueStats';
import InteractionMatrix from './InteractionMatrix';

interface ScriptStats {
    acts: number;
    scenes: number;
    words: number;
    readingMinutes: number;
    withDialogue: number;
    withLocation: number;
    withContent: number;
    completionRate: number;
}

interface ActBreakdown {
    actName: string;
    words: number;
    withDialogue: number;
    withLocation: number;
    withContent: number;
    scenes: number;
}

interface ScriptBlock {
    id: string;
    sceneId: string;
    type: string;
    content: string;
    speaker?: string;
    speakerType?: 'character' | 'narrator' | 'system';
    order: number;
}

interface ScriptStatisticsProps {
    stats: ScriptStats;
    actBreakdown?: ActBreakdown[];
    blocks?: ScriptBlock[];
}

// Mini sparkline bar chart for per-act distribution
function Sparkline({
    values,
    actNames,
    barColor,
}: {
    values: number[];
    actNames: string[];
    barColor: string;
}) {
    const maxVal = Math.max(...values, 1);

    return (
        <div className="flex items-end gap-px mt-2 h-5">
            {values.map((val, i) => {
                const heightPercent = (val / maxVal) * 100;
                return (
                    <Tooltip
                        key={i}
                        content={`${actNames[i]}: ${val}`}
                        position="top"
                    >
                        <div
                            className="flex-1 min-w-0 rounded-sm transition-all hover:opacity-80 cursor-default"
                            style={{
                                height: `${Math.max(heightPercent, 8)}%`,
                                backgroundColor: barColor,
                                opacity: heightPercent === 0 ? 0.2 : 1,
                            }}
                        />
                    </Tooltip>
                );
            })}
        </div>
    );
}

export default function ScriptStatistics({ stats, actBreakdown, blocks }: ScriptStatisticsProps) {
    const actNames = useMemo(
        () => actBreakdown?.map(a => a.actName) ?? [],
        [actBreakdown]
    );

    const items = [
        {
            label: 'Total Words',
            value: stats.words.toLocaleString(),
            icon: FileText,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            barColor: 'var(--ms-cyan, #06B6D4)',
            sparkValues: actBreakdown?.map(a => a.words),
        },
        {
            label: 'With Dialogue',
            value: `${stats.withDialogue}/${stats.scenes}`,
            icon: MessageSquare,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            barColor: '#A855F7',
            sparkValues: actBreakdown?.map(a => a.withDialogue),
        },
        {
            label: 'With Location',
            value: `${stats.withLocation}/${stats.scenes}`,
            icon: MapPin,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            barColor: '#F59E0B',
            sparkValues: actBreakdown?.map(a => a.withLocation),
        },
        {
            label: 'With Content',
            value: `${stats.withContent}/${stats.scenes}`,
            icon: Check,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            barColor: '#10B981',
            sparkValues: actBreakdown?.map(a => a.withContent),
        },
    ];

    return (
        <div className="space-y-3">
            {/* Aggregate stats grid */}
            <div className="grid grid-cols-4 gap-3">
                {items.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-900/40 rounded-lg border border-slate-800/50 px-3 py-2.5"
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn('p-1.5 rounded', item.bgColor)}>
                                <item.icon className={cn('w-3.5 h-3.5', item.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{item.value}</p>
                                <p className="text-sm text-slate-400">{item.label}</p>
                            </div>
                        </div>
                        {item.sparkValues && item.sparkValues.length > 1 && (
                            <Sparkline
                                values={item.sparkValues}
                                actNames={actNames}
                                barColor={item.barColor}
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Per-character dialogue breakdown */}
            {blocks && blocks.length > 0 && (
                <>
                    <CharacterDialogueStats blocks={blocks} />
                    <InteractionMatrix blocks={blocks} />
                </>
            )}
        </div>
    );
}
