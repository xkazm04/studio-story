/**
 * Command Palette Types
 * Types for the keyboard-driven command interface
 */

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: CommandCategory;
  action: () => void | Promise<void>;
  keywords?: string[];
  disabled?: boolean;
}

export type CommandCategory =
  | 'scene'
  | 'choice'
  | 'navigation'
  | 'view'
  | 'ai'
  | 'export'
  | 'settings';

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  commands: Command[];
}

export interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  commands: Command[];
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  scene: 'Scenes',
  choice: 'Choices',
  navigation: 'Navigation',
  view: 'View',
  ai: 'AI Tools',
  export: 'Export',
  settings: 'Settings',
};

export const CATEGORY_ICONS: Record<CommandCategory, string> = {
  scene: '📄',
  choice: '🔀',
  navigation: '🧭',
  view: '👁️',
  ai: '✨',
  export: '📤',
  settings: '⚙️',
};
