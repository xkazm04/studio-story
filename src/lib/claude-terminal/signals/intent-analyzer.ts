/**
 * Intent Analyzer — Captures successful tool chains as creative intent signals.
 *
 * Instead of detecting errors, this module tracks sequences of tool calls that
 * complete successfully. These tool chains represent authorial workflow patterns
 * (e.g. "create character → add traits → create relationship") that can be used
 * to predict the author's next action.
 *
 * Hooks into cli-service.ts alongside the error-focused signal-analyzer.
 */

import type { CLIExecutionEvent } from '../cli-service';
import type { IntentSignal } from './signal-types';

// ============ Entity Type Extraction ============

/**
 * Map of tool name patterns to entity types.
 * Used to derive which story entities are involved in a tool chain.
 */
const TOOL_ENTITY_MAP: Record<string, string> = {
  character: 'character',
  scene: 'scene',
  beat: 'beat',
  act: 'act',
  faction: 'faction',
  trait: 'trait',
  relationship: 'relationship',
  project: 'project',
  image: 'image',
  voice: 'voice',
  workspace: 'workspace',
  narration: 'narration',
  illustration: 'illustration',
};

/**
 * Extract the entity type from a tool name.
 * e.g. "mcp__story__create_character" → "character"
 *      "update_scene" → "scene"
 */
function extractEntityType(toolName: string): string | null {
  const normalized = toolName.toLowerCase();
  for (const [keyword, entity] of Object.entries(TOOL_ENTITY_MAP)) {
    if (normalized.includes(keyword)) return entity;
  }
  return null;
}

// ============ Fingerprinting ============

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Fingerprint a tool chain by hashing the ordered tool names.
 * Strips MCP prefixes for cleaner grouping (mcp__story__create_character → create_character).
 */
function normalizeToolName(name: string): string {
  return name.replace(/^mcp__\w+__/, '');
}

function makeChainFingerprint(toolNames: string[]): string {
  const normalized = toolNames.map(normalizeToolName);
  return simpleHash(`intent:${normalized.join('→')}`);
}

function makeIntentId(): string {
  return `int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============ Chain Tracker ============

interface PendingToolCall {
  name: string;
  id: string;
  timestamp: number;
}

/**
 * IntentChainTracker accumulates successful tool_use → tool_result pairs
 * within an execution. When a chain of 2+ successful tool calls is detected
 * (bounded by a gap, an error, or execution end), it emits an IntentSignal.
 */
export class IntentChainTracker {
  private pendingCalls: PendingToolCall[] = [];
  private completedChain: string[] = [];
  private executionId: string;
  /** Max gap between tool calls before chain is considered broken (30s) */
  private readonly maxGapMs = 30_000;
  private lastActivityTs = 0;

  constructor(executionId: string) {
    this.executionId = executionId;
  }

  /**
   * Process an event and return an IntentSignal if a complete chain is detected.
   * Returns null if no chain boundary is reached yet.
   */
  processEvent(event: CLIExecutionEvent): IntentSignal | null {
    // Check for time gap breaking the chain
    if (this.lastActivityTs > 0 && event.timestamp - this.lastActivityTs > this.maxGapMs) {
      const signal = this.flushChain();
      this.handleEvent(event);
      return signal;
    }

    this.lastActivityTs = event.timestamp;
    return this.handleEvent(event);
  }

  /**
   * Flush any remaining chain at execution end.
   */
  flush(): IntentSignal | null {
    return this.flushChain();
  }

  private handleEvent(event: CLIExecutionEvent): IntentSignal | null {
    if (event.type === 'tool_use') {
      const { name, id } = event.data;
      if (name) {
        this.pendingCalls.push({ name, id, timestamp: event.timestamp });
      }
      return null;
    }

    if (event.type === 'tool_result') {
      const { toolUseId, content } = event.data;
      const isError = content.toLowerCase().includes('error') ||
                      content.toLowerCase().includes('failed') ||
                      content.includes('PGRST');

      // Find the matching pending call
      const callIdx = this.pendingCalls.findIndex(c => c.id === toolUseId);
      if (callIdx >= 0) {
        const call = this.pendingCalls[callIdx];
        this.pendingCalls.splice(callIdx, 1);

        if (isError) {
          // Error breaks the chain — flush what we have
          return this.flushChain();
        }

        // Successful tool result — extend the chain
        this.completedChain.push(call.name);
      }
      return null;
    }

    // Execution end or error events — flush chain
    if (event.type === 'result' || event.type === 'error') {
      return this.flushChain();
    }

    return null;
  }

  private flushChain(): IntentSignal | null {
    if (this.completedChain.length < 2) {
      this.completedChain = [];
      this.pendingCalls = [];
      return null;
    }

    const toolChain = [...this.completedChain];
    const entityTypes = [...new Set(
      toolChain
        .map(extractEntityType)
        .filter((e): e is string => e !== null)
    )];

    const signal: IntentSignal = {
      id: makeIntentId(),
      type: 'intent_signal',
      toolChain,
      fingerprint: makeChainFingerprint(toolChain),
      entityTypes,
      executionId: this.executionId,
      timestamp: Date.now(),
    };

    this.completedChain = [];
    this.pendingCalls = [];
    return signal;
  }
}
