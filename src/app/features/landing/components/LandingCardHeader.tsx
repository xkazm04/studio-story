'use client';

import { useRef, useState, useEffect } from "react";
import { Project } from "@/app/types/Project";
import { projectApi } from "@/app/hooks/integration/useProjects";
import { Trash2 } from "lucide-react";

type Props = {
    project: Project;
    isRenaming: boolean;
    setIsRenaming: (isRenaming: boolean) => void;
    setShowOverlay: (showOverlay: boolean) => void;
    onUpdate: () => void;
}

const LandingCardHeader = ({ project, isRenaming, setIsRenaming, setShowOverlay, onUpdate }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newName, setNewName] = useState(project.name);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const deleteProjectMutation = projectApi.useDeleteProject();

    const handleRename = async () => {
        if (newName.trim() && newName !== project.name) {
            // TODO: Implement rename mutation
            console.log('Rename to:', newName);
        }
        setIsRenaming(false);
    };

    const handleDelete = () => {
        deleteProjectMutation.mutate(project.id, {
            onSuccess: () => {
                onUpdate();
                setShowOverlay(false);
                setIsRenaming(false);
                setShowDeleteModal(false);
            }
        });
    };

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    return <>
        <div className="flex justify-between items-center mb-6">
        {isRenaming ? (
            <div className="flex items-center w-full">
                <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-gray-800/70 text-white px-3 py-2 rounded-md w-full border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') {
                            setIsRenaming(false);
                            setNewName(project.name);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRename();
                    }}
                    className="ml-2 text-blue-400 hover:opacity-80 transition-opacity"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
            </div>
        ) : (
            <h3 className="text-xl font-semibold text-white">{project.name}</h3>
        )}

        <div className="flex space-x-2">
            {!isRenaming && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsRenaming(true);
                        }}
                        className="p-2 rounded-full transition-all duration-200 hover:bg-gray-700/30 group"
                        title="Rename Project"
                        data-testid={`rename-project-btn-${project.id}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 group-hover:scale-110 transition-transform">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>

                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-full transition-all duration-200 hover:bg-gray-700/30 group"
                        title="Delete Project"
                        data-testid={`delete-project-btn-${project.id}`}
                    >
                        <Trash2 className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowOverlay(false);
                    setIsRenaming(false);
                }}
                className="p-2 rounded-full hover:bg-gray-700/30 transition-all duration-200 group"
                title="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:scale-110 transition-transform">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    </div>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteModal(false)} data-testid="delete-confirmation-modal">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold text-white mb-4">Delete Project</h3>
                <p className="text-gray-300 mb-6">
                    Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(false);
                        }}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        data-testid="cancel-delete-btn"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        data-testid="confirm-delete-btn"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
}

export default LandingCardHeader;

