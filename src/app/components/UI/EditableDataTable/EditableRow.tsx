'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { GripVertical, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ColumnDefinition, RowAction, EditableRowState } from './types';
import { EditableCell } from './EditableCell';
import { IconButton } from '../Button';

interface EditableRowProps<T> {
  row: T;
  index: number;
  columns: ColumnDefinition<T>[];
  actions: RowAction<T>[];
  rowState: EditableRowState;
  updateRowState: (updates: Partial<EditableRowState>) => void;
  onRowUpdate?: (row: T, updates: Partial<T>) => Promise<void> | void;
  onRowDelete?: (row: T) => Promise<void> | void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
  showIndex?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
  expandable?: boolean;
  renderExpanded?: (row: T, index: number) => React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  highlighted?: boolean;
  rowClassName?: string;
  testId?: string;
}

export function EditableRow<T extends Record<string, any>>({
  row,
  index,
  columns,
  actions,
  rowState,
  updateRowState,
  onRowUpdate,
  onRowDelete,
  selectable,
  isSelected,
  onSelectionToggle,
  showIndex,
  dragHandleProps,
  isDragging,
  expandable,
  renderExpanded,
  onRowClick,
  highlighted,
  rowClassName,
  testId = 'editable-row',
}: EditableRowProps<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEditing = useCallback(() => {
    const initialValues: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.editable !== false) {
        initialValues[col.key] = row[col.key];
      }
    });
    updateRowState({
      isEditing: true,
      editValues: initialValues,
      errors: {},
    });
  }, [columns, row, updateRowState]);

  const cancelEditing = useCallback(() => {
    updateRowState({
      isEditing: false,
      editValues: {},
      errors: {},
    });
  }, [updateRowState]);

  const saveEditing = useCallback(async () => {
    if (!onRowUpdate) return;

    // Validate all fields
    const errors: Record<string, string> = {};
    columns.forEach((col) => {
      if (col.validate && col.editable !== false) {
        const error = col.validate(rowState.editValues[col.key], row);
        if (error) {
          errors[col.key] = error;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      updateRowState({ errors });
      return;
    }

    setIsSaving(true);
    try {
      await onRowUpdate(row, rowState.editValues as Partial<T>);
      updateRowState({
        isEditing: false,
        editValues: {},
        errors: {},
      });
    } catch (error) {
      console.error('Failed to update row:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onRowUpdate, row, rowState.editValues, columns, updateRowState]);

  const handleCellChange = useCallback(
    (key: string, value: any) => {
      updateRowState({
        editValues: { ...rowState.editValues, [key]: value },
      });
    },
    [rowState.editValues, updateRowState]
  );

  const toggleExpanded = useCallback(() => {
    updateRowState({ isExpanded: !rowState.isExpanded });
  }, [rowState.isExpanded, updateRowState]);

  const handleRowClick = useCallback(() => {
    if (onRowClick && !rowState.isEditing) {
      onRowClick(row, index);
    }
  }, [onRowClick, row, index, rowState.isEditing]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (rowState.isEditing) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          saveEditing();
        } else if (e.key === 'Escape') {
          cancelEditing();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditing();
        }
      }
    },
    [rowState.isEditing, saveEditing, cancelEditing, startEditing]
  );

  return (
    <>
      <div
        className={clsx(
          'flex items-center py-2 px-3 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors',
          isDragging && 'bg-gray-900/50 shadow-xl',
          highlighted && 'bg-blue-500/10',
          rowState.isEditing && 'bg-gray-900/50',
          rowClassName
        )}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        data-testid={testId}
      >
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="w-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400"
            data-testid={`${testId}-drag-handle`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Selection Checkbox */}
        {selectable && (
          <div className="w-10 flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelectionToggle}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
              data-testid={`${testId}-select`}
            />
          </div>
        )}

        {/* Index */}
        {showIndex && (
          <div className="w-10 flex items-center justify-center text-gray-400 text-sm">
            {index + 1}
          </div>
        )}

        {/* Expand Toggle */}
        {expandable && renderExpanded && (
          <div className="w-6 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="text-gray-500 hover:text-gray-300 transition"
              data-testid={`${testId}-expand-btn`}
            >
              {rowState.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Cells */}
        {columns.map((col) => (
          <EditableCell
            key={col.key}
            column={col}
            value={rowState.isEditing ? rowState.editValues[col.key] : row[col.key]}
            row={row}
            index={index}
            isEditing={rowState.isEditing}
            onChange={(value) => handleCellChange(col.key, value)}
            error={rowState.errors[col.key]}
            testId={`${testId}-cell-${col.key}`}
          />
        ))}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="w-24 flex justify-end items-center gap-1">
            {rowState.isEditing ? (
              <>
                <IconButton
                  icon={<Check className="h-4 w-4" />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEditing();
                  }}
                  loading={isSaving}
                  disabled={isSaving}
                  className="text-green-500 hover:text-green-400"
                  aria-label="Save changes"
                  data-testid={`${testId}-save-btn`}
                />
                <IconButton
                  icon={<X className="h-4 w-4" />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  disabled={isSaving}
                  className="text-red-500 hover:text-red-400"
                  aria-label="Cancel editing"
                  data-testid={`${testId}-cancel-btn`}
                />
              </>
            ) : (
              <>
                {actions.map((action, idx) => {
                  const shouldShow = action.show ? action.show(row) : true;
                  const isDisabled = action.disabled ? action.disabled(row) : false;

                  if (!shouldShow) return null;

                  return (
                    <IconButton
                      key={idx}
                      icon={action.icon}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row, index);
                      }}
                      disabled={isDisabled}
                      className={clsx(
                        action.variant === 'danger' && 'text-red-500 hover:text-red-400',
                        action.variant === 'primary' && 'text-blue-500 hover:text-blue-400',
                        !action.variant && 'text-gray-500 hover:text-gray-300'
                      )}
                      aria-label={action.label}
                      data-testid={`${testId}-action-${idx}`}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {rowState.isExpanded && expandable && renderExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-800/50 bg-gray-900/20"
            data-testid={`${testId}-expanded`}
          >
            <div className="px-3 py-2">{renderExpanded(row, index)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
