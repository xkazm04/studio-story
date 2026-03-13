# Codebase Concerns

**Analysis Date:** 2026-03-13

## Tech Debt

**Stub/Unimplemented Service Functions:**
- Issue: The image analysis service has three completely unimplemented functions returning empty arrays. OpenAI Vision, Gemini Vision, and Groq Vision all return `{ assets: [] }` with TODO comments.
- Files: `src/app/lib/services/imageAnalysis.ts` (lines 47, 73, 99)
- Impact: Any feature relying on multi-model image analysis silently returns no results. Users see empty data with no error indication.
- Fix approach: Implement the three provider functions or remove the module and redirect callers to the working extraction endpoints at `src/app/api/ai/evaluate-image/route.ts` and `src/app/api/image-extraction/`.

**Archetype CRUD Uses Hardcoded Data Instead of API:**
- Issue: `useArchetypes` hook has three TODO markers indicating create, update, and delete operations should call a backend API but currently do not.
- Files: `src/app/hooks/useArchetypes.ts` (lines 72, 84, 110)
- Impact: Custom archetype changes are lost on page refresh; no persistence.
- Fix approach: Create `/api/archetypes` CRUD routes backed by Supabase and wire the hook mutations to them.

**Numerous Unimplemented Feature Stubs (28+ TODOs):**
- Issue: At least 28 TODO comments across the codebase mark features that are stubbed but not implemented. Key gaps include:
  - Voice training/upload: `src/app/features/voice/extraction/VoiceExtraction.tsx` (line 54)
  - Image generation trigger: `src/app/features/image/generator/ImageGenerator.tsx` (line 184)
  - YouTube audio extraction: `src/app/features/datasets/audio/YouTubeAudioSampler.tsx` (line 42)
  - Audio transcription: `src/app/features/datasets/audio/AudioTranscriptions.tsx` (line 41)
  - Script save: `src/app/features/scenes/components/Script/ScriptEditor.tsx` (line 39)
  - Asset deletion: `src/app/features/assets/components/panels/AssetRightPanel.tsx` (line 408)
  - Project rename: `src/app/features/landing/components/LandingCardHeader.tsx` (line 24)
  - Voice casting persistence: `src/workspace/panels/audio/VoiceCastingPanel.tsx` (line 26)
  - Story setting/config save: `src/app/features/story/components/Setup/StorySettingArea.tsx` (line 16), `src/app/features/story/components/Setup/StoryConfigSelect.tsx` (line 73)
  - Relationship force-directed layout: `src/app/features/relationships/RelationshipMap.tsx` (line 118)
  - Scene graph backend fetch: `src/app/hooks/integration/useSceneGraphData.ts` (line 74)
- Impact: Users interact with UI elements that silently do nothing. No error feedback.
- Fix approach: Prioritize stubs by user-facing impact. Implement backend-connected save operations first (script, settings, casting).

**Mixed Database Backends (Supabase + SQLite):**
- Issue: Two API routes use a local SQLite database (`better-sqlite3`) via `DB_PATH` while all other routes use Supabase. This creates an inconsistent data layer.
- Files: `src/app/api/beat-pacing/route.ts` (line 7), `src/app/api/beat-dependencies/route.ts` (line 7)
- Impact: Beat pacing and dependency data is not available in production/deployed environments unless a local SQLite file is provisioned. Data is not backed up. Cannot scale to multiple instances.
- Fix approach: Migrate beat-pacing and beat-dependencies tables to Supabase. Replace `better-sqlite3` calls with `supabaseServer` queries.

**Hardcoded Fallback IDs Throughout:**
- Issue: Multiple components fall back to hardcoded project IDs like `'proj-1'` and mock user IDs when no real selection exists.
- Files: `src/app/features/story/StoryFeature.tsx` (lines 198, 220), `src/workspace/layout/header/ProjectSelector.tsx` (line 10), `src/app/config/mockUser.ts`, `src/app/features/projects/ProjectsFeature.tsx` (line 21), `src/app/features/landing/Landing.tsx` (line 28)
- Impact: In production, operations silently target wrong/nonexistent resources. Mock data leaks into real workflows.
- Fix approach: Replace hardcoded IDs with proper empty-state handling. Show "Select a project" prompts instead of silently using mock data.

