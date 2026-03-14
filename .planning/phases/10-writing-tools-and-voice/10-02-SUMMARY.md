---
phase: 10-writing-tools-and-voice
plan: 02
subsystem: api
tags: [elevenlabs, tts, voice-cloning, youtube, audio, supabase-storage, tiptap]

requires:
  - phase: 10-writing-tools-and-voice
    provides: AI writing tools backend (plan 01)
provides:
  - ElevenLabs TTS proxy endpoint (POST /api/ai/audio/tts)
  - ElevenLabs voice cloning endpoint (POST /api/ai/audio/clone-voice)
  - ElevenLabs preset voice listing (GET /api/ai/audio/voices)
  - YouTube audio extraction endpoint (POST /api/datasets/audio/extract)
  - Screenplay parser (TipTap JSON to ScriptLine[])
  - Audio stitcher with gap computation
affects: [10-writing-tools-and-voice, voice-panels, narration-pipeline]

tech-stack:
  added: [cobalt.tools API for YouTube extraction]
  patterns: [ElevenLabs API proxy pattern, MP3 silence gap computation, TipTap screenplay parsing]

key-files:
  created:
    - src/app/api/ai/audio/tts/route.ts
    - src/app/api/ai/audio/clone-voice/route.ts
    - src/app/api/ai/audio/voices/route.ts
    - src/app/api/datasets/audio/extract/route.ts
    - src/app/features/voice/lib/screenplayParser.ts
    - src/app/features/voice/lib/audioStitcher.ts
    - src/app/features/voice/__tests__/screenplayParser.test.ts
    - src/app/api/ai/audio/__tests__/tts.test.ts
    - src/app/api/ai/audio/__tests__/clone.test.ts
  modified:
    - src/app/features/datasets/audio/YouTubeAudioSampler.tsx

key-decisions:
  - "cobalt.tools API for YouTube extraction instead of ytdl-core (no native dependency, simpler deployment)"
  - "TTS duration estimated from byte size (bytes/16000 for 128kbps MP3) rather than audio analysis"
  - "Voice listing includes all premade + cloned voices (broad filter) with 5-min cache"

patterns-established:
  - "ElevenLabs proxy: server-side API key, fetch to ElevenLabs, upload result to Supabase Storage"
  - "TipTap screenplay node types: characterCue, dialogue, action, paragraph, sceneHeading"

requirements-completed: [VOICE-01, VOICE-02]

duration: 6min
completed: 2026-03-14
---

# Phase 10 Plan 02: Voice/TTS Backend Infrastructure Summary

**ElevenLabs TTS/cloning/voice-list API routes, YouTube audio extraction, screenplay parser for TipTap JSON, and MP3 audio stitcher with gap computation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T22:28:43Z
- **Completed:** 2026-03-14T22:35:05Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- ElevenLabs TTS proxy that stores generated MP3 audio in Supabase Storage and returns public URL
- Voice cloning endpoint that accepts audio URL and creates instant ElevenLabs clone
- Filtered voice listing with 5-minute cache for narration-suitable voices
- YouTube audio extraction via cobalt.tools API with sample splitting and Supabase Storage upload
- Screenplay parser converting TipTap JSON nodes to ScriptLine[] with character-voice mapping
- Audio stitcher with configurable silence gaps between same/different character transitions
- 26 tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Screenplay parser and audio stitcher**
   - `dae31b8` (test: add failing tests for screenplay parser)
   - `b42ed82` (feat: implement screenplay parser and audio stitcher)
2. **Task 2: ElevenLabs API routes and YouTube extraction**
   - `7bda5cd` (test: add failing tests for TTS and voice cloning routes)
   - `20a1ccc` (feat: implement ElevenLabs API routes and YouTube extraction)

## Files Created/Modified
- `src/app/api/ai/audio/tts/route.ts` - ElevenLabs TTS proxy with Supabase Storage upload
- `src/app/api/ai/audio/clone-voice/route.ts` - Instant voice cloning via ElevenLabs
- `src/app/api/ai/audio/voices/route.ts` - Filtered voice listing with caching
- `src/app/api/datasets/audio/extract/route.ts` - YouTube audio extraction via cobalt.tools
- `src/app/features/voice/lib/screenplayParser.ts` - TipTap JSON to ScriptLine[] conversion
- `src/app/features/voice/lib/audioStitcher.ts` - MP3 concatenation with silence gaps
- `src/app/features/voice/__tests__/screenplayParser.test.ts` - 18 parser/stitcher tests
- `src/app/api/ai/audio/__tests__/tts.test.ts` - 4 TTS route tests
- `src/app/api/ai/audio/__tests__/clone.test.ts` - 4 clone route tests
- `src/app/features/datasets/audio/YouTubeAudioSampler.tsx` - Updated fetch URL to new extraction route

## Decisions Made
- Used cobalt.tools API for YouTube extraction instead of ytdl-core to avoid native dependencies and simplify deployment
- Duration estimated from MP3 byte size (bytes/16000 for 128kbps) rather than requiring audio analysis library
- Voice listing includes all premade + cloned + generated voices with broad filter rather than strict narration-only filtering
- TipTap screenplay uses node type switching (characterCue/dialogue/action/paragraph/sceneHeading) matching existing screenplay editor format from Phase 7

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test import paths for audio API tests**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Test files at `__tests__/` used `../../tts/route` and `../../clone-voice/route` paths, but the correct relative path was `../tts/route` (one level up from `__tests__`)
- **Fix:** Changed all dynamic imports to use `../` prefix instead of `../../`
- **Files modified:** `src/app/api/ai/audio/__tests__/tts.test.ts`, `src/app/api/ai/audio/__tests__/clone.test.ts`
- **Verification:** All 8 route tests pass

**2. [Rule 1 - Bug] Added missing afterEach import in TTS tests**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** `afterEach` was used in the test file but not imported from vitest
- **Fix:** Added `afterEach` to the vitest import statement
- **Files modified:** `src/app/api/ai/audio/__tests__/tts.test.ts`
- **Verification:** All 4 TTS tests pass

---

**Total deviations:** 2 auto-fixed (2 bugs in test files)
**Impact on plan:** Both were test file corrections needed for tests to run. No scope creep.

## Issues Encountered
None beyond the auto-fixed test import paths.

## User Setup Required
ElevenLabs API key must be set in `.env.local`:
- `ELEVENLABS_API_KEY` - Required for TTS, voice cloning, and voice listing endpoints

## Next Phase Readiness
- Voice backend infrastructure complete for narration pipeline UI (Plan 04)
- All 4 API routes ready: TTS, clone-voice, voices, YouTube extraction
- Screenplay parser ready for script-to-narration conversion
- Audio stitcher ready for MP3 export pipeline

## Self-Check: PASSED

All 9 created files verified on disk. All 4 task commits (dae31b8, b42ed82, 7bda5cd, 20a1ccc) verified in git log.

---
*Phase: 10-writing-tools-and-voice*
*Completed: 2026-03-14*
