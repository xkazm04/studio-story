---
phase: 14-llm-transport-and-ambient-observer-wiring
plan: 02
subsystem: ui
tags: [ambient-observer, suggestion-cards, llm-status, workspace, intent-system, dzin-core]

# Dependency graph
requires:
  - phase: 14-llm-transport-and-ambient-observer-wiring
    plan: 01
    provides: useSuggestionState hook, useIntentDispatch with LLM transport, SuggestionCard LLM variant
  - phase: 06-llm-transport
    provides: createAmbientObserver factory, DEFAULT_PATTERNS, SuggestionStack component
  - phase: 05-intent-system
    provides: IntentBus, IntentProvider, bus.dispatch
provides:
  - Ambient observer instantiated in V2Layout with all 4 DEFAULT_PATTERNS
  - SuggestionStack rendered in layout with both ambient and LLM cards
  - SuggestionContext providing suggestion state and transport refs to all descendants
  - Observer pause/resume mechanism gated by LLM transport status
  - Real LLM transport status piped to WorkspaceHeader status dot
affects: [workspace composition, advisor integration, future workflow patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React context bridge: SuggestionContext bridges useSuggestionState + useIntentDispatch for descendant access"
    - "Observer pause/resume: transport status gates ambient observer event processing"
    - "Apply-through-bus: suggestion apply dispatches intent through bus for unified validation/undo"

key-files:
  created: []
  modified:
    - src/agents/ambient-observer.ts
    - src/agents/__tests__/ambient-observer.test.ts
    - src/app/providers.tsx
    - src/workspace/layout/V2Layout.tsx

key-decisions:
  - "SuggestionContext as React context in providers.tsx: bridges useSuggestionState and useIntentDispatch for descendant consumption without prop drilling"
  - "Observer pauses on error/disconnected transport status, resumes on idle/sending/streaming: simple boolean gate in emitOrQueue/processEvents/idle callbacks"
  - "Apply dispatches intent through bus with source 'click': unified validation path, undo works naturally for both ambient and LLM suggestions"
  - "Idle timers keep running while paused but emitOrQueue is gated: no timer reset/clear needed on pause, simpler state management"

patterns-established:
  - "SuggestionContext pattern: shared suggestion state accessible via useSuggestionContext() hook from any V2Layout descendant"
  - "Transport-gated observer: ambient observer lifecycle tied to LLM transport health for graceful degradation"

requirements-completed: [JINT-05]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 14 Plan 02: Ambient Observer Wiring Summary

**Ambient observer instantiated in V2Layout with transport-gated pause/resume, SuggestionStack rendering both ambient and LLM cards, and real LLM status dot in workspace header**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T22:41:41Z
- **Completed:** 2026-03-15T22:45:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added pause/resume mechanism to ambient observer with 3 new tests (16 total pass)
- Created SuggestionContext in providers.tsx bridging useSuggestionState and useIntentDispatch
- V2Layout instantiates ambient observer with all 4 DEFAULT_PATTERNS, renders SuggestionStack, and pipes real llmStatus to WorkspaceHeader
- Observer automatically pauses when LLM transport is disconnected/error, resumes when recovered

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `36959cd` (test)
2. **Task 1 (GREEN): Implementation** - `d722887` (feat)
3. **Task 2: Providers and V2Layout wiring** - `cb533a1` (feat)

_Task 1 used TDD flow: RED (failing tests) -> GREEN (implementation)_

## Files Created/Modified
- `src/agents/ambient-observer.ts` - Added pause/resume methods and paused boolean gate in emitOrQueue, processEvents, idle callbacks
- `src/agents/__tests__/ambient-observer.test.ts` - Added 3 pause/resume tests in new describe block
- `src/app/providers.tsx` - Created SuggestionContext, wired useSuggestionState + useIntentDispatch, exported useSuggestionContext hook
- `src/workspace/layout/V2Layout.tsx` - Instantiates ambient observer, renders SuggestionStack, passes llmStatus to header, subscribes to transport status for pause/resume

## Decisions Made
- SuggestionContext as React context in providers.tsx rather than Zustand store -- follows existing IntentProvider pattern, avoids adding another global store
- Observer pauses on error/disconnected, resumes on idle/sending/streaming -- simple boolean gate, no timer reset needed
- Apply dispatches through bus with 'click' source -- unified validation path and undo support for both ambient and LLM suggestions
- Idle timers keep running while paused but emitOrQueue gates output -- simpler than clearing/restarting all timers on pause/resume

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 14 is fully complete: LLM transport wired (plan 01), ambient observer wired (plan 02)
- The app now proactively surfaces workflow suggestions and displays real-time AI connection status
- All 4 DEFAULT_PATTERNS are active at launch
- SuggestionStack visible with both ambient and LLM cards
- Future work: additional workflow patterns can be added to DEFAULT_PATTERNS array

## Self-Check: PASSED

- All 4 files verified present on disk
- All 3 commits verified in git log (36959cd, d722887, cb533a1)
- All 685 tests pass across 73 test files

---
*Phase: 14-llm-transport-and-ambient-observer-wiring*
*Completed: 2026-03-15*