## Security Considerations

**No Authentication or Authorization on API Routes:**
- Risk: All 43 API routes are completely unauthenticated. Any client with network access can CRUD all project data, spawn CLI processes, and call AI APIs (consuming API credits).
- Files: All routes under `src/app/api/` — no `middleware.ts` exists at project root or `src/` level.
- Current mitigation: None. The app appears designed for local-only single-user use.
- Recommendations: Add Next.js middleware for auth checks. At minimum, implement API key validation for non-browser clients. The CLI terminal endpoints (`src/app/api/claude-terminal/`) are especially dangerous as they spawn arbitrary shell processes.

**CLI Terminal Spawns Arbitrary Processes:**
- Risk: The `startExecution` function in `src/lib/claude-terminal/cli-service.ts` spawns `claude` CLI processes with user-supplied `prompt` and `projectPath` parameters. The SSE stream endpoint at `src/app/api/claude-terminal/stream/route.ts` accepts these as query parameters with no auth.
- Files: `src/lib/claude-terminal/cli-service.ts` (line 170), `src/app/api/claude-terminal/stream/route.ts` (line 31)
- Current mitigation: None. The path and prompt are `decodeURIComponent`-ed but not sanitized.
- Recommendations: Restrict `projectPath` to an allowlist. Add authentication. Rate-limit session creation.

**Service Role Key Used for All Server Operations:**
- Risk: `supabaseServer` uses the service role key which bypasses all Row Level Security. Every API route operates with full admin access.
- Files: `src/lib/supabase/server.ts` (line 20)
- Current mitigation: `getSupabaseForUser()` exists (line 31) but is never called by any API route.
- Recommendations: Use `getSupabaseForUser()` in API routes once auth is added. Reserve service role client for admin-only operations.

**Non-Null Assertions on Environment Variables:**
- Risk: `process.env.NEXT_PUBLIC_SUPABASE_URL!` and similar use TypeScript non-null assertions. If env vars are missing, runtime crashes with unhelpful errors.
- Files: `src/lib/supabase/server.ts` (lines 9-10), `src/lib/supabase/client.ts` (lines 8-9)
- Current mitigation: Runtime checks exist on lines 12-14 of both files, but the assertions on lines 9-10 execute first during module initialization.
- Recommendations: Remove `!` assertions; the runtime check handles the missing case already.

**Hardcoded Mock User UUID in Production Code:**
- Risk: `MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000'` is used as a default across the app, meaning all data is attributed to a single fake user.
- Files: `src/app/config/mockUser.ts`, `src/workspace/layout/header/ProjectSelector.tsx` (line 10)
- Current mitigation: Can be overridden via `NEXT_PUBLIC_MOCK_USER_ID` env var.
- Recommendations: Remove mock user from production builds. Gate behind `USE_MOCK_DATA` flag.

## Performance Bottlenecks

**Oversized Components:**
- Problem: Several components exceed 1000 lines, indicating monolithic UI code with likely excessive re-renders.
- Files:
  - `src/app/sound-lab/components/sound-designer/TimelineMixer.tsx` (1761 lines)
  - `src/app/lib/ai/providers/leonardo.ts` (1257 lines)
  - `src/lib/hierarchy/HierarchyEngine.ts` (1216 lines)
  - `src/app/features/characters/sub_CharFactions/DiplomacyPanel.tsx` (1151 lines)
  - `src/lib/editor/ColorCorrection.ts` (1125 lines)
  - `src/app/features/story/sub_StoryScript/StoryScript.tsx` (1124 lines)
  - `src/app/sound-lab/components/composer/ComposerTab.tsx` (1110 lines)
