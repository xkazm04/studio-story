'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useDropdown } from '@/workspace/hooks/useDropdown';

export interface DropdownItem {
  id: string;
  label: string;
  sublabel?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export interface CreateFormConfig {
  triggerLabel: string;
  placeholder: string;
  submitLabel?: string;
  accentColorClass: string;
  onSubmit: (name: string) => Promise<void>;
}

export interface HeaderDropdownProps {
  triggerContent: React.ReactNode;
  triggerClassName?: string;
  items: DropdownItem[];
  selectedId?: string;
  selectedItemClassName: string;
  onSelect: (id: string) => void;
  minWidth?: number;
  maxHeight?: string;
  emptyMessage?: string;
  createForm?: CreateFormConfig;
  onClose?: () => void;
}

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  triggerContent,
  triggerClassName,
  items,
  selectedId,
  selectedItemClassName,
  onSelect,
  minWidth = 200,
  maxHeight = '300px',
  emptyMessage = 'No items found',
  createForm,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    setIsCreating(false);
    setNewName('');
    onClose?.();
  };

  const { isOpen, toggle: handleToggle, close } = useDropdown({
    triggerRef: buttonRef,
    contentRef: dropdownRef,
    onClose: handleDismiss,
  });

  // Calculate position when opening (fixed header: no scrollY offset needed)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, minWidth),
      });
    }
  }, [isOpen, minWidth]);

  const handleSelect = (id: string) => {
    onSelect(id);
    close();
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!createForm || !newName.trim()) return;
    await createForm.onSubmit(newName.trim());
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={triggerClassName ?? 'flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/50 transition-all text-sm text-slate-300 hover:text-slate-100'}
      >
        {triggerContent}
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            ref={dropdownRef}
            className="fixed bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl overflow-hidden z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <div className="overflow-y-auto" style={{ maxHeight }}>
              {items.length > 0 ? (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      item.id === selectedId
                        ? selectedItemClassName
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-medium">
                        {item.prefix}
                        {item.label}
                      </div>
                      {item.suffix && <div>{item.suffix}</div>}
                    </div>
                    {item.sublabel && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  {emptyMessage}
                </div>
              )}

              {createForm && (
                <>
                  {items.length > 0 && <div className="h-px bg-slate-800 my-0.5" />}

                  {!isCreating ? (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      <span className="font-medium">{createForm.triggerLabel}</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateSubmit} className="p-2.5 border-t border-slate-800">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={createForm.placeholder}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewName('');
                          }
                        }}
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          type="submit"
                          disabled={!newName.trim()}
                          className={`flex-1 px-2 py-1 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-medium rounded transition-colors ${createForm.accentColorClass}`}
                        >
                          {createForm.submitLabel ?? 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsCreating(false); setNewName(''); }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default HeaderDropdown;
