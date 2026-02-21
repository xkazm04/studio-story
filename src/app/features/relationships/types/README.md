# Relationship Type System Documentation

## Overview

This directory contains a comprehensive type-safe system for managing relationships between characters and factions in the storytelling application. The system implements strict TypeScript types, Zod schemas for runtime validation, type guards, and validators to prevent type-related bugs and ensure data integrity.

## Architecture

### Source of Truth

The type system follows a clear hierarchy of "source of truth":

1. **TypeScript Types** (`index.ts`) - Define the structure and contracts
2. **Zod Schemas** (`schemas.ts`) - Validate runtime data and enforce constraints
3. **Type Guards** (`guards.ts`) - Runtime type checking with TypeScript integration
4. **Validators** (`validators.ts`) - API response validation and error handling

### Files

- **`index.ts`** - Core TypeScript type definitions
- **`schemas.ts`** - Zod schemas for runtime validation
- **`guards.ts`** - Type guard functions for runtime type checking
- **`validators.ts`** - Validation utilities for API responses

## Core Types

### RelationshipType Enum

```typescript
enum RelationshipType {
  ALLY = 'ALLY',
  ENEMY = 'ENEMY',
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  RIVAL = 'RIVAL',
  ROMANTIC = 'ROMANTIC',
  BUSINESS = 'BUSINESS',
  MENTOR = 'MENTOR',
  NEUTRAL = 'NEUTRAL',
  UNKNOWN = 'UNKNOWN'
}
```

**Source of Truth**: This enum is the definitive list of valid relationship types.

### RelationshipNode

Represents a node (character or faction) in the relationship graph.

```typescript
interface RelationshipNode extends Node {
  id: string;
  type: 'character' | 'faction';
  position: { x: number; y: number };
  data: NodeData;
}
```

**Validation**: Fully validated by `RelationshipNodeSchema` to ensure:
- Valid UUID format for IDs
- Finite numeric coordinates
- Proper discriminated union for node data

### RelationshipEdge

Represents an edge (relationship) between two nodes.

```typescript
interface RelationshipEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: 'relationship';
  data: RelationshipEdgeData;
}
```

**Validation**: Fully validated by `RelationshipEdgeSchema` to ensure:
- Valid relationship type from enum
- Required source and target entity references
- Proper UUID format for relationship IDs

## Runtime Validation

### Zod Schemas

All types have corresponding Zod schemas that validate:

1. **Type correctness** - Ensures values match expected types
2. **Format constraints** - UUIDs, URLs, color codes, etc.
3. **Business rules** - Required fields, min/max values, etc.

Example:

```typescript
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Character name is required'),
  type: z.string().optional(),
  // ... other fields
});
```

### Type Guards

Type guards provide TypeScript-friendly runtime checking:

```typescript
// Simple boolean type guard
if (isRelationshipNode(value)) {
  // TypeScript knows value is RelationshipNode here
  console.log(value.data.label);
}

// Detailed validation with error information
const result = validateRelationshipNode(value);
if (result.isValid) {
  const node = result.data; // Typed as RelationshipNode
} else {
  console.error(result.errors); // Array of error messages
}
```

### Validators

Validators handle API response validation:

```typescript
const result = validateCharacterArray(apiResponse);
if (result.success) {
  const characters = result.data; // Typed as Character[]
} else {
  console.error(result.errors); // Detailed validation errors
}
```

## API Integration

The relationship API (`lib/relationshipApi.ts`) uses the validation system to:

1. **Validate all incoming API responses** - Catch malformed data early
2. **Validate all outgoing API requests** - Prevent invalid state from being sent
3. **Filter invalid data** - Skip malformed relationships while processing valid ones
4. **Log validation errors** - Provide detailed diagnostics for debugging

Example:

```typescript
export async function fetchRelationships(projectId: string): Promise<RelationshipMapData> {
  // Fetch raw data
  const charactersRaw = await apiFetch<unknown>({ url: '...' });

  // Validate API response
  const charactersResult = validateCharacterArray(charactersRaw);

  // Use validated data or fallback
  const characters = charactersResult.success ? charactersResult.data! : [];

  // Log errors for debugging
  if (!charactersResult.success) {
    console.warn('Character validation errors:', charactersResult.errors);
  }

  // ... continue processing with validated data
}
```

## Benefits

### Type Safety

1. **No `any` types** - All data structures are fully typed
2. **Discriminated unions** - NodeData uses TypeScript's discriminated unions for type-safe handling
3. **Strict enum usage** - RelationshipType is an enum, not a loose string union
4. **Runtime validation** - API responses are validated at runtime, not just assumed

