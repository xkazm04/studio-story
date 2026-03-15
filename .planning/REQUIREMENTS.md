# Requirements: Studio Story + Jinn

**Defined:** 2026-03-14
**Core Value:** A regular person can produce a high-quality, compelling, publishable story package through an AI-driven interface that adapts to them.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Jinn Core Engine

- [x] **JCORE-01**: Component registry where LLM selects from pre-registered panel types with metadata (size, role, complexity, domains)
- [x] **JCORE-02**: Machine-readable panel manifests declaring capabilities, inputs, outputs, density modes, and data slice schemas
- [x] **JCORE-03**: Layout composition engine that resolves LLM panel directives into CSS Grid layouts with viewport-aware responsive breakpoints
- [x] **JCORE-04**: Bidirectional state synchronization between LLM context and UI state using JSON Patch (RFC 6902) deltas
- [x] **JCORE-05**: Streaming response rendering — partial LLM results visible immediately, progressive panel population
- [x] **JCORE-06**: Chat/conversation interface as always-available fallback when panel composition is insufficient
- [x] **JCORE-07**: Undo/redo system for AI-initiated actions — user can revert any LLM-driven UI or content change
- [x] **JCORE-08**: Multi-density panel system — each panel renders at micro, compact, or full density based on viewport and focus
- [x] **JCORE-09**: Spatial budget protocol — LLM receives exact pixel dimensions of available slots and reasons about what fits
- [x] **JCORE-10**: Tool call visualization — user can see what the LLM is doing, why, and what tools it invoked
- [x] **JCORE-11**: Jinn type system and protocol definitions separated from any domain-specific code (enforced import boundaries)

### Jinn Intelligence

- [x] **JINT-01**: Intent bus that normalizes all user inputs (voice, text, click, ambient) into typed Intent objects
- [x] **JINT-02**: Director with tiered resolution — instant local resolution via workflow hints (~80% of intents) + LLM reasoning for complex/ambiguous intents (~20%)
- [x] **JINT-03**: Claude Code CLI integration via MCP/stdio as primary reasoning and orchestration engine
- [x] **JINT-04**: Gemini API bridge for multimodal tasks (vision, image generation, audio) called as tools by Claude
- [x] **JINT-05**: Ambient observation mode — LLM watches user context and proactively adapts UI, surfaces relevant data, suggests next steps
- [x] **JINT-06**: Direct manipulation alongside LLM composition — user can drag, resize, rearrange panels while LLM also composes them

### Jinn Multimodal

- [x] **JMULTI-01**: Voice input as equal-mode interaction — user speaks intent ("show me the castle scene with Elena") and LLM composes the right view
- [x] **JMULTI-02**: Fluid modality switching — user transitions between voice, text, and direct manipulation without mode changes or friction

### Story Creation

- [x] **STORY-01**: User can create structured stories with premise, acts, beats, and scenes through Jinn's guided LLM composition
- [x] **STORY-02**: User can create and manage character profiles with traits, descriptions, relationships, and faction membership
- [x] **STORY-03**: Interactive relationship map that visualizes character connections and faction dynamics
- [x] **STORY-04**: User can edit scene content and dialogue in a rich text editor within Jinn panels
- [x] **STORY-05**: AI-driven narrative suggestions — LLM analyzes relationship tensions and story structure to suggest plot developments, conflicts, and resolutions
- [x] **STORY-06**: Branching narrative system — user can create choose-your-own-adventure story paths with scene graph visualization

### Story Visual

- [x] **VISUAL-01**: AI-generated scene illustrations matching story context (characters present, location, mood, action)
- [x] **VISUAL-02**: Character visual consistency — same character looks the same across all generated images using reference-image based pipeline (IPAdapter/cref-style)
- [x] **VISUAL-03**: Art style consistency engine — defined art style (palette, lighting, mood) persists across all generated images for the entire story

### Story Writing

- [x] **WRITE-01**: AI text generation — user can continue, rewrite, and expand story text with Claude maintaining narrative voice
- [x] **WRITE-02**: Fiction-specific writing tools — show-don't-tell conversion, sensory rewrite (emotion amplification and cliche detection deferred to future iteration per user decision)

