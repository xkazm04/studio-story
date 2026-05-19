/**
 * Shared icon and color maps for CLI log entries.
 *
 * Used by both CompactTerminal and InlineTerminal.
 */

import type React from 'react';
import {
  Terminal,
  User,
  Bot,
  Wrench,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { LogEntry } from './types';

export const LOG_ICONS: Record<LogEntry['type'], React.ElementType> = {
  user: User,
  assistant: Bot,
  tool_use: Wrench,
  tool_result: CheckCircle,
  system: Terminal,
  error: AlertCircle,
};

export const LOG_COLORS: Record<LogEntry['type'], string> = {
  user: 'ms-log-user',
  assistant: 'ms-log-assistant',
  tool_use: 'ms-log-tool',
  tool_result: 'ms-log-result',
  system: 'ms-log-system',
  error: 'ms-log-error',
};
