# Studio Story Backlog Implementation Plan

## Phase 1: Workspace Infrastructure and Accessibility

1. `idea-cda1183b-selection-event-bus-replaces-h.md`
- Add typed selection bus: `src/workspace/panels/primitives/adapters/selectionBus.ts`.
- Publish selection events in `src/workspace/panels/primitives/adapters/CharacterCardsAdapter.tsx`.
- Subscribe in `src/workspace/panels/primitives/adapters/CharacterDetailAdapter.tsx`.

2. `idea-ce44bf43-panel-undo-history-empty-slot.md`
- Add close-history stack with 5-item/5-minute expiry in `src/workspace/store/workspaceStore.ts`.
- Add reopen action surface in `src/workspace/components/WorkspaceToolbar.tsx`.
- Render empty slot ghost targets in `src/workspace/components/WorkspaceGrid.tsx`.

3. `idea-fe3239d8-aria-labels-focus-management-r.md`
- Add aria labels and toolbar/button accessibility improvements in `src/workspace/components/WorkspaceToolbar.tsx`.
- Focus handoff on panel close in `src/workspace/panels/shared/PanelFrame.tsx`.
- Wrap panel wrapper with labeled section in `src/workspace/components/WorkspacePanelWrapper.tsx`.
- Add reduced-motion handling in `src/workspace/components/WorkspaceGrid.tsx`.

4. `idea-32916449-workspace-change-confirmation.md`
- Capture previous workspace snapshot for undo in `src/agents/store/agentStore.ts`.
- Store pre-compose snapshot and emit workspace update messaging in `src/agents/useAdvisor.ts`.

5. `idea-351aaaf6-workflow-context-stack-with-la.md`
- Add workflow context stack push/pop behavior in `src/workspace/store/workspaceStore.ts`.

## Phase 2: Primitives and Adapter Cohesion

6. `idea-bee4bd71-image-load-spinner-error-fallb.md`
- Add spinner during image load and error fallback/retry with cache busting in `src/workspace/panels/primitives/MediaViewer.tsx`.

7. `idea-f5d3a6fa-propagate-highlightids-to-all.md`
- Add highlight support to card primitive in `src/workspace/panels/primitives/CardGrid.tsx`.
- Wire scene highlights in `src/workspace/panels/primitives/adapters/SceneListAdapter.tsx`.
- Wire character highlight behavior in `src/workspace/panels/primitives/adapters/CharacterCardsAdapter.tsx`.

8. `idea-b62e2b6f-schema-driven-adapter-factory.md`
- Introduce reusable adapter factory in `src/workspace/panels/primitives/adapters/createAdapter.tsx`.
- Keep existing adapters operational while factory is available for incremental migration.

## Phase 3: Beats UX, A11y, and Error Consistency

9. `idea-12d83501-sticky-table-headers-view-swit.md`
- Add sticky table header styling via `headerClassName` in `src/app/features/story/components/Beats/BeatsTable.tsx`.
- Add Cmd/Ctrl+1..5 view shortcuts and kbd hints in `src/app/features/story/components/Beats/BeatsOverview.tsx`.

10. `idea-c24e60ea-aria-keyboard-accessibility-fo.md`
- Add progressbar ARIA semantics and beat-card button interaction in `src/app/features/story/components/Beats/BeatsOverview.tsx`.
- Add aria-live and aria-expanded coverage in `src/app/features/story/components/Beats/BeatClassifier.tsx`, `src/app/features/story/components/Beats/BeatSceneSuggestions.tsx`, and `src/app/features/story/components/Beats/EmotionalMarkers.tsx`.
- Add icon/button labeling in `src/app/features/story/components/Beats/DraggableBeatRow.tsx` and recommendations/suggestions panels.

11. `idea-fb5edb85-standardize-error-handling-to.md`
- Replace blocking alert usage with toast patterns in `src/app/features/story/components/Beats/ActRecommendations.tsx`.
- Add toast error feedback in `src/app/features/story/components/Beats/BeatSceneSuggestions.tsx` and `src/app/features/story/components/Beats/BeatsTableAdd.tsx`.

12. `idea-fd694244-migrate-drag-and-drop-to-dnd-k.md`
- Improve drag-handle accessibility baseline in `src/app/features/story/components/Beats/DraggableBeatRow.tsx`.
- Keep current DnD runtime stable while preparing migration path.

## Phase 4: Agent Streaming and Voice Resilience

13. `idea-2f5f4bc0-eventemitter-push-replacing-10.md`
- Add event emitter push pipeline in `src/lib/claude-terminal/cli-service.ts`.
- Replace polling with emitter subscription in `src/app/api/claude-terminal/stream/route.ts`.

14. `idea-55f0ae8f-resilient-voice-sessions-with.md`
- Extend token API response metadata and constraints in `src/app/api/agents/live-token/route.ts`.
- Add proactive refresh timer and reconnect token fetch flow in `src/agents/useAdvisorVoice.ts`.

## Phase 5: Existing Feature Completion and Compatibility

15. `idea-1b7a84f6-reference-image-conditioning-f.md`
- Ensure reference-image conditioning path is active in generation hook: `src/app/features/characters/hooks/useImageGenerator.ts` (img2img request fields preserved/used).

16. `idea-58d4b59c-webworker-nlp-pipeline-for-sce.md`
- Maintain scene analysis and formatter integration points in `src/app/features/story/sub_SceneEditor/components/PresenceTracker.tsx` and `src/app/features/story/sub_SceneEditor/SceneEditor.tsx` as worker-migration touchpoints.

17. `idea-6582324b-keyboard-first-navigation-acro.md`
- Maintain AI companion mode navigation and interaction hooks in `src/app/features/story/sub_AICompanion/AICompanion.tsx` and related mode components as keyboard-first entry points.

## Validation

- Required validation command: `npx tsc --noEmit` from repository root.
- Compatibility shim added for validator route import: `src/app/api/agents/gemini-token/route.ts`.