### Error Prevention

1. **Invalid state prevention** - Malformed data is caught before it can corrupt the graph
2. **API contract validation** - Detect API contract violations immediately
3. **Type mismatch detection** - Catch wrong relationship types or missing properties early
4. **UUID format validation** - Ensure all IDs are valid UUIDs

### Real-time Collaboration Safety

The type system is designed to handle multi-client scenarios:

1. **Client-side validation** - Prevent malformed data from being sent
2. **Server response validation** - Catch corrupted data from other clients
3. **Defensive programming** - Skip invalid relationships while preserving valid ones
4. **Detailed logging** - Track validation failures for debugging

## Usage Examples

### Basic Type Checking

```typescript
import { isRelationshipType, isRelationshipNode } from './guards';

// Check if a value is a valid relationship type
if (isRelationshipType(value)) {
  // TypeScript knows value is RelationshipType
  updateRelationship(value);
}

// Check if a value is a valid node
if (isRelationshipNode(node)) {
  // TypeScript knows node is RelationshipNode
  renderNode(node);
}
```

### Validating API Responses

```typescript
import { validateCharacterArray, assertValidation } from './validators';

// Get validation result
const result = validateCharacterArray(apiResponse);

// Option 1: Check and handle errors
if (result.success) {
  processCharacters(result.data);
} else {
  console.error('Validation errors:', result.errors);
  showErrorToUser();
}

// Option 2: Assert validation (throws on error)
assertValidation(result, 'Character API response');
processCharacters(result.data);
```

### Safe Parsing

```typescript
import { safeParseRelationshipNode, safeParseRelationshipEdge } from './guards';

// Returns validated data or null
const node = safeParseRelationshipNode(unknownValue);
if (node) {
  // node is typed as RelationshipNode
  processNode(node);
} else {
  console.warn('Invalid node data');
}
```

### Batch Validation

```typescript
import { validateRelationshipNodes, validateRelationshipEdges } from './guards';

// Validate array with detailed per-item errors
const nodesResult = validateRelationshipNodes(unknownArray);
if (nodesResult.isValid) {
  processNodes(nodesResult.data);
} else {
  console.error('Node validation errors:', nodesResult.errors);
}
```

## Best Practices

1. **Always validate API responses** - Use validators for all external data
2. **Use type guards in conditionals** - Leverage TypeScript's type narrowing
3. **Log validation failures** - Help debug issues in development
4. **Provide fallbacks** - Don't crash on invalid data, use sensible defaults
5. **Validate before API calls** - Prevent sending invalid data to the server
6. **Use discriminated unions** - Leverage TypeScript's type system for node/edge data
7. **Document derived types** - Make it clear which types are computed vs. stored

## Validation Error Handling

The system provides multiple levels of error handling:

### Soft Failures (Warnings)

Used when processing arrays - invalid items are skipped but valid ones are processed:

```typescript
const result = validateCharacterArray(data);
if (!result.success) {
  console.warn('Some characters failed validation:', result.errors);
}
// Continue with valid characters
const validCharacters = result.success ? result.data : [];
```

### Hard Failures (Errors)

Used when data corruption would cause critical issues:

```typescript
const validation = validateEdgeUpdate({ edgeId, relationshipType, description });
if (!validation.success) {
  throw new ValidationError('EdgeUpdate', validation.errors || []);
}
```

### Safe Validation

Used when you want to continue with defaults on validation failure:

```typescript
import { safeValidate } from './validators';

const characters = safeValidate(
  validateCharacterArray,
  apiResponse,
  [], // default value
  'Character API response'
);
```

## Testing

See `__tests__/` directory for comprehensive tests covering:

- Type guard functionality
- Validation error cases
- API integration scenarios
- Edge cases and malformed data

## Future Enhancements

Potential improvements to the type system:

1. **Server-side validation** - Share schemas between client and server
2. **Migration helpers** - Handle API version changes gracefully
3. **Performance optimization** - Cache validation results for immutable data
4. **Custom error messages** - More user-friendly validation errors
5. **Internationalization** - Translate validation errors
6. **GraphQL integration** - Use schema definitions for API types

## Related Documentation

- [Relationship Map Feature](../README.md)
- [API Integration](../../../utils/api.ts)
- [React Flow Types](https://reactflow.dev/docs/api/nodes/)
- [Zod Documentation](https://zod.dev/)
