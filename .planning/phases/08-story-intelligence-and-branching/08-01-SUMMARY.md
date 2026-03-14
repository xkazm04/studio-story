---
phase: 08-story-intelligence-and-branching
plan: 01
subsystem: api, agents, workspace
tags: [scene-choices, story-analyzer, muse-insights, narrative-suggestions, supabase, tdd]

requires:
  - phase: 07-story-data-and-authoring
    provides: MCP story tools, scene/beat/act data layer, workspace panel system

provides:
  - Scene choices API routes with condition gating (GET/POST, GET/PUT/DELETE)
  - StoryAnalyzer unresolvedTension and unbalancedFactions rules
  - NarrativeSuggestionsPanel registered as workspace panel with manifest
  - TDD test coverage for relationship-tension analysis rules

affects: [08-02, 08-03, story-branching, narrative-intelligence]

tech-stack:
  added: []
  patterns: [relationship-tension-analysis, condition-gated-choices, insight-to-workspace-composition]

key-files:
  created:
    - src/app/api/scene-choices/route.ts
    - src/app/api/scene-choices/[id]/route.ts
    - src/workspace/panels/story/NarrativeSuggestionsPanel.tsx
    - src/agents/__tests__/story-analyzer.test.ts
    - src/agents/__tests__/muse-insight-accept.test.ts
  modified:
    - src/app/types/SceneChoice.ts
    - src/agents/StoryAnalyzer.ts
    - src/workspace/types.ts
    - src/workspace/engine/panelRegistry.ts
    - src/manifest/panelManifests.ts
    - src/workspace/hooks/useCLIDataSync.ts

key-decisions:
  - "TENSION_TYPES set includes rival, enemy, antagonist, nemesis, conflict for relationship analysis"
  - "unresolvedTension uses triptych layout (char1 + editor + char2) for confrontation scene creation"
  - "NarrativeSuggestionsPanel uses replaceAllPanels for insight apply actions"
  - "snapshotHash includes relationship types for mutation detection"

patterns-established:
  - "Relationship tension rule pattern: iterate relationships, check scene co-presence, emit insight with compose payload"
  - "Insight-to-composition: MuseInsight.action.payload maps directly to replaceAllPanels(panels, layout)"

metrics:
  duration: 5 min
  completed: 2026-03-14
  tasks_completed: 2
  tasks_total: 2
  test_count: 6
  files_changed: 11
---

# Phase 08 Plan 01: Story Intelligence Data Layer Summary

Scene choices API with condition-gated branching plus StoryAnalyzer relationship-tension rules and NarrativeSuggestionsPanel

## What Was Built

### Task 1: Scene Choices API Routes
- Extended `SceneChoice` type with `condition` (JSONB) and `condition_enabled` fields for gating choices on story variables
- Created `GET/POST /api/scene-choices` with projectId/sceneId query parameter filtering
- Created `GET/PUT/DELETE /api/scene-choices/[id]` for individual choice CRUD
- Added `create_choice` and `create_branch` to `TOOL_INVALIDATION_MAP` for React Query cache sync

### Task 2: StoryAnalyzer Rules + NarrativeSuggestionsPanel (TDD)
- **unresolvedTension rule**: Detects rival/enemy characters who never share a scene (>= 3 scenes required). Emits high-priority character insight with triptych workspace composition showing both character details flanking a scene editor.
- **unbalancedFactions rule**: Detects factions with zero members when 2+ factions exist. Emits medium-priority character insight.
- **snapshotHash update**: Now includes relationship types so type changes trigger re-analysis.
- **NarrativeSuggestionsPanel**: Sidebar panel reading `museInsights` from agentStore, rendering up to 5 non-dismissed insight cards with category badges, priority dots, apply/dismiss actions. Micro density shows count badge. Empty state encourages continued writing.
- **Registration**: Added `narrative-suggestions` to WorkspacePanelType union, panelRegistry (lazy-loaded, sidebar, sm), and panelManifests (with density modes and suggested companions).
- **Tests**: 6 tests covering rule emission/suppression, dismissed tracking, and compose_workspace payload validation.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b0343ae | feat(08-01): scene choices API routes with condition gating |
| 2 | 4b3b36c | feat(08-01): StoryAnalyzer tension rules, tests, and NarrativeSuggestionsPanel |
