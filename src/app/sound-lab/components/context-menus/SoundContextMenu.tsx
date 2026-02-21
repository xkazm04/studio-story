/**
 * SoundContextMenu — Right-click context menu for Sound Lab elements
 *
 * Adapted from GraphContextMenu with audio-specific features:
 * - MenuItem with icon, label, shortcut badge, disabled/danger/success states
 * - MenuDivider separator
 * - MenuSubmenu with hover-reveal child items (e.g. "Move to Lane")
 * - Viewport boundary detection
 * - AnimatePresence enter/exit
 * - Escape + click-outside + scroll close
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { ContextMenuPosition } from './useSoundContextMenu';

// ============ MenuItem ============

export interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  success?: boolean;
}

export function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  danger = false,
  success = false,
}: MenuItemProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors rounded',
        disabled && 'opacity-40 cursor-not-allowed',
        danger && !disabled && 'text-red-400 hover:bg-red-500/10',
        success && !disabled && 'text-emerald-400 hover:bg-emerald-500/10',
        !danger && !success && !disabled && 'text-slate-300 hover:bg-slate-700/50',
      )}
    >
      <span
        className={cn(
          'w-4 h-4 shrink-0',
          danger && 'text-red-400',
          success && 'text-emerald-400',
          !danger && !success && 'text-slate-400',
        )}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-500 rounded border border-slate-700 shrink-0">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// ============ MenuDivider ============

export function MenuDivider() {
  return <div className="my-1 h-px bg-slate-700/50" />;
}

// ============ MenuSubmenu ============

export interface MenuSubmenuProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function MenuSubmenu({ icon, label, children, disabled = false }: MenuSubmenuProps) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<'right' | 'left'>('right');

  // Decide if submenu opens left or right based on viewport
  useEffect(() => {
    if (!open || !rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    setSide(spaceRight < 200 ? 'left' : 'right');
  }, [open]);

  return (
    <div
      ref={rowRef}
      className="relative"
      onMouseEnter={() => !disabled && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded cursor-default',
          disabled ? 'opacity-40 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700/50',
        )}
      >
        <span className="w-4 h-4 shrink-0 text-slate-400">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
      </div>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            ref={subRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute top-0 z-50 min-w-40 py-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl',
              side === 'right' ? 'left-full ml-1' : 'right-full mr-1',
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ MenuHeader ============

export interface MenuHeaderProps {
  children: React.ReactNode;
}

export function MenuHeader({ children }: MenuHeaderProps) {
  return (
    <div className="px-3 py-2 border-b border-slate-700/50">{children}</div>
  );
}

// ============ Main Container ============

interface SoundContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  children: React.ReactNode;
}

export default function SoundContextMenu({
  position,
  onClose,
  children,
}: SoundContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState<ContextMenuPosition | null>(null);

  // Viewport boundary detection
  useEffect(() => {
    if (!position || !menuRef.current) {
      setAdjusted(position);
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x;
    let y = position.y;
    if (x + rect.width > vw - 16) x = vw - rect.width - 16;
    if (y + rect.height > vh - 16) y = vh - rect.height - 16;
    if (x < 16) x = 16;
    if (y < 16) y = 16;
    setAdjusted({ x, y });
  }, [position]);

  // Close on click outside + Escape + scroll
  useEffect(() => {
    if (!position) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [position, onClose]);

  // Wrap action to also close menu
  const handleAction = useCallback(
    (action?: () => void) => {
      action?.();
      onClose();
    },
    [onClose],
  );

  if (!position) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 min-w-48 py-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl shadow-black/30"
        style={{
          left: adjusted?.x ?? position.x,
          top: adjusted?.y ?? position.y,
        }}
      >
        {/* Inject handleAction into children via context */}
        <SoundMenuContext.Provider value={{ handleAction }}>
          {children}
        </SoundMenuContext.Provider>
      </motion.div>
    </AnimatePresence>
  );
}

// ============ Context for handleAction ============

interface SoundMenuContextValue {
  handleAction: (action?: () => void) => void;
}

export const SoundMenuContext = React.createContext<SoundMenuContextValue>({
  handleAction: () => {},
});

/**
 * Convenience wrapper: MenuItem that auto-closes menu on click.
 * Use inside SoundContextMenu.
 */
export function ActionItem({
  icon,
  label,
  shortcut,
  action,
  disabled,
  danger,
  success,
}: Omit<MenuItemProps, 'onClick'> & { action: () => void }) {
  const { handleAction } = React.useContext(SoundMenuContext);
  return (
    <MenuItem
      icon={icon}
      label={label}
      shortcut={shortcut}
      onClick={() => handleAction(action)}
      disabled={disabled}
      danger={danger}
      success={success}
    />
  );
}
