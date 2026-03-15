---
phase: 12-export-and-package-boundary
plan: 03
subsystem: export
tags: [visual-novel, export, html5, branching, interactive]
dependency_graph:
  requires: [12-02]
  provides: [VisualNovelGenerator, VN templates, ExportDialog story formats]
  affects: [src/lib/export, ExportDialog]
tech_stack:
  added: []
  patterns: [JS state machine, base64 asset inlining, click-to-advance VN]
key_files:
  created:
    - src/lib/export/VisualNovelGenerator.ts
    - src/lib/export/templates/visual-novel.ts
    - src/lib/export/templates/vn-styles.ts
    - src/lib/export/__tests__/visual-novel.test.ts
  modified:
    - src/lib/export/index.ts
    - src/app/features/story/sub_StoryScript/components/ExportDialog.tsx
decisions:
  - "VN engine uses inline JS state machine (no framework) for zero-dependency single-file output"
  - "Dead-end detection: scenes with no choices and isEnding !== true auto-show The End"
  - "Staggered fade-in for choice buttons (100ms per button) for polished UX"
  - "ExportDialog groups formats into Script Formats and Story Formats sections"
metrics:
  duration_minutes: 4
  completed: "2026-03-15T10:13:00Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 10
  tests_total_passing: 27
requirements: [EXPORT-03]
---

# Phase 12 Plan 03: Visual Novel Generator Summary

VN export generator producing self-contained HTML with JS state machine for branching dialogue, click-to-advance UX, auto-play audio, and fade transitions.

## What Was Built

### VisualNovelGenerator (src/lib/export/VisualNovelGenerator.ts)
- Transforms StoryExportData into VNSceneData with flattened dialogue lines, mapped choice targets, and base64-inlined assets
- Scenes without dialogueLines create a single narration line from scene content
- Dead-end detection: scenes with no choices and isEnding !== true auto-set as endings
- Returns ExportResult with format 'visual-novel' and 'text/html;charset=utf-8' blob

### VN Templates
- **vn-styles.ts**: Classic VN CSS -- fullscreen background cover, semi-transparent dialogue box (30vh) fixed at bottom, speaker name with accent color, choice buttons with opacity fade-in animation, ending overlay, art-style adaptive theming
- **visual-novel.ts**: JS state machine engine with scenes JSON, showLine/advance/showChoices/goToScene/showEnding functions, auto-play Audio on line display, keyboard controls (Space/Enter to advance, 1-9 for choices), click-to-advance on dialogue box, 300ms opacity fade scene transitions

### ExportDialog Updates (ExportDialog.tsx)
- Three new format cards: Story PDF (FileImage icon, amber), HTML5 Reader (Globe icon, emerald), Visual Novel (Gamepad2 icon, pink)
- Format list grouped with section headers: "Script Formats" and "Story Formats"
- "Include voice narration" toggle for HTML5 and Visual Novel formats with file-size warning banner

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (RED) | a85581b | Failing tests for VN generator |
| 1 (GREEN) | 6033ffd | Implement VN generator + templates |
| 2 | b115812 | Update ExportDialog with story formats |

## Deviations from Plan

None -- plan executed exactly as written.

## Test Results

All 27 export tests pass (10 VN + 6 story-pdf + 11 html5-bundle).

## Self-Check: PASSED
