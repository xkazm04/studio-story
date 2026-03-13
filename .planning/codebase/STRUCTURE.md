# Codebase Structure

**Analysis Date:** 2026-03-13

## Directory Layout

```
studio-story/
├── src/
│   ├── app/                        # Next.js App Router (single page)
│   │   ├── api/                    # REST API routes (20+ entity endpoints)
│   │   ├── components/             # Shared UI components
│   │   │   ├── UI/                 # Design system primitives (40+ components)
│   │   │   ├── coordination/       # Event timeline, impact preview
│   │   │   ├── dev/                # Debug panels
│   │   │   └── recommendations/    # Recommendation UI
│   │   ├── constants/              # Enums and constants
│   │   ├── features/               # Domain feature modules
│   │   │   ├── assets/             # Asset management
│   │   │   ├── assistant/          # AI assistant panel
│   │   │   ├── characters/         # Character management (largest feature)
│   │   │   ├── collaboration/      # Multi-user collaboration
│   │   │   ├── datasets/           # Audio/image datasets
│   │   │   ├── image/              # Image generation/editing/sketching
│   │   │   ├── landing/            # Landing/onboarding
│   │   │   ├── projectOverview/    # Project dashboard
│   │   │   ├── projects/           # Project CRUD
│   │   │   ├── relationships/      # Relationship map (ReactFlow)
│   │   │   ├── scenes/             # Scene management
│   │   │   ├── story/              # Story structure (beats, acts, scenes)
│   │   │   └── voice/              # Voice/audio features
│   │   ├── hooks/                  # Shared React hooks
│   │   │   └── integration/        # Cross-feature integration hooks
│   │   ├── lib/                    # Utility functions
│   │   ├── store/                  # Global Zustand store slices
│   │   │   └── slices/             # projectSlice, characterSlice, userSettingsSlice
│   │   ├── types/                  # TypeScript type definitions (20 files)
│   │   ├── utils/                  # API error handling, utilities
│   │   ├── globals.css             # Design system CSS variables
│   │   ├── layout.tsx              # Root layout (fonts, providers, dark mode)
│   │   ├── page.tsx                # Single page entry (renders V2Layout)
│   │   └── providers.tsx           # React Query + Toast providers
│   ├── workspace/                  # Dynamic workspace system (core)
│   │   ├── engine/                 # Layout engine + panel registry
│   │   ├── components/             # WorkspaceGrid, PanelWrapper, Toolbar
│   │   ├── hooks/                  # Workspace-specific hooks
│   │   ├── layout/                 # V2Layout, WorkspaceArea, CommandBar, header
│   │   │   ├── CommandBar/         # CLI command bar
│   │   │   └── header/             # WorkspaceHeader, selectors, dropdown
│   │   ├── panels/                 # Panel implementations by domain
│   │   │   ├── assistant/          # AdvisorPanel
│   │   │   ├── audio/              # Audio/voice panels (6 panels)
│   │   │   ├── character/          # Character panels (4 panels)
│   │   │   ├── image/              # Image panels (4 panels)
│   │   │   ├── scene/              # Scene panels (5 panels)
│   │   │   ├── story/              # Story panels (8 panels)
│   │   │   ├── shared/             # PanelFrame, PanelPrimitives, EmptyWelcome, PanelSizeContext
│   │   │   └── primitives/         # 7 generic primitives + 13 adapters
│   │   │       └── adapters/       # createAdapter factory + domain adapters
│   │   ├── schemas/                # Entity schemas for panel data
│   │   ├── store/                  # Workspace Zustand stores (5 stores)
│   │   ├── theme/                  # Accent color tokens
│   │   ├── config/                 # Workflow hints
│   │   ├── creator/                # Image generation view + option components
│   │   └── types.ts                # All workspace type definitions
│   ├── agents/                     # AI advisor system
│   │   ├── store/                  # agentStore, advisorMemoryStore
│   │   ├── AdvisorClient.ts        # HTTP client for /api/agents/advisor
│   │   ├── AdvisorOverlay.tsx      # Floating advisor widget
│   │   ├── AudioIOManager.ts       # Mic capture + PCM playback
│   │   ├── GeminiLiveClient.ts     # WebSocket voice connection
│   │   ├── StoryAnalyzer.ts        # Story analysis utilities
│   │   ├── WorkspaceObserver.ts    # Sends workspace state to advisor
│   │   ├── useAdvisor.ts           # Main advisor orchestrator hook
│   │   ├── useAdvisorVoice.ts      # Voice mode hook
│   │   ├── useAdvisorMemory.ts     # Memory tracking hook
│   │   ├── useProactiveMuse.ts     # Proactive suggestion hook
│   │   └── index.ts                # Public API exports
│   ├── manifest/                   # Panel manifest system
│   │   ├── index.ts                # Public API + LLM serialization
│   │   ├── panelManifests.ts       # All panel manifest definitions
│   │   └── types.ts                # PanelManifest type
│   ├── mcp-server/                 # MCP server (separate build target)
│   │   ├── tools/                  # Tool implementations by domain
│   │   │   ├── characters.ts       # Character CRUD tools
│   │   │   ├── factions.ts         # Faction CRUD tools
│   │   │   ├── images.ts           # Image generation tools
│   │   │   ├── index.ts            # Tool registry
│   │   │   ├── projects.ts         # Project tools
│   │   │   ├── scenes.ts           # Scene CRUD tools
│   │   │   ├── story-structure.ts  # Acts, beats tools
│   │   │   └── workspace.ts        # Workspace composition tools
│   │   ├── config.ts               # Config parsing (env vars)
│   │   ├── db.ts                   # Direct Supabase client for MCP
│   │   ├── index.ts                # Server entry point
│   │   └── tsconfig.json           # Separate TypeScript config
│   ├── cli/                        # Terminal UI components
│   │   ├── CLIMarkdown.tsx         # Markdown renderer for terminal
│   │   ├── CompactTerminal.tsx     # Compact terminal component
│   │   ├── InlineTerminal.tsx      # Inline terminal component
│   │   ├── ImprovementIndicator.tsx
│   │   └── MCPConnectionIndicator.tsx
│   └── lib/                        # Core shared libraries
│       ├── supabase/               # Supabase client + server client
│       ├── claude-terminal/        # CLI service
│       ├── audio/                  # Audio processing
│       ├── image/                  # Image processing, StoryboardEngine
│       ├── context/                # DifferentialContextEngine
│       ├── coordination/           # Event coordination
│       ├── recommendations/        # Recommendation engine types
│       ├── services/               # Shared services
│       ├── animations.ts           # Animation utilities
│       ├── utils.ts                # General utilities (cn, etc.)
│       └── [20+ domain modules]/   # analytics, beats, brainstorm, canvas, etc.
├── .planning/                      # GSD planning documents
│   └── codebase/                   # Codebase analysis docs
├── .claude/                        # Claude Code config
├── CLAUDE.md                       # Claude Code instructions
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript config (strict mode)
├── eslint.config.mjs               # ESLint flat config
├── next.config.ts                  # Next.js config
├── tailwind.config.ts              # Tailwind CSS config
└── .mcp.json                       # MCP server config (STORY_BASE_URL, STORY_PROJECT_ID)
```

