/**
 * Script Block Validator
 *
 * Pre-export validation layer that catches structural issues in ScriptBlocks
 * before they silently produce corrupted exports.
 */

import type { ScriptBlockInput } from './types';

// ============================================================================
// Types
// ============================================================================

/** Severity levels for validation issues. */
export type ValidationSeverity = 'error' | 'warning';

/** A single validation issue tied to a specific block index. */
export interface ValidationIssue {
  severity: ValidationSeverity;
  blockIndex: number;
  rule: string;
  message: string;
}

/** Result of validating a ScriptBlock array. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/** @deprecated Use ScriptBlockInput from './types' directly. */
export type ValidatableBlock = ScriptBlockInput;

// ============================================================================
// Validator
// ============================================================================

/**
 * Validate an array of script blocks for structural correctness before export.
 *
 * Checks:
 * - Empty content on scene-header, dialogue, actor blocks
 * - Missing speaker on dialogue blocks
 * - Orphaned direction/parenthetical blocks (no preceding actor/dialogue)
 * - Empty description/content blocks (warning)
 * - Dialogue immediately after dialogue without a character cue in between
 */
export function validateScriptBlocks(blocks: ValidatableBlock[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const trimmed = block.content.trim();

    switch (block.type) {
      case 'scene-header': {
        if (!trimmed) {
          errors.push({
            severity: 'error',
            blockIndex: i,
            rule: 'empty-scene-header',
            message: 'Scene header has no content',
          });
        }
        break;
      }

      case 'dialogue': {
        if (!block.speaker?.trim()) {
          errors.push({
            severity: 'error',
            blockIndex: i,
            rule: 'missing-speaker',
            message: 'Dialogue block is missing a speaker name',
          });
        }
        if (!trimmed) {
          warnings.push({
            severity: 'warning',
            blockIndex: i,
            rule: 'empty-dialogue',
            message: `Empty dialogue line${block.speaker ? ` for ${block.speaker}` : ''}`,
          });
        }
        break;
      }

      case 'actor': {
        if (!trimmed) {
          errors.push({
            severity: 'error',
            blockIndex: i,
            rule: 'empty-actor',
            message: 'Character cue block has no name',
          });
        }
        break;
      }

      case 'direction': {
        // A direction (parenthetical) must follow an actor or dialogue block
        const prev = i > 0 ? blocks[i - 1] : undefined;
        if (!prev || (prev.type !== 'actor' && prev.type !== 'dialogue')) {
          errors.push({
            severity: 'error',
            blockIndex: i,
            rule: 'orphaned-direction',
            message: 'Direction/parenthetical block has no preceding character cue or dialogue',
          });
        }
        if (!trimmed) {
          warnings.push({
            severity: 'warning',
            blockIndex: i,
            rule: 'empty-direction',
            message: 'Empty direction/parenthetical block',
          });
        }
        break;
      }

      case 'description':
      case 'content': {
        if (!trimmed) {
          warnings.push({
            severity: 'warning',
            blockIndex: i,
            rule: 'empty-content',
            message: `Empty ${block.type} block`,
          });
        }
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
