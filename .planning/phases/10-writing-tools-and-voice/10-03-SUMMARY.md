---
phase: 10-writing-tools-and-voice
plan: 03
subsystem: ui
tags: [tiptap, prosemirror, inline-diff, bubble-menu, diff-match-patch, writing-tools]

# Dependency graph
requires:
  - phase: 10-writing-tools-and-voice
    provides: WritingToolType, POST /api/ai/writing endpoint, getSystemPrompt
provides:
  - InlineDiffExtension with ProseMirror decoration-based green/red diff rendering
  - AIWritingExtension managing API call lifecycle and delegating to InlineDiffExtension
  - AIWritingToolbar BubbleMenu with 5 writing tools and Continue length picker
  - InlineDiffControls floating accept/reject bar with Enter/Escape shortcuts
  - SceneEditorPanel integration wiring both extensions into TipTap editor
affects: [10-04-PLAN]

# Tech tracking
tech-stack:
  added: ["diff-match-patch", "@types/diff-match-patch"]
  patterns: ["TipTap extension with ProseMirror decoration plugin", "BubbleMenu dropdown with nested submenu", "Replace-then-decorate inline diff strategy"]

key-files:
  created:
    - src/app/features/story/sub_SceneEditor/extensions/inlineDiffExtension.ts
    - src/app/features/story/sub_SceneEditor/extensions/aiWritingExtension.ts
    - src/app/features/story/sub_SceneEditor/extensions/__tests__/aiWritingExtension.test.ts
    - src/app/features/story/sub_SceneEditor/components/AIWritingToolbar.tsx
    - src/app/features/story/sub_SceneEditor/components/InlineDiffControls.tsx
  modified:
    - src/workspace/panels/scene/SceneEditorPanel.tsx

key-decisions:
  - "Replace-then-decorate diff strategy: replace text with new text on showDiff, add decorations; acceptDiff clears decorations; rejectDiff calls undo"
  - "Widget decorations for deletions (zero-width position with strikethrough span), inline decorations for additions"
  - "BubbleMenu from @tiptap/react/menus with Floating UI options (TipTap v3 replaced Tippy with Floating UI)"
  - "Integration into SceneEditorPanel.tsx (workspace panel with TipTap) rather than SceneEditor.tsx (feature component with textarea)"
  - "Storage accessed via double-cast (as unknown as Record) for extension storage type safety"

patterns-established:
  - "TipTap extension storage access pattern: (editor.storage as unknown as Record<string, Record<string, unknown>>).extensionName"
  - "BubbleMenu visibility gating: shouldShow checks selection non-empty AND diff not active"
  - "Floating accept/reject controls positioned via editor.view.coordsAtPos relative to editor DOM rect"

requirements-completed: [WRITE-01, WRITE-02]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 10 Plan 03: AI Writing Editor UI Summary

**TipTap inline diff extension with green/red decorations, AI writing BubbleMenu toolbar with 5 tools, and accept/reject controls integrated into SceneEditorPanel**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T22:38:22Z
- **Completed:** 2026-03-14T22:46:53Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- InlineDiffExtension using diff-match-patch for computing text diffs with ProseMirror decorations (green additions, red strikethrough deletions via widget decorations)
- AIWritingExtension managing async API calls to /api/ai/writing with processing state, delegating results to InlineDiffExtension for inline preview
- AIWritingToolbar BubbleMenu with Continue (sentence/paragraph/page length picker), Rewrite, Expand, Show Don't Tell, and Sensory Rewrite tools
- InlineDiffControls floating bar with Accept (Enter) and Reject (Escape) keyboard shortcuts
- 10 structural tests validating extension names, storage defaults, command registrations, and plugin definitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Inline diff and AI writing TipTap extensions with behavioral test** - `06fa8c0` (feat, TDD)
2. **Task 2: AI toolbar UI and SceneEditor integration** - `b5cc295` (feat)

