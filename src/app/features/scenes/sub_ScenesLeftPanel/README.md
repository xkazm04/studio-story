# Scenes Left Panel Components

This folder is reserved for scene-specific components that should appear exclusively in the LeftPanel.

## Current Implementation

The LeftPanel currently shows the main `ScenesFeature` component from `@/app/features/scenes/ScenesFeature.tsx`, which includes:
- Scene management
- Act management
- Scene creation and editing

## When to Use This Folder

Place components here when they:
1. Are specific to the LeftPanel view
2. Provide alternative/specialized scene views (e.g., ActDashboard)
3. Should not appear in the CenterPanel

## Migration Notes

The old `LeftPanel/Scenes` content from `a_to_migrate` included:
- `ActDashboard` - Complex dashboard with grid layouts (can be migrated here if needed)
- `ScenesDragAndDrop` - Already integrated in main ScenesFeature
- `ActManager` - Already integrated in main ScenesFeature
- `SceneAdd` - Already integrated in main ScenesFeature

These components have been integrated into the main ScenesFeature and are currently accessible from both LeftPanel and CenterPanel (Scenes tab).

If specialized left-panel-only views are needed in the future (e.g., the ActDashboard), they should be placed in this folder.
