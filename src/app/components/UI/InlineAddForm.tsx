'use client';

import { ReactNode, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface InlineAddFormProps {
  trigger: {
    icon?: ReactNode;
    label: string;
  };
  onSubmit: (close: () => void) => void;
  renderForm: (close: () => void) => ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function InlineAddForm({
  trigger,
  onSubmit,
  renderForm,
  className,
  'data-testid': testId,
}: InlineAddFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200',
          'border border-solid border-slate-700/30 hover:border-cyan-500/30 rounded-lg',
          'transition-all w-full justify-center',
          className
        )}
        data-testid={testId}
      >
        {trigger.icon || <Plus className="w-3.5 h-3.5" />}
        {trigger.label}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'border border-slate-700/50 rounded-lg p-3 bg-slate-900/60 backdrop-blur-sm space-y-3',
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">{trigger.label}</span>
        <button onClick={close} className="p-0.5 text-slate-500 hover:text-slate-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {renderForm(close)}
      <div className="flex justify-end gap-2">
        <button
          onClick={close}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(close)}
          className="px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md transition-all duration-200"
        >
          Create
        </button>
      </div>
    </div>
  );
}
