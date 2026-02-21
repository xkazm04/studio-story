import React from 'react';
import { Play, Pause } from 'lucide-react';

export interface DialogueLine {
    speaker: string;
    text: string;
    emotion?: string;
}

interface DialogueViewerProps {
    lines: DialogueLine[];
}

export const DialogueViewer: React.FC<DialogueViewerProps> = ({ lines }) => {
    if (!lines || lines.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Dialogue</h3>
            <div className="space-y-4">
                {lines.map((line, index) => (
                    <div key={index} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-24 text-right">
                            <div className="font-bold text-blue-400 text-sm">{line.speaker}</div>
                            {line.emotion && (
                                <div className="text-xs text-gray-500 italic">({line.emotion})</div>
                            )}
                        </div>

                        <div className="flex-grow bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 relative">
                            <p className="text-gray-200 text-sm leading-relaxed">{line.text}</p>

                            <button
                                className="absolute right-2 top-2 p-1.5 rounded-full bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                                title="Play Audio (Coming Soon)"
                            >
                                <Play className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
