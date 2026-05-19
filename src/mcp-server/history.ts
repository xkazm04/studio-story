/**
 * Story History — Git-like version control for narrative data.
 *
 * Every MCP mutation auto-creates a "story commit" capturing the entity diff.
 * Authors can branch, diff, merge, cherry-pick, and time-travel through
 * their narrative history.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────

export interface StoryBranch {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  parent_branch_id: string | null;
  fork_commit_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryCommit {
  id: string;
  project_id: string;
  branch_id: string;
  parent_commit_id: string | null;
  entity_table: string;
  entity_id: string;
  operation: 'insert' | 'update' | 'delete';
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  diff: Record<string, unknown> | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CommitDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export interface MergeConflict {
  entity_table: string;
  entity_id: string;
  field: string;
  source_value: unknown;
  target_value: unknown;
  base_value: unknown;
}

export interface MergeResult {
  merged_commits: number;
  conflicts: MergeConflict[];
  applied: StoryCommit[];
}

// Tables that are version-controlled
const TRACKED_TABLES = new Set([
  'characters', 'scenes', 'beats', 'acts', 'factions',
  'traits', 'character_relationships', 'scene_choices',
  'projects',
]);

// Fields to exclude from diffs (metadata, not narrative content)
const DIFF_EXCLUDE = new Set(['created_at', 'updated_at']);

// ─── Module State ───────────────────────────────────

let _client: SupabaseClient | null = null;

/** Branches cache: projectId → active branch id */
const _activeBranches = new Map<string, string>();

export function initHistory(client: SupabaseClient): void {
  _client = client;
}

function getClient(): SupabaseClient {
  if (!_client) throw new Error('History not initialized. Call initHistory() first.');
  return _client;
}

// ─── Branch Management ──────────────────────────────

/**
 * Get or create the "main" branch for a project.
 * Called lazily on first commit.
 */
