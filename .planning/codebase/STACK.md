# Technology Stack

**Analysis Date:** 2026-03-13

## Languages

**Primary:**
- TypeScript (strict mode) - All application code, both browser and server

**Secondary:**
- CSS (Tailwind v4 + CSS custom properties) - Styling via `src/app/globals.css`
- JavaScript - Minimal (config files: `postcss.config.mjs`, `eslint.config.mjs`)

## Runtime

**Environment:**
- Node.js (no `.nvmrc` — version not pinned)
- Browser (React 19 SPA)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.1 (`next`) - App Router, single-page workspace app at `/`
- React 19.2.3 (`react`, `react-dom`) - UI framework
- Tailwind CSS 4 (`tailwindcss`, `@tailwindcss/postcss`) - Utility-first styling

**Testing:**
- Vitest 4.0.4 (`vitest`) - Unit/integration test runner (no dedicated config file; configured via CLI)

**Build/Dev:**
- Turbopack - Dev server and production builds (`next dev --turbopack`, `next build --turbopack`)
- TypeScript 5 (`typescript`) - Type checking
- ESLint 9 with flat config (`eslint.config.mjs`) - Linting (extends `eslint-config-next`)
- PostCSS (`postcss.config.mjs`) - CSS processing with `@tailwindcss/postcss` plugin

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.76.1 - Database client (browser + server)
- `@google/genai` ^1.35.0 - Gemini AI SDK (advisor, vision, text generation)
- `openai` ^6.22.0 - Anthropic-compatible API calls (Claude provider uses raw HTTP, but OpenAI SDK imported in `src/app/lib/services/characterConsistency.ts`)
- `@modelcontextprotocol/sdk` ^1.27.1 - MCP server protocol for Claude Code CLI integration
- `zustand` ^5.0.8 - Client-side state management with persist middleware
- `@tanstack/react-query` ^5.90.5 - Server state management (30s staleTime, no refetchOnWindowFocus)
- `zod` ^4.1.12 - Schema validation

**UI/UX:**
- `framer-motion` ^12.23.24 - Animations and transitions
- `lucide-react` ^0.548.0 - Icon library (sole icon source)
- `reactflow` ^11.11.4 - Graph/node visualization (relationship maps, scene graphs, dependency graphs)
- `@hello-pangea/dnd` ^18.0.1 - Drag and drop
- `@tiptap/react` ^3.10.1 + `@tiptap/starter-kit` + `@tiptap/pm` - Rich text editor
- `react-resizable-panels` ^3.0.6 - Resizable panel layouts
- `@tanstack/react-virtual` ^3.13.21 - Virtualized lists
- `@radix-ui/react-switch` ^1.2.6, `@radix-ui/react-label` ^2.1.7 - Accessible primitives
- `focus-trap-react` ^12.0.0 - Modal focus management
- `clsx` ^2.1.1, `tailwind-merge` ^3.3.1 - Conditional class composition
- `dagre` ^0.8.5 - Graph layout algorithm (used with ReactFlow)
- `canvas-confetti` ^1.9.4 - Celebration animations

**Audio/Music:**
- `tone` ^15.1.22 - Web Audio framework
- `@spotify/basic-pitch` ^1.0.1 - Audio pitch detection
- `essentia.js` ^0.1.3 - Audio feature extraction
- `@tonejs/midi` ^2.0.28 - MIDI parsing
- `spessasynth_core` ^4.1.5 - SoundFont synthesis

**Infrastructure:**
- `rxjs` ^7.8.2 - Reactive event streams
- `date-fns` ^4.1.0 - Date manipulation
- `uuid` ^13.0.0 - UUID generation
- `better-sqlite3` ^12.6.2 - Local SQLite (MCP server fallback)
- `pg` ^8.18.0 (devDependency) - PostgreSQL client for migrations

## TypeScript Configuration

**Main app (`tsconfig.json`):**
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode: enabled
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`
- Incremental compilation: enabled

**MCP server (`src/mcp-server/tsconfig.json`):**
- Target: ES2022
- Module: NodeNext (standalone Node.js process)
- Output: `dist/mcp-server/`
- Compiled separately via `npm run build:mcp`

## Configuration

**Environment:**
- `.env` / `.env.local` - Runtime secrets (copy from `.env.example`)
- `.mcp.json` - MCP server configuration (stdio transport, env vars for project ID and Supabase credentials)
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` (both must be set for full AI), `LEONARDO_API_KEY`, `ANTHROPIC_API_KEY`
- Mock mode: `NEXT_PUBLIC_USE_MOCK_DATA=true` bypasses Supabase

**Build:**
- `next.config.ts` - Image remote patterns (Leonardo CDN, Supabase Storage), `fs` polyfill for browser
- `postcss.config.mjs` - Tailwind PostCSS plugin
- `eslint.config.mjs` - Flat config extending `eslint-config-next`, custom rule banning `gray-*` colors (enforces `slate-*` palette)

## Platform Requirements

**Development:**
- Node.js (version not pinned)
- npm
- Claude Code CLI (optional, for MCP server / terminal integration)
- Supabase project (or `NEXT_PUBLIC_USE_MOCK_DATA=true`)

**Production:**
- Vercel or any Node.js hosting supporting Next.js App Router
- Supabase (PostgreSQL + Storage)
- External API keys for AI features (Gemini, Leonardo, Anthropic)

---

*Stack analysis: 2026-03-13*
