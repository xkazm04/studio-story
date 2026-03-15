---
phase: 11-multimodal-input
plan: 02
subsystem: agents
tags: [push-to-talk, voice, multimodal, auto-connect, idle-disconnect, mic-indicator, ghost-text]

requires:
  - phase: 11-multimodal-input
    provides: useMultimodalInput hook, InteractionContext, GeminiLiveClient inputTranscription, voice IntentSource
  - phase: 06-advisor
    provides: GeminiLiveClient, AudioIOManager, agentStore, useAdvisorVoice, AdvisorOverlay

provides:
  - "Push-to-talk via Space key with auto-connect on first voice interaction"
  - "Idle voice disconnect after 2 minutes of no recording activity"
  - "Always-available mic button with 5 visual states in AdvisorOverlay"
  - "Unified multimodal input pipeline routing both text and voice through useMultimodalInput"
  - "Ghost text display for live voice transcription"
  - "Cross-modal interaction context badge"

affects: [11-multimodal-input, advisor, workspace-composition]

tech-stack:
  added: []
  patterns:
    - "Push-to-talk with isTypingInInput guard for text input elements"
    - "Auto-connect pattern: pendingRecordAfterConnect ref bridges disconnected state to recording"
    - "Idle disconnect timer resets on each recording start, fires on stop"
    - "Ghost text via placeholder text and overlay span in input field"
    - "PTT hint auto-hide via localStorage counter pattern"

key-files:
  created:
    - src/agents/__tests__/push-to-talk.test.ts
    - src/agents/__tests__/interaction-context.test.ts
  modified:
    - src/agents/useAdvisorVoice.ts
    - src/agents/AdvisorOverlay.tsx

key-decisions:
  - "isTypingInInput checks instanceof HTMLElement before getAttribute to handle jsdom edge cases"
  - "Idle disconnect timer is 2 minutes (IDLE_DISCONNECT_MS = 120000) per research pitfall #4"
  - "Input area always visible (not gated behind isAnyConnected) since mic auto-connects"
  - "Ghost text clears after 2s timeout rather than on next input event"
  - "PTT hint dismissed after 3 uses via localStorage counter (advisor-ptt-hint-count)"

patterns-established:
  - "Auto-connect voice: pendingRecordAfterConnect ref + onSetupComplete callback bridges async connection to immediate recording"
  - "Always-available mic: single MicButton component with 5 states replaces separate connect/record/stop buttons"
  - "Unified text submission: handleSend routes through multimodal.handleTextInput for local intent resolution before fallback to LLM"

requirements-completed: [JMULTI-01, JMULTI-02]

duration: 7min
completed: 2026-03-15
---

# Phase 11 Plan 02: Push-to-Talk and Always-Available Voice Summary

**Push-to-talk via Space key with auto-connect, idle disconnect, always-available mic button in AdvisorOverlay, and unified multimodal input pipeline**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-15T00:01:45Z
- **Completed:** 2026-03-15T00:09:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added push-to-talk via Space key with guards for text inputs, contenteditable, and key repeat
- Auto-connect voice on first interaction (no separate "Connect Voice" step needed)
- Idle disconnect after 2 minutes prevents WebSocket resource drain
- AdvisorOverlay mic button always visible with 5 visual states (disconnected/connecting/connected/recording/speaking)
- Text and voice inputs route through unified useMultimodalInput pipeline
- Ghost text shows live voice transcription in the input field
- Cross-modal interaction context badge appears when mixing voice+text inputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add auto-connect, push-to-talk, idle disconnect to useAdvisorVoice** - `36803af` (feat, TDD)
2. **Task 2: Update AdvisorOverlay with always-available mic and unified input** - `06fc3ec` (feat)

## Files Created/Modified
- `src/agents/useAdvisorVoice.ts` - Added push-to-talk keyboard handler, auto-connect, idle disconnect, onTranscription callback, pushToTalkEnabled state, liveClientRef exposure
- `src/agents/AdvisorOverlay.tsx` - Replaced VoiceControls with always-available MicButton, wired useMultimodalInput, added ghost text, interaction context badge, PTT hint
- `src/agents/__tests__/push-to-talk.test.ts` - 6 tests for push-to-talk, auto-connect, idle disconnect, transcription wiring
- `src/agents/__tests__/interaction-context.test.ts` - 5 tests for text submission, mic toggle, transcription, context badge, ghost text

## Decisions Made
- isTypingInInput checks `instanceof HTMLElement` before calling `getAttribute` to handle jsdom environments where event target may not be an Element
- Idle disconnect uses 2 minute timeout (IDLE_DISCONNECT_MS = 120000ms) per research pitfall #4 about WebSocket drain
- Input area is always visible (not gated behind isAnyConnected) since the mic auto-connects on first use
- Ghost text clears after a 2 second timeout rather than on next user input, providing a visible confirmation window
- PTT hint auto-hides after 3 uses via localStorage counter (advisor-ptt-hint-count key)
- Removed MicOff and Phone icons from imports since they are no longer needed with the always-available mic pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed isTypingInInput crash in jsdom**
- **Found during:** Task 1 (push-to-talk tests)
- **Issue:** KeyboardEvent target in jsdom can be a non-Element node, causing `getAttribute is not a function`
- **Fix:** Added `instanceof HTMLElement` check before accessing getAttribute
- **Files modified:** src/agents/useAdvisorVoice.ts
- **Verification:** All 6 push-to-talk tests pass
- **Committed in:** 36803af (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for test environment compatibility. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Push-to-talk and auto-connect work with existing ephemeral token infrastructure.

## Next Phase Readiness
- Voice is now a continuously available input channel alongside text
- Multimodal input pipeline complete: voice, text, and click all flow through useMultimodalInput
- Phase 11 objectives (JMULTI-01, JMULTI-02) are complete
- Ready for Phase 12 (package enforcement/finalization)

## Self-Check: PASSED

- [x] src/agents/useAdvisorVoice.ts - FOUND
- [x] src/agents/AdvisorOverlay.tsx - FOUND
- [x] src/agents/__tests__/push-to-talk.test.ts - FOUND
- [x] src/agents/__tests__/interaction-context.test.ts - FOUND
- [x] Commit 36803af - FOUND
- [x] Commit 06fc3ec - FOUND

---
*Phase: 11-multimodal-input*
*Completed: 2026-03-15*
