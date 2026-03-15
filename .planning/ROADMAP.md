# Roadmap: Studio Story + Jinn

## Overview

This roadmap builds the Jinn engine from the ground up as a separable LLM-orchestrated UI framework, then layers Studio Story's storytelling capabilities on top. The first four phases establish Jinn's foundation (component system, layout, state, and intelligence). Phases 5-6 wire up the LLM reasoning and multimodal intelligence. Phases 7-9 deliver the storytelling application (story data, visuals, writing/voice). Phase 10 adds multimodal input (voice, modality switching). Phases 11-12 deliver exports and finalize package extraction. Every phase produces an observable, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Jinn Package Scaffold and Component Catalog** - Separable package structure with component registry, panel manifests, and multi-density system (completed 2026-03-14)
- [x] **Phase 2: Jinn Layout Engine** - Viewport-aware CSS Grid composition that resolves panel directives into responsive layouts (completed 2026-03-14)
- [x] **Phase 3: Jinn State and Streaming** - Bidirectional LLM-UI state synchronization with undo/redo and streaming response rendering (completed 2026-03-14)
- [x] **Phase 4: Jinn Conversation Shell** - Chat interface and tool call visualization as the user-facing LLM interaction layer (completed 2026-03-14)
- [x] **Phase 5: Jinn Intent and Director** - Intent bus normalizing all inputs into typed objects with tiered local/LLM resolution (completed 2026-03-14)
- [ ] **Phase 6: Jinn LLM Integration** - Claude Code CLI and Gemini API wired as reasoning and multimodal engines with ambient observation
- [ ] **Phase 7: Story Data and Authoring** - Story structure, character management, relationship visualization, and rich text editing on Jinn
- [ ] **Phase 8: Story Intelligence and Branching** - AI-driven narrative suggestions and branching story paths with scene graph
- [ ] **Phase 9: Visual Pipeline** - AI-generated scene illustrations with character consistency and art style coherence
- [x] **Phase 10: Writing Tools and Voice** - AI text generation, fiction writing tools, TTS narration, and script-to-performance pipeline (completed 2026-03-14)
- [x] **Phase 11: Multimodal Input** - Voice as equal-mode interaction and fluid modality switching between voice, text, and manipulation (completed 2026-03-15)
- [x] **Phase 12: Export and Package Boundary** - Story package exports (PDF, HTML5, visual novel) and enforced Jinn package separation (completed 2026-03-15)

## Phase Details

### Phase 1: Jinn Package Scaffold and Component Catalog
**Goal**: A clean, separable Dzin package (@dzin/core) exists with a component registry, machine-readable manifests, and multi-density panel rendering -- all without any domain-specific code
**Depends on**: Nothing (first phase)
**Requirements**: JCORE-01, JCORE-02, JCORE-08, JCORE-11, PKG-02
**Success Criteria** (what must be TRUE):
  1. A `packages/dzin/core/` directory exists with its own tsconfig and no imports from `src/app/features/` or any Studio Story domain code
  2. Panel types can be registered with metadata (size, role, complexity, domains) and looked up by the engine at runtime
  3. Panel manifests declare capabilities, inputs, outputs, density modes, and data slice schemas in a machine-readable format
  4. A panel can render at micro, compact, and full density with visually distinct output at each level
  5. The Dzin type system (interfaces, protocols, enums) is defined in the Dzin package and importable without pulling in domain code
**Plans:** 4/4 plans complete

Plans:
- [ ] 01-01-PLAN.md -- Turborepo monorepo scaffold, @dzin/core package, type system, Vitest config
- [ ] 01-02-PLAN.md -- Unified panel registry and manifest API (PanelDefinition, createRegistry, serializeRegistry)
- [ ] 01-03-PLAN.md -- Multi-density rendering system (DensityContext, PanelFrame, default theme CSS)
- [ ] 01-04-PLAN.md -- Demo archetype panels (DataList, Detail, MediaGrid) and boundary/integration tests

### Phase 2: Jinn Layout Engine
**Goal**: The LLM (or user) can request a set of panels and the engine resolves them into a CSS Grid layout that fits the actual viewport, adapting density and arrangement automatically
**Depends on**: Phase 1
**Requirements**: JCORE-03, JCORE-09
**Success Criteria** (what must be TRUE):
  1. Given a set of panel directives (type, optional density, optional data slice), the layout engine produces a CSS Grid layout with panels in named slots
  2. The engine computes pixel-level spatial budgets for each slot and assigns panel density based on available space
  3. Layouts adapt to viewport resize -- panels reflow or change density without losing content
  4. At least 5 layout templates (single, split-2, split-3, grid-4, primary-sidebar) are available and the engine selects the best fit for the requested panel count and roles
