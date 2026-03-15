# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack (localhost:3000)
npm run build        # Production build with Turbopack
npm run lint         # ESLint (flat config, no args needed)
npm test             # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npm run build:mcp    # Compile MCP server to dist/mcp-server/
npm run mcp-server   # Run compiled MCP server (requires build:mcp first)
```

## Architecture

**Single-page Next.js 16 app** (App Router) — no routing. The entire UI is a dynamic workspace at `/` where navigation happens by swapping panels, not changing URLs.

### Data Flow

```
Claude Code CLI ──stdio──> MCP Server (Node.js) ──HTTP──> Next.js API Routes ──> Supabase
                                                           src/app/api/
Browser UI ──React Query──> Next.js API Routes ──> Supabase
```

- **API routes** (`src/app/api/`) — RESTful CRUD for all entities (characters, scenes, acts, beats, factions, traits, relationships, voices)
- **MCP server** (`src/mcp-server/`) — Separate Node.js process, built independently with its own `tsconfig.json`. Calls the same API routes over HTTP. Configured via `.mcp.json` with `STORY_BASE_URL` and `STORY_PROJECT_ID` env vars.
- **Supabase** — Database + storage. Client (`src/lib/supabase/client.ts`) for browser, server client (`src/lib/supabase/server.ts`) with service role for API routes.

### Workspace Panel System

The core UI paradigm. Panels are dynamically composed into CSS Grid layouts.

- **Panel Registry** (`src/workspace/engine/panelRegistry.ts`) — 25+ panel types, all lazy-loaded. Each has a type, defaultRole, sizeClass, and domains.
- **Layout Engine** (`src/workspace/engine/layoutEngine.ts`) — 7 grid templates (single, split-2, split-3, grid-4, primary-sidebar, triptych, studio). Uses permutation-based scoring to assign panels to slots based on size constraints and role matching.
- **Panel Manifests** (`src/manifest/`) — Machine-readable descriptions of panel capabilities, inputs, and outputs. Used by the LLM to decide which panels to compose via the `compose_workspace` MCP tool.
- **Workspace Store** (`src/workspace/store/workspaceStore.ts`) — Zustand store managing visible panels, layout, and terminal-panel snapshots. Persisted to localStorage.

Panel categories: scene, character, story, image, voice/audio, agent (advisor).

### State Management

- **Zustand** — Local/UI state. Stores use slice pattern with `persist` middleware (localStorage). Key stores: `workspaceStore`, `terminalDockStore`, `projectStore`, `characterStore`.
- **React Query** — Server state. Configured with 30s staleTime, no refetch on window focus. Provider in `src/app/providers.tsx`.

### Key Directories

- `src/workspace/` — Layout engine, panel components, stores, hooks for the workspace system
- `src/workspace/panels/` — Panel implementations organized by domain (scene/, character/, story/, image/, audio/, assistant/)
- `src/app/api/` — All Next.js API route handlers
- `src/app/features/` — Feature modules (acts, characters, scenes, etc.)
- `src/app/store/` — Zustand store slices
- `src/mcp-server/tools/` — MCP tool implementations (characters, factions, images, scenes, story-structure, workspace)
- `src/manifest/` — Panel manifest definitions
- `src/lib/` — Core libraries (supabase, audio, coordination, services)

## Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Design system**: CSS custom properties with `--ms-` prefix (dark slate/cyan theme). Defined in `src/app/globals.css`. Use these variables and corresponding utility classes over raw Tailwind colors for theme consistency.
- **Dark mode only**: `<html>` has `dark` class. Background is `bg-slate-950`, text is `text-slate-100`.
- **Panel structure**: New panels need a registry entry in `panelRegistry.ts`, a manifest in `src/manifest/panelManifests.ts`, and a lazy-loaded component in `src/workspace/panels/{domain}/`.
- **Icons**: Lucide React (`lucide-react`)
- **TypeScript strict mode** enabled

## Environment Variables

Copy `.env.example` to `.env.local`. Required: Supabase URL/keys. Optional: `GEMINI_API_KEY` for AI advisor, `NEXT_PUBLIC_USE_MOCK_DATA=true` to bypass Supabase.
