# Architecture

**Analysis Date:** 2026-03-13

## Pattern Overview

**Overall:** Single-page workspace application with dynamic panel composition, backed by a RESTful API layer over Supabase.

**Key Characteristics:**
- No client-side routing -- the entire app is a single page at `/` that swaps panels dynamically via a workspace engine
- Two-path data access: Browser UI uses React Query through Next.js API routes; Claude Code CLI uses an MCP server that either queries Supabase directly or calls the same API routes over HTTP
- LLM-driven UI composition: panel manifests describe capabilities in machine-readable form so an AI advisor can dynamically compose workspace layouts
- CSS Grid layout engine with Hungarian algorithm for optimal panel-to-slot assignment

## Layers

**Presentation Layer (Workspace):**
- Purpose: Renders the dynamic panel-based UI, manages layout, and handles user interaction
- Location: `src/workspace/`
- Contains: Layout engine, panel registry, panel components, grid rendering, workspace stores, keyboard shortcuts, focus tracking
- Depends on: Feature components (`src/app/features/`), UI primitives (`src/app/components/UI/`), Zustand stores, React Query
- Used by: Root page (`src/app/page.tsx`)

**Feature Layer:**
- Purpose: Domain-specific UI components for characters, scenes, story, images, voice, etc.
- Location: `src/app/features/`
- Contains: Complex feature components organized by domain with sub-features prefixed `sub_`
- Depends on: UI components (`src/app/components/UI/`), hooks, stores, types
- Used by: Workspace panels (`src/workspace/panels/`)

**Panel Adapter Layer:**
- Purpose: Bridges between the workspace panel system and legacy/feature components using a standardized primitive interface
- Location: `src/workspace/panels/primitives/adapters/`
- Contains: Adapter components created via `createAdapter.tsx` factory, plus 7 primitive components (DataList, CardGrid, TreeView, DetailView, ConversationView, MediaViewer, LazyContainer)
- Depends on: Feature components, primitive components, selection bus
- Used by: Panel registry (`src/workspace/engine/panelRegistry.ts`)

**API Layer:**
- Purpose: RESTful CRUD endpoints for all entities, plus AI service proxies
- Location: `src/app/api/`
- Contains: Next.js App Router route handlers organized by entity type
- Depends on: Supabase server client (`src/lib/supabase/server.ts`), error handling utilities
- Used by: React Query hooks (browser), MCP server (CLI)

**MCP Server Layer:**
- Purpose: Provides Claude Code CLI access to project data via stdio transport
- Location: `src/mcp-server/`
- Contains: Tool registrations, config parsing, HTTP client for AI tools, direct Supabase access for CRUD
- Depends on: `@modelcontextprotocol/sdk`, Supabase (direct), API routes (for image/AI tools)
- Used by: Claude Code CLI over stdio

**Agent Layer:**
- Purpose: AI advisor system using Gemini for intelligent workspace assistance
- Location: `src/agents/`
- Contains: AdvisorClient (HTTP), GeminiLiveClient (WebSocket voice), AudioIOManager, agent store, memory store
- Depends on: API routes (`/api/agents/advisor`, `/api/agents/live-token`), workspace store, command bar store
- Used by: AdvisorOverlay component, workspace hooks

**Manifest Layer:**
- Purpose: Machine-readable panel descriptions consumed by LLM for dynamic composition
- Location: `src/manifest/`
- Contains: Panel manifest definitions with capabilities, inputs, outputs, density modes, data slice examples
- Depends on: Workspace types
- Used by: Panel registry, MCP `compose_workspace` tool, advisor system prompt

**Shared Libraries:**
- Purpose: Cross-cutting utilities and service clients
- Location: `src/lib/`
- Contains: Supabase clients, audio processing, image processing, context engine, coordination, recommendations, and 20+ domain-specific modules
- Depends on: External SDKs (Supabase, etc.)
- Used by: All layers

## Data Flow

**Browser UI Flow:**

1. User interacts with a workspace panel
2. Panel component calls a React Query hook (configured in `src/app/providers.tsx` with 30s staleTime)
3. React Query fetches from Next.js API route (`src/app/api/`)
4. API route uses `supabaseServer` (`src/lib/supabase/server.ts`) with service role key to query Supabase
5. Response flows back through React Query cache to component

**MCP CLI Flow:**

1. Claude Code sends tool call via stdio to MCP server (`src/mcp-server/index.ts`)
2. MCP server routes to registered tool handler (`src/mcp-server/tools/`)
3. CRUD tools query Supabase directly via `src/mcp-server/db.ts`; Image/AI tools call API routes over HTTP via `StoryHttpClient`
4. Response returns to Claude Code over stdio

**Panel Composition Flow:**

1. LLM (advisor or MCP `compose_workspace` tool) receives serialized panel manifests via `serializeManifestsForLLM()` (`src/manifest/index.ts`)
2. LLM decides which panels to show, their roles, densities, and data slices
3. `PanelDirective[]` array is passed to `workspaceStore.replaceAllPanels()` or `showPanels()`
4. Layout engine (`src/workspace/engine/layoutEngine.ts`) resolves optimal layout using Hungarian algorithm
5. `WorkspaceGrid` (`src/workspace/components/WorkspaceGrid.tsx`) renders CSS Grid with assigned panels
6. `WorkspacePanelWrapper` lazy-loads panel component from registry and passes density/dataSlice props