## Directory Purposes

**`src/workspace/`:**
- Purpose: The core workspace system -- everything related to dynamic panel composition
- Contains: Layout engine, panel registry, panel implementations, stores, hooks, grid rendering
- Key files: `engine/panelRegistry.ts` (29 panel types), `engine/layoutEngine.ts` (8 layouts + Hungarian algorithm), `store/workspaceStore.ts`, `types.ts`

**`src/workspace/panels/`:**
- Purpose: All panel component implementations, organized by domain
- Contains: Domain folders (scene/, character/, story/, image/, audio/, assistant/), shared frame/primitives, and an adapter layer
- Key files: `shared/PanelFrame.tsx` (standard panel chrome), `primitives/adapters/createAdapter.tsx` (adapter factory)

**`src/app/api/`:**
- Purpose: Next.js API route handlers for all CRUD operations and AI service proxies
- Contains: Entity-based directories with `route.ts` files, plus nested `[id]/route.ts` for single-entity operations
- Key files: `characters/route.ts`, `scenes/route.ts`, `beats/route.ts`, `ai/generate-images/route.ts`, `agents/advisor/route.ts`

**`src/app/features/`:**
- Purpose: Domain feature modules with complex UI components
- Contains: Feature-level components organized by domain. Sub-features use `sub_` prefix convention (e.g., `sub_AvatarGenerator/`, `sub_SceneEditor/`, `sub_CharFactions/`)
- Key files: `characters/CharactersFeature.tsx`, `story/StoryFeature.tsx`, `scenes/ScenesFeature.tsx`

