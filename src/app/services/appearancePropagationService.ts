/**
 * Appearance Propagation Service
 *
 * Watches for appearance changes and propagates them to story elements
 * Handles background processing of appearance updates across scenes, beats, and character bios
 */

import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/app/utils/logger';

export interface AppearanceChangeLog {
  id: string;
  character_id: string;
  project_id: string;
  changed_fields: string[];
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  propagation_status: 'pending' | 'processing' | 'completed' | 'failed';
  propagation_started_at?: string;
  propagation_completed_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface PropagationTarget {
  id: string;
  change_log_id: string;
  character_id: string;
  target_type: 'scene' | 'beat' | 'character_bio' | 'dialogue';
  target_id?: string;
  status: 'pending' | 'completed' | 'failed';
  original_content?: string;
  updated_content?: string;
  applied: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get pending appearance changes that need propagation
 */
export async function getPendingChanges(): Promise<AppearanceChangeLog[]> {
  try {
    const { data, error } = await supabaseServer
      .from('appearance_change_log')
      .select('*')
      .eq('propagation_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      logger.error('Error fetching pending appearance changes', error);
      throw error;
    }

    return data as AppearanceChangeLog[];
  } catch (error) {
    logger.error('Error in getPendingChanges', error);
    throw error;
  }
}

/**
 * Get all change logs for a character
 */
export async function getCharacterChangeLogs(characterId: string): Promise<AppearanceChangeLog[]> {
  try {
    const { data, error } = await supabaseServer
      .from('appearance_change_log')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching character change logs', error);
      throw error;
    }

    return data as AppearanceChangeLog[];
  } catch (error) {
    logger.error('Error in getCharacterChangeLogs', error);
    throw error;
  }
}

/**
 * Update propagation status
 */
export async function updatePropagationStatus(
  changeLogId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      propagation_status: status,
    };

