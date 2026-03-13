# External Integrations

**Analysis Date:** 2026-03-13

## APIs & External Services

**Google Gemini AI:**
- Purpose: AI advisor (text + voice), vision analysis, story intelligence, art style extraction
- SDK: `@google/genai` ^1.35.0
- Auth: `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` (both must be set with same value)
- Models used:
  - `gemini-3-flash-preview` - Default for text generation and vision (`src/app/lib/ai/providers/gemini.ts`)
  - `gemini-2.0-flash-live-001` - Voice mode via WebSocket (`src/agents/GeminiLiveClient.ts`)
- Endpoints:
  - HTTP advisor proxy: `src/app/api/agents/advisor/route.ts` - Server-side Gemini calls with function declarations, multi-turn tool loop
  - Ephemeral token: `src/app/api/agents/live-token/route.ts` - Generates short-lived tokens for voice WebSocket (v1alpha API)
  - Story architect: `src/app/api/ai/story-architect/route.ts` - Beat classification, act recommendations, pacing analysis
  - General Gemini: `src/app/api/ai/gemini/route.ts` - Generic text generation
  - Image evaluation: `src/app/api/ai/evaluate-image/route.ts` - Gemini Vision image quality scoring
  - Image extraction: `src/app/api/image-extraction/gemini/route.ts` - Structured data extraction from images (characters, scenes, art style)
  - Art style extraction: `src/app/api/ai/art-style/extract/route.ts` - Gemini Vision art style analysis
- WebSocket URLs:
  - `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent` (direct API key)
  - `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent` (ephemeral token)

**Leonardo AI:**
- Purpose: Image generation (text-to-image, inpainting, video generation)
- SDK: Custom HTTP client (`src/app/lib/ai/providers/leonardo.ts`) - no official SDK
- Auth: `LEONARDO_API_KEY`
- Base URLs: `https://cloud.leonardo.ai/api/rest/v1` and `https://cloud.leonardo.ai/api/rest/v2`
- Models: Lucide Origin (`7b592283-e8a7-4c5a-9ba6-d18c31f258b9`), Leonardo Diffusion XL (for inpainting), Seedance 1.0 Pro Fast (video)
- Image CDN: `cdn.leonardo.ai` (configured in `next.config.ts` remote patterns)
- API route: `src/app/api/ai/generate-images/route.ts`
- Features: Async generation with polling (2s intervals, 60 max attempts for images, 120 for video)

**Anthropic (Claude):**
- Purpose: Text generation provider (character consistency checks)
- SDK: Raw HTTP via `fetch` to `https://api.anthropic.com/v1/messages` (`src/app/lib/ai/providers/claude.ts`)
- Auth: `ANTHROPIC_API_KEY`
- Default model: `claude-sonnet-4-5-20250929`
- Also used indirectly via Claude Code CLI (terminal integration)

**Claude Code CLI:**
- Purpose: In-app terminal for AI-assisted coding/story tasks
- Integration: Spawns `claude` CLI process via `child_process.spawn` (`src/lib/claude-terminal/cli-service.ts`)
- Communication: Stream-JSON output parsing (system, assistant, user, result message types)
- API routes:
  - `src/app/api/claude-terminal/stream/route.ts` - SSE stream for real-time CLI execution
  - `src/app/api/claude-terminal/sessions/route.ts` - Session management
  - `src/app/api/claude-terminal/mcp-health/route.ts` - MCP connection health check

## Unified AI Provider System

**Location:** `src/app/lib/ai/`

**Architecture:** Provider abstraction with fallback chains, circuit breakers, rate limiting, caching, cost tracking, and retry logic.

- `src/app/lib/ai/unified-provider.ts` - Orchestrates all AI providers
- `src/app/lib/ai/providers/claude.ts` - Claude adapter
- `src/app/lib/ai/providers/gemini.ts` - Gemini adapter
- `src/app/lib/ai/providers/leonardo.ts` - Leonardo adapter
- `src/app/lib/ai/circuit-breaker.ts` - Per-provider circuit breaker
- `src/app/lib/ai/rate-limiter.ts` - Request rate limiting
- `src/app/lib/ai/cache.ts` - Response caching
- `src/app/lib/ai/cost-tracker.ts` - Usage/cost tracking
- `src/app/lib/ai/retry.ts` - Retry with backoff

