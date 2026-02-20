'use client';

import { useState, useCallback, useMemo, ReactNode } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { EditableDataTableProps, ColumnDefinition, EditableRowState } from './types';
import { EditableRow } from './EditableRow';
import { TableSkeleton } from './TableSkeleton';

export function EditableDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowUpdate,
  onRowDelete,
  onRowAdd,
  actions = [],
  draggable = false,
  onReorder,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  showIndex = true,
  indexHeader = '#',
  showHeader = true,
  showFooter = false,
  emptyMessage = 'No data available',
  emptyIcon,
  loading = false,
  loadingRows = 5,
  className,
  headerClassName,
  rowClassName,
  expandable = false,
  renderExpanded,
  addable = false,
  renderAddForm,
  onRowClick,
  highlightRow,
  keyboardNavigation = true,
  undoable = false,
  'data-testid': testId = 'editable-data-table',
}: EditableDataTableProps<T>) {
  const [rowStates, setRowStates] = useState<Map<string, EditableRowState>>(new Map());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [undoStack, setUndoStack] = useState<T[][]>([]);

  const getRowKey = useCallback(
    (row: T): string => {
      return typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
    },
    [rowKey]
  );

  const getRowState = useCallback(
    (row: T): EditableRowState => {
      const key = getRowKey(row);
      return rowStates.get(key) || {
        isEditing: false,
        editValues: {},
        errors: {},
        isExpanded: false,
      };
    },
    [rowStates, getRowKey]
  );

  const updateRowState = useCallback((row: T, updates: Partial<EditableRowState>) => {
    const key = getRowKey(row);
    setRowStates((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(key) || {
        isEditing: false,
        editValues: {},
        errors: {},
        isExpanded: false,
      };
      newMap.set(key, { ...currentState, ...updates });
      return newMap;
    });
  }, [getRowKey]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !onReorder) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) return;

      // Save to undo stack if enabled
      if (undoable) {
        setUndoStack((prev) => [...prev, data]);
      }

      await onReorder(sourceIndex, destinationIndex);
    },
    [onReorder, data, undoable]
  );

  const handleSelectionToggle = useCallback(
    (row: T) => {
      if (!onSelectionChange) return;

      const key = getRowKey(row);
      const newSelection = new Set(selectedRows);

      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }

      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange, getRowKey]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    if (selectedRows.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(getRowKey)));
    }
  }, [data, selectedRows, onSelectionChange, getRowKey]);

  // Calculate column widths
  const columnWidths = useMemo(() => {
    const widths: string[] = [];

    if (draggable) widths.push('w-8');
    if (selectable) widths.push('w-10');
    if (showIndex) widths.push('w-10');

    columns.forEach((col) => {
      widths.push(col.width || 'flex-1');
    });

    if (actions.length > 0) {
      widths.push('w-24');
    }

    return widths;
  }, [draggable, selectable, showIndex, columns, actions]);

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={loadingRows} />;
  }

  const tableContent = (
    <div
      className={clsx('w-full overflow-hidden rounded-lg border border-gray-800', className)}
      data-testid={testId}
    >
      {/* Header */}
      {showHeader && (
        <div className={clsx(
          'flex py-2 px-3 border-b bg-gray-900/50 border-gray-800 text-gray-300 text-xs font-medium',
          headerClassName
        )}>
          {draggable && <div className="w-8" />}
          {selectable && (
            <div className="w-10 flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
                data-testid={`${testId}-select-all`}
              />
            </div>
          )}
          {showIndex && <div className="w-10 text-center">{indexHeader}</div>}
          {columns.map((col, idx) => (
            <div
              key={col.key}
              className={clsx(col.width || 'flex-1', col.headerClassName)}
            >
              {col.header}
            </div>
          ))}
          {actions.length > 0 && <div className="w-24 text-right">Actions</div>}
        </div>
      )}

      {/* Body */}
      <div className="bg-gray-950">
        {data.length === 0 && !isAddingNew ? (
          <div className="py-12 text-center text-gray-400" data-testid={`${testId}-empty`}>
            {emptyIcon && <div className="mb-3 flex justify-center">{emptyIcon}</div>}
            <p>{emptyMessage}</p>
          </div>
        ) : draggable ? (
          <Droppable droppableId="table-rows">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={clsx(
                  snapshot.isDraggingOver ? 'bg-gray-900/30' : '',
                  'transition-colors duration-200'
                )}
              >
                {data.map((row, index) => {
                  const rowId = getRowKey(row);
                  return (
                    <Draggable key={rowId} draggableId={rowId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <EditableRow
                            row={row}
                            index={index}
                            columns={columns}
                            actions={actions}
                            rowState={getRowState(row)}
                            updateRowState={(updates) => updateRowState(row, updates)}
                            onRowUpdate={onRowUpdate}
                            onRowDelete={onRowDelete}
                            selectable={selectable}
                            isSelected={selectedRows.has(rowId)}
                            onSelectionToggle={() => handleSelectionToggle(row)}
                            showIndex={showIndex}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            expandable={expandable}
                            renderExpanded={renderExpanded}
                            onRowClick={onRowClick}
                            highlighted={highlightRow?.(row)}
                            rowClassName={typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName}
                            testId={`${testId}-row-${index}`}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <>
            {data.map((row, index) => {
              const rowId = getRowKey(row);
              return (
                <EditableRow
                  key={rowId}
                  row={row}
                  index={index}
                  columns={columns}
                  actions={actions}
                  rowState={getRowState(row)}
                  updateRowState={(updates) => updateRowState(row, updates)}
                  onRowUpdate={onRowUpdate}
                  onRowDelete={onRowDelete}
                  selectable={selectable}
                  isSelected={selectedRows.has(rowId)}
                  onSelectionToggle={() => handleSelectionToggle(row)}
                  showIndex={showIndex}
                  expandable={expandable}
                  renderExpanded={renderExpanded}
                  onRowClick={onRowClick}
                  highlighted={highlightRow?.(row)}
                  rowClassName={typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName}
                  testId={`${testId}-row-${index}`}
                />
              );
            })}
          </>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {isAddingNew && renderAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-800"
            >
              {renderAddForm(
                async (newData) => {
                  if (onRowAdd) {
                    await onRowAdd(newData);
                  }
                  setIsAddingNew(false);
                },
                () => setIsAddingNew(false)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="py-2 px-3 border-t border-gray-800 text-xs font-medium bg-gray-900/30">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Total: {data.length}
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </span>
            {addable && !isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="text-blue-400 hover:text-blue-300 transition"
                data-testid={`${testId}-add-btn`}
              >
                + Add New
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return draggable ? (
    <DragDropContext onDragEnd={handleDragEnd}>
      {tableContent}
    </DragDropContext>
  ) : (
    tableContent
  );
}