## Files Created/Modified
- `src/app/features/story/sub_SceneEditor/extensions/inlineDiffExtension.ts` - ProseMirror decoration-based inline diff with showDiff/acceptDiff/rejectDiff/isDiffActive commands
- `src/app/features/story/sub_SceneEditor/extensions/aiWritingExtension.ts` - TipTap extension managing API call lifecycle with runWritingTool/clearWritingState commands
- `src/app/features/story/sub_SceneEditor/extensions/__tests__/aiWritingExtension.test.ts` - 10 structural tests for both extensions
- `src/app/features/story/sub_SceneEditor/components/AIWritingToolbar.tsx` - BubbleMenu dropdown with AI writing tool options and Continue submenu
- `src/app/features/story/sub_SceneEditor/components/InlineDiffControls.tsx` - Floating accept/reject controls with keyboard shortcuts
- `src/workspace/panels/scene/SceneEditorPanel.tsx` - Added both extensions to TipTap editor and rendered toolbar/controls

## Decisions Made
- Used "replace-then-decorate" diff strategy: text is replaced immediately on showDiff, decorations mark additions/deletions; accept clears decorations, reject calls undo
- Widget decorations used for deletions (shown as strikethrough spans at zero-width positions) since deleted text occupies no space in the new document
- BubbleMenu imported from `@tiptap/react/menus` (TipTap v3 moved it to a subpath export)
- Used Floating UI `options.placement` instead of deprecated `tippyOptions` (TipTap v3 migration)
- Integrated into SceneEditorPanel.tsx (workspace panel with real TipTap editor) instead of SceneEditor.tsx (feature component using plain textarea)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Integrated into SceneEditorPanel.tsx instead of SceneEditor.tsx**
- **Found during:** Task 2 (SceneEditor integration)
- **Issue:** Plan specified SceneEditor.tsx for integration, but that component uses a plain textarea, not TipTap. The actual TipTap editor is in SceneEditorPanel.tsx (workspace panel).
- **Fix:** Integrated extensions and components into SceneEditorPanel.tsx where the TipTap useEditor instance lives
- **Files modified:** src/workspace/panels/scene/SceneEditorPanel.tsx
- **Verification:** TypeScript compiles, extensions register in TipTap editor
- **Committed in:** b5cc295

**2. [Rule 1 - Bug] Fixed TipTap v3 BubbleMenu API migration**
- **Found during:** Task 2 (AIWritingToolbar implementation)
- **Issue:** Plan referenced `tippyOptions` prop which no longer exists in TipTap v3 (switched from Tippy to Floating UI). BubbleMenu export also moved from `@tiptap/react` to `@tiptap/react/menus`.
- **Fix:** Changed import path and replaced `tippyOptions` with `options: { placement: 'top' }`
- **Files modified:** src/app/features/story/sub_SceneEditor/components/AIWritingToolbar.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** b5cc295

**3. [Rule 1 - Bug] Fixed TipTap v3 Extension.create() API in tests**
- **Found during:** Task 1 (test execution)
- **Issue:** TipTap v3 Extension.create() returns the extension directly, not a factory with a .create() method. Tests were calling .create() on already-created extensions.
- **Fix:** Updated tests to access .name, .storage, .config directly on the extension object
- **Files modified:** src/app/features/story/sub_SceneEditor/extensions/__tests__/aiWritingExtension.test.ts
- **Verification:** All 10 tests pass
- **Committed in:** 06fa8c0

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for TipTap v3 compatibility and correct integration target. No scope creep.

## Issues Encountered
- TipTap v3 significantly changed the BubbleMenu API (Floating UI replaces Tippy, subpath exports), requiring adaptation from plan-specified code patterns
- Extension storage type access requires double-cast pattern (`as unknown as Record`) due to TipTap's Storage type being opaque

## User Setup Required
None - uses the ANTHROPIC_API_KEY already configured for Plan 01's /api/ai/writing endpoint.

## Next Phase Readiness
- AI writing toolbar and inline diff are wired into the SceneEditorPanel
- All 5 writing tools (continue, rewrite, expand, show-dont-tell, sensory-rewrite) are accessible from the BubbleMenu
- Plan 04 can build on this for MCP tool integration and voice workspace panels

## Self-Check: PASSED

All 6 files verified present. Both task commits (06fa8c0, b5cc295) verified in git log.

---
*Phase: 10-writing-tools-and-voice*
*Completed: 2026-03-14*