**Default fallback chains:**
- Vision: Gemini only
- Image generation: Leonardo only
- Text generation: Deprecated in unified provider (handled by CLI skills)

## Data Storage

**Primary Database — Supabase (PostgreSQL):**
- Connection (browser): `src/lib/supabase/client.ts` - Anon key, persistent session
- Connection (server): `src/lib/supabase/server.ts` - Service role key, bypasses RLS
- Connection (MCP): `src/mcp-server/db.ts` - Direct Supabase client (eliminates HTTP double-hop)
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Tables: projects, characters, scenes, acts, beats, factions, traits, relationships, voices, datasets, dataset_images, beat_dependencies, beat_pacing, beat_scene_mappings, faction_relationships, project_stats
- Type definitions: `src/lib/supabase/database.types.ts`

**File Storage — Supabase Storage:**
- Purpose: Character avatars, scene images, dataset images, generated assets
- CDN pattern: `**.supabase.co/storage/v1/object/public/**` (configured in `next.config.ts`)
- Note: Base64 data URLs from Gemini must be uploaded to Storage first (btree index limit)

**Local SQLite (MCP fallback):**
- Package: `better-sqlite3` ^12.6.2
- Purpose: Fallback when Supabase is unavailable in MCP server context

**Client-Side Persistence:**
- Zustand stores with `persist` middleware → `localStorage`
- Key stores: `workspaceStore`, `terminalDockStore`, `commandBarStore`

**Caching:**
- AI response cache: In-memory with TTL (`src/app/lib/ai/cache.ts`)
- React Query: 30s staleTime, no window focus refetch (`src/app/providers.tsx`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in) with persistent session and auto-refresh
- Development bypass: `NEXT_PUBLIC_MOCK_USER_ID` env var for dev without auth
- Server-side: Service role key bypasses RLS; `getSupabaseForUser()` in `src/lib/supabase/server.ts` supports per-user RLS via `X-User-Id` header

## MCP (Model Context Protocol) Server

**Purpose:** Enables Claude Code CLI to interact with the Studio Story app
- Location: `src/mcp-server/`
- Transport: stdio (configured in `.mcp.json`)
- Compiled independently: `npm run build:mcp` → `dist/mcp-server/index.js`
- Tools: `src/mcp-server/tools/` — characters, factions, images, scenes, story-structure, workspace, projects
- Config: `src/mcp-server/config.ts` reads `STORY_BASE_URL`, `STORY_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Dual access path: Direct Supabase queries (preferred, 50-70% faster) with HTTP fallback to Next.js API routes

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, DataDog, etc.)

**Logs:**
- `console.error` / `console.log` throughout
- AI provider errors tracked via circuit breaker state (`src/app/lib/ai/circuit-breaker.ts`)
- Cost tracking per provider (`src/app/lib/ai/cost-tracker.ts`)

## CI/CD & Deployment

**Hosting:**
- Not configured (local development; Vercel-compatible via Next.js)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no `Jenkinsfile`, etc.)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-only)

**Optional env vars:**
- `GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` - Google AI (both should be set to same value)
- `LEONARDO_API_KEY` - Leonardo AI image generation
- `ANTHROPIC_API_KEY` - Claude text generation
- `NEXT_PUBLIC_API_BASE_URL` - API base URL (default: `http://localhost:3001/api`)
- `NEXT_PUBLIC_USE_MOCK_DATA` - `true` to bypass Supabase entirely
- `NEXT_PUBLIC_MOCK_USER_ID` - UUID for dev without auth
- `STORY_BASE_URL` - MCP server target (default: `http://localhost:3000`)
- `STORY_PROJECT_ID` - Active project for MCP tools

**Secrets location:**
- `.env` / `.env.local` (local development, gitignored)
- `.mcp.json` (contains Supabase service role key — should be gitignored but is currently tracked)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Leonardo AI polling (GET generation status) — not a webhook, but async polling pattern at 2s intervals

---

*Integration audit: 2026-03-13*
