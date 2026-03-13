# Coding Conventions

**Analysis Date:** 2026-03-13

## Naming Patterns

**Files:**
- React components: PascalCase (`PanelFrame.tsx`, `SceneEditorPanel.tsx`, `CharacterCard.tsx`)
- Hooks: camelCase with `use` prefix (`useCharacters.ts`, `useWorkspaceComposition.ts`)
- Stores: camelCase with `Store` suffix (`workspaceStore.ts`, `projectStore.ts`, `terminalDockStore.ts`)
- Types: PascalCase matching the entity (`Character.ts`, `Scene.ts`, `Project.ts`)
- API routes: lowercase kebab-case directories (`/api/characters/`, `/api/beat-dependencies/`, `/api/claude-terminal/`)
- Utilities: camelCase (`apiErrorHandling.ts`, `focusRing.ts`, `utils.ts`)
- Test files: `*.test.ts` in `__tests__/` directories co-located with source

**Functions:**
- React components: PascalCase named exports or default exports (`export function Card()`, `export default function PanelFrame()`)
- Hooks: camelCase with `use` prefix (`useCharacters`, `useWorkspaceComposition`)
- API handlers: uppercase HTTP method names (`GET`, `POST`, `PUT`, `DELETE`) as named exports
- Utility functions: camelCase (`handleDatabaseError`, `createErrorResponse`, `validateRequiredParams`)
- Store actions: camelCase verbs (`showPanels`, `hidePanels`, `setLayout`, `replaceAllPanels`)

**Variables:**
- Constants: UPPER_SNAKE_CASE for config objects (`HTTP_STATUS`, `API_CONSTANTS`, `DEFAULT_ROLES`, `PANEL_REGISTRY`)
- CSS custom properties: `--ms-` prefix (`--ms-bg-base`, `--ms-accent-primary`, `--ms-text-muted`)
- CSS class prefix: `ms-` for design system classes (`ms-button`, `ms-card-v2`)
- Boolean props: descriptive adjectives (`hoverable`, `clickable`, `isLoading`, `fullWidth`)

**Types:**
- Interfaces: PascalCase with descriptive suffix (`PanelFrameProps`, `WorkspaceStoreState`, `ErrorResponse`)
- Type aliases: PascalCase (`ButtonSize`, `ButtonVariant`, `PanelDensity`, `WorkspacePanelType`)
- Union string types: kebab-case values for panel types (`'scene-editor'`, `'character-cards'`), PascalCase for roles (`'primary'`, `'secondary'`)
- Enums: PascalCase with UPPER_SNAKE values (`RelationshipType.ALLY`, `RelationshipType.ENEMY`)

## Code Style

**Formatting:**
- No Prettier config detected; formatting is handled by editor defaults and ESLint
- Single quotes for strings (observed throughout codebase)
- 2-space indentation
- Trailing commas in multi-line structures
- Semicolons used consistently

**Linting:**
- ESLint 9 with flat config at `eslint.config.mjs`
- Extends `eslint-config-next`
- Custom rule: `no-restricted-syntax` bans `gray-*` Tailwind colors; use `slate-*` instead
- Run with: `npm run lint`

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Path alias `@/*` maps to `./src/*`
- Target ES2017, module ESNext, bundler module resolution
- Use `type` imports where possible (`import type { LucideIcon }`)

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party)
2. Internal absolute imports using `@/` alias
3. Relative imports (types, utilities, sibling components)

**Path Aliases:**
- `@/*` maps to `./src/*` - use this for all cross-directory imports
- Relative imports (`./`, `../`) only for same-directory or immediate parent

**Examples from codebase:**
```typescript
// External
import { NextRequest, NextResponse } from 'next/server';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Internal absolute
import { supabaseServer } from '@/lib/supabase/server';
import type { WorkspacePanelType, PanelRole } from '@/workspace/types';
import { getManifest } from '@/manifest';

// Relative
import { Character } from '../../types/Character';
import type { PanelDensity } from '../types';
```

## Error Handling

**API Routes:**
- Wrap all handlers in try/catch
- Use shared error utilities from `src/app/utils/apiErrorHandling.ts`
- Pattern: `handleDatabaseError()` for Supabase errors, `handleUnexpectedError()` for catch-all
- Use `createErrorResponse()` for validation failures with appropriate HTTP status codes
- Use `validateRequiredParams()` for parameter validation that returns early

```typescript
// Standard API route pattern
export async function GET(request: NextRequest) {
  try {
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return createErrorResponse('projectId is required', 400);
    }
    const { data, error } = await supabaseServer.from('table').select('*');
    if (error) {
      return handleDatabaseError('fetch items', error, 'GET /api/items');
    }
    return NextResponse.json(data);
  } catch (error) {
    return handleUnexpectedError('GET /api/items', error);
  }
}
```