    if (status === 'processing') {
      updateData.propagation_started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updateData.propagation_completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabaseServer
      .from('appearance_change_log')
      .update(updateData)
      .eq('id', changeLogId);

    if (error) {
      logger.error('Error updating propagation status', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in updatePropagationStatus', error);
    throw error;
  }
}

/**
 * Increment retry count for a change log
 */
export async function incrementRetryCount(changeLogId: string): Promise<void> {
  try {
    const { data, error: fetchError } = await supabaseServer
      .from('appearance_change_log')
      .select('retry_count')
      .eq('id', changeLogId)
      .single();

    if (fetchError) {
      logger.error('Error fetching retry count', fetchError);
      throw fetchError;
    }

    const { error: updateError } = await supabaseServer
      .from('appearance_change_log')
      .update({ retry_count: (data.retry_count || 0) + 1 })
      .eq('id', changeLogId);

    if (updateError) {
      logger.error('Error incrementing retry count', updateError);
      throw updateError;
    }
  } catch (error) {
    logger.error('Error in incrementRetryCount', error);
    throw error;
  }
}

/**
 * Find story elements that reference a character
 * These are the targets for propagation
 */
export async function findPropagationTargets(
  characterId: string,
  projectId: string
): Promise<Array<{ type: string; id: string; content: string }>> {
  const targets: Array<{ type: string; id: string; content: string }> = [];

  try {
    // Find scenes that mention the character
    const { data: scenes, error: scenesError } = await supabaseServer
      .from('scenes')
      .select('id, description')
      .eq('project_id', projectId)
      .or(`description.ilike.%${characterId}%`);

    if (!scenesError && scenes) {
      scenes.forEach((scene) => {
        targets.push({
          type: 'scene',
          id: scene.id,
          content: scene.description || '',
        });
      });
    }

    // Find beats that mention the character
    const { data: beats, error: beatsError } = await supabaseServer
      .from('beats')
      .select('id, description')
      .eq('project_id', projectId)
      .or(`description.ilike.%${characterId}%`);

    if (!beatsError && beats) {
      beats.forEach((beat) => {
        targets.push({
          type: 'beat',
          id: beat.id,
          content: beat.description || '',
        });
      });
    }

    // Find character bio/traits
    const { data: traits, error: traitsError } = await supabaseServer
      .from('character_traits')
      .select('id, description')
      .eq('character_id', characterId);

    if (!traitsError && traits) {
      traits.forEach((trait) => {
        targets.push({
          type: 'character_bio',
          id: trait.id,
          content: trait.description || '',
        });
      });
    }

    return targets;
  } catch (error) {
    logger.error('Error finding propagation targets', error);
    throw error;
  }
}

/**
 * Create propagation targets for a change log
 */
export async function createPropagationTargets(
  changeLogId: string,
  characterId: string,
  targets: Array<{ type: string; id: string; content: string }>
): Promise<void> {
  try {
    const targetRecords = targets.map((target) => ({
      change_log_id: changeLogId,
      character_id: characterId,
      target_type: target.type,
      target_id: target.id,
      original_content: target.content,
      status: 'pending',
      applied: false,
    }));

    if (targetRecords.length === 0) {
      return;
    }

    const { error } = await supabaseServer
      .from('appearance_propagation_targets')
      .insert(targetRecords);

    if (error) {
      logger.error('Error creating propagation targets', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in createPropagationTargets', error);
    throw error;
  }
}

/**
 * Get propagation targets for a change log
 */
export async function getPropagationTargets(changeLogId: string): Promise<PropagationTarget[]> {
  try {
    const { data, error } = await supabaseServer
      .from('appearance_propagation_targets')
      .select('*')
      .eq('change_log_id', changeLogId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching propagation targets', error);
      throw error;
    }

    return data as PropagationTarget[];
  } catch (error) {
    logger.error('Error in getPropagationTargets', error);
    throw error;
  }
}

/**
 * Update a propagation target with new content
 */
export async function updatePropagationTarget(
  targetId: string,
  updatedContent: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('appearance_propagation_targets')
      .update({
        updated_content: updatedContent,
        status,
      })
      .eq('id', targetId);

    if (error) {
      logger.error('Error updating propagation target', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in updatePropagationTarget', error);
    throw error;
  }
}

/**
 * Apply a propagation target update to the actual story element
 */
export async function applyPropagationTarget(targetId: string): Promise<void> {
  try {
    const { data: target, error: fetchError } = await supabaseServer
      .from('appearance_propagation_targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (fetchError || !target) {
      logger.error('Error fetching propagation target', fetchError);
      throw fetchError;
    }

    if (!target.updated_content || target.applied) {
      return;
    }

    // Apply the update based on target type
    let updateError;
    switch (target.target_type) {
      case 'scene':
        ({ error: updateError } = await supabaseServer
          .from('scenes')
          .update({ description: target.updated_content })
          .eq('id', target.target_id));
        break;

      case 'beat':
        ({ error: updateError } = await supabaseServer
          .from('beats')
          .update({ description: target.updated_content })
          .eq('id', target.target_id));
        break;

      case 'character_bio':
        ({ error: updateError } = await supabaseServer
          .from('character_traits')
          .update({ description: target.updated_content })
          .eq('id', target.target_id));
        break;
    }

    if (updateError) {
      logger.error('Error applying propagation target update', updateError);
      throw updateError;
    }

    // Mark as applied
    const { error: markError } = await supabaseServer
      .from('appearance_propagation_targets')
      .update({ applied: true })
      .eq('id', targetId);

    if (markError) {
      logger.error('Error marking propagation target as applied', markError);
      throw markError;
    }
  } catch (error) {
    logger.error('Error in applyPropagationTarget', error);
    throw error;
  }
}

/**
 * Get character appearance data
 */
export async function getCharacterAppearance(characterId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('char_appearance')
      .select('*')
      .eq('character_id', characterId)
      .single();

    if (error) {
      logger.error('Error fetching character appearance', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error in getCharacterAppearance', error);
    return null;
  }
}

/**
 * Get character details
 */
export async function getCharacterDetails(characterId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (error) {
      logger.error('Error fetching character details', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error in getCharacterDetails', error);
    return null;
  }
}

export const appearancePropagationService = {
  getPendingChanges,
  getCharacterChangeLogs,
  updatePropagationStatus,
  incrementRetryCount,
  findPropagationTargets,
  createPropagationTargets,
  getPropagationTargets,
  updatePropagationTarget,
  applyPropagationTarget,
  getCharacterAppearance,
  getCharacterDetails,
};
