/**
 * CommandList Component
 * Displays filtered command results
 */

'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Command, CommandGroup, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

interface CommandListProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onHover: (index: number) => void;
}

export function CommandList({
  commands,
  selectedIndex,
  onSelect,
  onHover,
}: CommandListProps) {
  // Group commands by category
  const groups = commands.reduce<CommandGroup[]>((acc, command) => {
    const existingGroup = acc.find((g) => g.category === command.category);
    if (existingGroup) {
      existingGroup.commands.push(command);
    } else {
      acc.push({
        category: command.category,
        label: CATEGORY_LABELS[command.category],
        commands: [command],
      });
    }
    return acc;
  }, []);

  let globalIndex = 0;

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {groups.map((group) => (
        <div key={group.category} className="py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>{CATEGORY_ICONS[group.category]}</span>
            {group.label}
          </div>
          {group.commands.map((command) => {
            const index = globalIndex++;
            const isSelected = index === selectedIndex;

            return (
              <CommandItem
                key={command.id}
                command={command}
                isSelected={isSelected}
                onSelect={() => onSelect(command)}
                onHover={() => onHover(index)}
              />
            );
          })}
        </div>
      ))}

      {commands.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          No commands found
        </div>
      )}
    </div>
  );
}

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

function CommandItem({ command, isSelected, onSelect, onHover }: CommandItemProps) {
  const handleClick = useCallback(() => {
    if (!command.disabled) {
      onSelect();
    }
  }, [command.disabled, onSelect]);

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={onHover}
      disabled={command.disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
        isSelected && !command.disabled && 'bg-cyan-600/20',
        !isSelected && !command.disabled && 'hover:bg-slate-800/50',
        command.disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileTap={command.disabled ? undefined : { scale: 0.98 }}
    >
      {/* Icon */}
      {command.icon && (
        <span className="text-base shrink-0">{command.icon}</span>
      )}

      {/* Label and Description */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-cyan-300' : 'text-slate-200'
          )}
        >
          {command.label}
        </p>
        {command.description && (
          <p className="text-xs text-slate-500 truncate">{command.description}</p>
        )}
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <kbd
          className={cn(
            'shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded',
            'bg-slate-800 border border-slate-700 text-slate-400'
          )}
        >
          {command.shortcut}
        </kbd>
      )}
    </motion.button>
  );
}
