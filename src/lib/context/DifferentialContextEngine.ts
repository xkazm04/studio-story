/**
 * DifferentialContextEngine - Break the Token Ceiling
 *
 * Tracks what the LLM already knows via a session-scoped content hash map
 * and only sends deltas (new, modified, removed elements) instead of
 * rebuilding the entire context from scratch on every interaction.
 *
 * Turns the ContextCompressor from a batch processor into a diff engine:
 * - Hashes each ContextElement on first send
 * - On subsequent calls, only transmits elements whose content hash changed
 * - Tracks context version counter per session
 * - Near-zero marginal cost per additional scene/character
 */

import type { ContextElement, ScoringConfig } from './RelevanceScorer';
import { relevanceScorer } from './RelevanceScorer';
import {
  contextCompressor,
  type CompressionLevel,
  type TokenBudget,
  type CompressedContext,
} from './ContextCompressor';

// ============================================================================
// Types
// ============================================================================

export interface DiffSession {
  id: string;
  /** Monotonically increasing version counter */
  contextVersion: number;
  /** Map of element ID -> content hash for what the LLM already knows */
  knownHashes: Map<string, string>;
  /** Set of element IDs the LLM has received at least once */
  knownIds: Set<string>;
  /** Timestamp of session creation */
  createdAt: number;
  /** Timestamp of last context send */
  lastSyncAt: number;
}

export type DiffAction = 'added' | 'modified' | 'unchanged' | 'removed';

export interface DiffElement {
  element: ContextElement;
  action: DiffAction;
  previousHash?: string;
  currentHash: string;
}

export interface DifferentialResult {
  /** Session version after this diff */
  version: number;
  /** Full compressed context for first interaction, or delta for subsequent */
  content: string;
  /** Whether this is a full context send or a differential update */
  isFullContext: boolean;
  /** Elements that changed since last sync */
  delta: DiffElement[];
  /** Stats */
  stats: DiffStats;
  /** The underlying compressed context (for token budget tracking) */
  compressed: CompressedContext;
}

export interface DiffStats {
  totalElements: number;
  added: number;
  modified: number;
  unchanged: number;
  removed: number;
  /** Tokens in the full context (what batch mode would send) */
  fullContextTokens: number;
  /** Tokens actually sent (delta only) */
  sentTokens: number;
  /** Percentage of tokens saved by differential protocol */
  tokenSavingsPercent: number;
  /** Session version */
  version: number;
}

export interface DiffConfig {
  tokenBudget: TokenBudget;
  compressionLevel: CompressionLevel;
  scoringConfig?: ScoringConfig;
  /** Force full context resend (e.g., after page reload) */
  forceFullContext?: boolean;
  /** Include unchanged elements in output for coherence verification */
  includeUnchangedSummary?: boolean;
}

// ============================================================================
// Content Hashing
// ============================================================================

/**
 * Fast content hash using FNV-1a (32-bit).
 * Not cryptographic — optimized for speed and low collision rate on similar content.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Hash a ContextElement's meaningful content.
 * Includes id, type, name, and content to detect any change.
 */
function hashElement(element: ContextElement): string {
  const payload = `${element.id}|${element.type}|${element.name}|${element.content}`;
  return fnv1aHash(payload);
}

// ============================================================================
// DifferentialContextEngine
// ============================================================================

export class DifferentialContextEngine {
  private static instance: DifferentialContextEngine;
  private sessions: Map<string, DiffSession> = new Map();

  private constructor() {}

  static getInstance(): DifferentialContextEngine {
    if (!DifferentialContextEngine.instance) {
      DifferentialContextEngine.instance = new DifferentialContextEngine();
    }
    return DifferentialContextEngine.instance;
  }

  // -------------------------------------------------------------------------
  // Session Management
  // -------------------------------------------------------------------------