**Custom Error Classes:**
- `AIError` in `src/app/lib/ai/types.ts` - typed error with `code`, `provider`, `statusCode`, `retryable`, `retryAfterMs`
- `ValidationError` in `src/app/features/relationships/types/validators.ts` - with `context` and `validationErrors` array

**Client-Side:**
- React Query handles server state errors (configured in `src/app/providers.tsx`)
- `apiFetch` utility in `src/app/utils/api.ts` standardizes HTTP calls

## Logging

**Framework:** Console-based with structured logger utility

**Patterns:**
- Use `logger.error()` / `logger.warn()` from `src/app/utils/apiErrorHandling.ts`
- Development-only logging: guarded by `process.env.NODE_ENV === 'development'`
- Context string passed as first argument: `logger.error('GET /api/characters', error)`
- No production logging service yet (TODO noted in code)

## Comments

**When to Comment:**
- File-level JSDoc comments on all modules explaining purpose
- Section dividers using comment blocks: `// ─── Scene ───────────────────────`
- `@deprecated` annotations on legacy re-export files
- Inline comments for non-obvious logic (e.g., store actions explaining data flow)

**JSDoc/TSDoc:**
- Used on exported functions, interfaces, and store files
- Brief one-line descriptions preferred
- Parameter docs omitted when types are self-documenting

**Examples:**
```typescript
/** Shows a spinner in the header bar to indicate loading */
isLoading?: boolean;

/** Density mode -- micro hides header, compact shrinks it */
density?: PanelDensity;

/**
 * Generate a stable panel ID based on type.
 * Duplicate types get a numeric suffix: panel-scene-editor, panel-scene-editor-2, etc.
 */
function stablePanelId(type: WorkspacePanelType, usedIds: Set<string>): string {
```

## Function Design

**Size:** Functions are generally short to medium (10-40 lines). Large components decompose into sub-components.

**Parameters:** Use object destructuring for props. Default values in destructuring pattern:
```typescript
export default function PanelFrame({
  title,
  icon: Icon,
  density = 'full',
  ...props
}: PanelFrameProps) {
```

**Return Values:**
- API routes return `NextResponse.json()` or error responses
- Hooks return React Query results or Zustand selectors
- Validation functions return `{ success: boolean; data?: T; errors?: string[] }` pattern

## Module Design

**Exports:**
- Components: default export for panels, named export for UI components
- Hooks: named exports (`export const useCharacters = ...`)
- Stores: named exports (`export const useWorkspaceStore = create<...>()`)
- Types: named exports, often re-exported from barrel files
- API object pattern for data layer: `export const characterApi = { ... }`

**Barrel Files:**
- `src/app/store/index.ts` - re-exports all store slices
- `src/app/hooks/index.ts` - re-exports commonly used hooks
- `src/manifest/index.ts` - re-exports manifest utilities

**Deprecation Pattern:**
- Legacy files become thin re-export wrappers with `@deprecated` JSDoc
- Example: `src/app/store/projectStore.ts` re-exports from `./slices/projectSlice`
- Comment instructs: "For new code, please import from '...' directly"

## Component Patterns

**UI Components (`src/app/components/UI/`):**
- Accept `className` prop for style overriding
- Use `clsx` or `cn` (clsx + tailwind-merge) for conditional class merging
- Data attributes for variant styling: `data-variant={variant}`, `data-size={size}`
- `forwardRef` for components that need ref access (e.g., `Button`)
- Framer Motion for micro-interactions (`whileHover`, `whileTap`)

**Panel Components (`src/workspace/panels/`):**
- Accept `density?: PanelDensity` prop
- Wrap content in `PanelFrame` with title, icon, actions
- Default export, lazy-loaded via `panelRegistry.ts`
- Organized by domain: `scene/`, `character/`, `story/`, `image/`, `audio/`

**State Management Split:**
- Zustand for UI/local state (selections, layout, visibility)
- React Query for server state (CRUD data from API routes)
- Comment pattern in stores: `// UI state only (data is managed by React Query)`

## Design System

**Theme:** Dark mode only. `<html>` has `dark` class.

**Color Palette:**
- Use `slate-*` Tailwind colors exclusively (never `gray-*` - enforced by ESLint)
- CSS custom properties with `--ms-` prefix defined in `src/app/globals.css`
- Background: `--ms-bg-base` (#030712), `--ms-bg-surface` (#0f172a), `--ms-bg-elevated` (#1e293b)
- Text: `--ms-text-primary` (#f1f5f9), `--ms-text-secondary` (#cbd5e1), `--ms-text-muted` (#94a3b8)
- Accent: Cyan (`--ms-accent-primary` #06b6d4)
- Status: `--ms-success`, `--ms-warning`, `--ms-error`, `--ms-info`

**Icons:** Lucide React exclusively (`lucide-react`). Import individual icons.

**Utility:** `cn()` in `src/app/lib/utils.ts` (clsx + twMerge) for class composition.

---

*Convention analysis: 2026-03-13*
