/**
 * PromptRegistry — Centralized prompt generation with dependency resolution.
 *
 * Each generator declares which entity fields it reads (inputFields),
 * which other generators it depends on (dependencies), and a generate()
 * function that receives resolved dependency outputs alongside the raw input.
 *
 * The registry resolves the dependency graph automatically so callers
 * only need `promptRegistry.generate('character.full', { appearance })`.
 */

// ============================================================================
// Types
// ============================================================================

/** Entity domains that generators operate on */
export type PromptEntityType =
  | 'character'
  | 'outfit'
  | 'scene'
  | 'randomizer';

/** Describes one field a generator reads from its input */
export interface PromptInputField {
  /** Dot-path into the input object, e.g. "appearance.face.eyeColor" */
  path: string;
  /** If true, prompt is still valid without this field */
  optional?: boolean;
}

/** Output format the generator produces */
export type PromptOutputFormat = 'comma-separated' | 'prose' | 'json' | 'structured';

/** Definition of a single composable prompt generator */
export interface PromptGeneratorDef<TInput = unknown, TOutput = string> {
  /** Unique identifier, e.g. "character.facial", "outfit.clothing" */
  id: string;
  /** Which entity domain this generator belongs to */
  entityType: PromptEntityType;
  /** Human-readable description */
  description: string;
  /** Which input fields the generator reads */
  inputFields: PromptInputField[];
  /** IDs of other generators whose output is injected as `deps` */
  dependencies: string[];
  /** Output format produced */
  outputFormat: PromptOutputFormat;
  /** The generator function */
  generate: (input: TInput, deps: Record<string, string>) => TOutput;
}

/** Result of a generation including metadata */
export interface PromptGenerationResult {
  /** The generated prompt text */
  text: string;
  /** Which generator produced it */
  generatorId: string;
  /** Resolved dependency outputs (generatorId → text) */
  resolvedDeps: Record<string, string>;
}

// ============================================================================
// Registry
// ============================================================================

class PromptRegistryImpl {
  private generators = new Map<string, PromptGeneratorDef>();

  /** Register a generator definition */
  register<TInput = unknown>(def: PromptGeneratorDef<TInput, string>): void {
    if (this.generators.has(def.id)) {
      console.warn(`[PromptRegistry] Overwriting generator "${def.id}"`);
    }
    this.generators.set(def.id, def as PromptGeneratorDef);
  }

  /** Get a generator definition by ID */
  get(id: string): PromptGeneratorDef | undefined {
    return this.generators.get(id);
  }

  /** List all registered generator IDs */
  list(): string[] {
    return Array.from(this.generators.keys());
  }

  /** List generators for a specific entity type */
  listByEntity(entityType: PromptEntityType): PromptGeneratorDef[] {
    return Array.from(this.generators.values()).filter(
      (g) => g.entityType === entityType
    );
  }

  /**
   * Generate a prompt by ID, auto-resolving dependencies.
   * Throws if a generator or dependency is not found.
   */
  generate(id: string, input: unknown): PromptGenerationResult {
    const gen = this.generators.get(id);
    if (!gen) {
      throw new Error(`[PromptRegistry] Generator "${id}" not found. Registered: ${this.list().join(', ')}`);
    }

    const resolvedDeps: Record<string, string> = {};
    for (const depId of gen.dependencies) {
      const depResult = this.generate(depId, input);
      resolvedDeps[depId] = depResult.text;
    }

    const text = gen.generate(input, resolvedDeps) as string;
    return { text, generatorId: id, resolvedDeps };
  }

  /**
   * Get the full dependency tree for a generator (for debugging / visualization).
   * Returns generator IDs in topological order (leaves first).
   */
  getDependencyTree(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);

    const gen = this.generators.get(id);
    if (!gen) return [id];

    const tree: string[] = [];
    for (const depId of gen.dependencies) {
      tree.push(...this.getDependencyTree(depId, visited));
    }
    tree.push(id);
    return tree;
  }

  /** Remove a generator (useful for testing) */
  unregister(id: string): boolean {
    return this.generators.delete(id);
  }

  /** Clear all generators (useful for testing) */
  clear(): void {
    this.generators.clear();
  }
}

/** Singleton prompt registry */
export const promptRegistry = new PromptRegistryImpl();
