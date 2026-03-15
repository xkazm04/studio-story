import React from 'react';
import { MessageSquare, FileText, Download, Wand2 } from 'lucide-react';

interface ScriptQuickActionsProps {
    onGenerateDialogue: () => void;
    onAddDescription: () => void;
    onFormat: () => void;
    onExport: () => void;
    isGeneratingDialogue?: boolean;
    isGeneratingDescription?: boolean;
}

export const ScriptQuickActions: React.FC<ScriptQuickActionsProps> = ({
    onGenerateDialogue,
    onAddDescription,
    onFormat,
    onExport,
    isGeneratingDialogue = false,
    isGeneratingDescription = false,
}) => {
    return (
        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                    onClick={onGenerateDialogue}
                    disabled={isGeneratingDialogue}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MessageSquare className="w-4 h-4" />
                    {isGeneratingDialogue ? 'Generating...' : 'Generate Dialogue'}
                </button>
                <button
                    onClick={onAddDescription}
                    disabled={isGeneratingDescription}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText className="w-4 h-4" />
                    {isGeneratingDescription ? 'Adding...' : 'Add Description'}
                </button>
                <button
                    onClick={onFormat}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition text-sm"
                >
                    <Wand2 className="w-4 h-4" />
                    Format Script
                </button>
                <button
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition text-sm"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>
        </div>
    );
};
