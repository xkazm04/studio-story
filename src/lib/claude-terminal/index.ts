/**
 * Claude Terminal Service — main exports
 */

export {
  startExecution,
  getExecution,
  abortExecution,
  getActiveExecutions,
  cleanupExecutions,
  parseStreamJsonLine,
  extractTextContent,
  extractToolUses,
  type CLIExecution,
  type CLIExecutionEvent,
  type CLIMessage,
  type CLISystemMessage,
  type CLIAssistantMessage,
  type CLIUserMessage,
  type CLIResultMessage,
} from './cli-service';
