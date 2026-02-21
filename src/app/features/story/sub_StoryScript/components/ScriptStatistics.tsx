'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    FileText,
    MessageSquare,
    MapPin,
    Check,
    BarChart3,
} from 'lucide-react';

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

interface ScriptStatisticsProps {
    stats: ScriptStats;
}

export default function ScriptStatistics({ stats }: ScriptStatisticsProps) {
    const items = [
        {
            label: 'Total Words',
            value: stats.words.toLocaleString(),
            icon: FileText,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
        },
        {
            label: 'With Dialogue',
            value: `${stats.withDialogue}/${stats.scenes}`,
            icon: MessageSquare,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
        {
            label: 'With Location',
            value: `${stats.withLocation}/${stats.scenes}`,
            icon: MapPin,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
        {
            label: 'With Content',
            value: `${stats.withContent}/${stats.scenes}`,
            icon: Check,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
        },
    ];

    return (
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
                            <p className="text-[10px] text-slate-500">{item.label}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
