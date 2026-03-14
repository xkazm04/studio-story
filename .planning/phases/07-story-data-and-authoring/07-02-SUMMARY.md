---
phase: 07-story-data-and-authoring
plan: 02
subsystem: ui
tags: [reactflow, convex-hull, relationship-map, faction-clusters, svg]

# Dependency graph
requires:
  - phase: 07-01
    provides: MCP tools for relationships and factions, ReactFlow base map
provides:
  - Convex hull faction cluster visualization on relationship map
  - Sentiment-based edge coloring (green/red/gray) and type line styles (solid/dashed/dotted)
  - Enriched character nodes with name, role, and faction color border
  - Read-only relationship map (view + chat to edit)
affects: [08-visual-design, 09-character-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns: [graham-scan-convex-hull, sentiment-edge-styling, reactive-viewport-overlay]

key-files:
  created:
    - src/app/features/relationships/lib/factionClusters.ts
  modified:
    - src/app/features/relationships/components/RelationshipEdge.tsx
    - src/app/features/relationships/components/CharacterNode.tsx
    - src/app/features/relationships/components/FactionNode.tsx
    - src/app/features/relationships/components/RelationshipMapCanvas.tsx
    - src/app/features/relationships/RelationshipMap.tsx

key-decisions:
  - "Graham scan inline instead of d3-shape dependency for convex hull of <20 points"
  - "useViewport hook for reactive SVG overlay tracking during pan/zoom"
  - "Faction color derived from faction.color, branding.primary_color, or FACTION_COLOR_PALETTE fallback"
  - "Clusters require 2+ members; <3 use padded bounding rectangle, 3+ use convex hull"

patterns-established:
  - "Sentiment color mapping: positive=green, negative=red, neutral=gray for relationship edges"
  - "Line style mapping: solid=ally/friend/family/mentor, dashed=rival/enemy, dotted=romantic/neutral/unknown/business"
  - "Read-only map pattern: nodesConnectable=false, no onConnect handler, no inline edit UI"

requirements-completed: [STORY-03]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 7 Plan 2: Relationship Map Enhancement Summary

**Convex hull faction clusters, sentiment-colored edges, and enriched character nodes on read-only ReactFlow map**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T17:26:01Z
- **Completed:** 2026-03-14T17:31:05Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Faction clusters render as convex hull SVG backgrounds with labels when 2+ characters share a faction
- Edge colors use green for positive (ally/friend/family/romantic/mentor), red for negative (enemy/rival), gray for neutral
- Edge line styles use solid for allies/friends/family/mentor, dashed for rivals/enemies, dotted for others
- Character nodes show name, role/type label, and faction color left border
- Map is read-only with pan/zoom navigation, no inline editing UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create faction cluster computation and enhance edge styling** - `a2a44e7` (feat)
2. **Task 2: Enhance nodes and wire faction clusters into the map canvas** - `2411855` (feat)

## Files Created/Modified
- `src/app/features/relationships/lib/factionClusters.ts` - Graham scan convex hull computation, faction color palette, cluster labeling
- `src/app/features/relationships/components/RelationshipEdge.tsx` - Sentiment color + type line style, hover glow, no text labels
- `src/app/features/relationships/components/CharacterNode.tsx` - Compact card with name, role, faction color border
- `src/app/features/relationships/components/FactionNode.tsx` - Semi-transparent labeled anchor node
- `src/app/features/relationships/components/RelationshipMapCanvas.tsx` - Cluster overlay with reactive viewport tracking, enriched nodes
- `src/app/features/relationships/RelationshipMap.tsx` - Faction data passthrough, factionColorMap construction, removed editing controls

## Decisions Made
- Used Graham scan inline (~30 lines) instead of adding d3-shape dependency for trivial point sets
- Used `useViewport` hook for reactive SVG cluster overlay that tracks pan/zoom
- Faction color resolution chain: faction.color -> branding.primary_color -> FACTION_COLOR_PALETTE[index]
- Clusters only rendered for factions with 2+ members; <3 uses padded bounding rectangle, 3+ uses convex hull with 60px expansion
- Removed force layout toggle button and inline editing UI from map per CONTEXT.md "view + chat to edit" decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ClusterOverlay viewport reactivity**
- **Found during:** Task 2
- **Issue:** Initial implementation used `getViewport()` which only returns current value at render time, not reactive to pan/zoom
- **Fix:** Switched to `useViewport()` hook which reactively updates the SVG transform on every viewport change
- **Files modified:** src/app/features/relationships/components/RelationshipMapCanvas.tsx
- **Verification:** TypeScript compiles, viewport import changed from useReactFlow to useViewport
- **Committed in:** 2411855 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for correct visual behavior during pan/zoom. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Relationship map now shows faction dynamics at a glance with visual intelligence
- Ready for remaining Phase 7 plans (story authoring, script editing)
- Character nodes and edges follow CONTEXT.md visual language consistently

## Self-Check: PASSED

All files exist. All commits verified. Key patterns (computeFactionClusters, strokeDasharray, faction color border, nodesConnectable=false, no d3) confirmed.

---
*Phase: 07-story-data-and-authoring*
*Completed: 2026-03-14*