  /**
   * Create a new differential session.
   * Each session tracks what the LLM knows independently.
   */
  createSession(sessionId?: string): DiffSession {
    const id = sessionId || `diff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session: DiffSession = {
      id,
      contextVersion: 0,
      knownHashes: new Map(),
      knownIds: new Set(),
      createdAt: Date.now(),
      lastSyncAt: 0,
    };
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get an existing session or create a new one.
   */
  getOrCreateSession(sessionId: string): DiffSession {
    return this.sessions.get(sessionId) || this.createSession(sessionId);
  }

  /**
   * Get session by ID.
   */
  getSession(sessionId: string): DiffSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Destroy a session (e.g., on page unload or session end).
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Reset a session's knowledge (force full resend on next call).
   */
  resetSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.knownHashes.clear();
      session.knownIds.clear();
      session.contextVersion++;
    }
  }

  // -------------------------------------------------------------------------
  // Core Differential Protocol
  // -------------------------------------------------------------------------

  /**
   * Compute the differential context for a session.
   * First call sends full context; subsequent calls send only deltas.
   */
  computeDiff(
    sessionId: string,
    elements: ContextElement[],
    config: DiffConfig
  ): DifferentialResult {
    const session = this.getOrCreateSession(sessionId);
    const isFirstSync = session.contextVersion === 0;
    const forceFullContext = config.forceFullContext || isFirstSync;

    // 1. Hash all current elements
    const currentHashes = new Map<string, string>();
    for (const el of elements) {
      currentHashes.set(el.id, hashElement(el));
    }

    // 2. Compute diff
    const delta: DiffElement[] = [];
    const currentIds = new Set(elements.map(e => e.id));

    // Find added and modified elements
    for (const el of elements) {
      const currentHash = currentHashes.get(el.id)!;
      const previousHash = session.knownHashes.get(el.id);

      if (!previousHash) {
        delta.push({ element: el, action: 'added', currentHash });
      } else if (previousHash !== currentHash) {
        delta.push({ element: el, action: 'modified', previousHash, currentHash });
      } else {
        delta.push({ element: el, action: 'unchanged', previousHash, currentHash });
      }
    }

    // Find removed elements
    for (const knownId of session.knownIds) {
      if (!currentIds.has(knownId)) {
        delta.push({
          element: { id: knownId, type: 'scene', name: knownId, content: '' },
          action: 'removed',
          currentHash: '',
        });
      }
    }

    // 3. Determine which elements to send
    const elementsToSend = forceFullContext
      ? elements
      : elements.filter(el => {
          const hash = currentHashes.get(el.id)!;
          const prev = session.knownHashes.get(el.id);
          return !prev || prev !== hash;
        });

    // 4. Compress the elements to send
    const compressed = contextCompressor.compress(elementsToSend, {
      tokenBudget: config.tokenBudget,
      compressionLevel: config.compressionLevel,
      preserveNames: true,
      preserveRelationships: true,
      scoringConfig: config.scoringConfig,
    });

    // 5. Also compress full context for stats comparison
    const fullCompressed = forceFullContext
      ? compressed
      : contextCompressor.compress(elements, {
          tokenBudget: config.tokenBudget,
          compressionLevel: config.compressionLevel,
          preserveNames: true,
          preserveRelationships: true,
          scoringConfig: config.scoringConfig,
        });

    // 6. Build the output content
    let content: string;
    if (forceFullContext) {
      content = compressed.content;
    } else {
      content = this.buildDeltaContent(delta, compressed, config.includeUnchangedSummary);
    }

    // 7. Update session state
    session.contextVersion++;
    session.lastSyncAt = Date.now();
    for (const el of elements) {
      session.knownHashes.set(el.id, currentHashes.get(el.id)!);
      session.knownIds.add(el.id);
    }
    // Remove deleted elements from known state
    for (const d of delta) {
      if (d.action === 'removed') {
        session.knownHashes.delete(d.element.id);
        session.knownIds.delete(d.element.id);
      }
    }

    // 8. Compute stats
    const stats = this.computeStats(delta, compressed, fullCompressed, session.contextVersion);

    return {
      version: session.contextVersion,
      content,
      isFullContext: forceFullContext,
      delta,
      stats,
      compressed,
    };
  }

  // -------------------------------------------------------------------------
  // Content Building
  // -------------------------------------------------------------------------

  private buildDeltaContent(
    delta: DiffElement[],
    compressed: CompressedContext,
    includeUnchangedSummary?: boolean
  ): string {
    const parts: string[] = [];

    // Header
    parts.push('## Context Update (Differential)');
    parts.push('');

    // Removed elements
    const removed = delta.filter(d => d.action === 'removed');
    if (removed.length > 0) {
      parts.push('### Removed');
      for (const d of removed) {
        parts.push(`- ~~${d.element.name}~~ (no longer relevant)`);
      }
      parts.push('');
    }

    // Modified + Added elements (from compressed output)
    if (compressed.content) {
      const added = delta.filter(d => d.action === 'added');
      const modified = delta.filter(d => d.action === 'modified');

      if (added.length > 0) {
        parts.push(`### New (${added.length})`);
      }
      if (modified.length > 0) {
        parts.push(`### Updated (${modified.length})`);
      }
      parts.push(compressed.content);
      parts.push('');
    }

    // Unchanged summary
    if (includeUnchangedSummary) {
      const unchanged = delta.filter(d => d.action === 'unchanged');
      if (unchanged.length > 0) {
        parts.push(`### Unchanged (${unchanged.length} elements still in context)`);
        for (const d of unchanged) {
          parts.push(`- ${d.element.name}`);
        }
        parts.push('');
      }
    }

    return parts.join('\n').trim();
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  private computeStats(
    delta: DiffElement[],
    sentCompressed: CompressedContext,
    fullCompressed: CompressedContext,
    version: number
  ): DiffStats {
    const added = delta.filter(d => d.action === 'added').length;
    const modified = delta.filter(d => d.action === 'modified').length;
    const unchanged = delta.filter(d => d.action === 'unchanged').length;
    const removed = delta.filter(d => d.action === 'removed').length;

    const fullContextTokens = fullCompressed.compressedTokens;
    const sentTokens = sentCompressed.compressedTokens;
    const tokenSavingsPercent =
      fullContextTokens > 0
        ? Math.round(((fullContextTokens - sentTokens) / fullContextTokens) * 100)
        : 0;

    return {
      totalElements: delta.length,
      added,
      modified,
      unchanged,
      removed,
      fullContextTokens,
      sentTokens,
      tokenSavingsPercent: Math.max(0, tokenSavingsPercent),
      version,
    };
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  /**
   * Check if a session has any prior knowledge (i.e., not the first sync).
   */
  hasSessionKnowledge(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return !!session && session.contextVersion > 0;
  }

  /**
   * Get the number of elements the session knows about.
   */
  getSessionKnowledgeSize(sessionId: string): number {
    return this.sessions.get(sessionId)?.knownIds.size ?? 0;
  }

  /**
   * Get all active session IDs.
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Export singleton
export const differentialEngine = DifferentialContextEngine.getInstance();
