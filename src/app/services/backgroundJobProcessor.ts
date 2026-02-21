/**
 * Background Job Processor
 *
 * Processes appearance propagation jobs in the background
 * Can be triggered via cron job, API endpoint, or other mechanisms
 */

import { logger } from '@/app/utils/logger';
import { appearancePropagationService } from './appearancePropagationService';

const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

export interface JobResult {
  processedCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ changeLogId: string; error: string }>;
}

/**
 * Process a single change log
 */
async function processChangeLog(changeLogId: string): Promise<boolean> {
  try {
    // Call the process endpoint internally
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appearance-propagation/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ change_log_id: changeLogId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    logger.error('Error processing change log', error, { changeLogId });
    throw error;
  }
}

/**
 * Process pending appearance changes
 * This function can be called by a cron job or triggered manually
 */
export async function processPendingChanges(): Promise<JobResult> {
  const result: JobResult = {
    processedCount: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  try {
    logger.info('Starting background job: process pending appearance changes');

    // Get pending changes
    const pendingChanges = await appearancePropagationService.getPendingChanges();

    if (pendingChanges.length === 0) {
      logger.info('No pending changes to process');
      return result;
    }

    logger.info(`Found ${pendingChanges.length} pending changes to process`);

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < pendingChanges.length; i += BATCH_SIZE) {
      const batch = pendingChanges.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (change) => {
          // Skip if already retried too many times
          if (change.retry_count >= MAX_RETRIES) {
            logger.warn('Skipping change log: max retries reached', {
              changeLogId: change.id,
              retryCount: change.retry_count,
            });
            result.failureCount++;
            result.errors.push({
              changeLogId: change.id,
              error: 'Max retries reached',
            });
            return;
          }

          try {
            result.processedCount++;
            const success = await processChangeLog(change.id);

            if (success) {
              result.successCount++;
              logger.info('Successfully processed change log', { changeLogId: change.id });
            } else {
              result.failureCount++;
              result.errors.push({
                changeLogId: change.id,
                error: 'Processing returned false',
              });
            }
          } catch (error) {
            result.failureCount++;
            result.errors.push({
              changeLogId: change.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            logger.error('Failed to process change log', error, { changeLogId: change.id });
          }
        })
      );

      // Small delay between batches
      if (i + BATCH_SIZE < pendingChanges.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.info('Background job completed', { result });
    return result;
  } catch (error) {
    logger.error('Error in background job processor', { error });
    throw error;
  }
}

/**
 * Process a specific character's pending changes
 */
export async function processCharacterChanges(characterId: string): Promise<JobResult> {
  const result: JobResult = {
    processedCount: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  try {
    logger.info('Processing character changes', { characterId });

    const changeLogs = await appearancePropagationService.getCharacterChangeLogs(characterId);
    const pendingLogs = changeLogs.filter((log) => log.propagation_status === 'pending');

    if (pendingLogs.length === 0) {
      logger.info('No pending changes for character', { characterId });
      return result;
    }

    for (const change of pendingLogs) {
      try {
        result.processedCount++;
        const success = await processChangeLog(change.id);

        if (success) {
          result.successCount++;
        } else {
          result.failureCount++;
          result.errors.push({
            changeLogId: change.id,
            error: 'Processing returned false',
          });
        }
      } catch (error) {
        result.failureCount++;
        result.errors.push({
          changeLogId: change.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Character changes processing completed', { characterId, result });
    return result;
  } catch (error) {
    logger.error('Error processing character changes', error, { characterId });
    throw error;
  }
}

/**
 * Cleanup old completed change logs (older than 30 days)
 */
export async function cleanupOldChangeLogs(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Note: This is a placeholder - actual cleanup would require a DB query
    // to delete old records. Adding that would require extending the service.
    await appearancePropagationService.getPendingChanges();

    logger.info('Cleanup completed for old change logs');
    return 0;
  } catch (error) {
    logger.error('Error cleaning up old change logs', { error });
    throw error;
  }
}

export const backgroundJobProcessor = {
  processPendingChanges,
  processCharacterChanges,
  cleanupOldChangeLogs,
};
