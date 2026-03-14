---
phase: 05-jinn-intent-and-director
plan: 02
subsystem: intent-system
tags: [intent, resize, queue, hooks, react, useSyncExternalStore, density-hysteresis, conflict-resolution, dzin-core, typescript]

# Dependency graph
requires:
  - phase: 05-jinn-intent-and-director
    plan: 01
    provides: Intent types, createDirector, createIntentBus, NEEDS_LLM sentinel, handler factories
  - phase: 02-jinn-layout-engine
    provides: assignSlotDensity, parseGridFractions, PanelDefinition
  - phase: 03-jinn-state-and-streaming
    provides: acquireUserLock, releaseUserLock, StateEngine, WorkspaceState
provides:
  - computeResize pure function for edge-drag grid fraction recomputation with density hysteresis
  - initResizeState for capturing drag start state
  - createIntentQueue for buffering LLM intents during user manipulation with conflict-aware drain
  - IntentProvider context wrapper and useIntent hook with useSyncExternalStore
  - Complete intent module barrel export and @dzin/core public API surface
affects: [05-03, 06-llm-transport, 07-studio-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [resize-hysteresis, intent-queue-buffering, conflict-aware-drain, react-context-intent-provider]

key-files:
  created:
    - packages/dzin/core/src/intent/resize.ts
    - packages/dzin/core/src/intent/queue.ts
    - packages/dzin/core/src/intent/hooks.tsx
    - packages/dzin/core/src/intent/__tests__/resize.test.ts
    - packages/dzin/core/src/intent/__tests__/queue.test.ts
    - packages/dzin/core/src/intent/__tests__/hooks.test.tsx
    - packages/dzin/core/src/intent/__tests__/integration.test.ts
  modified:
    - packages/dzin/core/src/intent/index.ts
    - packages/dzin/core/src/index.ts

key-decisions:
  - "hooks.tsx uses .tsx extension (not .ts) because JSX in IntentProvider requires esbuild JSX transform"
  - "computeResize works in pixel space during drag and converts to fractions once per call to avoid cumulative drift"
  - "Density hysteresis tracks densityChangePx and requires 20px buffer before allowing another density change"
  - "IntentQueue.startBuffering optionally captures initial WorkspaceState snapshot for conflict detection on drain"
  - "Queue conflict detection compares panel density and slotIndex between buffer-start snapshot and drain-time state"

patterns-established:
  - "Resize hysteresis: track last density change position, require buffer distance before re-triggering"
  - "Intent queue buffer-drain: startBuffering(path, state) -> enqueue(intent) -> drain(currentState) lifecycle"
  - "React intent integration: IntentProvider + useIntent via useSyncExternalStore for tear-free reads"

requirements-completed: [JINT-01, JINT-06]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 5 Plan 02: Resize Math, Intent Queue, and React Hooks Summary

**Edge-drag resize with density hysteresis, LLM intent queue with conflict-aware buffering/draining, and useIntent React hook via useSyncExternalStore**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T13:04:35Z
- **Completed:** 2026-03-14T13:09:52Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- computeResize pure function converts pointer delta to grid fractions with MIN_PANEL_PX clamping and density hysteresis preventing threshold thrashing
- createIntentQueue buffers LLM intents during active user manipulation, drains non-conflicting intents on release, silently drops conflicting ones
- IntentProvider + useIntent hook provides dispatch/isResolving/pendingCount via useSyncExternalStore, matching established useChatMessages pattern
- 23 new tests (8 resize, 7 queue, 3 integration, 5 hooks), 266 total dzin tests passing, boundary enforcement green

## Task Commits

Each task was committed atomically:

1. **Task 1: Resize math and intent queue with TDD tests** - `0f48dfc` (feat)
2. **Task 2: React hooks, barrel export, and public API update** - `14c9fde` (feat)

## Files Created/Modified
- `packages/dzin/core/src/intent/resize.ts` - computeResize, initResizeState, ResizeState interface, MIN_PANEL_PX constant
- `packages/dzin/core/src/intent/queue.ts` - createIntentQueue factory with startBuffering/stopBuffering/enqueue/drain/isBuffering
- `packages/dzin/core/src/intent/hooks.tsx` - IntentProvider context wrapper, useIntent hook with useSyncExternalStore
- `packages/dzin/core/src/intent/index.ts` - Updated barrel export with resize, queue, and hooks exports
- `packages/dzin/core/src/index.ts` - Updated @dzin/core public API with all new intent symbols
- `packages/dzin/core/src/intent/__tests__/resize.test.ts` - 8 tests: idempotency, fraction increase/decrease, clamping, density thresholds, hysteresis
- `packages/dzin/core/src/intent/__tests__/queue.test.ts` - 7 tests: isBuffering, enqueue targeting, drain conflict/non-conflict, stopBuffering
- `packages/dzin/core/src/intent/__tests__/hooks.test.tsx` - 5 tests: context enforcement, dispatch, isResolving, pendingCount, re-render
- `packages/dzin/core/src/intent/__tests__/integration.test.ts` - 3 tests: full resize flow, LLM queue apply, LLM queue drop on conflict

## Decisions Made
- hooks.tsx uses `.tsx` extension because IntentProvider renders JSX and esbuild only enables JSX transform for `.tsx` files
- computeResize works in pixel space during drag and converts to fractions once per call to prevent cumulative floating-point drift (per research pitfall #1)
- Density hysteresis is tracked via `densityChangePx` field on ResizeState -- after a density change, the dimension must move 20px further before another change is allowed
- IntentQueue.startBuffering accepts optional initial WorkspaceState for snapshot comparison during drain -- enables conflict detection by comparing panel density/slotIndex between start and end states
- Queue conflict detection is simple: if panel density or slotIndex changed since buffering started, the intent is dropped (user-wins principle from Phase 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed hooks.ts to hooks.tsx for JSX support**
- **Found during:** Task 2 (React hooks)
- **Issue:** hooks.ts contained JSX (`<IntentContext.Provider>`) but esbuild only enables JSX transform for `.tsx` files
- **Fix:** Renamed to hooks.tsx; barrel import `from './hooks'` resolves correctly without extension
- **Files modified:** packages/dzin/core/src/intent/hooks.tsx (renamed from hooks.ts)
- **Verification:** Full test suite passes (266/266)
- **Committed in:** 14c9fde (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** File extension change only. No scope creep.

## Issues Encountered
None beyond the .tsx extension rename documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete intent module ready for Phase 5 Plan 3 (director wiring and host-app integration)
- computeResize + IntentQueue provide the direct manipulation primitives for resize handles
- useIntent hook ready for wrapping in host-app workspace components
- Phase 6 (LLM Transport) can wire NEEDS_LLM routing to actual Claude CLI when ready

## Self-Check: PASSED

All 9 created/modified files verified on disk. Both task commits (0f48dfc, 14c9fde) verified in git log. 266/266 tests passing.
