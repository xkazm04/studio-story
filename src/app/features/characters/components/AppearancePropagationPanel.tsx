/**
 * Appearance Propagation Panel
 *
 * Shows the status of appearance changes and allows users to review/apply updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppearancePropagation } from '@/app/hooks/useAppearancePropagation';
import { Card } from '@/app/components/UI/Card';
import { Button } from '@/app/components/UI/Button';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, Check } from 'lucide-react';

interface AppearancePropagationPanelProps {
  characterId: string;
}

export function AppearancePropagationPanel({ characterId }: AppearancePropagationPanelProps) {
  const {
    isProcessing,
    propagationStatus,
    targets,
    getPendingChanges,
    getPropagationTargets,
    applySingleUpdate,
    applyUpdates,
  } = useAppearancePropagation();

  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPendingChanges();
  }, [characterId]);

  const loadPendingChanges = async () => {
    try {
      setIsLoading(true);
      const changes = await getPendingChanges(characterId);
      setPendingChanges(changes);

      // Load targets for the first pending change
      if (changes.length > 0) {
        await getPropagationTargets(changes[0].id);
      }
    } catch (error) {
      console.error('Error loading pending changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTarget = (targetId: string) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(targetId)) {
      newSelected.delete(targetId);
    } else {
      newSelected.add(targetId);
    }
    setSelectedTargets(newSelected);
  };

  const handleApplySelected = async () => {
    if (selectedTargets.size === 0) return;

    try {
      await applyUpdates(Array.from(selectedTargets));
      setSelectedTargets(new Set());
      await loadPendingChanges();
    } catch (error) {
      console.error('Error applying updates:', error);
    }
  };

  const handleApplySingle = async (targetId: string) => {
    try {
      await applySingleUpdate(targetId);
      await loadPendingChanges();
    } catch (error) {
      console.error('Error applying update:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" data-testid="status-completed-icon" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" data-testid="status-failed-icon" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" data-testid="status-processing-icon" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-400" data-testid="status-pending-icon" />;
    }
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      scene: 'Scene',
      beat: 'Beat',
      character_bio: 'Character Bio',
      dialogue: 'Dialogue',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center" data-testid="loading-indicator">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="ml-2 text-sm text-gray-400">Loading propagation status...</span>
        </div>
      </Card>
    );
  }

  if (pendingChanges.length === 0 && targets.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-gray-400" data-testid="no-changes-message">
          No pending appearance changes to propagate.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Appearance Propagation</h3>
          {selectedTargets.size > 0 && (
            <Button
              onClick={handleApplySelected}
              className="flex items-center gap-2"
              data-testid="apply-selected-btn"
            >
              <Check className="h-4 w-4" />
              Apply {selectedTargets.size} Updates
            </Button>
          )}
        </div>

        {/* Pending Changes Summary */}
        {pendingChanges.length > 0 && (
          <div className="space-y-2" data-testid="pending-changes-summary">
            <h4 className="text-sm font-medium text-gray-300">Pending Changes</h4>
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3"
                data-testid={`change-${change.id}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(change.propagation_status)}
                  <div>
                    <p className="text-sm text-white">
                      {change.changed_fields?.length || 0} fields changed
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(change.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase">
                  {change.propagation_status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Propagation Targets */}
        {targets.length > 0 && (
          <div className="space-y-3" data-testid="propagation-targets">
            <h4 className="text-sm font-medium text-gray-300">Story Elements to Update</h4>
            {targets.map((target) => (
              <div
                key={target.id}
                className="rounded-lg border border-gray-700 bg-gray-800/30 p-4 space-y-3"
                data-testid={`target-${target.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTargets.has(target.id)}
                      onChange={() => handleToggleTarget(target.id)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                      data-testid={`target-checkbox-${target.id}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getTargetTypeLabel(target.target_type)}
                      </p>
                      {target.applied && (
                        <span className="text-xs text-green-400">Applied</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowDetails(showDetails === target.id ? null : target.id)
                      }
                      data-testid={`view-details-btn-${target.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!target.applied && target.updated_content && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApplySingle(target.id)}
                        data-testid={`apply-btn-${target.id}`}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Panel */}
                {showDetails === target.id && (
                  <div className="mt-3 space-y-3 border-t border-gray-700 pt-3">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Original:</p>
                      <p className="text-sm text-gray-300 bg-gray-900/50 rounded p-2">
                        {target.original_content}
                      </p>
                    </div>
                    {target.updated_content && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-1">Updated:</p>
                        <p className="text-sm text-white bg-blue-900/20 rounded p-2">
                          {target.updated_content}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-400" data-testid="processing-indicator">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing appearance changes...
          </div>
        )}

        {propagationStatus && propagationStatus.status === 'completed' && (
          <div className="rounded-lg bg-green-900/20 border border-green-700 p-3" data-testid="success-message">
            <p className="text-sm text-green-400">
              Successfully processed {propagationStatus.successCount} out of{' '}
              {propagationStatus.targetsProcessed} targets
            </p>
          </div>
        )}

        {propagationStatus && propagationStatus.status === 'failed' && (
          <div className="rounded-lg bg-red-900/20 border border-red-700 p-3" data-testid="error-message">
            <p className="text-sm text-red-400">
              {propagationStatus.error || 'Failed to process appearance changes'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
