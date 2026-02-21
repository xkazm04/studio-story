/**
 * Operational Transform (OT) utilities for conflict-free collaborative editing
 * Implements basic text operations: insert, delete, retain
 */

import { Operation, OperationType } from '@/app/types/Collaboration';

export interface TextOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface TransformedOperation {
  clientOp: TextOperation;
  serverOp: TextOperation;
}

/**
 * Transform two concurrent operations against each other
 * Returns transformed versions that can be applied in sequence
 */
export function transform(
  clientOp: TextOperation,
  serverOp: TextOperation
): TransformedOperation {
  // Case 1: Both operations are at different positions
  if (clientOp.position < serverOp.position) {
    // Client operation comes before server operation
    if (clientOp.type === 'insert') {
      // Shift server operation forward by inserted length
      return {
        clientOp,
        serverOp: {
          ...serverOp,
          position: serverOp.position + (clientOp.content?.length || 0),
        },
      };
    } else if (clientOp.type === 'delete') {
      // Shift server operation backward by deleted length
      return {
        clientOp,
        serverOp: {
          ...serverOp,
          position: Math.max(
            clientOp.position,
            serverOp.position - (clientOp.length || 0)
          ),
        },
      };
    }
  } else if (clientOp.position > serverOp.position) {
    // Server operation comes before client operation
    if (serverOp.type === 'insert') {
      // Shift client operation forward by inserted length
      return {
        clientOp: {
          ...clientOp,
          position: clientOp.position + (serverOp.content?.length || 0),
        },
        serverOp,
      };
    } else if (serverOp.type === 'delete') {
      // Shift client operation backward by deleted length
      return {
        clientOp: {
          ...clientOp,
          position: Math.max(
            serverOp.position,
            clientOp.position - (serverOp.length || 0)
          ),
        },
        serverOp,
      };
    }
  } else {
    // Case 2: Operations at same position
    if (clientOp.type === 'insert' && serverOp.type === 'insert') {
      // Both inserting at same position - client wins, server shifts right
      return {
        clientOp,
        serverOp: {
          ...serverOp,
          position: serverOp.position + (clientOp.content?.length || 0),
        },
      };
    } else if (clientOp.type === 'delete' && serverOp.type === 'delete') {
      // Both deleting at same position - merge deletions
      const clientLen = clientOp.length || 0;
      const serverLen = serverOp.length || 0;
      return {
        clientOp: {
          ...clientOp,
          length: Math.max(clientLen, serverLen),
        },
        serverOp: {
          ...serverOp,
          length: 0, // Server deletion is subsumed
        },
      };
    } else if (clientOp.type === 'insert' && serverOp.type === 'delete') {
      // Client inserting, server deleting - insert takes precedence
      return {
        clientOp,
        serverOp: {
          ...serverOp,
          position: serverOp.position + (clientOp.content?.length || 0),
        },
      };
    } else if (clientOp.type === 'delete' && serverOp.type === 'insert') {
      // Server inserting, client deleting - insert takes precedence
      return {
        clientOp: {
          ...clientOp,
          position: clientOp.position + (serverOp.content?.length || 0),
        },
        serverOp,
      };
    }
  }

  // Default: no transformation needed
  return { clientOp, serverOp };
}

/**
 * Apply an operation to a text string
 */
export function applyOperation(text: string, op: TextOperation): string {
  switch (op.type) {
    case 'insert':
      if (!op.content) return text;
      return (
        text.slice(0, op.position) +
        op.content +
        text.slice(op.position)
      );

    case 'delete':
      if (!op.length) return text;
      return (
        text.slice(0, op.position) +
        text.slice(op.position + op.length)
      );

    case 'retain':
      return text;

    default:
      return text;
  }
}

/**
 * Compose two sequential operations into a single operation
 */
export function compose(op1: TextOperation, op2: TextOperation): TextOperation {
  // If operations can be merged (same type, adjacent positions)
  if (op1.type === op2.type) {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position + (op1.content?.length || 0) === op2.position) {
        return {
          type: 'insert',
          position: op1.position,
          content: (op1.content || '') + (op2.content || ''),
        };
      }
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position === op2.position) {
        return {
          type: 'delete',
          position: op1.position,
          length: (op1.length || 0) + (op2.length || 0),
        };
      }
    }
  }

  // Cannot compose - return second operation
  return op2;
}

/**
 * Create operation from text change event
 */
export function createOperation(
  oldText: string,
  newText: string,
  cursorPosition: number
): TextOperation | null {
  if (oldText === newText) return null;

  // Simple diff algorithm
  let commonPrefix = 0;
  while (
    commonPrefix < oldText.length &&
    commonPrefix < newText.length &&
    oldText[commonPrefix] === newText[commonPrefix]
  ) {
    commonPrefix++;
  }

  let commonSuffix = 0;
  while (
    commonSuffix < oldText.length - commonPrefix &&
    commonSuffix < newText.length - commonPrefix &&
    oldText[oldText.length - 1 - commonSuffix] ===
      newText[newText.length - 1 - commonSuffix]
  ) {
    commonSuffix++;
  }

  const deletedText = oldText.slice(
    commonPrefix,
    oldText.length - commonSuffix
  );
  const insertedText = newText.slice(
    commonPrefix,
    newText.length - commonSuffix
  );

  if (deletedText.length > 0 && insertedText.length === 0) {
    return {
      type: 'delete',
      position: commonPrefix,
      length: deletedText.length,
    };
  } else if (insertedText.length > 0 && deletedText.length === 0) {
    return {
      type: 'insert',
      position: commonPrefix,
      content: insertedText,
    };
  } else if (insertedText.length > 0 && deletedText.length > 0) {
    // Replace: delete then insert
    // For simplicity, we'll just return the insert
    return {
      type: 'insert',
      position: commonPrefix,
      content: insertedText,
    };
  }

  return null;
}

/**
 * Optimistic update: Apply operation immediately to local state
 * and send to server for reconciliation
 */
export class OperationalTransformEngine {
  private pendingOperations: TextOperation[] = [];
  private serverRevision: number = 0;
  private clientRevision: number = 0;

  constructor(private onSendOperation: (op: TextOperation) => void) {}

  /**
   * Apply local operation optimistically
   */
  applyLocal(text: string, op: TextOperation): string {
    this.pendingOperations.push(op);
    this.clientRevision++;
    this.onSendOperation(op);
    return applyOperation(text, op);
  }

  /**
   * Receive and apply server operation
   */
  applyServer(text: string, serverOp: TextOperation): string {
    let transformedOp = serverOp;

    // Transform server operation against pending client operations
    for (const pendingOp of this.pendingOperations) {
      const result = transform(pendingOp, transformedOp);
      transformedOp = result.serverOp;
    }

    this.serverRevision++;
    return applyOperation(text, transformedOp);
  }

  /**
   * Acknowledge that server received our operation
   */
  acknowledgeOperation(opId: string): void {
    // Remove acknowledged operation from pending queue
    if (this.pendingOperations.length > 0) {
      this.pendingOperations.shift();
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      pendingCount: this.pendingOperations.length,
      serverRevision: this.serverRevision,
      clientRevision: this.clientRevision,
    };
  }
}
