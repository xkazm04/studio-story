---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 13-02-PLAN.md
last_updated: "2026-03-15T15:39:13.814Z"
last_activity: 2026-03-15 -- Completed 13-01-PLAN.md (VN Export Bridge)
progress:
  total_phases: 14
  completed_phases: 13
  total_plans: 40
  completed_plans: 40
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 13-01-PLAN.md
last_updated: "2026-03-15T15:34:13.979Z"
last_activity: 2026-03-15 -- Completed 13-01-PLAN.md (VN Export Bridge)
progress:
  [██████████] 100%
  completed_phases: 12
  total_plans: 40
  completed_plans: 39
  percent: 98
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** A regular person can produce a high-quality, compelling, publishable story package through an AI-driven interface that adapts to them.
**Current focus:** Phase 13 - Rich Visual Novel Export Bridge (1 of 2 plans complete)

## Current Position

Phase: 13 of 14 (Rich Visual Novel Export Bridge)
Plan: 1 of 2 in current phase (13-01-PLAN.md complete)
Status: Executing
Last activity: 2026-03-15 -- Completed 13-01-PLAN.md (VN Export Bridge)

Progress: [█████████████████████████████░] 39/40 plans

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 4 min
- Total execution time: 1.48 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 19 min | 5 min |
| 02 | 3 | 11 min | 4 min |
| 03 | 3 | 10 min | 3 min |
| 04 | 2 | 11 min | 6 min |
| 05 | 3 | 13 min | 4 min |
| 06 | 3 | 14 min | 5 min |
| 07 | 4 | 19 min | 5 min |

**Recent Trend:**
- Last 5 plans: 06-03 (5 min), 07-01 (5 min), 07-02 (5 min), 07-03 (5 min), 07-04 (4 min)
- Trend: steady

