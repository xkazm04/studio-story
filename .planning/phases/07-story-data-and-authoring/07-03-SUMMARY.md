---
phase: 07-story-data-and-authoring
plan: 03
subsystem: ui
tags: [tiptap, screenplay, scene-editor, rich-text, distraction-free]

# Dependency graph
requires:
  - phase: 07-01
    provides: "Scene CRUD API and panel infrastructure"
provides:
  - "5 TipTap custom node extensions for screenplay formatting"
  - "ScreenplayKeymap extension with keyboard shortcuts"
  - "ScreenplayToolbar with combined prose + screenplay formatting"
  - "Distraction-free fullscreen editor mode"
  - "Dual-mode SceneEditorPanel (TipTap + legacy blocks)"
affects: [07-04, scene-editor, script-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: ["TipTap Node.create() for custom block nodes", "Extension.create() for keymap shortcuts", "Dual-mode editor with auto-detection"]

key-files:
  created:
    - src/app/features/story/sub_SceneEditor/extensions/screenplayNodes.ts
    - src/app/features/story/sub_SceneEditor/extensions/screenplayKeymap.ts
    - src/app/features/story/sub_SceneEditor/components/ScreenplayToolbar.tsx
  modified:
    - src/workspace/panels/scene/SceneEditorPanel.tsx
    - src/app/globals.css

key-decisions:
  - "Dual-mode editor (TipTap default, blocks for legacy @marker content) preserves backward compatibility"
  - "Distraction-free mode at z-[8500] sits below advisor overlay (z-9000) but above workspace panels"
  - "Screenplay CSS uses --ms-* custom properties for theme consistency"

patterns-established:
  - "TipTap custom nodes: Node.create() with data-type attribute + CSS class for styling"
  - "Dual-mode pattern: auto-detect content format, mode toggle in panel header"

requirements-completed: [STORY-04]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 07 Plan 03: Screenplay Extensions Summary

**TipTap screenplay extensions (5 node types + keymap) with dual-mode scene editor and distraction-free fullscreen toggle**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T17:36:48Z
- **Completed:** 2026-03-14T17:41:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- 5 TipTap custom Node extensions (SceneHeading, ActionLine, CharacterCue, Dialogue, Parenthetical) with parse/render HTML
- ScreenplayKeymap extension with Mod+Shift+H/A/C/D/P shortcuts for block type switching
- Combined prose + screenplay toolbar with active state indicators and keyboard shortcut hints
- SceneEditorPanel dual-mode: TipTap rich-text editor (default) with automatic fallback to legacy block editor for @marker content
- Distraction-free mode via F11 or Ctrl+Shift+F covering full viewport
- Screenplay CSS styles in globals.css using --ms-* design system variables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TipTap screenplay extensions and keymap** - `837aa29` (feat)
2. **Task 2: Add screenplay toolbar, distraction-free mode, and all screenplay CSS** - `214ab86` (feat)

## Files Created/Modified
- `src/app/features/story/sub_SceneEditor/extensions/screenplayNodes.ts` - 5 TipTap custom Node extensions for screenplay elements
- `src/app/features/story/sub_SceneEditor/extensions/screenplayKeymap.ts` - Keyboard shortcuts for screenplay block type switching
- `src/app/features/story/sub_SceneEditor/components/ScreenplayToolbar.tsx` - Combined prose + screenplay formatting toolbar
- `src/workspace/panels/scene/SceneEditorPanel.tsx` - Dual-mode editor with TipTap integration and distraction-free mode
- `src/app/globals.css` - Screenplay node CSS styles (scene-heading, action, character-cue, dialogue, parenthetical)

## Decisions Made
- Used dual-mode editor approach (TipTap + legacy blocks) to preserve backward compatibility with existing @marker format content
- Distraction-free mode renders at z-[8500] to stay below advisor overlay (z-9000) but above workspace panels
- Screenplay CSS uses --ms-* custom properties (accent-primary, text-primary, text-secondary, text-muted) for theme consistency
- Parenthetical CSS uses ::before/::after pseudo-elements for purely visual parentheses wrapping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Screenplay extensions ready for use in scene editor
- TipTap mode is default for new scenes; legacy @marker content auto-detects to block mode
- ScreenplayToolbar can be extended with additional formatting options in future plans

## Self-Check: PASSED

All 6 files verified present. Both task commits (837aa29, 214ab86) verified in git log.

---
*Phase: 07-story-data-and-authoring*
*Completed: 2026-03-14*
