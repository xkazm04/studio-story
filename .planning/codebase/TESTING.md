# Testing Patterns

**Analysis Date:** 2026-03-13

## Test Framework

**Runner:**
- Vitest 4.x
- Config: No dedicated `vitest.config.ts` detected; configuration is inferred from `next.config.ts` and `tsconfig.json`

**Assertion Library:**
- Vitest built-in `expect` (Chai-compatible matchers)

**Run Commands:**
```bash
npm test              # Vitest in watch mode
npm run test:run      # Vitest single run (CI)
```

## Test File Organization

**Location:**
- Co-located `__tests__/` directories next to source files

**Naming:**
- `*.test.ts` (not `.spec.ts`, not `.test.tsx`)

**Current test files:**
```
src/app/features/relationships/types/__tests__/guards.test.ts
src/app/features/relationships/types/__tests__/validators.test.ts
src/app/lib/ai/__tests__/cache.test.ts
src/app/lib/ai/__tests__/cost-tracker.test.ts
src/app/lib/ai/__tests__/rate-limiter.test.ts
src/app/lib/ai/__tests__/retry.test.ts
src/app/lib/ai/__tests__/types.test.ts
src/app/lib/ai/__tests__/leonardo-video.test.ts
src/lib/coordination/__tests__/CoordinationHub.test.ts
```

**Structure:**
```
src/
  app/lib/ai/
    cache.ts
    rate-limiter.ts
    retry.ts
    types.ts
    __tests__/
      cache.test.ts
      rate-limiter.test.ts
      retry.test.ts
      types.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ClassName or ModuleName', () => {
  let instance: ClassName;

  beforeEach(() => {
    instance = new ClassName();
  });

  describe('methodName or feature group', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
      expect(result).toBe(expected);
    });

    it('should [handle edge case]', () => {
      expect(instance.method(edgeCaseInput)).toBeUndefined();
    });
  });
});
```

**Patterns:**
- Nested `describe` blocks: outer for class/module, inner for method/feature group
- `beforeEach` for instance setup and state reset
- `afterEach` for cleanup (e.g., `eventBus.destroy()`, `graph.clear()`)
- Test names start with `should` (e.g., `it('should set and get values', ...)`)
- One assertion concept per test (but multiple `expect` calls for same concept)

**Singleton Reset Pattern:**
- Modules exposing singletons provide a `reset*()` function for test isolation
- Example from `src/lib/coordination/__tests__/CoordinationHub.test.ts`:
```typescript
beforeEach(() => {
  resetCoordinationHub();
  hub = new CoordinationHub({ debugMode: false });
});

afterEach(() => {
  hub.destroy();
});
```

## Mocking

**Framework:** Vitest built-in `vi` module

**Patterns:**

**Function mocks:**
```typescript
const handler = vi.fn();
const fn = vi.fn().mockResolvedValue('result');
const onRetry = vi.fn();
```

**Sequential mock returns:**
```typescript
const fn = vi.fn()
  .mockRejectedValueOnce(new AIError('fail', 'RATE_LIMITED', 'claude', 429, true))
  .mockResolvedValueOnce('success');
```

**Fake timers:**
```typescript
vi.useFakeTimers();
// ... perform time-dependent operations
vi.advanceTimersByTime(1500);
// ... assert
vi.useRealTimers();
```

**What to Mock:**
- Callbacks and event handlers (`vi.fn()`)
- Time-dependent behavior (`vi.useFakeTimers()`)
- Sequential API call outcomes (`.mockRejectedValueOnce().mockResolvedValueOnce()`)

**What NOT to Mock:**
- The system under test itself
- Pure utility functions (tested directly)
- Type guards and validators (tested with real data structures)

## Fixtures and Factories

**Test Data:**
- Inline test data objects constructed per test
- No shared fixture files or factory functions detected
- UUID-format strings used for IDs: `'123e4567-e89b-12d3-a456-426614174000'`

**Pattern:**
```typescript
const validNode = {
  id: 'char-123',
  type: 'character' as const,
  position: { x: 100, y: 200 },
  data: {
    character: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Character'
    },
    label: 'Test Character',
    type: 'character' as const
  }
};
```

