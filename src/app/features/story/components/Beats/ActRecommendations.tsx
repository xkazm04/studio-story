'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Sparkles } from "lucide-react";
import { ActRecommendation } from "@/app/types/Recommendation";
import { actApi } from "@/app/hooks/integration/useActs";
import { Button } from "@/app/components/UI/Button";

type Props = {
    recommendations: ActRecommendation[];
    overallAssessment: string;
    onClose: () => void;
    onApply: () => void;
};

const ActRecommendations = ({ recommendations, overallAssessment, onClose, onApply }: Props) => {
    const [applyingRecommendations, setApplyingRecommendations] = useState<Set<string>>(new Set());
    const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());
    const [rejectedRecommendations, setRejectedRecommendations] = useState<Set<string>>(new Set());
    const [isApplying, setIsApplying] = useState(false);

    const handleApprove = async (recommendation: ActRecommendation) => {
        const recId = `${recommendation.act_id}-${recommendation.before}`;
        setApplyingRecommendations(prev => new Set(prev).add(recId));

        try {
            // Fetch the current act to get its description
            const response = await fetch(`/api/acts/${recommendation.act_id}`);
            if (!response.ok) throw new Error('Failed to fetch act');

            const currentAct = await response.json();
            let newDescription = '';

            if (recommendation.change_type === 'replace' && recommendation.before) {
                // Replace specific text
                newDescription = (currentAct.description || '').replace(
                    recommendation.before,
                    recommendation.after
                );
            } else if (recommendation.change_type === 'add') {
                // Add to existing description
                newDescription = currentAct.description
                    ? `${currentAct.description}\n\n${recommendation.after}`
                    : recommendation.after;
            }

            await actApi.updateAct(recommendation.act_id, {
                description: newDescription
            });

            setAppliedRecommendations(prev => new Set(prev).add(recId));
        } catch (error) {
            console.error('Error applying recommendation:', error);
            alert('Failed to apply recommendation');
        } finally {
            setApplyingRecommendations(prev => {
                const newSet = new Set(prev);
                newSet.delete(recId);
                return newSet;
            });
        }
    };

    const handleReject = (recommendation: ActRecommendation) => {
        const recId = `${recommendation.act_id}-${recommendation.before}`;
        setRejectedRecommendations(prev => new Set(prev).add(recId));
    };

    const handleApplyAll = async () => {
        setIsApplying(true);
        for (const rec of recommendations) {
            const recId = `${rec.act_id}-${rec.before}`;
            if (!appliedRecommendations.has(recId) && !rejectedRecommendations.has(recId)) {
                await handleApprove(rec);
            }
        }
        setIsApplying(false);
        onApply();
    };

    const handleCloseAll = () => {
        // Mark all remaining as rejected
        const allRecIds = recommendations.map(rec => `${rec.act_id}-${rec.before}`);
        setRejectedRecommendations(new Set(allRecIds));
        onClose();
    };

    const pendingCount = recommendations.filter(rec => {
        const recId = `${rec.act_id}-${rec.before}`;
        return !appliedRecommendations.has(recId) && !rejectedRecommendations.has(recId);
    }).length;

    if (recommendations.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-4"
                data-testid="act-recommendations-none"
            >
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-200 mb-1">
                            No Changes Recommended
                        </h3>
                        <p className="text-xs text-green-300/80 leading-relaxed">
                            {overallAssessment}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-green-400 hover:text-green-300 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4 space-y-3"
            data-testid="act-recommendations-panel"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-200 mb-1">
                            Act Description Recommendations ({pendingCount} pending)
                        </h3>
                        <p className="text-xs text-blue-300/80 leading-relaxed">
                            {overallAssessment}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCloseAll}
                    className="text-blue-400 hover:text-blue-300 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
                {recommendations.map((rec, idx) => {
                    const recId = `${rec.act_id}-${rec.before}`;
                    const isApplied = appliedRecommendations.has(recId);
                    const isRejected = rejectedRecommendations.has(recId);
                    const isApplying = applyingRecommendations.has(recId);

                    if (isRejected) return null;

                    return (
                        <motion.div
                            key={recId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`border rounded-lg p-3 ${
                                isApplied
                                    ? 'bg-green-900/20 border-green-700/30'
                                    : 'bg-gray-900/50 border-gray-700'
                            }`}
                        >
                            <div className="flex items-start gap-2 mb-2">
                                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                    isApplied ? 'text-green-400' : 'text-blue-400'
                                }`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-200">
                                            {rec.act_name}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                                            {rec.change_type}
                                        </span>
                                        {isApplied && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-300">
                                                ✓ Applied
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mb-2">{rec.reason}</p>

                                    {/* Show change details */}
                                    {rec.change_type === 'replace' && rec.before && (
                                        <div className="space-y-1.5 text-[11px]">
                                            <div className="bg-red-900/20 border border-red-700/30 rounded px-2 py-1">
                                                <span className="text-red-300 font-mono">- </span>
                                                <span className="text-red-200/80">{rec.before}</span>
                                            </div>
                                            <div className="bg-green-900/20 border border-green-700/30 rounded px-2 py-1">
                                                <span className="text-green-300 font-mono">+ </span>
                                                <span className="text-green-200/80">{rec.after}</span>
                                            </div>
                                        </div>
                                    )}

                                    {rec.change_type === 'add' && (
                                        <div className="bg-green-900/20 border border-green-700/30 rounded px-2 py-1 text-[11px]">
                                            <span className="text-green-300 font-mono">+ </span>
                                            <span className="text-green-200/80">{rec.after}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isApplied && (
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleApprove(rec)}
                                        disabled={isApplying}
                                        className="flex items-center gap-1 text-xs"
                                        data-testid={`apply-recommendation-${rec.act_id}`}
                                    >
                                        {isApplying ? (
                                            <>Applying...</>
                                        ) : (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Apply
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleReject(rec)}
                                        disabled={isApplying}
                                        className="flex items-center gap-1 text-xs"
                                        data-testid={`reject-recommendation-${rec.act_id}`}
                                    >
                                        <X className="w-3 h-3" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            {pendingCount > 0 && (
                <div className="flex gap-2 pt-2 border-t border-blue-700/30">
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleApplyAll}
                        disabled={isApplying}
                        className="flex items-center gap-1"
                        data-testid="apply-all-recommendations-btn"
                    >
                        <Check className="w-4 h-4" />
                        Apply All ({pendingCount})
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCloseAll}
                        data-testid="dismiss-all-recommendations-btn"
                    >
                        Dismiss All
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default ActRecommendations;