- Cause: No component decomposition discipline. State changes in any part re-render entire 1000+ line trees.
- Improvement path: Extract sub-components, memoize expensive renders with `React.memo`, and use `useMemo`/`useCallback` for derived state.

**170+ Files Using useEffect:**
- Problem: Heavy reliance on `useEffect` (170 files, 43+ instances of `useEffect(() => {`) suggests widespread side-effect-driven patterns that are hard to optimize and debug.
- Files: Throughout `src/` — heaviest in `src/agents/AdvisorOverlay.tsx` (7 useEffects), `src/workspace/components/WorkspaceToolbar.tsx` (4 useEffects), `src/cli/CompactTerminal.tsx` (4 useEffects)
- Cause: No established pattern for data fetching lifecycle; effects used where React Query or event handlers would suffice.
- Improvement path: Audit useEffect calls in hot paths. Replace data-fetching effects with React Query. Replace event-driven effects with proper event handlers.

**100+ Files Using Direct fetch():**
- Problem: Around 100 files call `fetch()` directly rather than through a centralized API client or React Query.
- Files: Spread across `src/` — not enumerated individually.
- Cause: No enforced pattern for API communication.
- Improvement path: Route all API calls through the existing `src/app/utils/api.ts` utility or React Query hooks. This enables centralized caching, retry logic, and error handling.

**Excessive localStorage Usage:**
- Problem: Multiple systems independently read/write localStorage (Zustand stores, brainstorm sessions, upload retry state, asset usage tracking, collapsed nodes). No size management or eviction.
- Files: `src/workspace/store/workspaceStore.ts`, `src/workspace/store/terminalDockStore.ts`, `src/workspace/store/commandBarStore.ts`, `src/agents/store/advisorMemoryStore.ts`, `src/lib/brainstorm/IdeaGenerator.ts`, `src/lib/upload/RetryManager.ts`, `src/lib/assets/UsageTracker.ts`
- Cause: Each subsystem independently chose localStorage persistence without coordination.
- Improvement path: Audit total localStorage usage. Add eviction policies. Consider IndexedDB for large data (brainstorm sessions, upload state).

## Fragile Areas

**CLI Terminal Service with globalThis Hack:**
- Files: `src/lib/claude-terminal/cli-service.ts` (lines 101-110)
- Why fragile: Uses `globalThis` casting to persist a `Map<string, CLIExecution>` across Next.js hot module reloads. This is a workaround for dev-mode module re-evaluation but leaks child processes if the map reference is lost.
- Safe modification: Never change the `globalForExecutions` key name. Always clean up processes on execution completion/abort.
- Test coverage: No tests exist for cli-service.

**Advisor System (Multi-Turn Server-Side Tool Loop):**
- Files: `src/app/api/agents/advisor/route.ts`, `src/agents/AdvisorClient.ts`, `src/agents/useAdvisor.ts`, `src/agents/AdvisorOverlay.tsx`
- Why fragile: The advisor route executes a multi-turn loop calling Gemini and executing server-side tools. If Gemini returns unexpected tool calls or the loop condition is wrong, it could hang or loop indefinitely.
- Safe modification: Always test with both text-only and tool-calling responses. Verify the loop has a bounded iteration limit.
- Test coverage: No tests.

**eslint-disable Suppression of React Hook Rules:**
- Files: `src/agents/AdvisorOverlay.tsx` (line 241), `src/cli/InlineTerminal.tsx` (line 337), `src/cli/CompactTerminal.tsx` (lines 269, 364, 425), `src/app/features/assistant/AIAssistantPanel.tsx` (line 84), `src/workspace/panels/assistant/AdvisorPanel.tsx` (line 177)
- Why fragile: Suppressed `react-hooks/exhaustive-deps` warnings indicate effects with missing dependencies. These cause stale closures and hard-to-reproduce bugs.
- Safe modification: Audit each suppression. Add the missing deps or restructure the effect.
- Test coverage: No tests for these components.

