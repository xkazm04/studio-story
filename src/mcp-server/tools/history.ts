/**
 * Story History Tools — Git-like version control for narrative data.
 *
 * Provides MCP tools for viewing commit logs, branching, diffing,
 * cherry-picking, merging, and time-traveling through story history.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import {
  listCommits,
  getCommit,
  diffCommits,
  diffBranches,
  createStoryBranch,
  listStoryBranches,
  checkoutBranch,
  cherryPick,
  mergeBranch,
  timeTravelTo,
  isHistoryAvailable,
} from '../history.js';
import { textContent, errorContent } from './helpers.js';

export function registerHistoryTools(server: McpServer, config: McpConfig) {

  // ─── Commit Log ─────────────────────────────────

  server.tool(
    'story_log',
    `View the story commit history — every mutation recorded as a commit with before/after snapshots. Filter by branch, entity type, or specific entity. Like "git log" for your narrative.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      branchId: z.string().optional().describe('Filter by branch UUID.'),
      entityTable: z.string().optional().describe('Filter by entity type: characters, scenes, beats, acts, factions, traits, scene_choices, character_relationships.'),
      entityId: z.string().optional().describe('Filter by specific entity UUID.'),
      limit: z.number().optional().describe('Max commits to return (default 20).'),
      offset: z.number().optional().describe('Skip N commits for pagination.'),
    },
    async ({ projectId, branchId, entityTable, entityId, limit, offset }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const commits = await listCommits({
          projectId: pid,
          branchId,
          entityTable,
          entityId,
          limit: limit || 20,
          offset,
        });

        const summary = commits.map(c => ({
          id: c.id,
          message: c.message,
          operation: c.operation,
          entity: `${c.entity_table}:${c.entity_id}`,
          branch_id: c.branch_id,
          created_at: c.created_at,
          diff_fields: c.diff ? Object.keys(c.diff) : null,
        }));

        return textContent(JSON.stringify(summary, null, 2));
      } catch (err) {
        return errorContent(`Failed to get log: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Show Commit ────────────────────────────────

  server.tool(
    'story_show',
    `Show full details of a specific story commit — including before/after snapshots and field-level diff. Like "git show <commit>".`,
    {
      commitId: z.string().describe('Commit UUID to inspect.'),
    },
    async ({ commitId }) => {
      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const commit = await getCommit(commitId);
        return textContent(JSON.stringify(commit, null, 2));
      } catch (err) {
        return errorContent(`Failed to show commit: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Diff Commits ───────────────────────────────

  server.tool(
    'story_diff',
    `Compare two commits or two branches side-by-side. Shows field-level diffs of narrative data. Use commitA+commitB for commit diff, or branchA+branchB for branch diff.`,
    {
      projectId: z.string().optional().describe('Project UUID. Required for branch diff.'),
      commitA: z.string().optional().describe('First commit UUID (for commit diff).'),
      commitB: z.string().optional().describe('Second commit UUID (for commit diff).'),
      branchA: z.string().optional().describe('First branch name (for branch diff).'),
      branchB: z.string().optional().describe('Second branch name (for branch diff).'),
    },
    async ({ projectId, commitA, commitB, branchA, branchB }) => {
      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        if (commitA && commitB) {
          const diffs = await diffCommits(commitA, commitB);
          return textContent(JSON.stringify({ type: 'commit_diff', diffs }, null, 2));
        }

        if (branchA && branchB) {
          const pid = projectId || config.projectId;
          if (!pid) return errorContent('projectId required for branch diff.');
          const diffs = await diffBranches(pid, branchA, branchB);
          return textContent(JSON.stringify({ type: 'branch_diff', diffs }, null, 2));
        }

        return errorContent('Provide either commitA+commitB or branchA+branchB.');
      } catch (err) {
        return errorContent(`Diff failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Branch Management ──────────────────────────

  server.tool(
    'story_branches',
    `List all story branches for a project, or create a new branch. Each branch is an alternative plotline that can be developed independently.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      action: z.enum(['list', 'create']).describe('"list" to show all branches, "create" to make a new one.'),
      name: z.string().optional().describe('Branch name (required for create). E.g. "what-if-villain-wins".'),
      description: z.string().optional().describe('Branch description.'),
      fromCommitId: z.string().optional().describe('Fork from this commit (default: latest on active branch).'),
    },
    async ({ projectId, action, name, description, fromCommitId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        if (action === 'list') {
          const branches = await listStoryBranches(pid);
          return textContent(JSON.stringify(branches, null, 2));
        }

        if (!name) return errorContent('Branch name required for create.');
        const branch = await createStoryBranch(pid, name, description, fromCommitId);
        return textContent(JSON.stringify(branch, null, 2));
      } catch (err) {
        return errorContent(`Branch operation failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Checkout ───────────────────────────────────

  server.tool(
    'story_checkout',
    `Switch the active story branch. All subsequent mutations will be recorded on the new branch. Like "git checkout <branch>".`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      branchName: z.string().describe('Branch name to switch to.'),
    },
    async ({ projectId, branchName }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const branch = await checkoutBranch(pid, branchName);
        return textContent(JSON.stringify({
          message: `Switched to branch "${branch.name}"`,
          branch,
        }, null, 2));
      } catch (err) {
        return errorContent(`Checkout failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Cherry-Pick ────────────────────────────────

  server.tool(
    'story_cherry_pick',
    `Apply a specific commit's changes to the current branch. Use to selectively copy narrative elements between plotlines. Like "git cherry-pick".`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      commitId: z.string().describe('Commit UUID to cherry-pick.'),
    },
    async ({ projectId, commitId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const commit = await cherryPick(pid, commitId);
        return textContent(JSON.stringify({
          message: `Cherry-picked commit ${commitId}`,
          new_commit: commit,
        }, null, 2));
      } catch (err) {
        return errorContent(`Cherry-pick failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Merge ──────────────────────────────────────

  server.tool(
    'story_merge',
    `Merge a story branch into the target branch (default: main). Detects conflicts where the same field was changed in both branches. Non-conflicting changes are applied automatically.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      sourceBranch: z.string().describe('Branch name to merge from.'),
      targetBranch: z.string().optional().describe('Branch name to merge into (default: current active branch).'),
    },
    async ({ projectId, sourceBranch, targetBranch }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const result = await mergeBranch(pid, sourceBranch, targetBranch);

        if (result.conflicts.length > 0) {
          return textContent(JSON.stringify({
            status: 'conflicts',
            message: `Merged ${result.merged_commits} commits, but ${result.conflicts.length} conflict(s) need resolution.`,
            conflicts: result.conflicts,
            applied_count: result.merged_commits,
          }, null, 2));
        }

        return textContent(JSON.stringify({
          status: 'clean',
          message: `Successfully merged ${result.merged_commits} commits from "${sourceBranch}".`,
          applied_count: result.merged_commits,
        }, null, 2));
      } catch (err) {
        return errorContent(`Merge failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );

  // ─── Time Travel ────────────────────────────────

  server.tool(
    'story_time_travel',
    `Restore an entity to its state at a specific commit. The entity's current data is overwritten with the historical snapshot, and a new commit records the restoration. Like "git checkout <commit> -- <file>".`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from config if omitted.'),
      commitId: z.string().describe('Commit UUID to restore entity state from.'),
    },
    async ({ projectId, commitId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available.');

      if (!(await isHistoryAvailable())) {
        return errorContent('Story history tables not found. Run the migration first.');
      }

      try {
        const result = await timeTravelTo(pid, commitId);
        return textContent(JSON.stringify({
          message: `Restored entity to state at commit ${commitId}`,
          restored_snapshot: result.restored,
          restore_commit: result.commit,
        }, null, 2));
      } catch (err) {
        return errorContent(`Time-travel failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  );
}
