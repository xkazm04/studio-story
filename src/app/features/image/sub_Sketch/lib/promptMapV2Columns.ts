/**
 * Claude Prompt Map V2 - Column Definitions
 * Column configuration for the prompt builder UI
 */

import { ClaudePromptColumnV2 } from './promptMapV2Types';

export const CLAUDE_COLUMNS_V2: ClaudePromptColumnV2[] = [
  {
    id: 'theme',
    label: 'Visual Style',
    icon: '🎨',
    description: 'Choose your artistic direction',
    gradient: 'from-cyan-500 via-blue-500 to-purple-500',
  },
  {
    id: 'scene',
    label: 'Environment',
    icon: '🌍',
    description: 'Set the stage and atmosphere',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
  },
  {
    id: 'character',
    label: 'Subject',
    icon: '✨',
    description: 'Define who or what to focus on',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
];