### Story Voice

- [x] **VOICE-01**: TTS narration — user can generate voice narration for scenes with character-appropriate voices
- [x] **VOICE-02**: Script-to-performance pipeline — write dialogue, assign character voices, generate multi-voice audio drama with narration

### Export

- [x] **EXPORT-01**: PDF export with embedded illustrations and formatted story text
- [x] **EXPORT-02**: Complete story package — shareable HTML5 bundle with illustrations, voice narration, and navigation
- [x] **EXPORT-03**: Visual novel output — branching narrative exported as navigable, illustrated, voiced experience

### Package Boundary

- [ ] **PKG-01**: Automated import boundary enforcement — CI/lint rules prevent Studio Story domain code from leaking into Jinn engine code
- [x] **PKG-02**: Jinn engine code organized in a monorepo-ready structure (packages/jinn/) even if not yet published as npm package

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Jinn Advanced

- **JADV-01**: Jinn extracted and published as standalone npm package via Turborepo + tsup
- **JADV-02**: Plugin/extension system for third-party panel types
- **JADV-03**: Offline/local-first resilience when cloud services are unreachable

### Story Advanced

- **SADV-01**: Voice-directed scene creation ("make it darker, add rain") via real-time multimodal direction
- **SADV-02**: Audiobook export format with chapter markers and metadata
- **SADV-03**: ePub3 export with embedded audio
- **SADV-04**: Real-time multiplayer collaboration (CRDT-based)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Raw code generation in UI (Renderify-style) | Security risk, inconsistent quality. Use registered component selection instead. |
| Infinite canvas / whiteboard | Becomes a dumping ground. Structured panels with layout engine is the right abstraction. |
| Local LLM inference (Ollama/llama.cpp) | Claude Code CLI is the engine. Bundling local models adds months and degrades quality. |
| Fine-tuning / model training UI | LoRA training doesn't belong in a storytelling app. Use reference-image consistency instead. |
| Mobile native app | Web-first, local-first. Responsive web for tablets; native mobile is a separate project. |
| Social features / marketplace | Dilutes focus. Export to standard formats users can share on their own platforms. |
| Game engine / interactive fiction runtime | Story packages are narrative, not interactive games. Export to standard formats. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| JCORE-01 | Phase 1 | Complete |
| JCORE-02 | Phase 1 | Complete |
| JCORE-03 | Phase 2 | Complete |
| JCORE-04 | Phase 3 | Complete |
| JCORE-05 | Phase 3 | Complete |
| JCORE-06 | Phase 4 | Complete |
| JCORE-07 | Phase 3 | Complete |
| JCORE-08 | Phase 1 | Complete |
| JCORE-09 | Phase 2 | Complete |
| JCORE-10 | Phase 4 | Complete |
| JCORE-11 | Phase 1 | Complete |
| JINT-01 | Phase 5 | Complete |
| JINT-02 | Phase 5 | Complete |
| JINT-03 | Phase 6 | Complete |
| JINT-04 | Phase 6 | Complete |
| JINT-05 | Phase 6 | Complete |
| JINT-06 | Phase 5 | Complete |
| JMULTI-01 | Phase 11 | Complete |
| JMULTI-02 | Phase 11 | Complete |
| STORY-01 | Phase 7 | Complete |
| STORY-02 | Phase 7 | Complete |
| STORY-03 | Phase 7 | Complete |
| STORY-04 | Phase 7 | Complete |
| STORY-05 | Phase 8 | Complete |
| STORY-06 | Phase 8 | Complete |
| VISUAL-01 | Phase 9 | Complete |
| VISUAL-02 | Phase 9 | Complete |
| VISUAL-03 | Phase 9 | Complete |
| WRITE-01 | Phase 10 | Complete |
| WRITE-02 | Phase 10 | Complete |
| VOICE-01 | Phase 10 | Complete |
| VOICE-02 | Phase 10 | Complete |
| EXPORT-01 | Phase 12 | Complete |
| EXPORT-02 | Phase 12 | Complete |
| EXPORT-03 | Phase 12 | Complete |
| PKG-01 | Phase 12 | Pending |
| PKG-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation*