**Plans:** 3/3 plans complete

Plans:
- [ ] 02-01-PLAN.md -- Layout types, 8 CSS Grid templates, Hungarian algorithm, template scoring, panel-to-slot assignment
- [ ] 02-02-PLAN.md -- Spatial budget computation, auto-density assignment, viewport breakpoints, resolveLayout pipeline
- [ ] 02-03-PLAN.md -- React integration (useLayout hook with ResizeObserver, DzinLayout component, public API wiring)

### Phase 3: Jinn State and Streaming
**Goal**: LLM context and UI state stay synchronized through JSON Patch deltas, users can undo/redo any AI-initiated change, and partial LLM results render progressively
**Depends on**: Phase 1
**Requirements**: JCORE-04, JCORE-05, JCORE-07
**Success Criteria** (what must be TRUE):
  1. Changes originating from the LLM (panel additions, content updates, layout changes) are applied to UI state as JSON Patch operations and the UI reflects them in real-time
  2. Changes originating from the user (direct manipulation, form input) are captured as JSON Patch operations and available to the LLM context on next interaction
  3. User can undo and redo any AI-initiated UI or content change, restoring previous state accurately
  4. Streaming LLM responses render progressively -- partial panel content is visible before the full response completes
**Plans:** 3/3 plans complete

Plans:
- [ ] 03-01-PLAN.md -- State engine core with JSON Patch synchronization, undo/redo stack, and snapshot serialization
- [ ] 03-02-PLAN.md -- Streaming controller for progressive LLM response rendering with abort/commit lifecycle
- [ ] 03-03-PLAN.md -- React hooks, conflict resolution, CSS animations, and public API wiring

### Phase 4: Jinn Conversation Shell
**Goal**: Users have a persistent chat interface for directing Jinn via natural language, and can see exactly what the LLM is doing through tool call visualization
**Depends on**: Phase 2, Phase 3
**Requirements**: JCORE-06, JCORE-10
**Success Criteria** (what must be TRUE):
  1. An always-available chat interface exists where the user can type natural language requests and receive LLM responses
  2. When the LLM invokes tools (compose workspace, query data, generate content), the user sees a real-time visualization of which tools are running and their results
  3. The chat interface works as a fallback when panel composition is insufficient -- the user can always fall back to conversation
**Plans:** 2/2 plans complete

Plans:
- [x] 04-01-PLAN.md -- Headless chat primitives in @dzin/core (types, store, commands, hooks, tests)
- [x] 04-02-PLAN.md -- Styled conversation shell overlay (floating popover, markdown, tool cards, slash commands, drag/resize)

### Phase 5: Jinn Intent and Director
**Goal**: All user inputs (text, clicks, keyboard, future voice) are normalized into typed Intent objects, and a two-tier director resolves most intents locally in under 1ms while routing complex ones to the LLM
**Depends on**: Phase 2, Phase 3
**Requirements**: JINT-01, JINT-02, JINT-06
**Success Criteria** (what must be TRUE):
  1. Clicking a button, typing in chat, or selecting a menu item all produce typed Intent objects that flow through the same intent bus
  2. Common intents (open panel, navigate, filter) resolve locally via workflow hints without any LLM call, in under 50ms
  3. Complex or ambiguous intents are routed to the LLM for resolution, with the user seeing a brief loading indicator
  4. User can directly manipulate panels (drag, resize, rearrange) while the LLM is simultaneously composing other panels -- both paths coexist without conflict
**Plans:** 3/3 plans complete

Plans:
- [x] 05-01-PLAN.md -- Intent types, bus, director, and built-in handlers (compose/manipulate/navigate/system)
- [x] 05-02-PLAN.md -- Resize math, intent queue, React hooks (useIntent/IntentProvider), barrel export
- [x] 05-03-PLAN.md -- Host app integration (resize handles, layout picker, close buttons, IntentProvider wiring)

### Phase 6: Jinn LLM Integration
**Goal**: Claude Code CLI serves as the primary reasoning engine via MCP/stdio, Gemini API handles multimodal tasks as a tool, and the system proactively observes user context to suggest next steps
**Depends on**: Phase 4, Phase 5
**Requirements**: JINT-03, JINT-04, JINT-05
**Success Criteria** (what must be TRUE):
  1. The Director routes complex intents to Claude Code CLI via MCP/stdio and receives structured composition directives back
  2. When a task requires vision, image generation, or audio processing, Claude delegates to Gemini API and the result flows back through the same intent pipeline
  3. Ambient observation mode watches user context (which panels are open, what data is focused, idle time) and proactively surfaces relevant suggestions or adapts the UI
  4. The system degrades gracefully when Claude CLI is slow or unavailable -- local resolution still works, and the user sees clear status about LLM connectivity