**`src/app/components/UI/`:**
- Purpose: Reusable design system primitives
- Contains: 40+ components (Button, Card, Modal, Input, Select, Tabs, Toast, Tooltip, Badge, etc.)
- Key files: `Button.tsx`, `Card.tsx`, `Modal.tsx`, `Input.tsx`, `Select.tsx`, `Tabs.tsx`

**`src/agents/`:**
- Purpose: AI advisor system with text and voice modes
- Contains: HTTP client, WebSocket client, audio I/O, stores, hooks
- Key files: `AdvisorClient.ts`, `useAdvisor.ts`, `GeminiLiveClient.ts`, `store/agentStore.ts`

**`src/manifest/`:**
- Purpose: Machine-readable panel descriptions for LLM-driven composition
- Contains: Manifest definitions, types, serialization for system prompts
- Key files: `panelManifests.ts` (all panel manifests), `index.ts` (public API + `serializeManifestsForLLM()`)

**`src/mcp-server/`:**
- Purpose: Standalone MCP server process for Claude Code CLI integration
- Contains: Tool registrations, config, HTTP client, direct DB access
- Key files: `index.ts` (entry), `tools/index.ts` (registry), `db.ts` (Supabase direct), `config.ts`

**`src/app/types/`:**
- Purpose: TypeScript type definitions for all domain entities
- Contains: 20 type files covering all data models
- Key files: `Character.ts`, `Scene.ts`, `Beat.ts`, `Project.ts`, `Voice.ts`, `Faction.ts`

**`src/app/store/`:**
- Purpose: Global Zustand stores for cross-feature state
- Contains: Store slices for project selection, character selection, user settings
- Key files: `slices/projectSlice.ts`, `slices/characterSlice.ts`

**`src/lib/`:**
- Purpose: Shared utility libraries and service clients
- Contains: Supabase clients, domain-specific logic modules, utilities
- Key files: `supabase/server.ts`, `supabase/client.ts`, `utils.ts`, `claude-terminal/cli-service.ts`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Single page entry -- renders `V2Layout`
- `src/app/layout.tsx`: Root layout -- fonts, dark mode, providers
- `src/app/providers.tsx`: React Query (30s staleTime) + Toast providers
- `src/mcp-server/index.ts`: MCP server entry point

**Configuration:**
- `package.json`: Dependencies, scripts
- `tsconfig.json`: TypeScript strict mode config
- `eslint.config.mjs`: ESLint flat config
- `.mcp.json`: MCP server runtime config (base URL, project ID)
- `src/app/globals.css`: CSS custom properties with `--ms-` prefix
- `src/workspace/theme/tokens.ts`: Accent color token system

**Core Logic:**
- `src/workspace/engine/layoutEngine.ts`: CSS Grid layout scoring and assignment
- `src/workspace/engine/panelRegistry.ts`: 29 panel type definitions with lazy imports
- `src/workspace/store/workspaceStore.ts`: Central workspace state (panels, layout, snapshots)
- `src/manifest/panelManifests.ts`: All panel manifest definitions
- `src/manifest/index.ts`: Manifest API + `serializeManifestsForLLM()`
- `src/agents/useAdvisor.ts`: Advisor orchestration hook
- `src/agents/AdvisorClient.ts`: HTTP client for advisor API
- `src/app/utils/apiErrorHandling.ts`: Centralized API error handling

**Database Access:**
- `src/lib/supabase/server.ts`: Server-side Supabase client (service role, bypasses RLS)
- `src/lib/supabase/client.ts`: Browser-side Supabase client
- `src/mcp-server/db.ts`: Direct Supabase access for MCP server

**Testing:**
- `src/app/lib/ai/__tests__/leonardo-video.test.ts`: Example test file
- Test files use `*.test.ts` / `*.test.tsx` pattern (co-located in `__tests__/` dirs)

## Naming Conventions

**Files:**
- React components: PascalCase (`WorkspaceGrid.tsx`, `PanelFrame.tsx`)
- Hooks: camelCase with `use` prefix (`useAdvisor.ts`, `useWorkspaceKeyboard.ts`)
- Stores: camelCase with `Store` suffix (`workspaceStore.ts`, `agentStore.ts`)
- Types: PascalCase (`Character.ts`, `Scene.ts`)
- API routes: `route.ts` inside kebab-case directories (`/api/characters/route.ts`)
- Utilities: camelCase (`apiErrorHandling.ts`, `utils.ts`)
- Constants: camelCase (`characterEnums.ts`)

