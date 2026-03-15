---
phase: 14-llm-transport-and-ambient-observer-wiring
plan: 01
subsystem: ui
tags: [llm-transport, intent-system, suggestion-cards, workspace, dzin-core]

# Dependency graph
requires:
  - phase: 06-llm-transport
    provides: createLLMTransport factory, sendToLLM callback pattern, /api/claude-terminal/intent endpoint
  - phase: 05-intent-system
    provides: createIntentBus, NEEDS_LLM sentinel, IntentEvent subscription
provides:
  - LLM transport wired into useIntentDispatch with lazy initialization
  - useSuggestionState hook for shared ambient + LLM suggestion management
  - SuggestionCard LLM variant with persistent mode and Bot icon
  - NEEDS_LLM -> transport -> suggestion card pipeline
affects: [14-02 ambient observer wiring, workspace composition, V2Layout integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Host-side bus subscription for NEEDS_LLM routing (Option B from research)
    - Lazy transport initialization (no CLI session on app load)
    - Late-binding callback pattern for addSuggestion

key-files:
  created:
    - src/workspace/hooks/useSuggestionState.ts
    - src/workspace/hooks/__tests__/useIntentDispatch.test.ts
  modified:
    - src/workspace/hooks/useIntentDispatch.ts
    - src/workspace/panels/shared/SuggestionCard.tsx

key-decisions:
  - "Host-side bus subscription pattern: subscribe to IntentBus events in useIntentDispatch and filter for needs-llm status, rather than modifying @dzin/core bus"
  - "Lazy transport: getOrCreateTransport() only called on first NEEDS_LLM event, no CLI session spawned on app load"
  - "Late-binding addSuggestion callback: setAddSuggestion allows parent component to wire suggestion state after hook initialization"
  - "SuggestionCard variant derived from patternId '__llm_response__' in SuggestionStack, not passed from caller"

patterns-established:
  - "Host-side NEEDS_LLM routing: bus.subscribe() filter pattern for LLM fallthrough without modifying core bus"
  - "Persistent suggestion cards: variant='llm' with persistent=true skips auto-dismiss timer"

requirements-completed: [JINT-03]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 14 Plan 01: LLM Transport Wiring Summary

**NEEDS_LLM intents route to Claude via lazily-initialized transport, with resolved patches surfaced as persistent Bot-icon suggestion cards in SuggestionStack**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T22:32:52Z
- **Completed:** 2026-03-15T22:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Wired LLM transport into useIntentDispatch: bus subscription filters NEEDS_LLM events and routes to lazily-created transport via createLLMTransport
- Created useSuggestionState hook managing shared suggestion array with max 2 visible, overflow queue, transport ref, and llmStatus via useSyncExternalStore
- Updated SuggestionCard with LLM variant (Bot icon, cyan border, persistent) distinct from ambient (Lightbulb, subtle, 30s auto-dismiss)
- 6 integration tests covering transport wiring, lazy init, sendToLLM POST, suggestion creation, and error handling

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `1fd2a1a` (test)
2. **Task 1 (GREEN): Implementation** - `96924fa` (feat)
3. **Task 2: SuggestionCard LLM variant** - `caf4ff1` (feat)

_Task 1 used TDD flow: RED (failing tests) -> GREEN (implementation)_

## Files Created/Modified
- `src/workspace/hooks/useSuggestionState.ts` - Shared suggestion state hook with max 2 visible, overflow queue, transport ref, llmStatus
- `src/workspace/hooks/useIntentDispatch.ts` - Added LLM transport wiring: bus subscription, lazy transport, sendToLLM, suggestion creation
- `src/workspace/panels/shared/SuggestionCard.tsx` - Added persistent/variant props, LLM variant with Bot icon and cyan border
- `src/workspace/hooks/__tests__/useIntentDispatch.test.ts` - 6 integration tests for transport wiring

## Decisions Made
- Host-side bus subscription pattern (Option B from research): subscribe to IntentBus events in useIntentDispatch and filter for needs-llm, rather than modifying @dzin/core's bus.ts
- Lazy transport initialization: getOrCreateTransport() only called on first NEEDS_LLM event, avoiding CLI session spawn on app load
- Late-binding addSuggestion callback via setAddSuggestion(): allows parent component (V2Layout in plan 02) to wire suggestion state after hook init
- SuggestionStack auto-derives variant and persistent from patternId '__llm_response__' -- callers don't need to know about LLM vs ambient distinction

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test mock reset in beforeEach**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** vi.clearAllMocks() in beforeEach also cleared createLLMTransport mock return value, causing transport to be undefined on lazy init
- **Fix:** Added explicit mockReturnValue re-establishment for all core factory mocks in beforeEach
- **Files modified:** src/workspace/hooks/__tests__/useIntentDispatch.test.ts
- **Verification:** All 6 tests pass
- **Committed in:** 96924fa (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test infrastructure fix necessary for correctness. No scope creep.

## Issues Encountered
None beyond the mock reset issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Transport wiring complete, ready for Plan 02 (ambient observer integration, V2Layout composition, LLM status dot)
- useSuggestionState hook ready for consumption by V2Layout
- SuggestionCard LLM variant ready for rendering in SuggestionStack

## Self-Check: PASSED

- All 4 files verified present on disk
- All 3 commits verified in git log (1fd2a1a, 96924fa, caf4ff1)
- All 6 tests pass

---
*Phase: 14-llm-transport-and-ambient-observer-wiring*
*Completed: 2026-03-15*
