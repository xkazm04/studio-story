'use client';

import { PlusIcon, Sparkles } from "lucide-react";

type Props = {
    onShowStepper?: () => void;
    variant?: 'large' | 'card';
}

const LandingProjectCreate = ({ 
    onShowStepper,
    variant = 'large'
}: Props) => {
    const handleClick = () => {
        if (onShowStepper) {
            onShowStepper();
        }
    };

    // Large centered variant for first project
    if (variant === 'large') {
        return (
            <div className="col-span-1 sm:col-span-2 lg:grid-cols-3 xl:col-span-4 flex items-center justify-center py-12">
                <button
                    onClick={handleClick}
                    className="relative group bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 w-full max-w-2xl h-96 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
                    data-testid="create-first-project-btn"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <PlusIcon className="w-12 h-12 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-bold text-white flex items-center gap-2 justify-center">
                                Create Your First Project
                                <Sparkles className="w-6 h-6 text-blue-400" />
                            </h3>
                            <p className="text-white/60 text-lg">
                                Start your storytelling journey
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-white/40 mt-4">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span>Click to begin</span>
                        </div>
                    </div>
                </button>
            </div>
        );
    }

    // Small card variant to add alongside existing projects
    return (
        <button
            onClick={handleClick}
            className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-6 h-80 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 hover:bg-white/10 hover:border-blue-500/50 active:scale-95"
            data-testid="create-new-project-btn"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg">
                        <PlusIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                </div>
                
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-1">
                        New Project
                    </h3>
                    <p className="text-sm text-white/60">
                        Click to create
                    </p>
                </div>
            </div>
        </button>
    );
}

export default LandingProjectCreate

