'use client';

import { clsx } from 'clsx';
import { ColumnDefinition } from './types';
import { Input } from '../Input';
import { Select } from '../Select';

interface EditableCellProps<T> {
  column: ColumnDefinition<T>;
  value: any;
  row: T;
  index: number;
  isEditing: boolean;
  onChange: (value: any) => void;
  error?: string;
  testId?: string;
}

export function EditableCell<T>({
  column,
  value,
  row,
  index,
  isEditing,
  onChange,
  error,
  testId = 'editable-cell',
}: EditableCellProps<T>) {
  const width = column.width || 'flex-1';

  // Display mode
  if (!isEditing || column.editable === false) {
    return (
      <div
        className={clsx('flex items-center', width, column.className)}
        data-testid={testId}
      >
        {column.render ? (
          column.render(value, row, index)
        ) : column.format ? (
          <span className="text-sm text-gray-300">{column.format(value)}</span>
        ) : (
          <span className="text-sm text-gray-300">{value ?? '-'}</span>
        )}
      </div>
    );
  }

  // Edit mode
  if (column.renderEdit) {
    return (
      <div className={clsx(width, column.className)} data-testid={testId}>
        {column.renderEdit(value, onChange, row)}
      </div>
    );
  }

  // Default edit inputs based on type
  switch (column.type) {
    case 'boolean':
      return (
        <div className={clsx('flex items-center', width, column.className)} data-testid={testId}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
            data-testid={`${testId}-checkbox`}
          />
        </div>
      );

    case 'number':
      return (
        <div className={clsx(width, column.className)} data-testid={testId}>
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            size="sm"
            error={error}
            fullWidth
            data-testid={`${testId}-input`}
          />
        </div>
      );

    case 'select':
      return (
        <div className={clsx(width, column.className)} data-testid={testId}>
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            options={column.options || []}
            size="sm"
            error={error}
            fullWidth
            data-testid={`${testId}-select`}
          />
        </div>
      );

    case 'custom':
      // Custom type should use renderEdit
      return null;

    case 'text':
    default:
      return (
        <div className={clsx(width, column.className)} data-testid={testId}>
          <Input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            size="sm"
            error={error}
            fullWidth
            data-testid={`${testId}-input`}
          />
        </div>
      );
  }
}
