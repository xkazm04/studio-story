---
phase: 10-writing-tools-and-voice
plan: 04
subsystem: voice
tags: [elevenlabs, tts, voice-cloning, youtube-extraction, mcp, narration, mp3-export]

requires:
  - phase: 10-02
    provides: "TTS API routes, screenplayParser, audioStitcher, clone-voice route, YouTube audio extraction"
provides:
  - "useScreenplayParser hook for TipTap JSON to ScriptLine parsing"
  - "useVoiceCloning hook for audio upload and YouTube URL voice cloning"
  - "useNarrationBatch multi-take generation with progress tracking"
  - "useNarrationExport MP3 stitching and download"
  - "VoiceAssignmentChecklist pre-flight component"
  - "NarrationPipeline wired to real TTS with full workflow"
  - "MCP voice tools: generate_scene_narration, check_voice_assignments, list_voices, assign_character_voice"
  - "Narration composition patterns in workflowHints"
affects: [voice, narration, mcp-server, workspace-composition]

tech-stack:
  added: []
  patterns:
    - "Multi-take TTS generation with takesCount option"
    - "Two-step voice cloning: YouTube extract then ElevenLabs clone"
    - "Pre-flight checklist pattern for missing assignments"
    - "getDb() for direct Supabase access in MCP voice tools"

key-files:
  created:
    - src/app/features/voice/hooks/useScreenplayParser.ts
    - src/app/features/voice/hooks/useVoiceCloning.ts
    - src/app/features/voice/components/VoiceAssignmentChecklist.tsx
    - src/app/features/voice/components/__tests__/VoiceAssignmentChecklist.test.tsx
    - src/app/features/voice/hooks/__tests__/useNarrationBatch.test.ts
    - src/mcp-server/tools/voice.ts
  modified:
    - src/app/features/voice/hooks/useNarrationBatch.ts
    - src/app/features/voice/hooks/useNarrationExport.ts
    - src/app/features/voice/components/NarrationPipeline.tsx
    - src/mcp-server/tools/index.ts
    - src/mcp-server/db.ts
    - src/workspace/config/workflowHints.ts

key-decisions:
  - "takesCount=2 as default for narration generation (2 takes per segment for audition)"
  - "getDb() added to db.ts for direct Supabase access in voice tools rather than using HTTP client for CRUD"
  - "NARRATION_COMPOSITION_PATTERNS as separate export for voice workflow layouts"

patterns-established:
  - "Pre-flight checklist pattern: show warning component before generation when assignments missing"
  - "Two-step async cloning: extract audio from source, then clone voice via ElevenLabs"

requirements-completed: [VOICE-01, VOICE-02]

duration: 9min
completed: 2026-03-15
---

# Phase 10 Plan 04: Voice/Narration Pipeline Wiring Summary

**Full narration pipeline: screenplay parsing, voice assignment checklist, multi-take TTS with progress, MP3 export via audioStitcher, voice cloning from audio upload and YouTube URL, MCP voice tools, and narration workflow hints**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-14T22:50:40Z
- **Completed:** 2026-03-15T00:00:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- 4 voice hooks wired to real API routes: useScreenplayParser, useVoiceCloning, useNarrationBatch (multi-take), useNarrationExport (MP3 stitching)
- VoiceAssignmentChecklist pre-flight component with 5 behavioral tests
- NarrationPipeline fully wired: parse screenplay, check assignments, generate 2 takes, audition, export MP3, voice cloning
- 4 MCP voice tools registered: generate_scene_narration, check_voice_assignments, list_voices, assign_character_voice
- Narration composition patterns added to workflowHints for LLM-driven panel composition

## Task Commits

Each task was committed atomically:

1. **Task 1: Voice hooks (4 hooks)** - `a31bd3e` (feat) - TDD: tests + implementation
2. **Task 2: VoiceAssignmentChecklist with rendering test** - `e2ff110` (feat) - TDD: tests + implementation
3. **Task 3: NarrationPipeline wiring and MCP/composition integration** - `0e56531` (feat)

## Files Created/Modified
- `src/app/features/voice/hooks/useScreenplayParser.ts` - React hook wrapping screenplay parser with voice mapping
- `src/app/features/voice/hooks/useVoiceCloning.ts` - Audio upload and YouTube URL voice cloning orchestration
- `src/app/features/voice/hooks/useNarrationBatch.ts` - Updated with takesCount option and currentCharacter progress
- `src/app/features/voice/hooks/useNarrationExport.ts` - Wired to audioStitcher for MP3 export
- `src/app/features/voice/hooks/__tests__/useNarrationBatch.test.ts` - 4 behavioral tests for TTS batch generation
- `src/app/features/voice/components/VoiceAssignmentChecklist.tsx` - Pre-flight checklist for voice assignments
- `src/app/features/voice/components/__tests__/VoiceAssignmentChecklist.test.tsx` - 5 rendering tests
- `src/app/features/voice/components/NarrationPipeline.tsx` - Full pipeline wiring with all hooks
- `src/mcp-server/tools/voice.ts` - 4 MCP voice tools
- `src/mcp-server/tools/index.ts` - Voice tools registration
- `src/mcp-server/db.ts` - getDb() export for direct Supabase access
- `src/workspace/config/workflowHints.ts` - Voice/narration workflow hints and composition patterns

## Decisions Made
- takesCount=2 as default for narration generation -- 2 takes per segment for audition (within plan's 2-3 range)
- getDb() added to db.ts for direct Supabase access in voice tools rather than using individual dbSelect/dbUpdate helpers -- voice tools need complex queries (joins, multi-table reads) that the generic helpers don't support well
- NARRATION_COMPOSITION_PATTERNS exported separately from TOOL_PANEL_HINTS for voice-specific layouts (narrate scene, assign voices, record audio drama)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added getDb() export to db.ts**
- **Found during:** Task 3 (MCP voice tools)
- **Issue:** db.ts only exported individual CRUD helpers (dbSelect, dbInsert, etc.) but voice tools need direct Supabase client for complex queries
- **Fix:** Added getDb(config) function that returns the raw SupabaseClient, auto-initializing if needed
- **Files modified:** src/mcp-server/db.ts
- **Verification:** npm run build:mcp succeeds
- **Committed in:** 0e56531 (Task 3 commit)

**2. [Rule 1 - Bug] Added afterEach cleanup in VoiceAssignmentChecklist tests**
- **Found during:** Task 2 (VoiceAssignmentChecklist test)
- **Issue:** @testing-library/react was not auto-cleaning DOM between tests, causing button count assertions to fail
- **Fix:** Added explicit afterEach(cleanup) call
- **Files modified:** src/app/features/voice/components/__tests__/VoiceAssignmentChecklist.test.tsx
- **Verification:** All 5 tests pass
- **Committed in:** e2ff110 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

External services require configuration:
- **ElevenLabs API Key**: Required for TTS voice generation and voice cloning. Set `ELEVENLABS_API_KEY` in `.env.local`. Obtain from ElevenLabs Dashboard -> Profile + API key.

## Next Phase Readiness
- Voice/narration pipeline complete: full script-to-performance workflow
- All Phase 10 plans complete (4/4)
- Ready for Phase 11

## Self-Check: PASSED

All 12 files verified present. All 3 task commits verified in git log.

---
*Phase: 10-writing-tools-and-voice*
*Completed: 2026-03-15*
