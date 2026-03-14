---
phase: 10-writing-tools-and-voice
plan: 01
subsystem: api
tags: [anthropic, claude, ai-writing, fiction-tools, token-budgeting, vitest]

# Dependency graph
requires:
  - phase: 07-story-data-and-authoring
    provides: Supabase schema for projects, characters, acts, beats, scenes
provides:
  - WritingToolType union and WRITING_TOOL_PROMPTS for 5 fiction writing tools
  - assembleStoryContext with token budgeting at ~80K tokens
  - formatStoryContextForPrompt for structured markdown context
  - POST /api/ai/writing endpoint calling Claude with specialized prompts
  - getSystemPrompt helper resolving tool type to prompt string
affects: [10-03-PLAN, 10-04-PLAN]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk"]
  patterns: ["Claude API route with Anthropic SDK", "Token-budgeted story context assembly", "TDD with vi.hoisted() for mock factories in Vitest 4"]

key-files:
  created:
    - src/lib/ai/writingPrompts.ts
    - src/lib/ai/storyContext.ts
    - src/app/api/ai/writing/route.ts
    - src/lib/ai/__tests__/writingPrompts.test.ts
    - src/lib/ai/__tests__/storyContext.test.ts
    - src/app/api/ai/writing/__tests__/route.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "Anthropic SDK via @anthropic-ai/sdk with cached client pattern (same as Gemini cached client)"
  - "Validation before client creation so 400s return without API key requirement"
  - "vi.hoisted() for mock functions referenced in vi.mock factories (Vitest 4 hoisting)"
  - "Vitest config updated with @/ path alias for proper module resolution in tests"
  - "Token budget at 80K tokens, truncating oldest prior scenes first while preserving characters/premise/current scene"

patterns-established:
  - "Anthropic SDK route pattern: cached client, input validation, assembleStoryContext, formatStoryContextForPrompt, getSystemPrompt"
  - "Token budgeting: estimate tokens as wordCount / 0.75, cap at 80K, truncate oldest scenes from prior text"

requirements-completed: [WRITE-01, WRITE-02]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 10 Plan 01: AI Writing Tools Backend Summary

**Claude API writing route with 5 specialized fiction prompts (continue/rewrite/expand/show-dont-tell/sensory) and token-budgeted story context assembly at 80K tokens**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T22:17:02Z
- **Completed:** 2026-03-14T22:25:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Writing prompts module with 5 distinct fiction tool types and getSystemPrompt helper
- Story context assembly that queries Supabase for project/characters/beats/scenes and applies token budgeting
- POST /api/ai/writing endpoint with input validation, continue (append) vs transform (replace) mode differentiation, and Claude API integration
- 21 unit tests covering prompt distinctness, token truncation, route validation, and tool dispatch

## Task Commits

Each task was committed atomically:

1. **Task 1: Story context assembly and writing prompts** - `bd39404` (feat)
2. **Task 2: AI writing API route with tests** - `bf36b99` (feat)

## Files Created/Modified
- `src/lib/ai/writingPrompts.ts` - WritingToolType, ContinueLength, WRITING_TOOL_PROMPTS, getSystemPrompt
- `src/lib/ai/storyContext.ts` - StoryContext interface, assembleStoryContext, formatStoryContextForPrompt, token budgeting
- `src/app/api/ai/writing/route.ts` - POST handler with validation, context assembly, Claude API call
- `src/lib/ai/__tests__/writingPrompts.test.ts` - 7 tests for prompt distinctness and content
- `src/lib/ai/__tests__/storyContext.test.ts` - 5 tests for formatting and token budgeting
- `src/app/api/ai/writing/__tests__/route.test.ts` - 9 tests for route validation and tool dispatch
- `vitest.config.ts` - Added @/ path alias to resolve module imports in tests

## Decisions Made
- Used Anthropic SDK (`@anthropic-ai/sdk`) with cached client pattern consistent with existing Gemini client
- Moved input validation before client creation so 400 responses work without API key
- Used `vi.hoisted()` to define mock functions referenced in `vi.mock` factories (Vitest 4 hoists mock factories)
- Added `resolve.alias` with `@/` mapping to vitest.config.ts for proper path resolution in tests
- Token budget set at 80K tokens (not 100K) to leave room for system prompt and response

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @anthropic-ai/sdk dependency**
- **Found during:** Task 2 (API route implementation)
- **Issue:** @anthropic-ai/sdk was not in package.json despite being referenced in the plan
- **Fix:** Ran `npm install @anthropic-ai/sdk`
- **Files modified:** package.json, package-lock.json
- **Verification:** Import succeeds, tests pass
- **Committed in:** bd39404 (Task 1 commit, installed before first use)

**2. [Rule 3 - Blocking] Added @/ path alias to vitest.config.ts**
- **Found during:** Task 2 (route test execution)
- **Issue:** Vitest could not resolve @/ path aliases used in route.ts imports
- **Fix:** Added `resolve.alias` configuration mapping `@` to `src/` directory
- **Files modified:** vitest.config.ts
- **Verification:** All tests pass with proper module resolution
- **Committed in:** bf36b99 (Task 2 commit)

**3. [Rule 1 - Bug] Moved validation before client creation in route handler**
- **Found during:** Task 2 (route test for 400 responses)
- **Issue:** Validation happened after `getClient()` call, meaning 400 responses for invalid input would fail if no API key was set
- **Fix:** Restructured handler to validate request body first, then create client
- **Files modified:** src/app/api/ai/writing/route.ts
- **Verification:** 400 tests pass without API key dependency
- **Committed in:** bf36b99 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and test execution. No scope creep.

## Issues Encountered
- Vitest 4 `vi.mock` factory hoisting requires `vi.hoisted()` for shared mock variables -- resolved by using the hoisted pattern
- Vitest 4 does not support `-x` flag (bail on first failure) -- plan verification command adjusted

## User Setup Required
Set `ANTHROPIC_API_KEY` in `.env.local` to enable the AI writing endpoint. Without this key, the endpoint returns 503.

## Next Phase Readiness
- Writing prompts and context assembly are ready for Plan 03 (TipTap inline diff extension and AI writing toolbar)
- API route ready for integration with frontend UI components
- Story context assembly can be reused by other AI features needing full narrative context

## Self-Check: PASSED

All 7 created files verified present. Both task commits (bd39404, bf36b99) verified in git log.

---
*Phase: 10-writing-tools-and-voice*
*Completed: 2026-03-14*