*Updated after each plan completion*
| Phase 02 P01 | 5 | 2 tasks | 10 files |
| Phase 02 P02 | 4 | 2 tasks | 10 files |
| Phase 02 P03 | 2 | 2 tasks | 5 files |
| Phase 03 P01 | 5 | 2 tasks | 11 files |
| Phase 03 P02 | 2 | 1 tasks | 2 files |
| Phase 03 P03 | 3 | 2 tasks | 8 files |
| Phase 04 P01 | 3 | 2 tasks | 9 files |
| Phase 04 P02 | 8 | 3 tasks | 11 files |
| Phase 05 P01 | 6 | 2 tasks | 13 files |
| Phase 05 P02 | 5 | 2 tasks | 9 files |
| Phase 05 P03 | 2 | 3 tasks | 9 files |
| Phase 06 P01 | 4 | 2 tasks | 7 files |
| Phase 06 P02 | 5 | 2 tasks | 6 files |
| Phase 06 P03 | 5 | 2 tasks | 7 files |
| Phase 07 P01 | 5 | 3 tasks | 11 files |
| Phase 07 P02 | 5 | 2 tasks | 6 files |
| Phase 07 P03 | 5 | 2 tasks | 5 files |
| Phase 07 P04 | 4 | 2 tasks | 3 files |
| Phase 08 P01 | 5 | 2 tasks | 11 files |
| Phase 08 P02 | 6 | 3 tasks | 11 files |
| Phase 08 P03 | 2 | 2 tasks | 3 files |
| Phase 09 P01 | 4 | 2 tasks | 6 files |
| Phase 09 P02 | 4 | 2 tasks | 5 files |
| Phase 09 P03 | 3 | 2 tasks | 4 files |
| Phase 10 P01 | 8 | 2 tasks | 7 files |
| Phase 10 P02 | 6 | 2 tasks | 10 files |
| Phase 10 P03 | 8 | 2 tasks | 6 files |
| Phase 10 P04 | 9 | 3 tasks | 12 files |
| Phase 11 P01 | 5 | 2 tasks | 8 files |
| Phase 11 P02 | 7 | 2 tasks | 4 files |
| Phase 12 P01 | 3 | 2 tasks | 4 files |
| Phase 12 P02 | 3 | 2 tasks | 5 files |
| Phase 12 P03 | 4 | 2 tasks | 6 files |
| Phase 12 P04 | 4 | 2 tasks | 2 files |
| Phase 13 P01 | 5 | 2 tasks | 6 files |
| Phase 13 P02 | 2 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Jinn engine phases (1-6) precede Studio Story domain phases (7-10) -- engine must be stable before domain features
- [Roadmap]: Package separation (PKG-02) starts in Phase 1, enforcement (PKG-01) closes in Phase 12 -- boundary maintained throughout, formalized at end
- [Roadmap]: Phases 2+3 can parallelize (both depend only on Phase 1); Phases 8+9+10 can parallelize (all depend on Phase 7)
- [01-01]: Vitest 4 uses test.projects instead of defineWorkspace -- adapted workspace config
- [01-01]: @dzin/core uses JIT (no build step) via Next.js transpilePackages
- [01-01]: PanelFrameProps uses ReactNode for icon/actions/children for max composition flexibility
- [01-02]: PanelDefinition.component uses ComponentType<Record<string, unknown>> -- generic yet type-safe
- [01-02]: serializeRegistry excludes component ref by explicit field mapping rather than delete/omit
- [01-02]: SerializedPanel is a separate type from PanelDefinition rather than Omit<> -- cleaner serialization contract
- [01-03]: Vitest jsdom via dedicated vitest.config.ts per package rather than inline workspace config
- [01-03]: PanelFrame accepts Record<string, unknown> rest props for forward-compatible custom data attributes
- [01-03]: Default theme dark mode as root default, light mode via prefers-color-scheme + class toggles
- [01-04]: Vitest workspace renamed from vitest.workspace.ts to vitest.config.ts with inline named projects for proper auto-detection
- [01-04]: Demo panels use data-dzin-* attributes exclusively for headless structural elements
- [01-04]: Boundary test uses static file scanning (fs + regex) for comprehensive coverage of forbidden imports
- [Phase 02]: Hungarian algorithm pads non-square matrices with 1e9 cost for dummy entries
- [Phase 02]: scorePanelForSlot returns cost (lower=better), scoreTemplateForDirectives returns score (higher=better)
- [Phase 02]: LAYOUT_TEMPLATES as array with Map-based getTemplate() for O(1) lookup
- [Phase 02]: assignPanelsToSlots takes PanelRegistry via dependency injection
- [02-02]: FALLBACK_THRESHOLDS for panels without densityModes: full=400x300, compact=180x120, micro=60x40
- [02-02]: Viewport breakpoints at 768/1024/1280 matching existing layoutEngine.ts
- [02-02]: Stack excluded from scoring (mobile-only fallback) per research recommendation
- [02-02]: parseGridFractions uses 1920px reference for px-to-fraction conversion
- [Phase 02]: useLayout returns containerProps + getSlotProps pattern for headless grid composition
- [Phase 02]: ResizeObserver debounced at 100ms with SSR guard defaulting to 1920x1080
- [Phase 02]: DzinLayout wraps each slot in DensityProvider for automatic density context
- [03-01]: No-op UndoStack stub as default for createStateEngine allows DI
- [03-01]: structuredClone for immutable state management throughout engine
- [03-01]: crypto.randomUUID for PatchGroup IDs (no external dependency)
- [03-01]: _applyWithoutUndo and _recordUndoGroup exposed for StreamController integration
- [Phase 03]: abort() delegates to commit() -- keeps rendered content as undoable group
- [Phase 03]: useSyncExternalStore with JSON.parse(getSnapshot()) for tear-free React reads
- [Phase 03]: Path-level locking with ancestor matching for nested path conflict detection
- [04-01]: ChatStore.subscribe takes () => void (not state callback) for direct useSyncExternalStore compatibility
- [04-01]: Tool calls stored as optional array on ChatMessage rather than separate collection
- [04-01]: matchCommands strips leading slash for natural /command typing UX
- [04-02]: Pointer Events API for drag/resize instead of third-party library -- zero dependencies, better touch support
- [04-02]: markdown-to-jsx for message rendering -- lightweight, React-native, no dangerouslySetInnerHTML
- [04-02]: Mock echo handler (300ms delay) enables full visual testing without LLM transport
- [04-02]: z-[9000] for overlay ensures it floats above all workspace panels
- [05-01]: IntentHandler returns typeof NEEDS_LLM (unique Symbol) as sentinel for LLM fallthrough
- [05-01]: Bus special-cases undo/redo descriptions to call stateEngine.undo()/redo() instead of dispatch()
- [05-01]: Manipulate handler uses inline FALLBACK_THRESHOLDS to avoid PanelDefinition dependency
- [05-01]: Compose handler accepts registryHas function rather than full PanelRegistry for minimal coupling
- [05-02]: hooks.tsx uses .tsx extension because JSX in IntentProvider requires esbuild JSX transform
- [05-02]: computeResize works in pixel space during drag, converts to fractions once per call to avoid cumulative drift
- [05-02]: Density hysteresis tracks densityChangePx and requires 20px buffer before allowing another density change
- [05-02]: IntentQueue.startBuffering captures optional initial state snapshot for conflict detection on drain
- [05-03]: Pointer Events API (setPointerCapture) for resize -- zero deps, better touch support, consistent with 04-02
- [05-03]: Resize state in useRef avoids re-renders during pointermove; density committed only on pointerup
- [05-03]: LayoutPicker renders inline SVG thumbnails per template -- self-contained, theme-consistent
- [05-03]: Ctrl+1-7 keyboard shortcuts mapped to LAYOUT_ORDER, excluding stack (mobile-only)
- [05-03]: IntentProvider wraps inside QueryClientProvider via IntentSetup inner component
- [Phase 06]: TimeoutError sentinel class for distinguishing timeout from other errors in retry loop
- [Phase 06]: Promise.race via manual settle flag for timeout instead of AbortController -- simpler, no polyfill needed
- [Phase 06]: Exponential backoff formula: BASE_BACKOFF_MS * 2^attempt (1s, 2s, 4s...)
- [06-02]: PersistentSession uses getter properties for sessionId/status -- internal mutation with read-only interface
- [06-02]: executeCLI collects events via onEvent callback, resolves promise on result/error event
- [06-02]: Multimodal tools use standalone handler array plus registerMultimodalTools for MCP server integration
- [06-02]: Intent API route returns 200 with error status on CLI failure -- transport handles error routing
- [06-03]: Entity-created trigger scans all recent events in debounce batch, not just last event -- handles rapid multi-type actions
- [06-03]: Idle trigger uses separate setTimeout per pattern, all reset on any IntentBus event
- [06-03]: WorkspaceHeader accepts llmStatus prop (default 'disconnected') for graceful degradation when transport not wired
- [06-03]: SuggestionStack z-[8000] sits below advisor overlay z-[9000] but above workspace panels
- [07-01]: Default MCP user_id (00000000-...) for create_project since MCP config has no userId concept
- [07-01]: create_relationship uses character_relationships table (not relationships) matching actual DB schema
- [07-01]: RelationshipMapPanel uses React.lazy for existing RelationshipMap component
- [07-02]: Graham scan inline instead of d3-shape dependency for convex hull of <20 points
- [07-02]: useViewport hook for reactive SVG overlay tracking during pan/zoom
- [07-02]: Faction color resolution: faction.color -> branding.primary_color -> FACTION_COLOR_PALETTE[index]
- [07-02]: Clusters require 2+ members; <3 use padded bounding rectangle, 3+ use convex hull with 60px expansion
- [07-03]: Dual-mode editor (TipTap default, blocks for legacy @marker content) preserves backward compatibility
- [07-03]: Distraction-free mode at z-[8500] sits below advisor overlay (z-9000) but above workspace panels
- [07-03]: Screenplay CSS uses --ms-* custom properties for theme consistency
- [07-04]: Story authoring patterns added as appendix in PANEL_MANIFESTS constant rather than separate MCP tool
- [07-04]: relationship-map added to PANEL_TYPES (was missing despite existing in panel registry)
- [07-04]: Advisor route system instruction updated alongside advisorTools.ts for consistent dual-layer awareness
- [Phase 08]: TENSION_TYPES set for relationship analysis; triptych layout for confrontation insights
- [08-02]: PanelFrame uses component ref (BookOpen) not JSX element for icon prop
- [08-02]: Variable persistence via raw localStorage keyed by project ID for simplicity
- [08-02]: create_branch reads source scene to inherit project_id and act_id
- [Phase 08-03]: Story intelligence composition patterns follow same appendix pattern established in 07-04
- [Phase 08-03]: narrative-suggestions always sidebar role; reader-view always primary role
- [Phase 09]: generateSceneIllustration as new public method avoids modifying existing AIProvider interface
- [Phase 09]: controlnets and styleUUID mutually exclusive per Leonardo docs -- omit styleUUID when controlnets present
- [Phase 09]: Character ref upload failures are non-blocking (warn and continue)
- [Phase 09]: React Query polling with refetchInterval callback for generation status polling
- [Phase 09]: dataSlice.entityId used as sceneId for contextual panel composition
- [Phase 09]: MCP tool trio pattern (generate/check/save) for async generation workflows
- [Phase 09]: Visual pipeline composition patterns follow same appendix pattern established in 07-04 and 08-03
- [Phase 09]: Character reference setup guidance teaches advisor to check avatar_url and troubleshoot visual consistency
- [10-01]: Anthropic SDK via @anthropic-ai/sdk with cached client pattern (same as Gemini cached client)
- [10-01]: Validation before client creation so 400s return without API key requirement
- [10-01]: Token budget at 80K tokens, truncating oldest prior scenes first while preserving characters/premise/current scene
- [10-01]: vi.hoisted() for mock functions referenced in vi.mock factories (Vitest 4 hoisting)
- [10-01]: Vitest config updated with @/ path alias for proper module resolution in tests
- [10-02]: cobalt.tools API for YouTube extraction instead of ytdl-core (no native dependency)
- [10-02]: TTS duration estimated from byte size (bytes/16000 for 128kbps MP3) rather than audio analysis
- [10-02]: Voice listing includes all premade + cloned + generated voices with broad filter and 5-min cache
- [10-03]: Replace-then-decorate diff strategy: replace text on showDiff, add decorations; acceptDiff clears decorations; rejectDiff calls undo
- [10-03]: Widget decorations for deletions (zero-width position with strikethrough span), inline decorations for additions
- [10-03]: BubbleMenu from @tiptap/react/menus with Floating UI options (TipTap v3 replaced Tippy with Floating UI)
- [10-03]: Integration into SceneEditorPanel.tsx (workspace panel with TipTap) rather than SceneEditor.tsx (textarea-based feature component)
- [10-04]: takesCount=2 as default for narration generation (2 takes per segment for audition)
- [10-04]: getDb() added to db.ts for direct Supabase access in voice tools (complex queries need raw client)
- [10-04]: NARRATION_COMPOSITION_PATTERNS as separate export for voice workflow layouts
- [11-01]: inputTranscription uses independent if-block (not early return) since it can arrive alongside other server content
- [11-01]: parseTextToIntent is a pure exported function for testability rather than embedded in the hook
- [11-01]: InteractionContext stored in ref (not React state) to avoid re-renders on each fragment addition
- [11-01]: INTERACTION_TIMEOUT_MS set to 10s matching typical voice interaction gap patterns
- [11-02]: isTypingInInput checks instanceof HTMLElement before getAttribute for jsdom compatibility
- [11-02]: IDLE_DISCONNECT_MS = 120000 (2 min) per research pitfall #4 about WebSocket drain
- [11-02]: Input area always visible since mic auto-connects; not gated behind isAnyConnected
- [11-02]: Ghost text clears after 2s timeout rather than on next input event
- [11-02]: PTT hint dismissed after 3 uses via localStorage counter (advisor-ptt-hint-count)
- [12-01]: Hand-rolled PDF with DCTDecode image XObjects -- no external PDF library, consistent with existing PDFGenerator
- [12-01]: Helvetica font for story PDF (not Courier) -- prose readability over screenplay convention
- [12-01]: Fixed image display dimensions with cm matrix -- real dimension parsing deferred
- [12-02]: Base64 inlining via fetch+arrayBuffer+btoa for zero-dependency asset embedding
- [12-02]: Scroll-snap CSS for page-by-page reading with IntersectionObserver dot sync
- [12-02]: Art-style adaptive theming falls back to --ms- design system dark defaults
- [Phase 12]: VN engine uses inline JS state machine for zero-dependency single-file output
- [Phase 12]: ExportDialog groups formats into Script Formats and Story Formats sections
- [Phase 12]: ESLint flat config scoped block for dzin boundary -- keeps rule isolated to engine files only
- [Phase 13]: BFS with adjacency map for graph traversal -- handles cycles via visited set
- [Phase 13]: Scenes with explicit choices do NOT get implicit Continue links -- preserves authored branching
- [Phase 13]: Narration play button only when NO per-line dialogue audio exists -- avoids double audio
- [Phase 13]: useVNExportData defers API calls via enabled flag until VN format selected
- [Phase 13]: VN export with rich data bypasses exportScript, goes directly to VisualNovelGenerator.generate()

### Pending Todos

None yet.

### Blockers/Concerns

- [Research gap]: Claude Code CLI latency for real-time UI composition needs benchmarking in Phase 6
- [Research gap]: Character visual consistency APIs (IPAdapter/cref) need technology research in Phase 9

## Session Continuity

Last session: 2026-03-15T15:39:13.811Z
Stopped at: Completed 13-02-PLAN.md
Resume file: None