**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md -- Headless LLM transport layer in @dzin/core (types, serializer, transport factory with timeout/retry/status)
- [ ] 06-02-PLAN.md -- Persistent CLI session manager, intent API route, Gemini multimodal MCP tools
- [ ] 06-03-PLAN.md -- Ambient observer with workflow patterns, SuggestionCard, LLMStatusDot in header

### Phase 7: Story Data and Authoring
**Goal**: Users can create and manage complete story structures (premise, acts, beats, scenes), character profiles with relationships, and edit scene content -- all through Jinn's panel composition
**Depends on**: Phase 6
**Requirements**: STORY-01, STORY-02, STORY-03, STORY-04
**Success Criteria** (what must be TRUE):
  1. User can create a story with premise, then add acts, beats within acts, and scenes within beats -- all through Jinn-composed panels that the LLM arranges contextually
  2. User can create character profiles with traits, descriptions, and faction membership, and the LLM composes relevant panels as the user works
  3. An interactive relationship map visualizes character connections and faction dynamics, updating as relationships are added or modified
  4. User can edit scene content and dialogue in a rich text editor that appears as a Jinn panel, with formatting toolbar and character dialogue markup
  5. Asking Jinn "show me the castle scene with Elena" opens the scene editor focused on that scene with Elena's character panel alongside it
**Plans:** 3/4 plans executed

Plans:
- [ ] 07-01-PLAN.md -- Schema extensions (Project premise/genre/setting), missing MCP tools (create_project, update_project, create_relationship), relationship-map panel registration
- [ ] 07-02-PLAN.md -- Relationship map enhancement with faction cluster visualization, sentiment-based edge styling, enriched character nodes
- [ ] 07-03-PLAN.md -- TipTap screenplay extensions (5 node types), combined prose+screenplay toolbar, distraction-free mode
- [ ] 07-04-PLAN.md -- LLM composition wiring (compose_workspace story patterns, advisor tool declarations for story authoring)

### Phase 8: Story Intelligence and Branching
**Goal**: The LLM analyzes story structure and relationships to suggest plot developments, and users can create branching choose-your-own-adventure narratives with visual scene graph
**Depends on**: Phase 7
**Requirements**: STORY-05, STORY-06
**Success Criteria** (what must be TRUE):
  1. Given the current story state (characters, relationships, tension points), the LLM proactively suggests plot developments, conflicts, and resolutions
  2. User can create branching story paths where scenes lead to multiple possible next scenes based on reader choices
  3. A scene graph visualization shows all story paths, branches, and convergence points, with unreachable or dead-end paths highlighted
  4. User can simulate walking through a branching story to verify all paths make narrative sense
**Plans:** 2/3 plans executed

Plans:
- [ ] 08-01-PLAN.md -- Scene choices API routes, SceneChoice condition field, StoryAnalyzer relationship-tension rules, narrative-suggestions panel registration
- [ ] 08-02-PLAN.md -- Reader view panel with simulation/choices/variables/rewind, MCP create_branch and create_choice tools
- [ ] 08-03-PLAN.md -- LLM composition wiring for narrative-suggestions and reader-view panels, advisor story intelligence guidance

### Phase 9: Visual Pipeline
**Goal**: AI generates scene illustrations that match the story's art style, and characters look visually consistent across every generated image
**Depends on**: Phase 7
**Requirements**: VISUAL-01, VISUAL-02, VISUAL-03
**Success Criteria** (what must be TRUE):
  1. User can generate an illustration for any scene, and the generated image reflects the scene's characters, location, mood, and action as described in the story
  2. The same character is visually recognizable across all generated images -- consistent face, build, clothing style, and distinguishing features
  3. A defined art style (palette, lighting, mood, rendering approach) persists across all generated images for the entire story, not just per-scene
  4. User can define or adjust the story's art style and regenerate images to match the updated style
**Plans:** 1/3 plans executed

Plans:
- [ ] 09-01-PLAN.md -- Prompt assembly pipeline, Leonardo controlnet extension (character ref ID 133, style ref ID 67), Supabase Storage utility, scene illustration API endpoint
- [ ] 09-02-PLAN.md -- GenerationGallery UI (2x2 select/confirm), SceneToImage illustration wiring, MCP generate_scene_illustration tool
- [ ] 09-03-PLAN.md -- LLM composition wiring for visual pipeline (compose_workspace patterns, advisor tools, workflow hints)

