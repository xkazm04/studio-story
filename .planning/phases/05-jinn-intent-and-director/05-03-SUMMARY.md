---
phase: 05-jinn-intent-and-director
plan: 03
subsystem: intent-system
tags: [intent, resize-handles, layout-picker, pointer-events, direct-manipulation, intent-provider, keyboard-shortcuts, dzin-core, workspace, react]

# Dependency graph
requires:
  - phase: 05-jinn-intent-and-director
    plan: 01
    provides: Intent types, createDirector, createIntentBus, handler factories, NEEDS_LLM sentinel
  - phase: 05-jinn-intent-and-director
    plan: 02
    provides: computeResize, initResizeState, createIntentQueue, IntentProvider, useIntent hook
  - phase: 03-jinn-state-and-streaming
    provides: acquireUserLock, releaseUserLock, StateEngine
  - phase: 02-jinn-layout-engine
    provides: LAYOUT_TEMPLATES, LAYOUT_ORDER, assignSlotDensity
provides:
  - useResizeHandle hook for panel edge drag with density snapping via Pointer Events API
  - useIntentDispatch hook initializing full intent system (Director + Bus + Queue + 4 handlers)
  - LayoutPicker dropdown with SVG layout thumbnails and Ctrl+1-7 keyboard shortcuts
  - IntentProvider wired at app root via providers.tsx
  - Panel close buttons dispatching compose intents
  - Resize handle hit areas on panel right and bottom edges
affects: [06-llm-transport, 07-studio-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [pointer-events-resize, intent-provider-at-root, layout-picker-svg-thumbnails, keyboard-shortcut-layout-switching]

key-files:
  created:
    - src/workspace/hooks/useResizeHandle.ts
    - src/workspace/hooks/useIntentDispatch.ts
    - src/workspace/layout/header/LayoutPicker.tsx
  modified:
    - src/workspace/components/WorkspacePanelWrapper.tsx
    - src/workspace/components/WorkspaceGrid.tsx
    - src/app/providers.tsx
    - src/workspace/layout/header/WorkspaceHeader.tsx
    - packages/dzin/core/src/state/engine.ts
    - packages/dzin/core/src/state/types.ts

key-decisions:
  - "Pointer Events API for resize (setPointerCapture) rather than third-party drag library -- zero deps, better touch support"
  - "Resize state stored in useRef to avoid re-renders during pointermove; density committed only on pointerup"
  - "LayoutPicker uses inline SVG thumbnails (~40x30px) per template rather than image assets"
  - "Ctrl+1-7 keyboard shortcuts mapped to LAYOUT_ORDER from @dzin/core, excluding stack (mobile-only)"
  - "IntentProvider wraps inside QueryClientProvider via IntentSetup inner component pattern"

patterns-established:
  - "Resize handle pattern: 4px transparent hit area on panel edges, cursor change on hover, Pointer Events for drag"
  - "Intent system initialization: useIntentDispatch hook wires Director + Bus + handlers + queue as single setup"
  - "Layout switching: both dropdown UI and keyboard shortcuts dispatch compose intent with set-layout action"

requirements-completed: [JINT-06]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 5 Plan 03: Host App Integration Summary

**Panel resize handles via Pointer Events, layout template picker with SVG thumbnails and Ctrl+1-7 shortcuts, and IntentProvider wired at app root**

## Performance

- **Duration:** 2 min (continuation -- Tasks 1-2 completed in prior session)
- **Started:** 2026-03-14T13:34:28Z
- **Completed:** 2026-03-14T13:36:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 9

## Accomplishments
- useResizeHandle hook provides drag-to-resize on panel edges using Pointer Events API with acquireUserLock/releaseUserLock conflict guards and density hysteresis from computeResize
- useIntentDispatch hook initializes the complete intent system (Director with compose/manipulate/navigate/system handlers, IntentBus, IntentQueue) and connects it to the app's panel registry and workflow hints
- LayoutPicker dropdown renders inline SVG thumbnails for all 7 layout templates (excluding stack), with active template highlighting and Ctrl+1-7 keyboard shortcuts
- IntentProvider wraps the app root via an IntentSetup inner component in providers.tsx, making useIntent() available to all workspace components
- WorkspacePanelWrapper augmented with resize handle hit areas (right + bottom edges) and close button dispatching compose intent
- WorkspaceGrid gains data-dzin-workspace-grid attribute and ref for resize dimension computation

## Task Commits

Each task was committed atomically:

1. **Task 1: Resize handles, intent dispatch bridge, and IntentProvider wiring** - `d711ce4` (feat)
2. **Task 2: Layout template picker and keyboard shortcuts** - `c2a9eae` (feat)
3. **Task 3: Verify direct manipulation and layout picker in browser** - checkpoint approved (no commit)

## Files Created/Modified
- `src/workspace/hooks/useResizeHandle.ts` - Pointer Events resize hook using computeResize with density snapping and user locks
- `src/workspace/hooks/useIntentDispatch.ts` - Full intent system initialization bridge (Director + Bus + Queue + 4 handlers)
- `src/workspace/layout/header/LayoutPicker.tsx` - Dropdown with SVG layout thumbnails, active highlight, Ctrl+1-7 shortcuts
- `src/workspace/components/WorkspacePanelWrapper.tsx` - Added resize handle divs and close button with intent dispatch
- `src/workspace/components/WorkspaceGrid.tsx` - Added grid container ref and data-dzin-workspace-grid attribute
- `src/app/providers.tsx` - IntentProvider wrapping app root via IntentSetup inner component
- `src/workspace/layout/header/WorkspaceHeader.tsx` - Added LayoutPicker to header bar
- `packages/dzin/core/src/state/engine.ts` - Minor type adjustment for intent system compatibility
- `packages/dzin/core/src/state/types.ts` - Minor type adjustment for intent system compatibility

## Decisions Made
- Pointer Events API (setPointerCapture) for resize rather than third-party library -- zero dependencies, better touch support, consistent with Phase 4 decision (04-02)
- Resize state stored in useRef to avoid re-renders during pointermove; density change committed only on pointerup to avoid thrashing
- LayoutPicker renders inline SVG thumbnails per template rather than separate image assets -- self-contained, theme-consistent
- Ctrl+1-7 keyboard shortcuts mapped to LAYOUT_ORDER from @dzin/core, excluding stack template (mobile-only fallback per 02-02 decision)
- IntentProvider wraps inside QueryClientProvider via an IntentSetup inner component that calls useIntentDispatch() -- keeps provider tree clean

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (Jinn Intent and Director) is now fully complete -- all 3 plans executed
- The complete intent pipeline is operational: typed intents flow from UI gestures through the Director to local handlers or LLM fallthrough
- Direct manipulation (resize, layout switch, close) and LLM composition coexist via user locks and intent queue buffering
- Phase 6 (Jinn LLM Integration) can wire NEEDS_LLM routing to Claude Code CLI and Gemini API
- Phase 7+ (Studio Story domain) can use useIntent() for all panel interactions

## Self-Check: PASSED

All 7 key files verified on disk. Both task commits (d711ce4, c2a9eae) verified in git log. Task 3 checkpoint approved by user.

---
*Phase: 05-jinn-intent-and-director*
*Completed: 2026-03-14*
