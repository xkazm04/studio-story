---
phase: 13-rich-visual-novel-export-bridge
plan: "02"
subsystem: export
tags: [vn-export, react-query, export-dialog, data-bridge]
dependency_graph:
  requires: [vnExportBridge, useScenes, useActs, useSceneChoices]
  provides: [useVNExportData, vn-dual-path-export, pre-export-summary]
  affects: [ExportDialog]
tech_stack:
  added: []
  patterns: [react-query-conditional-fetch, dual-path-export, progress-indicator]
key_files:
  created:
    - src/app/hooks/integration/useVNExportData.ts
  modified:
    - src/lib/export/index.ts
    - src/app/features/story/sub_StoryScript/components/ExportDialog.tsx
decisions:
  - useVNExportData uses enabled flag to defer API calls until VN format is selected
  - VN export with rich data bypasses exportScript and goes directly to VisualNovelGenerator.generate()
  - Pre-export summary is informational only (non-blocking)
metrics:
  duration: 2 min
  completed: "2026-03-15"
---

# Phase 13 Plan 02: VN Export Data Hook and ExportDialog Integration Summary

useVNExportData hook fetches scenes/acts/choices via React Query, assembles StoryExportData using buildVNExportScenes, and ExportDialog shows pre-export summary with dual-path VN export.

## What Was Built

### Task 1: useVNExportData Hook and Export Re-exports
- Created `useVNExportData` hook that fetches scenes, acts, and choices via existing React Query hooks (`sceneApi`, `actApi`, `sceneChoiceApi`)
- Hook uses `buildVNExportScenes` from vnExportBridge to assemble `StoryExportData` with dialogue lines, choices, and asset URLs
- `enabled` parameter defaults to false so no API calls happen until VN format is selected
- Returns `{ storyExportData, summary, isLoading, error }` for consumption by ExportDialog
- Updated `src/lib/export/index.ts` to re-export `buildVNExportScenes`, `findReachableScenes`, `generateGradientBackground`, and related types from vnExportBridge

### Task 2: ExportDialog Pre-Export Summary and Dual-Path Export
- Added `projectId` prop to ExportDialogProps (optional for backward compatibility)
- Wired `useVNExportData` hook, enabled only when `selectedFormat === 'visual-novel'` and projectId is provided
- Pre-export summary panel shows: included/total scenes, illustrations count, audio count, dead-end scenes, empty scenes skipped (with appropriate icons)
- Progress indicator replaces "Exporting..." with contextual messages during export
- Dual-path export: VN format with rich data goes directly to `VisualNovelGenerator.generate()`; all other formats continue through `exportScript()` unchanged
- Export button disabled while VN data is still loading

## Verification

- TypeScript compiles cleanly (no errors in modified files)
- All 49 export tests pass (4 test files, no regressions)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 43dbe7d | Create useVNExportData hook and re-export vnExportBridge utilities |
| 2 | 71d9d58 | Update ExportDialog with VN pre-export summary, progress, and dual-path export |