**State Management:**
- **Zustand stores** for local/UI state, persisted to localStorage:
  - `src/workspace/store/workspaceStore.ts` -- panels, layout, snapshots, focus
  - `src/workspace/store/commandBarStore.ts` -- command bar expansion state
  - `src/workspace/store/terminalDockStore.ts` -- terminal session management
  - `src/app/store/slices/projectSlice.ts` -- selected project/act/scene
  - `src/app/store/slices/characterSlice.ts` -- selected character state
  - `src/agents/store/agentStore.ts` -- advisor messages, suggestions, connection state
  - `src/agents/store/advisorMemoryStore.ts` -- advisor memory/context
- **React Query** for server state (queries to API routes), configured in `src/app/providers.tsx`

## Key Abstractions

**Panel Registry:**
- Purpose: Maps panel types to lazy-loaded components with metadata (size, role, complexity, domains)
- Examples: `src/workspace/engine/panelRegistry.ts`
- Pattern: Record lookup by `WorkspacePanelType` string literal. Each entry has `importFn` for code splitting.

**Layout Engine:**
- Purpose: Scores and assigns panels to CSS Grid slots across 8 layout templates
- Examples: `src/workspace/engine/layoutEngine.ts`
- Pattern: Hungarian algorithm (O(n^3)) for panel-to-slot assignment. Scoring considers size compatibility, role matching, complexity-slot fitness. Viewport-aware with responsive breakpoints (768/1024/1280px).

**Panel Manifests:**
- Purpose: Machine-readable descriptions enabling LLM-driven workspace composition
- Examples: `src/manifest/panelManifests.ts`, `src/manifest/types.ts`
- Pattern: Each manifest declares capabilities, input schemas, outputs, use cases, density modes, and data slice examples

**Panel Primitives:**
- Purpose: Reusable UI building blocks for panels -- DataList, CardGrid, TreeView, DetailView, ConversationView, MediaViewer, LazyContainer
- Examples: `src/workspace/panels/primitives/DataList.tsx`, `src/workspace/panels/primitives/CardGrid.tsx`
- Pattern: Generic components with `BasePrimitiveProps` including `density?: PanelDensity`. Adapters in `adapters/` bridge these to specific domain data.

**PanelFrame:**
- Purpose: Standard panel chrome with header, close/minimize, density-aware rendering
- Examples: `src/workspace/panels/shared/PanelFrame.tsx`
- Pattern: Wraps all panel content. Micro density hides header; compact shrinks it to 24px; full shows 32px header with actions.

**API Error Handling:**
- Purpose: Standardized error responses across all API routes
- Examples: `src/app/utils/apiErrorHandling.ts`
- Pattern: `createErrorResponse()`, `handleDatabaseError()`, `handleUnexpectedError()`, `validateRequiredParams()` -- all return `NextResponse<ErrorResponse>`.

## Entry Points

**Browser (Single Page):**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/`
- Responsibilities: Renders `V2Layout` which composes `WorkspaceHeader` + `WorkspaceArea` + `CommandBar`

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Sets up fonts (Geist), dark mode class on `<html>`, wraps with `Providers` (React Query + Toast)

**V2Provider (Workspace Init):**
- Location: `src/workspace/V2Provider.tsx`
- Triggers: On mount within V2Layout
- Responsibilities: Activates keyboard shortcuts (`useWorkspaceKeyboard`), responsive layout enforcement (`useResponsiveLayout`), panel focus tracking (`usePanelFocusTracking`)

**MCP Server:**
- Location: `src/mcp-server/index.ts`
- Triggers: `npm run mcp-server` (compiled to `dist/mcp-server/`)
- Responsibilities: Parses config, initializes direct DB access, creates McpServer, registers 30+ tools, connects stdio transport

**API Routes:**
- Location: `src/app/api/` (20+ route directories)
- Triggers: HTTP requests from browser (React Query) or MCP server
- Responsibilities: CRUD for all entities (projects, characters, scenes, acts, beats, factions, traits, relationships, voices, datasets), AI service proxies (Gemini, Leonardo), terminal streaming

## Error Handling

**Strategy:** Centralized error utilities for API routes; try-catch with standardized responses

**Patterns:**
- API routes use `handleDatabaseError()` for Supabase errors, `handleUnexpectedError()` for catch-all, `validateRequiredParams()` for input validation -- all in `src/app/utils/apiErrorHandling.ts`
- `apiHandler()` wrapper available for automatic try-catch on entire route handlers
- Supabase error details (code, hint, message) are forwarded in API responses so MCP tools get actionable error messages
- Logger utility in `src/app/utils/apiErrorHandling.ts` only logs in development mode; no production logging service integrated yet

## Cross-Cutting Concerns

**Logging:** Development-only `logger` utility in `src/app/utils/apiErrorHandling.ts`. MCP server uses `console.error` for startup/diagnostic messages. No production logging service.

**Validation:** `validateRequiredParams()` in API routes for parameter checking. Zod available as dependency but not widely used for API input validation.

**Authentication:** Service role key for all API route DB access (bypasses RLS). `getSupabaseForUser()` exists in `src/lib/supabase/server.ts` for user-scoped access but is not widely used. No auth middleware on API routes.

**State Persistence:** Workspace store persists panels/layout to localStorage. Terminal dock store persists sessions. Project store persists selections.

**Code Splitting:** All 29 panel types are lazy-loaded via dynamic `import()` in panel registry. `React.lazy()` + `Suspense` in `WorkspacePanelWrapper`.

**Theming:** CSS custom properties with `--ms-` prefix in `src/app/globals.css`. Dark-mode-only. Accent color system in `src/workspace/theme/tokens.ts`.

---

*Architecture analysis: 2026-03-13*
