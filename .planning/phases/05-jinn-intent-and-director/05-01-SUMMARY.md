---
phase: 05-jinn-intent-and-director
plan: 01
subsystem: intent-system
tags: [intent, director, bus, handlers, json-patch, dzin-core, typescript]

# Dependency graph
requires:
  - phase: 03-jinn-state-and-streaming
    provides: StateEngine, PatchOrigin, WorkspaceState, undo/redo stack
  - phase: 02-jinn-layout-engine
    provides: LayoutTemplateId, PanelDirective, assignSlotDensity
provides:
  - Intent type system (5 coarse types with discriminated payloads)
  - createDirector factory with handler map and NEEDS_LLM sentinel
  - createIntentBus factory dispatching resolved patches through StateEngine
  - 4 built-in handlers (compose, manipulate, navigate, system)
  - Barrel export added to @dzin/core public API
affects: [05-02, 06-llm-transport, 07-studio-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [intent-bus-dispatch, director-handler-map, needs-llm-sentinel, undo-redo-description-routing]

key-files:
  created:
    - packages/dzin/core/src/intent/types.ts
    - packages/dzin/core/src/intent/director.ts
    - packages/dzin/core/src/intent/bus.ts
    - packages/dzin/core/src/intent/handlers/compose.ts
    - packages/dzin/core/src/intent/handlers/manipulate.ts
    - packages/dzin/core/src/intent/handlers/navigate.ts
    - packages/dzin/core/src/intent/handlers/system.ts
    - packages/dzin/core/src/intent/index.ts
    - packages/dzin/core/src/intent/__tests__/director.test.ts
    - packages/dzin/core/src/intent/__tests__/bus.test.ts
    - packages/dzin/core/src/intent/__tests__/compose-handler.test.ts
    - packages/dzin/core/src/intent/__tests__/manipulate-handler.test.ts
  modified:
    - packages/dzin/core/src/index.ts

key-decisions:
  - "IntentHandler type uses symbol return (typeof NEEDS_LLM) for fallthrough sentinel"
  - "Bus special-cases undo/redo descriptions to call stateEngine.undo()/redo() instead of dispatch()"
  - "Manipulate handler uses inline FALLBACK_THRESHOLDS for density computation to avoid PanelDefinition dependency"
  - "Compose handler takes registryHas function rather than full PanelRegistry to minimize coupling"

patterns-established:
  - "Intent dispatch: all structured user inputs flow through createIntentBus -> createDirector -> handler map"
  - "NEEDS_LLM sentinel: handlers return Symbol to signal LLM fallthrough"
  - "Handler factory pattern: createXHandler(deps) returns IntentHandler function"

requirements-completed: [JINT-01, JINT-02]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 5 Plan 01: Intent and Director Summary

**Intent type system with 5 coarse types, director with handler map and NEEDS_LLM fallthrough, bus dispatching resolved patches through StateEngine, and 4 built-in handlers for compose/manipulate/navigate/system**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T12:52:57Z
- **Completed:** 2026-03-14T12:59:10Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Intent type system with discriminated union payloads (compose, manipulate, navigate, query, system)
- Director resolves local handlers synchronously and falls through to NEEDS_LLM for complex/unknown intents
- Bus dispatches resolved patches to StateEngine, tracks pending LLM intents, notifies subscribers
- 4 built-in handlers: compose (close/set-layout/open with hints), manipulate (resize/set-density), navigate (focus), system (undo/redo/clear)
- 27 new tests, 243 total dzin tests passing, boundary enforcement green

## Task Commits

Each task was committed atomically:

1. **Task 1: Intent types, director, and bus core with TDD tests** - `db5a90a` (feat)
2. **Task 2: Built-in handlers for compose, manipulate, navigate, and system intents** - `c44bf64` (feat)

## Files Created/Modified
- `packages/dzin/core/src/intent/types.ts` - Intent, IntentType, IntentPayloadMap, IntentResult, IntentHandler, IntentEvent, IntentBus, Director interfaces
- `packages/dzin/core/src/intent/director.ts` - createDirector factory with handler map, NEEDS_LLM sentinel
- `packages/dzin/core/src/intent/bus.ts` - createIntentBus factory with dispatch, subscribe, getSnapshot
- `packages/dzin/core/src/intent/handlers/compose.ts` - Local handler for open/close/swap/set-layout with workflow hints
- `packages/dzin/core/src/intent/handlers/manipulate.ts` - Local handler for resize/set-density with dimension-to-density computation
- `packages/dzin/core/src/intent/handlers/navigate.ts` - Local handler for focus/scroll-to
- `packages/dzin/core/src/intent/handlers/system.ts` - Local handler for undo/redo/clear/toggle-chat
- `packages/dzin/core/src/intent/index.ts` - Barrel export for intent module
- `packages/dzin/core/src/index.ts` - Added intent module to @dzin/core public API
- `packages/dzin/core/src/intent/__tests__/director.test.ts` - 5 director tests
- `packages/dzin/core/src/intent/__tests__/bus.test.ts` - 9 bus tests
- `packages/dzin/core/src/intent/__tests__/compose-handler.test.ts` - 6 compose handler tests
- `packages/dzin/core/src/intent/__tests__/manipulate-handler.test.ts` - 7 handler tests (manipulate + system + navigate)

## Decisions Made
- IntentHandler returns `typeof NEEDS_LLM` (unique Symbol) as sentinel for LLM fallthrough -- type-safe, impossible to confuse with valid result
- Bus recognizes 'undo'/'redo' description strings from system handler and calls stateEngine.undo()/redo() instead of dispatch() -- keeps undo/redo on the undo stack without creating new patches
- Manipulate handler duplicates FALLBACK_THRESHOLDS from layout/density.ts rather than importing PanelDefinition -- avoids coupling the handler to the full registry type
- Compose handler accepts `registryHas: (type: string) => boolean` function rather than full PanelRegistry -- dependency injection keeps the handler testable with minimal mocking

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest `-x` flag (bail on first failure) not available in Vitest 4.x -- used `--bail 1` instead. No impact on results.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Intent infrastructure complete and tested, ready for Phase 5 Plan 2 (direct manipulation / React hooks)
- Bus produces patches through StateEngine -- Phase 6 (LLM Transport) can wire NEEDS_LLM routing to actual Claude CLI
- Workflow hints pattern from compose handler can be populated with TOOL_PANEL_HINTS from workflowHints.ts

## Self-Check: PASSED

All 12 created files verified on disk. Both task commits (db5a90a, c44bf64) verified in git log. 243/243 tests passing.

---
*Phase: 05-jinn-intent-and-director*
*Completed: 2026-03-14*