export async function ensureMainBranch(projectId: string): Promise<string> {
  const cached = _activeBranches.get(projectId);
  if (cached) return cached;

  const client = getClient();

  // Check for existing active branch
  const { data: activeBranch } = await client
    .from('story_branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (activeBranch) {
    _activeBranches.set(projectId, activeBranch.id);
    return activeBranch.id;
  }

  // Check for existing "main" branch
  const { data: mainBranch } = await client
    .from('story_branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', 'main')
    .limit(1)
    .maybeSingle();

  if (mainBranch) {
    await client
      .from('story_branches')
      .update({ is_active: true })
      .eq('id', mainBranch.id);
    _activeBranches.set(projectId, mainBranch.id);
    return mainBranch.id;
  }

  // Create "main" branch
  const { data: newBranch, error } = await client
    .from('story_branches')
    .insert({
      project_id: projectId,
      name: 'main',
      description: 'Main storyline',
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[story-history] Failed to create main branch:', error.message);
    throw error;
  }

  _activeBranches.set(projectId, newBranch.id);
  return newBranch.id;
}

/**
 * Create a new story branch, optionally forking from a specific commit.
 */
export async function createStoryBranch(
  projectId: string,
  name: string,
  description?: string,
  fromCommitId?: string,
): Promise<StoryBranch> {
  const client = getClient();
  const parentBranchId = await ensureMainBranch(projectId);

  const { data, error } = await client
    .from('story_branches')
    .insert({
      project_id: projectId,
      name,
      description: description || null,
      parent_branch_id: parentBranchId,
      fork_commit_id: fromCommitId || null,
      is_active: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create branch: ${error.message}`);
  return data as StoryBranch;
}

/**
 * Switch active branch for a project.
 */
export async function checkoutBranch(projectId: string, branchName: string): Promise<StoryBranch> {
  const client = getClient();

  // Deactivate current
  await client
    .from('story_branches')
    .update({ is_active: false })
    .eq('project_id', projectId)
    .eq('is_active', true);

  // Activate target
  const { data, error } = await client
    .from('story_branches')
    .update({ is_active: true })
    .eq('project_id', projectId)
    .eq('name', branchName)
    .select()
    .single();

  if (error) throw new Error(`Branch "${branchName}" not found: ${error.message}`);

  _activeBranches.set(projectId, data.id);
  return data as StoryBranch;
}

/**
 * List all branches for a project.
 */
export async function listStoryBranches(projectId: string): Promise<StoryBranch[]> {
  const client = getClient();
  const { data, error } = await client
    .from('story_branches')
    .select()
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list branches: ${error.message}`);
  return (data || []) as StoryBranch[];
}

// ─── Auto-Commit ────────────────────────────────────

/**
 * Compute diff between before and after snapshots.
 */
export function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Record<string, { old: unknown; new: unknown }> | null {
  if (!before && !after) return null;
  if (!before) return null; // insert — full snapshot is the diff
  if (!after) return null;  // delete — full snapshot is the diff

  const diff: Record<string, { old: unknown; new: unknown }> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (DIFF_EXCLUDE.has(key)) continue;
    const oldVal = before[key];
    const newVal = after[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Generate a human-readable commit message from the operation.
 */
function autoMessage(
  operation: 'insert' | 'update' | 'delete',
  table: string,
  after: Record<string, unknown> | null,
  diff: Record<string, unknown> | null,
): string {
  const entityName = (after?.name as string) || (after?.label as string) || '';
  const singular = table.replace(/s$/, '');

  switch (operation) {
    case 'insert':
      return `Create ${singular}${entityName ? `: "${entityName}"` : ''}`;
    case 'update': {
      const fields = diff ? Object.keys(diff).join(', ') : 'fields';
      return `Update ${singular}${entityName ? ` "${entityName}"` : ''} (${fields})`;
    }
    case 'delete':
      return `Delete ${singular}${entityName ? `: "${entityName}"` : ''}`;
  }
}

/**
 * Record a story commit. Called automatically by the db wrapper.
 * Non-blocking: failures are logged but don't break the mutation.
 */
export async function recordCommit(
  projectId: string,
  table: string,
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  toolName?: string,
): Promise<StoryCommit | null> {
  if (!TRACKED_TABLES.has(table)) return null;

  try {
    const client = getClient();
    const branchId = await ensureMainBranch(projectId);
    const diff = computeDiff(before, after);
    const message = autoMessage(operation, table, after, diff);

    // Find parent commit (latest on this branch)
    const { data: parentRow } = await client
      .from('story_commits')
      .select('id')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await client
      .from('story_commits')
      .insert({
        project_id: projectId,
        branch_id: branchId,
        parent_commit_id: parentRow?.id || null,
        entity_table: table,
        entity_id: entityId,
        operation,
        before_snapshot: before,
        after_snapshot: after,
        diff,
        message,
        metadata: { tool: toolName || null },
      })
      .select()
      .single();

    if (error) {
      console.error('[story-history] Commit failed:', error.message);
      return null;
    }

    return data as StoryCommit;
  } catch (err) {
    console.error('[story-history] Commit error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Query ──────────────────────────────────────────

export async function listCommits(opts: {
  projectId: string;
  branchId?: string;
  entityTable?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}): Promise<StoryCommit[]> {
  const client = getClient();
  let query = client
    .from('story_commits')
    .select()
    .eq('project_id', opts.projectId)
    .order('created_at', { ascending: false });

  if (opts.branchId) query = query.eq('branch_id', opts.branchId);
  if (opts.entityTable) query = query.eq('entity_table', opts.entityTable);
  if (opts.entityId) query = query.eq('entity_id', opts.entityId);

  query = query.range(opts.offset || 0, (opts.offset || 0) + (opts.limit || 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list commits: ${error.message}`);
  return (data || []) as StoryCommit[];
}

export async function getCommit(commitId: string): Promise<StoryCommit> {
  const client = getClient();
  const { data, error } = await client
    .from('story_commits')
    .select()
    .eq('id', commitId)
    .single();

  if (error) throw new Error(`Commit not found: ${error.message}`);
  return data as StoryCommit;
}

// ─── Diff Between Commits ───────────────────────────

/**
 * Compare two commits and return field-level diffs.
 */
export async function diffCommits(
  commitIdA: string,
  commitIdB: string,
): Promise<CommitDiff[]> {
  const [a, b] = await Promise.all([getCommit(commitIdA), getCommit(commitIdB)]);

  const snapA = a.after_snapshot || a.before_snapshot || {};
  const snapB = b.after_snapshot || b.before_snapshot || {};

  const allKeys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);
  const diffs: CommitDiff[] = [];

  for (const key of allKeys) {
    if (DIFF_EXCLUDE.has(key)) continue;
    if (JSON.stringify(snapA[key]) !== JSON.stringify(snapB[key])) {
      diffs.push({ field: key, before: snapA[key], after: snapB[key] });
    }
  }

  return diffs;
}

// ─── Diff Between Branches ──────────────────────────

/**
 * Compare the latest state of an entity across two branches.
 */
export async function diffBranches(
  projectId: string,
  branchNameA: string,
  branchNameB: string,
): Promise<{ entity: string; diffs: CommitDiff[] }[]> {
  const client = getClient();

  const { data: branchA } = await client
    .from('story_branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', branchNameA)
    .single();

  const { data: branchB } = await client
    .from('story_branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', branchNameB)
    .single();

  if (!branchA || !branchB) throw new Error('One or both branches not found');

  // Get latest commit per entity on each branch
  const { data: commitsA } = await client
    .from('story_commits')
    .select()
    .eq('branch_id', branchA.id)
    .order('created_at', { ascending: false });

  const { data: commitsB } = await client
    .from('story_commits')
    .select()
    .eq('branch_id', branchB.id)
    .order('created_at', { ascending: false });

  // Build latest snapshot per entity
  const latestA = new Map<string, StoryCommit>();
  for (const c of (commitsA || []) as StoryCommit[]) {
    const key = `${c.entity_table}:${c.entity_id}`;
    if (!latestA.has(key)) latestA.set(key, c);
  }

  const latestB = new Map<string, StoryCommit>();
  for (const c of (commitsB || []) as StoryCommit[]) {
    const key = `${c.entity_table}:${c.entity_id}`;
    if (!latestB.has(key)) latestB.set(key, c);
  }

  const allEntities = new Set([...latestA.keys(), ...latestB.keys()]);
  const results: { entity: string; diffs: CommitDiff[] }[] = [];

  for (const entity of allEntities) {
    const commitA = latestA.get(entity);
    const commitB = latestB.get(entity);

    const snapA = commitA?.after_snapshot || {};
    const snapB = commitB?.after_snapshot || {};

    const allKeys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);
    const diffs: CommitDiff[] = [];

    for (const key of allKeys) {
      if (DIFF_EXCLUDE.has(key)) continue;
      if (JSON.stringify(snapA[key]) !== JSON.stringify(snapB[key])) {
        diffs.push({ field: key, before: snapA[key], after: snapB[key] });
      }
    }

    if (diffs.length > 0) {
      results.push({ entity, diffs });
    }
  }

  return results;
}

// ─── Cherry-Pick ────────────────────────────────────

/**
 * Apply a specific commit's changes to the current branch.
 */
export async function cherryPick(
  projectId: string,
  commitId: string,
): Promise<StoryCommit> {
  const client = getClient();
  const source = await getCommit(commitId);
  const branchId = await ensureMainBranch(projectId);

  if (source.operation === 'update' && source.after_snapshot) {
    // Apply the after_snapshot fields to the entity
    const { error: updateError } = await client
      .from(source.entity_table)
      .update(source.after_snapshot)
      .eq('id', source.entity_id);

    if (updateError) throw new Error(`Cherry-pick update failed: ${updateError.message}`);
  } else if (source.operation === 'insert' && source.after_snapshot) {
    const { error: insertError } = await client
      .from(source.entity_table)
      .upsert(source.after_snapshot);

    if (insertError) throw new Error(`Cherry-pick insert failed: ${insertError.message}`);
  } else if (source.operation === 'delete') {
    const { error: deleteError } = await client
      .from(source.entity_table)
      .delete()
      .eq('id', source.entity_id);

    if (deleteError) throw new Error(`Cherry-pick delete failed: ${deleteError.message}`);
  }

  // Record the cherry-pick as a new commit
  const { data: parentRow } = await client
    .from('story_commits')
    .select('id')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await client
    .from('story_commits')
    .insert({
      project_id: projectId,
      branch_id: branchId,
      parent_commit_id: parentRow?.id || null,
      entity_table: source.entity_table,
      entity_id: source.entity_id,
      operation: source.operation,
      before_snapshot: source.before_snapshot,
      after_snapshot: source.after_snapshot,
      diff: source.diff,
      message: `Cherry-pick: ${source.message || source.id}`,
      metadata: { cherry_picked_from: commitId },
    })
    .select()
    .single();

  if (error) throw new Error(`Cherry-pick commit failed: ${error.message}`);
  return data as StoryCommit;
}

// ─── Merge ──────────────────────────────────────────

/**
 * Merge source branch into target branch with conflict detection.
 * Returns conflicts that need manual resolution.
 */
export async function mergeBranch(
  projectId: string,
  sourceBranchName: string,
  targetBranchName?: string,
): Promise<MergeResult> {
  const client = getClient();

  // Resolve branches
  const { data: sourceBranch } = await client
    .from('story_branches')
    .select('id, fork_commit_id')
    .eq('project_id', projectId)
    .eq('name', sourceBranchName)
    .single();

  if (!sourceBranch) throw new Error(`Source branch "${sourceBranchName}" not found`);

  const targetBranch = targetBranchName
    ? (await client.from('story_branches').select('id').eq('project_id', projectId).eq('name', targetBranchName).single()).data
    : { id: await ensureMainBranch(projectId) };

  if (!targetBranch) throw new Error(`Target branch "${targetBranchName}" not found`);

  // Get all commits on source branch since fork
  let sourceQuery = client
    .from('story_commits')
    .select()
    .eq('branch_id', sourceBranch.id)
    .order('created_at', { ascending: true });

  if (sourceBranch.fork_commit_id) {
    const forkCommit = await getCommit(sourceBranch.fork_commit_id);
    sourceQuery = sourceQuery.gte('created_at', forkCommit.created_at);
  }

  const { data: sourceCommits } = await sourceQuery;
  if (!sourceCommits || sourceCommits.length === 0) {
    return { merged_commits: 0, conflicts: [], applied: [] };
  }

  // Check for conflicts: get latest target state for each affected entity
  const conflicts: MergeConflict[] = [];
  const applied: StoryCommit[] = [];

  for (const srcCommit of sourceCommits as StoryCommit[]) {
    // Get current state of entity on target branch
    const { data: targetLatest } = await client
      .from('story_commits')
      .select()
      .eq('branch_id', targetBranch.id)
      .eq('entity_table', srcCommit.entity_table)
      .eq('entity_id', srcCommit.entity_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (targetLatest && srcCommit.diff) {
      // Check field-level conflicts
      const targetSnap = (targetLatest as StoryCommit).after_snapshot || {};
      const baseSnap = srcCommit.before_snapshot || {};

      for (const [field, change] of Object.entries(srcCommit.diff as Record<string, { old: unknown; new: unknown }>)) {
        if (DIFF_EXCLUDE.has(field)) continue;
        const targetVal = targetSnap[field];
        const baseVal = baseSnap[field];

        // Conflict if target diverged from base AND source changed the same field
        if (
          JSON.stringify(targetVal) !== JSON.stringify(baseVal) &&
          JSON.stringify(targetVal) !== JSON.stringify(change.new)
        ) {
          conflicts.push({
            entity_table: srcCommit.entity_table,
            entity_id: srcCommit.entity_id,
            field,
            source_value: change.new,
            target_value: targetVal,
            base_value: baseVal,
          });
        }
      }
    }

    // If no conflicts for this commit, apply it
    const commitConflicts = conflicts.filter(
      c => c.entity_table === srcCommit.entity_table && c.entity_id === srcCommit.entity_id
    );
    if (commitConflicts.length === 0) {
      const picked = await cherryPick(projectId, srcCommit.id);
      applied.push(picked);
    }
  }

  return {
    merged_commits: applied.length,
    conflicts,
    applied,
  };
}

// ─── Time Travel ────────────────────────────────────

/**
 * Restore an entity to its state at a specific commit.
 * Creates a new commit recording the restoration.
 */
export async function timeTravelTo(
  projectId: string,
  commitId: string,
): Promise<{ restored: Record<string, unknown>; commit: StoryCommit }> {
  const client = getClient();
  const target = await getCommit(commitId);

  const snapshot = target.after_snapshot || target.before_snapshot;
  if (!snapshot) throw new Error('Commit has no snapshot to restore');

  // Get current state
  const { data: current } = await client
    .from(target.entity_table)
    .select()
    .eq('id', target.entity_id)
    .single();

  // Restore the entity to the commit's state (exclude id, created_at)
  const restoreFields = { ...snapshot };
  delete restoreFields.id;
  delete restoreFields.created_at;

  const { error } = await client
    .from(target.entity_table)
    .update(restoreFields)
    .eq('id', target.entity_id);

  if (error) throw new Error(`Time-travel restore failed: ${error.message}`);

  // Record as a new commit
  const commit = await recordCommit(
    projectId,
    target.entity_table,
    target.entity_id,
    'update',
    current as Record<string, unknown>,
    snapshot,
    'story_time_travel',
  );

  return { restored: snapshot, commit: commit! };
}

// ─── Helpers ────────────────────────────────────────

/**
 * Check if history tables are available (graceful degradation).
 */
export async function isHistoryAvailable(): Promise<boolean> {
  try {
    const client = getClient();
    const { error } = await client
      .from('story_branches')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