### Phase 10: Writing Tools and Voice
**Goal**: Users have AI-powered writing assistance (continuation, rewriting, fiction-specific tools) and can generate multi-voice narration for their stories
**Depends on**: Phase 7
**Requirements**: WRITE-01, WRITE-02, VOICE-01, VOICE-02
**Success Criteria** (what must be TRUE):
  1. User can highlight text and ask the AI to continue, rewrite, or expand it while maintaining the narrative voice established in the story
  2. Fiction-specific writing tools are available: show-don't-tell conversion and sensory rewrite -- each transforming selected text with one-click inline diff
  3. User can generate voice narration for any scene, with different character-appropriate voices for each speaking character
  4. User can write dialogue, assign character voices, and generate a complete multi-voice audio drama with narration for a scene or act
**Plans**: 1/4 plans complete

Plans:
- [x] 10-01-PLAN.md -- AI writing API route, story context assembly, writing prompts (WRITE-01, WRITE-02)
- [ ] 10-02-PLAN.md -- ElevenLabs TTS/clone/voices API routes, screenplay parser, audio stitcher (VOICE-01, VOICE-02)
- [ ] 10-03-PLAN.md -- TipTap inline diff extension, AI writing toolbar, SceneEditor integration (WRITE-01, WRITE-02)
- [ ] 10-04-PLAN.md -- Multi-voice narration pipeline wiring, MP3 export, MCP voice tools (VOICE-01, VOICE-02)

### Phase 11: Multimodal Input
**Goal**: Users can speak to Jinn as naturally as they type, and transition fluidly between voice, text, and direct manipulation without friction or mode switching
**Depends on**: Phase 5, Phase 6
**Requirements**: JMULTI-01, JMULTI-02
**Success Criteria** (what must be TRUE):
  1. User can speak "show me the castle scene with Elena" and Jinn composes the correct workspace view -- voice input produces the same result as typing the same request
  2. User can start a request by voice, refine it by typing, and finish by clicking -- all within the same interaction flow without losing context
  3. Voice input is continuously available (not a separate mode that must be activated) and works alongside panel manipulation
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md -- Voice transcription infrastructure (GeminiLiveClient inputTranscription, live-token update, useMultimodalInput hook)
- [ ] 11-02-PLAN.md -- Push-to-talk, auto-connect, idle disconnect, AdvisorOverlay always-available mic and unified input surface

### Phase 12: Export and Package Boundary
**Goal**: Users can export their complete stories as publishable packages, and Jinn's code is cleanly separated with automated enforcement preventing domain leakage
**Depends on**: Phase 8, Phase 9, Phase 10
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, PKG-01
**Success Criteria** (what must be TRUE):
  1. User can export a story as a formatted PDF with embedded illustrations and styled text
  2. User can export a complete story package as a shareable HTML5 bundle with illustrations, voice narration, and reader navigation
  3. For branching stories, the export produces a navigable visual novel experience where the reader makes choices and follows different paths
  4. CI/lint rules prevent any import from Studio Story domain code into the Jinn engine package -- violations fail the build
**Plans:** 4/4 plans complete

Plans:
- [ ] 12-01-PLAN.md -- Shared StoryExportData types, StoryPDFGenerator with embedded illustrations (EXPORT-01)
- [ ] 12-02-PLAN.md -- HTML5BundleGenerator with inlined assets, art-style adaptive reader, scene navigation (EXPORT-02)
- [ ] 12-03-PLAN.md -- VisualNovelGenerator with VN state machine and branching choices, ExportDialog update (EXPORT-03)
- [ ] 12-04-PLAN.md -- ESLint no-restricted-imports boundary rule for dzin package, extended boundary test (PKG-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12

Note: Phases 2 and 3 can execute in parallel (both depend only on Phase 1). Phases 8, 9, and 10 can execute in parallel (all depend on Phase 7). Phase 11 depends on 5+6 and can execute in parallel with 7-10.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Jinn Package Scaffold and Component Catalog | 4/4 | Complete   | 2026-03-14 |
| 2. Jinn Layout Engine | 3/3 | Complete   | 2026-03-14 |
| 3. Jinn State and Streaming | 3/3 | Complete    | 2026-03-14 |
| 4. Jinn Conversation Shell | 2/2 | Complete | 2026-03-14 |
| 5. Jinn Intent and Director | 3/3 | Complete | 2026-03-14 |
| 6. Jinn LLM Integration | 0/3 | Not started | - |
| 7. Story Data and Authoring | 3/4 | In Progress|  |
| 8. Story Intelligence and Branching | 2/3 | In Progress|  |
| 9. Visual Pipeline | 1/3 | In Progress|  |
| 10. Writing Tools and Voice | 4/4 | Complete    | 2026-03-14 |
| 11. Multimodal Input | 2/2 | Complete    | 2026-03-15 |
| 12. Export and Package Boundary | 4/4 | Complete   | 2026-03-15 |
