---
phase: 07-story-data-and-authoring
plan: 04
subsystem: llm-composition
tags: [mcp, gemini, advisor, compose-workspace, story-authoring, relationship-map]

# Dependency graph
requires:
  - phase: 07-01
    provides: "Relationship map panel and MCP tools for characters/factions/relationships"
  - phase: 07-02
    provides: "Enhanced relationship map with faction clusters and visual encoding"
  - phase: 07-03
    provides: "Screenplay scene editor with distraction-free mode"
provides:
  - "Story authoring composition patterns in compose_workspace MCP tool description"
  - "Story authoring awareness in Gemini advisor tool declarations and system instruction"
  - "relationship-map panel type registered in MCP workspace tool"
  - "LLM guidance for when to use show vs replace actions"
  - "Layout selection rules for story authoring scenarios"
affects: [08-visual-production, 09-character-visual-consistency, 10-voice-audio]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LLM composition patterns: embed domain-specific guidance in tool descriptions"
    - "Dual-layer LLM teaching: MCP tool description + advisor system instruction"

key-files:
  created: []
  modified:
    - src/mcp-server/tools/workspace.ts
    - src/agents/advisorTools.ts
    - src/app/api/agents/advisor/route.ts

key-decisions:
  - "Story authoring patterns added as appendix section in PANEL_MANIFESTS constant rather than separate tool"
  - "relationship-map added to PANEL_TYPES array (was missing despite existing in panel registry)"
  - "Advisor route system instruction updated alongside advisorTools.ts for consistent dual-layer awareness"

patterns-established:
  - "Domain composition patterns: embed composition rules in both MCP tool descriptions and advisor system instructions for consistent behavior across Claude CLI and Gemini advisor"

requirements-completed: [STORY-01, STORY-02, STORY-03, STORY-04]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 7 Plan 4: LLM Composition Wiring Summary

**Story authoring composition patterns wired into compose_workspace MCP tool and Gemini advisor with relationship-map, scene-editor, story-map panel awareness**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T17:45:01Z
- **Completed:** 2026-03-14T17:49:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- compose_workspace MCP tool now teaches LLMs story authoring composition patterns for characters, scenes, story structure, and relationships
- Gemini advisor system instruction includes story authoring composition patterns with smart merge and layout selection guidance
- relationship-map panel type added to MCP PANEL_TYPES array and PANEL_MANIFESTS (was missing despite existing in registry)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update compose_workspace tool description with story authoring patterns** - `71facf1` (feat)
2. **Task 2: Update advisor tool declarations for story authoring** - `5b803ac` (feat)

## Files Created/Modified
- `src/mcp-server/tools/workspace.ts` - Added relationship-map to PANEL_TYPES/PANEL_MANIFESTS, added STORY AUTHORING COMPOSITION PATTERNS section with character/scene/story/relationship composition rules, updated compose_workspace description
- `src/agents/advisorTools.ts` - Updated compose_workspace and suggest_action descriptions with story authoring examples, added relationship-map to panel listing, added story authoring patterns section to ADVISOR_SYSTEM_INSTRUCTION
- `src/app/api/agents/advisor/route.ts` - Updated compose_workspace description with story authoring guidance, added relationship-map to panel types, added create_relationship CLI event mapping, added story authoring patterns to SYSTEM_INSTRUCTION

## Decisions Made
- Added story authoring patterns as appendix to existing PANEL_MANIFESTS constant rather than a separate tool -- keeps all composition guidance in one place for the LLM
- Fixed missing relationship-map in PANEL_TYPES (Rule 3 auto-fix) -- panel existed in registry but MCP tool didn't know about it
- Updated advisor route's SYSTEM_INSTRUCTION alongside advisorTools.ts to ensure both Gemini pathways (HTTP advisor and WebSocket live) have consistent story authoring awareness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing relationship-map to PANEL_TYPES array**
- **Found during:** Task 1 (compose_workspace tool description update)
- **Issue:** relationship-map panel existed in panelRegistry.ts but was not in the MCP workspace tool's PANEL_TYPES array, meaning the LLM couldn't compose it
- **Fix:** Added 'relationship-map' to the PANEL_TYPES const array
- **Files modified:** src/mcp-server/tools/workspace.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 71facf1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix -- without it the LLM could not compose the relationship-map panel via MCP. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 (Story Data & Authoring) is now complete with all 4 plans executed
- All story authoring panels are registered, wired, and the LLM knows how to compose them
- Ready for Phase 8 (Visual Production) which will build on the story structure and scene editor

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 07-story-data-and-authoring*
*Completed: 2026-03-14*
