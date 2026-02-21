/**
 * Appearance Propagation Indicator
 *
 * Simple indicator showing if there are pending appearance changes
 * Can be integrated into character details or appearance editor
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppearancePropagation } from '@/app/hooks/useAppearancePropagation';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/UI/Button';

interface AppearancePropagationIndicatorProps {
  characterId: string;
  onViewDetails?: () => void;
}

export function AppearancePropagationIndicator({
  characterId,
  onViewDetails,
}: AppearancePropagationIndicatorProps) {
  const { triggerPropagation, getPendingChanges } = useAppearancePropagation();
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    checkPendingChanges();
  }, [characterId]);

  const checkPendingChanges = async () => {
    try {
      const changes = await getPendingChanges(characterId);
      const pending = changes.filter((c: any) => c.propagation_status === 'pending');
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  };

  const handleTriggerPropagation = async () => {
    if (pendingCount === 0) return;

    try {
      setIsProcessing(true);
      const changes = await getPendingChanges(characterId);
      const pending = changes.filter((c: any) => c.propagation_status === 'pending');

      if (pending.length > 0) {
        await triggerPropagation(pending[0].id);
        setLastUpdate(new Date());
        await checkPendingChanges();
      }
    } catch (error) {
      console.error('Error triggering propagation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingCount === 0 && !lastUpdate) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-green-400"
        data-testid="propagation-status-ok"
      >
        <CheckCircle className="h-4 w-4" />
        <span>Appearance changes synced</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {pendingCount > 0 && (
        <div
          className="flex items-center gap-2 text-xs text-yellow-400"
          data-testid="propagation-status-pending"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {lastUpdate && (
        <div className="text-xs text-gray-400" data-testid="last-update-time">
          Last synced: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTriggerPropagation}
            disabled={isProcessing}
            className="flex items-center gap-1"
            data-testid="trigger-propagation-btn"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="text-xs">Sync Now</span>
          </Button>
        )}

        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-xs"
            data-testid="view-details-btn"
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}
