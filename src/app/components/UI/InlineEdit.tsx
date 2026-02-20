'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  'data-testid'?: string;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit...',
  size = 'md',
  className,
  'data-testid': testId,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)} data-testid={testId}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'bg-slate-900/80 border border-slate-700/50 rounded px-2 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200',
            size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'
          )}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          className="p-1 text-green-400 hover:text-green-300"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
          className="p-1 text-slate-400 hover:text-slate-300"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1.5 hover:bg-slate-800/40 rounded px-1 -mx-1 transition-all duration-200',
        size === 'sm' ? 'text-xs' : 'text-sm',
        value ? 'text-slate-200' : 'text-slate-500',
        className
      )}
      data-testid={testId}
    >
      {value || placeholder}
      <Pencil className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
