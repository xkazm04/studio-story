---
phase: 09-visual-pipeline
plan: 01
subsystem: api
tags: [leonardo, controlnets, prompt-assembly, supabase-storage, scene-illustration]

# Dependency graph
requires:
  - phase: 07-story-authoring
    provides: Scene types, SceneParser, PromptGenerator, existing Leonardo provider
provides:
  - assembleIllustrationPrompt for scene-to-prompt pipeline
  - buildControlnets for character (ID 133) and style (ID 67) references
  - LeonardoProvider.generateSceneIllustration with controlnet support
  - uploadToStorage/getPublicUrl Supabase Storage utility
  - POST/GET/PUT /api/scenes/[id]/illustrate orchestration endpoint
affects: [09-02-PLAN, 09-03-PLAN, workspace panels, MCP tools]

# Tech tracking
tech-stack:
  added: []
  patterns: [controlnet-based character/style consistency, prompt assembly pipeline, CDN-to-storage persistence]

key-files:
  created:
    - src/app/lib/ai/prompt-assembly.ts
    - src/app/lib/ai/prompt-assembly.test.ts
    - src/app/lib/ai/providers/__tests__/leonardo-controlnets.test.ts
    - src/lib/supabase/storage.ts
    - src/app/api/scenes/[id]/illustrate/route.ts
  modified:
    - src/app/lib/ai/providers/leonardo.ts

key-decisions:
  - "generateSceneIllustration as new public method avoids modifying existing AIProvider interface"
  - "controlnets and styleUUID are mutually exclusive per Leonardo docs -- omit styleUUID when controlnets present"
  - "Character refs limited to 2, style refs limited to 1 per controlnet array"
  - "Reference image upload failures are non-blocking (warn and continue without ref)"

patterns-established:
  - "Prompt assembly: art style -> setting -> characters (max 3, foreground first) -> mood -> quality tags"
  - "Controlnet refs: preprocessorId 133 (character, Mid strength), 67 (style, High strength)"
  - "Storage utility: upload to illustrations bucket, return permanent public URL"

requirements-completed: [VISUAL-01, VISUAL-02, VISUAL-03]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 9 Plan 1: Backend Visual Pipeline Summary

**Prompt assembly from scene context with Leonardo controlnet support for character/style consistency, Supabase Storage persistence, and 3-handler illustration orchestration API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T20:38:17Z
- **Completed:** 2026-03-14T20:42:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Prompt assembly module that combines art style, setting, characters (max 3, foreground-prioritized), mood, and quality tags into a single prompt under 1500 chars
- Leonardo provider extended with generateSceneIllustration method and controlnet support (preprocessor ID 133 for character refs, 67 for style refs)
- Supabase Storage utility for uploading and retrieving permanent public URLs
- Full scene illustration API with 3 handlers: POST (start generation), GET (poll status), PUT (persist selected image)
- 18 unit tests covering prompt assembly and controlnet payload construction

## Task Commits

Each task was committed atomically:

1. **Task 1: Prompt assembly module, Leonardo controlnet extension, and tests (TDD)**
   - `ddb5842` (test: RED -- failing tests for prompt assembly and controlnets)
   - `10c1478` (feat: GREEN -- implement prompt assembly and Leonardo controlnet support)
2. **Task 2: Supabase Storage utility and scene illustration API endpoint** - `695aa01` (feat)

## Files Created/Modified
- `src/app/lib/ai/prompt-assembly.ts` - assembleIllustrationPrompt, buildControlnets, ControlnetRef types
- `src/app/lib/ai/prompt-assembly.test.ts` - 13 tests for prompt assembly (art style, chars, setting, mood, quality tags, limits)
- `src/app/lib/ai/providers/__tests__/leonardo-controlnets.test.ts` - 5 tests for controlnet payload construction
- `src/app/lib/ai/providers/leonardo.ts` - Extended with generateSceneIllustration method and controlnet parameter on startGenerationAPI
- `src/lib/supabase/storage.ts` - uploadToStorage and getPublicUrl helpers
- `src/app/api/scenes/[id]/illustrate/route.ts` - POST/GET/PUT scene illustration pipeline

## Decisions Made
- Used a new public method `generateSceneIllustration` rather than modifying existing `generateImages`/`startGeneration` to avoid breaking the AIProvider interface contract
- Controlnets and styleUUID are mutually exclusive per Leonardo API docs -- when controlnets are present, styleUUID is omitted from the payload
- Character reference upload failures are handled gracefully (warn and continue) since the generation can proceed with fewer or no controlnets
- Fixed illustration dimensions at 1024x768 (landscape) as the default for scene illustrations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. The endpoint uses existing LEONARDO_API_KEY and Supabase credentials.

## Next Phase Readiness
- Backend visual pipeline is complete, ready for UI panel integration (Plan 02)
- The illustrate endpoint supports the full flow: parse -> assemble -> upload refs -> generate -> poll -> persist
- Storage utility available for reuse across other features

## Self-Check: PASSED

All 5 created files verified on disk. All 3 task commits (ddb5842, 10c1478, 695aa01) verified in git log.

---
*Phase: 09-visual-pipeline*
*Completed: 2026-03-14*
