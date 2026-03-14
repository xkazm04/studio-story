---
phase: 06-jinn-llm-integration
plan: 03
subsystem: engine
tags: [llm, ambient-observer, workflow-patterns, suggestion-ui, status-indicator, intents]

# Dependency graph
requires:
  - phase: 06-jinn-llm-integration
    plan: 01
    provides: LLMTransportStatus type for status dot component
  - phase: 05-jinn-intent-director
    provides: IntentBus, IntentEvent, IntentType for ambient observer subscription
provides:
  - createAmbientObserver factory with pattern matching and suggestion emission
  - DEFAULT_PATTERNS with 4 workflow pattern definitions
  - LLMStatusDot component showing transport connectivity
  - SuggestionCard dismissible UI with Apply action and auto-dismiss
affects: [07-story-domain (ambient patterns for story workflows)]

# Tech tracking
tech-stack:
  added: []
  patterns: [event-driven pattern matching with debounce, cooldown map for rate limiting, fixed-position toast-style suggestion cards]

key-files:
  created:
    - src/agents/ambient-observer.ts
    - src/agents/workflow-patterns.ts
    - src/agents/__tests__/ambient-observer.test.ts
    - src/workspace/layout/header/LLMStatusDot.tsx
    - src/workspace/panels/shared/SuggestionCard.tsx
  modified:
    - src/workspace/layout/header/WorkspaceHeader.tsx
    - src/app/globals.css

key-decisions:
  - "Entity-created trigger scans all recent events in debounce batch, not just last event -- handles rapid multi-type events"
  - "Idle trigger uses separate setTimeout per pattern, reset on any IntentBus event"
  - "SuggestionCard uses requestAnimationFrame for enter animation timing rather than useLayoutEffect"
  - "WorkspaceHeader accepts llmStatus prop (default 'disconnected') for graceful degradation when transport not wired"

patterns-established:
  - "Ambient observer: factory function with mock-friendly IntentBus DI and configurable getPanelCount callback"
  - "Suggestion queue: max 2 active with FIFO queue, drained on dismiss"

requirements-completed: [JINT-05, JINT-03]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 6 Plan 3: Ambient Observer & Status UI Summary

**Event-driven ambient observer with 4 workflow patterns, dismissible suggestion cards, and LLM connectivity status dot in workspace header**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T15:21:59Z
- **Completed:** 2026-03-14T15:27:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Ambient observer factory subscribing to IntentBus with entity-created, idle, and sequence pattern triggers
- 4 default workflow patterns: character-created, scene-opened, story-setup-complete, idle-empty-workspace
- Cooldown enforcement (5 min default), max 2 active suggestions with FIFO queue, 8s debounce
- LLMStatusDot component with green/amber/red states, tooltip, and pulse animation
- SuggestionCard with Lightbulb icon, Apply action, dismiss X, 30s auto-dismiss, and SuggestionStack container
- 13 unit tests for ambient observer covering all trigger types, cooldowns, max-visible limits, and cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Ambient observer and workflow patterns with tests** - `df87d74` (feat, TDD)
2. **Task 2: LLMStatusDot and SuggestionCard UI components** - `4089acd` (feat)

_Task 1 followed TDD: RED (failing tests) -> GREEN (implementation) -> verify_

## Files Created/Modified
- `src/agents/workflow-patterns.ts` - PatternTrigger, SuggestionTemplate, WorkflowPattern types and DEFAULT_PATTERNS
- `src/agents/ambient-observer.ts` - createAmbientObserver factory, ActiveSuggestion type, AmbientObserver interface
- `src/agents/__tests__/ambient-observer.test.ts` - 13 tests with mock IntentBus and fake timers
- `src/workspace/layout/header/LLMStatusDot.tsx` - Transport status dot with color/tooltip/pulse
- `src/workspace/panels/shared/SuggestionCard.tsx` - Dismissible suggestion card and SuggestionStack
- `src/workspace/layout/header/WorkspaceHeader.tsx` - Added LLMStatusDot with llmStatus prop
- `src/app/globals.css` - Added llm-pulse keyframe animation

## Decisions Made
- Entity-created trigger scans all recent events in debounce batch (not just the last event) to handle rapid multi-type actions correctly
- Idle trigger uses separate setTimeout per pattern, all reset on any IntentBus event arrival
- SuggestionCard uses requestAnimationFrame for reliable enter animation timing
- WorkspaceHeader accepts optional llmStatus prop defaulting to 'disconnected' for graceful degradation
- SuggestionStack uses z-[8000] to sit below advisor overlay (z-[9000]) but above workspace panels

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed entity-created matching to scan all batch events**
- **Found during:** Task 1 (Ambient observer implementation)
- **Issue:** Initial implementation only checked most recent event for entity-created triggers; when multiple different entity types arrived in same debounce window, only the last type matched
- **Fix:** Changed processEvents to iterate all recentEvents for entity-created matching
- **Files modified:** src/agents/ambient-observer.ts
- **Verification:** Tests for max-active and queue drain now pass
- **Committed in:** df87d74 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was essential for correct batch event handling. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ambient observer ready for integration with host app IntentBus instance
- LLMStatusDot ready for wiring to LLMTransport.getStatus() via useSyncExternalStore
- SuggestionStack ready for rendering in host app layout alongside workspace panels
- Full Phase 6 pipeline complete: Transport -> CLI Session -> Multimodal Tools -> Ambient Observer -> Status UI

## Self-Check: PASSED

- All 7 created/modified files exist on disk
- Commit df87d74 (Task 1) verified in git log
- Commit 4089acd (Task 2) verified in git log
- 13 ambient observer tests passing
- Full suite: 432 tests passing (2 pre-existing failures in unrelated relationship validators)

---
*Phase: 06-jinn-llm-integration*
*Completed: 2026-03-14*