**Directories:**
- Features: camelCase (`characters/`, `projectOverview/`)
- Sub-features: `sub_` prefix with PascalCase (`sub_AvatarGenerator/`, `sub_SceneEditor/`, `sub_CharFactions/`)
- API routes: kebab-case (`beat-dependencies/`, `claude-terminal/`, `faction-relationships/`)
- Component groups: PascalCase (`UI/`, `EditableDataTable/`, `MediaGallery/`)
- Panels: kebab-case domain folders (`scene/`, `character/`, `story/`, `image/`, `audio/`)

**Panel Types:**
- Kebab-case string literals: `'scene-editor'`, `'character-cards'`, `'beats-manager'`
- Panel component files: PascalCase with `Panel` suffix (`SceneEditorPanel.tsx`, `BeatsManagerPanel.tsx`)
- Adapter files: PascalCase with `Adapter` suffix (`CharacterCardsAdapter.tsx`, `SceneListAdapter.tsx`)

## Where to Add New Code

**New Workspace Panel:**
1. Create panel component in `src/workspace/panels/{domain}/{PanelName}Panel.tsx`
2. Add registry entry in `src/workspace/engine/panelRegistry.ts` (type, label, icon, importFn, defaultRole, sizeClass, domains, complexity)
3. Add `WorkspacePanelType` union member in `src/workspace/types.ts`
4. Add manifest in `src/manifest/panelManifests.ts` (capabilities, inputs, outputs, use cases, density modes)
5. Use `PanelFrame` from `src/workspace/panels/shared/PanelFrame.tsx` as the outer wrapper
6. Accept `density` and `dataSlice` props for spatial intelligence support

**New API Route:**
1. Create `src/app/api/{entity-name}/route.ts` for collection endpoints (GET list, POST create)
2. Create `src/app/api/{entity-name}/[id]/route.ts` for single-entity endpoints (GET, PATCH, DELETE)
3. Use `supabaseServer` from `src/lib/supabase/server.ts`
4. Use error utilities from `src/app/utils/apiErrorHandling.ts` (`handleDatabaseError`, `validateRequiredParams`)

**New Feature Module:**
1. Create `src/app/features/{featureName}/` directory
2. Add main feature component as `{FeatureName}Feature.tsx`
3. Put sub-components in `components/` subdirectory
4. Sub-features go in `sub_{SubFeatureName}/` directories
5. Feature-local hooks in `hooks/`, types in `types/`, logic in `lib/`

**New MCP Tool:**
1. Add tool registration function in `src/mcp-server/tools/{domain}.ts`
2. Register in `src/mcp-server/tools/index.ts`
3. Use direct Supabase access from `src/mcp-server/db.ts` for CRUD; use `StoryHttpClient` for proxied API calls

**New Zustand Store:**
- Global store slice: `src/app/store/slices/{name}Slice.ts`, export from `src/app/store/index.ts`
- Workspace store: `src/workspace/store/{name}Store.ts`
- Agent store: `src/agents/store/{name}Store.ts`
- Use `persist` middleware with `createJSONStorage(() => localStorage)` for persistence

**New UI Component:**
- Design system primitive: `src/app/components/UI/{ComponentName}.tsx`
- Follow existing patterns: accept `className` prop, use `cn()` for class merging, use `--ms-` CSS variables for theming

**New Type Definition:**
- Domain entity type: `src/app/types/{EntityName}.ts`
- Workspace type: add to `src/workspace/types.ts`
- Manifest type: add to `src/manifest/types.ts`

**New Shared Hook:**
- Global hook: `src/app/hooks/{useHookName}.ts`
- Integration hook: `src/app/hooks/integration/{useHookName}.ts`
- Workspace hook: `src/workspace/hooks/{useHookName}.ts`

## Special Directories

**`src/mcp-server/`:**
- Purpose: Standalone Node.js process, compiled separately
- Generated: Build output goes to `dist/mcp-server/`
- Committed: Source is committed; `dist/` is not
- Has its own `tsconfig.json`

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: Created by Claude Code agents
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration, agents, commands, scripts
- Generated: Mix of manual and auto-generated
- Committed: Yes

**`src/workspace/panels/primitives/adapters/`:**
- Purpose: Bridge layer between primitive components and domain data. Uses `createAdapter.tsx` factory to generate adapter components with standardized props.
- Generated: No (hand-written)
- Committed: Yes

**`src/workspace/schemas/`:**
- Purpose: Entity schema definitions used by primitives to understand data shapes
- Contains: `entitySchemas.ts`, `types.ts`, `index.ts`

---

*Structure analysis: 2026-03-13*
