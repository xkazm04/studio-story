# Studio Story + Jinn

## What This Is

A next-generation AI-driven storytelling studio where a non-technical user can create complete, publishable story packages — illustrated scenes, consistent characters, voice narration, branching narratives — through a dynamic interface called **Jinn**. Jinn is a reusable UI engine where the LLM acts as a "dirigent" — composing, arranging, and adapting the interface in real-time through conversation, voice, and ambient observation. Studio Story is the first application built on Jinn, proving that multimodal AI-driven UX can replace hardcoded pages with fluid, context-aware workspaces.

## Core Value

A regular person can produce a high-quality, compelling, publishable story package (with illustrations, consistent characters, and narration) without technical skill — because the interface adapts to them, not the other way around.

## Requirements

### Validated

<!-- Inferred from existing codebase -->

- ✓ Supabase-backed CRUD for projects, characters, scenes, acts, beats, factions, traits, relationships — existing
- ✓ MCP server providing Claude Code CLI access to all project data via stdio — existing
- ✓ Panel-based workspace with CSS Grid layout engine and lazy-loaded components — existing
- ✓ Machine-readable panel manifests enabling LLM-driven workspace composition — existing
- ✓ AI advisor system (Gemini) with text + voice modes — existing
- ✓ Image generation via Leonardo AI and Gemini — existing
- ✓ Rich text editing (TipTap) for scenes and scripts — existing
- ✓ Relationship map visualization (ReactFlow) — existing
- ✓ Audio/voice pipeline (Tone.js, pitch detection, MIDI) — existing
- ✓ Next.js 16 App Router single-page architecture — existing

### Active

<!-- Jinn: Universal Interface Engine -->

- [ ] Jinn core: LLM-UI protocol where LLM directs panel composition, density, and data flow in real-time
- [ ] Jinn primitives: Reusable, granular UI building blocks (cards, tables, editors, media viewers) designed as a separable package
- [ ] Jinn layout engine: Dynamic viewport-aware composition replacing hardcoded layouts — panels composed per need, not per page
- [ ] Jinn voice: Equal-mode input — voice, text, and direct manipulation as first-class interaction modes
- [ ] Jinn ambient mode: LLM observes user context and proactively adapts UI, surfaces relevant data, suggests next steps
- [ ] Jinn conversation mode: User directs via natural language ("show me the castle scene with Elena") and LLM responds by composing the right view
- [ ] Jinn state protocol: Unified state management bridging LLM context, UI state, and user session
- [ ] Jinn package boundary: Clean separation so Jinn can be extracted as a standalone package for other applications

<!-- Studio Story: Storytelling Application on Jinn -->

- [ ] Story creation flow: User can build complete narratives (premise, acts, beats, scenes) through Jinn's guided composition
- [ ] Character creation + consistency: Visual character design with AI-maintained consistency across all generated images
- [ ] World building: Locations, factions, cultures, relationships composed and visualized through Jinn panels
- [ ] Scene visualization: AI-generated illustrated scenes matching story art style and character appearances
- [ ] Script + dialogue: Writing and editing scripts with character voice assignments and narration
- [ ] Published story package: Export complete story as shareable package (illustrated, voiced, navigable)

### Out of Scope

- Mobile native app — web-first, local-first; mobile is future
- Local LLM inference — Claude Code CLI is the LLM engine, Gemini API bridges multimodality; no Ollama/llama.cpp
- Real-time multi-user collaboration — single user, local-first for now
- Monetization/marketplace — no publishing platform or payment system
- Game engine output — story packages are narrative (visual novel / audiobook style), not interactive games

## Context

**Existing codebase:** 25+ panel types, layout engine with Hungarian algorithm, Gemini advisor with voice, MCP server with 30+ tools. However, the current design is "half-baked" — UI is hard to grasp, principles aren't reusable, and the paradigm is still hardcoded pages pretending to be dynamic.

**Clean slate decision:** Jinn will be designed from scratch with proper abstractions. The existing code serves as learning material — what worked (panel manifests, density modes, spatial budget), what didn't (tight coupling, non-separable concerns, inconsistent patterns).

**LLM architecture:** Claude Code CLI runs locally as the core reasoning engine. Gemini 3.x API serves as a multimodal bridge — vision, image generation, audio — called as a tool by Claude. The web frontend (Next.js) handles rendering and user interaction. Communication flows: User ↔ Jinn UI ↔ Claude Code CLI (via MCP/stdio) ↔ Gemini API (for multimodal tasks).

**Success metric:** If a regular person — not a developer, not a writer — can sit down and produce a compelling illustrated story through natural conversation and direct manipulation, the interface has proven itself worthy of generalization.

## Constraints

- **LLM Engine**: Claude Code CLI (local process) — all reasoning and orchestration routes through Claude
- **Multimodal Bridge**: Gemini API (3.x models) — vision, image, audio capabilities as tools for Claude
- **Runtime**: Local-first — app runs on user's machine, no cloud deployment required for core functionality
- **Frontend**: Next.js (web) — leverages existing ecosystem, SSR not needed (SPA), Turbopack for DX
- **Database**: Supabase — existing schema and data, keep for persistence layer
- **Package Design**: Jinn must be separable — clean boundaries, no Studio Story domain logic leaking into Jinn

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean slate for Jinn (not evolving existing panels) | Current code is tightly coupled and not separable. Fresh design enables proper abstractions from day one. | — Pending |
| Claude Code CLI as LLM engine (not direct API calls) | Already integrated via MCP, provides tool execution, file access, and multi-step reasoning out of the box. | — Pending |
| Gemini as multimodal bridge (not primary LLM) | Gemini excels at vision/image/audio. Claude excels at reasoning/planning. Use each for their strength. | — Pending |
| Voice/text/manipulation as equal modes | Users shouldn't have to choose a "mode" — all three should work fluidly at any moment. | — Pending |
| Architecture open (Rust deferred) | Rust was suggested but not required. Decide architecture based on what best serves the interface requirements, not upfront tech choices. | — Pending |

---
*Last updated: 2026-03-13 after initialization*
