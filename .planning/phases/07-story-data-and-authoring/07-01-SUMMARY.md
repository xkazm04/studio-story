---
phase: 07-story-data-and-authoring
plan: 01
subsystem: api
tags: [mcp, supabase, project-schema, relationship-map, panel-registry, query-invalidation]

requires:
  - phase: 06-llm-integration
    provides: MCP server with direct Supabase access, workspace panel system with manifests

provides:
  - Project schema with premise, genre, setting fields
  - create_project and update_project MCP tools
  - create_relationship MCP tool for character_relationships
  - relationship-map workspace panel type with manifest
  - Expanded query invalidation map for project and relationship mutations

affects: [07-02, 07-03, 07-04, story-authoring, character-relationships]

tech-stack:
  added: []
  patterns:
    - MCP tool with default user_id for service-role project creation
    - Panel wrapper with React.lazy for existing feature components

key-files:
  created:
    - src/workspace/panels/character/RelationshipMapPanel.tsx
  modified:
    - src/app/types/Project.ts
    - src/lib/supabase/database.types.ts
    - src/mcp-server/tools/projects.ts
    - src/mcp-server/tools/characters.ts
    - src/mcp-server/tools/scenes.ts
    - src/mcp-server/index.ts
    - src/mcp-server/tools/index.ts
    - src/workspace/types.ts
    - src/workspace/engine/panelRegistry.ts
    - src/manifest/panelManifests.ts
    - src/workspace/hooks/useCLIDataSync.ts

key-decisions:
  - "Default MCP user_id (00000000-...) for create_project since MCP config has no userId concept"
  - "create_relationship uses character_relationships table (not relationships) matching actual DB schema"
  - "RelationshipMapPanel uses React.lazy for existing RelationshipMap component"

patterns-established:
  - "MCP tools that create entities with NOT NULL user_id use a default UUID constant"
  - "Panel wrappers for existing feature components use React.lazy + Suspense"

requirements-completed: [STORY-01, STORY-02, STORY-03]

duration: 5min
completed: 2026-03-14
---

# Phase 7 Plan 1: Story Data Foundations Summary

**Project schema extended with premise/genre/setting, three new MCP tools (create_project, update_project, create_relationship), and relationship-map panel registered with manifest for LLM composition**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T17:17:40Z
- **Completed:** 2026-03-14T17:22:53Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Extended Project interface and database types with premise, genre, setting fields for conversation-driven project creation
- Added create_project, update_project, and create_relationship MCP tools following established patterns
- Registered relationship-map as a first-class workspace panel with full manifest and density support
- Expanded TOOL_INVALIDATION_MAP to cover all new mutation tools

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Project schema and database types** - `81125c3` (feat)
2. **Task 2: Add missing MCP tools and query invalidation** - `6d6b763` (feat)
3. **Task 3: Register relationship-map panel type with manifest** - `71d9362` (feat)

## Files Created/Modified
- `src/app/types/Project.ts` - Added premise, genre, setting optional fields
- `src/lib/supabase/database.types.ts` - Added premise, genre, setting to projects Row/Insert/Update
- `src/mcp-server/tools/projects.ts` - Added create_project and update_project tools
- `src/mcp-server/tools/characters.ts` - Added create_relationship tool
- `src/mcp-server/tools/scenes.ts` - Fixed list_relationships table name to character_relationships
- `src/mcp-server/index.ts` - Updated tool documentation and instructions
- `src/mcp-server/tools/index.ts` - Updated tool registry list
- `src/workspace/types.ts` - Added relationship-map to WorkspacePanelType union
- `src/workspace/engine/panelRegistry.ts` - Added relationship-map registry entry with Network icon
- `src/manifest/panelManifests.ts` - Added relationship-map manifest with density modes
- `src/workspace/panels/character/RelationshipMapPanel.tsx` - New panel wrapping existing RelationshipMap
- `src/workspace/hooks/useCLIDataSync.ts` - Added project and relationship invalidation entries

## Decisions Made
- Used a default UUID (`00000000-0000-0000-0000-000000000000`) for MCP-created projects since the MCP config has no userId concept and the column is NOT NULL
- create_relationship inserts into `character_relationships` table (matching actual DB schema) rather than the non-existent `relationships` table
- RelationshipMapPanel uses React.lazy to avoid bundling the heavy ReactFlow component eagerly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed list_relationships table name**
- **Found during:** Task 2 (create_relationship implementation)
- **Issue:** Existing list_relationships tool queried `relationships` table which does not exist; actual table is `character_relationships`
- **Fix:** Updated both dbSelect calls in scenes.ts to use `character_relationships`
- **Files modified:** src/mcp-server/tools/scenes.ts
- **Verification:** MCP server tsconfig compiles clean
- **Committed in:** 6d6b763 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was necessary for correctness. The list_relationships tool was non-functional before this fix. No scope creep.

## Issues Encountered
None

## User Setup Required
Database migration required: Add `premise TEXT`, `genre TEXT`, `setting TEXT` columns to the `projects` table in Supabase. These are nullable columns so existing data is unaffected.

## Next Phase Readiness
- Project schema ready for Plans 02-04 to build story authoring features
- MCP tools ready for LLM-driven project and relationship creation
- relationship-map panel available for LLM workspace composition
- Query invalidation ensures UI refreshes on all new mutations

---
*Phase: 07-story-data-and-authoring*
*Completed: 2026-03-14*