**Location:**
- No dedicated fixtures directory; data is inline in test files

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
npx vitest run --coverage    # If coverage provider configured
```

## Test Types

**Unit Tests:**
- All existing tests are unit tests
- Focus on: AI infrastructure (cache, rate-limiter, retry, cost-tracker), type guards, validators, coordination hub
- Direct class/function instantiation, no HTTP or component rendering

**Integration Tests:**
- One integration test pattern in `src/app/lib/ai/__tests__/leonardo-video.test.ts`
- Gated by environment variable: `process.env.INTEGRATION_TEST === 'true'`
- Uses `it.skipIf(!shouldRunIntegration)` for conditional execution
- Makes real HTTP calls to external APIs

**E2E Tests:**
- Not used. No Playwright, Cypress, or similar framework detected.

**Component Tests:**
- Not used. No React Testing Library or similar detected in dependencies.

## Common Patterns

**Async Testing:**
```typescript
it('should return result on success', async () => {
  const fn = vi.fn().mockResolvedValue('success');
  const result = await withRetry(fn, 'claude');
  expect(result).toBe('success');
  expect(fn).toHaveBeenCalledTimes(1);
});
```

**Error Testing:**
```typescript
it('should throw immediately on non-retryable errors', async () => {
  const error = new AIError('auth failed', 'AUTHENTICATION_FAILED', 'claude', 401, false);
  const fn = vi.fn().mockRejectedValue(error);
  await expect(withRetry(fn, 'claude')).rejects.toThrow('auth failed');
  expect(fn).toHaveBeenCalledTimes(1);
});
```

**Assertion Error throwing:**
```typescript
it('should throw for invalid nodes', () => {
  const invalidNode = { invalid: 'node' };
  expect(() => assertRelationshipNode(invalidNode)).toThrow();
});
```

**Validation result testing:**
```typescript
it('should return success for valid nodes', () => {
  const result = validateRelationshipNode(validNode);
  expect(result.isValid).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.errors).toBeUndefined();
});

it('should return errors for invalid nodes', () => {
  const result = validateRelationshipNode(invalidNode);
  expect(result.isValid).toBe(false);
  expect(result.errors).toBeDefined();
  expect(result.errors!.length).toBeGreaterThan(0);
});
```

**Event/async flush testing:**
```typescript
it('should emit and receive events', async () => {
  const handler = vi.fn();
  eventBus.subscribe('CHARACTER_UPDATED', handler, { label: 'test-subscriber' });
  eventBus.emit('CHARACTER_UPDATED', { entityId: 'char-123', ... });
  await eventBus.flush();
  expect(handler).toHaveBeenCalledTimes(1);
});
```

**Parameterized tests:**
```typescript
const testCases: Array<{ code: string; description: string }> = [
  { code: 'RATE_LIMITED', description: 'Too many requests' },
  { code: 'TIMEOUT', description: 'Request timed out' },
];

testCases.forEach(({ code, description }) => {
  it(`should support ${code} error code`, () => {
    const error = new AIError(description, code as AIErrorCode, 'claude');
    expect(error.code).toBe(code);
  });
});
```

**Conditional integration tests:**
```typescript
const shouldRunIntegration = process.env.INTEGRATION_TEST === 'true';
it.skipIf(!shouldRunIntegration)('can make a test request', async () => {
  // Real API call
});
```

## Test Coverage Gaps

**Untested areas (high impact):**
- No component/UI tests for any of the 100+ React components
- No API route handler tests (`src/app/api/` - 15+ route files)
- No Zustand store tests (`workspaceStore`, `projectStore`, etc.)
- No hook tests (`useCharacters`, `useWorkspaceComposition`, etc.)
- No MCP server tool tests (`src/mcp-server/tools/`)

**Tested areas:**
- AI infrastructure utilities (cache, rate-limiter, retry, cost-tracker, error types)
- Relationship type guards and validators
- Coordination hub (EventBus, DependencyGraph, CoordinationHub)
- Leonardo video generation request format

**Summary:** Test coverage is concentrated in utility/infrastructure code. The entire UI layer, API routes, state management, and MCP tools lack automated tests.

---

*Testing analysis: 2026-03-13*