**Scene Editor Context with Mock Data Fallback:**
- Files: `src/app/features/story/StoryFeature.tsx` (lines 193-228)
- Why fragile: `SceneEditorWrapper` and `SceneGraphWrapper` fall back to `'proj-1'` and hardcoded `MOCK_SCENES`/`MOCK_CHOICES`. Any change to mock data structure breaks the editor silently.
- Safe modification: Always verify mock data matches the expected types. Better: eliminate mock fallback and use proper empty states.
- Test coverage: No tests.

## Scaling Limits

**In-Memory CLI Execution Map:**
- Current capacity: All active CLI executions stored in a `Map` in Node.js process memory.
- Limit: Memory grows linearly with concurrent executions. Events array per execution is unbounded.
- Scaling path: Add max concurrent execution limit. Implement event pruning for long-running executions. Consider external state store for multi-instance deployment.

**Single Supabase Client Instance (Server):**
- Current capacity: Single `supabaseServer` client shared across all API routes.
- Limit: Supabase connection pooling handles moderate load, but service role bypass of RLS means no per-user data isolation.
- Scaling path: Implement per-request client creation with user context once auth is added.

## Dependencies at Risk

**better-sqlite3 in a Next.js Serverless Context:**
- Risk: `better-sqlite3` is a native C++ addon. It does not work in Vercel/serverless deployments, Edge runtime, or Docker images without native build tools.
- Impact: Beat pacing and beat dependency features break in any non-local deployment.
- Migration plan: Move these tables to Supabase. Remove `better-sqlite3` dependency.

**@google/genai SDK (Alpha/Beta APIs):**
- Risk: The advisor and voice features use `@google/genai` with `apiVersion: 'v1alpha'` for live tokens. Alpha APIs can break without notice.
- Impact: Voice mode and live token generation could stop working after a Gemini API update.
- Migration plan: Monitor Gemini API changelog. Pin SDK version. Have fallback to text-only advisor mode (already exists).

## Test Coverage Gaps

**Near-Zero Test Coverage:**
- What's not tested: Only 9 test files exist in the entire codebase, all within `src/app/lib/ai/__tests__/` and `src/lib/coordination/__tests__/`. Zero tests for:
  - All 43 API routes
  - All workspace/panel components
  - All Zustand stores
  - The CLI terminal service
  - The advisor system
  - All feature components
  - The layout engine
  - The MCP server tools
- Files: Test files at `src/app/features/relationships/types/__tests__/`, `src/app/lib/ai/__tests__/`, `src/lib/coordination/__tests__/`
- Risk: Any refactoring or feature change can silently break existing functionality. The large monolithic components (1000+ lines) are especially risky to modify without tests.
- Priority: High. Start with API route integration tests and Zustand store unit tests, as these represent core data flow.

**No E2E Tests:**
- What's not tested: No Playwright, Cypress, or similar E2E framework detected. The single-page workspace app with dynamic panel composition is the primary user interaction surface and has zero automated UI testing.
- Risk: Layout regressions, panel interaction bugs, and keyboard shortcut conflicts go undetected.
- Priority: Medium. Add E2E smoke tests for core workflows (project creation, panel composition, scene editing).

## Missing Critical Features

**No Authentication System:**
- Problem: No user authentication, session management, or identity provider integration exists.
- Blocks: Multi-user support, data isolation, production deployment, API security.

**No Input Validation on AI Endpoints:**
- Problem: AI-facing API routes (`/api/agents/advisor`, `/api/ai/*`) accept arbitrary prompts and payloads without size limits, content filtering, or schema validation.
- Files: `src/app/api/agents/advisor/route.ts`, `src/app/api/ai/gemini/route.ts`, `src/app/api/ai/generate-images/route.ts`
- Blocks: Safe production deployment. Unbounded request bodies can cause OOM or excessive AI API costs.

**No API Rate Limiting (Server-Side):**
- Problem: Client-side rate limiting exists (`src/app/utils/rateLimiter.ts`) but no server-side rate limiting protects API routes.
- Blocks: Protection against abuse, cost control for AI API calls.

---

*Concerns audit: 2026-03-13*
