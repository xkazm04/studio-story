'use client';

import { useState, useRef } from "react";
import { BeatTableItem } from "./BeatsOverview";
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { beatApi } from "@/app/hooks/integration/useBeats";
import { ConfirmationModal } from "@/app/components/UI/ConfirmationModal";
import { useToast } from "@/app/components/UI/ToastContainer";
import { useUserSettingsStore } from "@/app/store/slices/userSettingsSlice";
import { triggerCheckboxConfetti, getCongratulationMessage } from "@/app/lib/celebration";
import BeatSceneSuggestions from "./BeatSceneSuggestions";
import { BeatSceneSuggestion } from "@/app/types/Beat";
import { beatSceneMappingApi } from "@/app/hooks/integration/useBeatSceneMappings";
import { useProjectStore } from "@/app/store/projectStore";

type Props = {
    beat: BeatTableItem;
    index: number;
    setBeats: React.Dispatch<React.SetStateAction<BeatTableItem[]>>;
}

const BeatsTableRow = ({ beat, index, setBeats }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState<Partial<BeatTableItem>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCelebrating, setIsCelebrating] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const checkboxRef = useRef<HTMLInputElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const { celebrationsEnabled, isBeatCelebrated, markBeatCelebrated } = useUserSettingsStore();
    const { selectedProject } = useProjectStore();

    const startEditing = () => {
        setIsEditing(true);
        setEditValues({
            name: beat.name,
            description: beat.description,
            type: beat.type,
            order: beat.order
        });
        setShowSuggestions(true); // Show suggestions when editing
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditValues({});
        setShowSuggestions(false);
    };

    const saveEditing = async () => {
        if (!editValues.name) return;

        // Update each changed field
        const promises = [];
        if (editValues.name !== beat.name) {
            promises.push(beatApi.editBeat(beat.id, 'name', editValues.name));
        }
        if (editValues.description !== beat.description) {
            promises.push(beatApi.editBeat(beat.id, 'description', editValues.description || ''));
        }

        try {
            await Promise.all(promises);
            setBeats(prev => prev.map(b => 
                b.id === beat.id ? { ...b, ...editValues } : b
            ));
            setIsEditing(false);
            setEditValues({});
        } catch (error) {
            console.error('Failed to update beat:', error);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const deleteBeat = async () => {
        setIsDeleting(true);
        try {
            await beatApi.deleteBeat(beat.id);
            setBeats(prev => prev.filter(b => b.id !== beat.id));
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Failed to delete beat:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleCompletion = async () => {
        const newValue = !beat.completed;
        const wasNotCompleted = !beat.completed;

        try {
            await beatApi.editBeat(beat.id, 'completed', newValue);
            setBeats(prev => prev.map(b =>
                b.id === beat.id ? { ...b, completed: newValue } : b
            ));

            // Trigger celebration only on first completion
            if (wasNotCompleted && newValue && celebrationsEnabled && !isBeatCelebrated(beat.id)) {
                triggerCelebration();
                markBeatCelebrated(beat.id);
            }
        } catch (error) {
            console.error('Failed to toggle completion:', error);
        }
    };

    const triggerCelebration = () => {
        // Set celebrating state for animations
        setIsCelebrating(true);

        // Trigger confetti at checkbox position
        if (checkboxRef.current) {
            triggerCheckboxConfetti(checkboxRef.current);
        }

        // Show congratulatory toast
        const message = getCongratulationMessage(beat.name);
        showToast(message, 'success', 3000);

        // Reset celebrating state after animation
        setTimeout(() => {
            setIsCelebrating(false);
        }, 1000);
    };

    const handleAcceptSuggestion = async (suggestion: BeatSceneSuggestion) => {
        try {
            // Create the mapping in the database
            await beatSceneMappingApi.createMapping({
                beat_id: beat.id,
                project_id: selectedProject?.id || '',
                scene_id: suggestion.scene_id,
                status: 'accepted',
                suggested_scene_name: suggestion.scene_name,
                suggested_scene_description: suggestion.scene_description,
                suggested_scene_script: suggestion.scene_script,
                suggested_location: suggestion.location,
                semantic_similarity_score: suggestion.similarity_score,
                reasoning: suggestion.reasoning,
                confidence_score: suggestion.confidence_score,
            });

            showToast(`Scene "${suggestion.scene_name}" mapped to beat!`, 'success');
            setShowSuggestions(false);
        } catch (error) {
            console.error('Error accepting suggestion:', error);
            showToast('Failed to accept suggestion', 'error');
        }
    };

    const handleRejectSuggestion = (suggestion: BeatSceneSuggestion) => {
        // Optionally save rejection to database for learning
        showToast('Suggestion rejected', 'info');
    };

    const handleModifySuggestion = (suggestion: BeatSceneSuggestion) => {
        // Open a modal or form to modify the suggestion
        showToast('Modify feature coming soon!', 'info');
    };

    return (
        <>
            <div ref={rowRef} className={isCelebrating ? 'celebrate-row' : ''}>
            {isEditing ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-10 flex items-center justify-center text-gray-400">{index + 1}</div>
                        <div className="w-1/6">
                            <input
                                type="text"
                                value={editValues.name || ''}
                                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                className="w-full px-2 py-1 bg-gray-800 rounded-sm text-white"
                                data-testid="beat-name-input"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={editValues.description || ''}
                                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                className="w-full px-2 py-1 bg-gray-800 rounded-sm text-white"
                                data-testid="beat-description-input"
                            />
                        </div>
                        <div className="w-16 flex items-center capitalize text-gray-400">{beat.type}</div>
                        <div className="w-24" />
                        <div className="w-24 flex justify-end items-center space-x-1">
                            <button onClick={saveEditing} className="text-green-500 hover:text-green-400" data-testid="save-beat-btn">
                                <Check className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEditing} className="text-red-500 hover:text-red-400" data-testid="cancel-edit-btn">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* AI Scene Suggestions in Edit Mode */}
                    {showSuggestions && selectedProject && (
                        <div className="ml-12 mr-32">
                            <BeatSceneSuggestions
                                beatId={beat.id}
                                beatName={editValues.name || beat.name}
                                beatDescription={editValues.description || beat.description}
                                projectId={selectedProject.id}
                                onAcceptSuggestion={handleAcceptSuggestion}
                                onRejectSuggestion={handleRejectSuggestion}
                                onModifySuggestion={handleModifySuggestion}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="w-10 flex items-center justify-center text-gray-400">{index + 1}</div>
                    <div className="w-1/6 flex items-center font-semibold">{beat.name}</div>
                    <div className="flex-1 flex items-center text-xs text-gray-400">{beat.description || '-'}</div>
                    <div className="w-16 flex items-center capitalize text-gray-400">{beat.type}</div>
                    <div className="w-24 flex justify-end items-center">
                        <input
                            ref={checkboxRef}
                            type="checkbox"
                            checked={beat.completed || false}
                            onChange={toggleCompletion}
                            data-testid="beat-completion-checkbox"
                            className={`w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 ${
                                isCelebrating ? 'celebrate-checkmark celebrate-glow' : ''
                            }`}
                        />
                    </div>
                    <div className="w-24 flex justify-end items-center space-x-1">
                        <button
                            onClick={startEditing}
                            className="text-blue-500 hover:text-blue-400"
                            data-testid="beat-edit-btn"
                            aria-label="Edit beat"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="text-red-500 hover:text-red-400"
                            data-testid="beat-delete-btn"
                            aria-label="Delete beat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={deleteBeat}
                    type="danger"
                    title="Delete Beat"
                    message={`Are you sure you want to delete "${beat.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    isLoading={isDeleting}
                />
            )}
        </>
    );
}

export default BeatsTableRow;


