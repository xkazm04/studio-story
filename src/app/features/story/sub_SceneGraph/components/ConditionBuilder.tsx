'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Variable,
  Equal,
  AlertCircle,
  CheckCircle2,
  Copy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  conditionEngine,
  variableManager,
  type Condition,
  type SimpleCondition,
  type CompoundCondition,
  type OperatorType,
  type LogicalOperator,
  type VariableValue,
  type VariableDefinition,
} from '@/lib/branching';

interface ConditionBuilderProps {
  condition?: Condition;
  onChange: (condition: Condition | undefined) => void;
  variables?: VariableDefinition[];
  choiceId?: string;
  className?: string;
}

const OPERATORS: { value: OperatorType; label: string; types: string[] }[] = [
  { value: 'equals', label: 'equals', types: ['string', 'number', 'boolean'] },
  { value: 'not_equals', label: 'not equals', types: ['string', 'number', 'boolean'] },
  { value: 'greater_than', label: '>', types: ['number'] },
  { value: 'less_than', label: '<', types: ['number'] },
  { value: 'greater_equal', label: '>=', types: ['number'] },
  { value: 'less_equal', label: '<=', types: ['number'] },
  { value: 'contains', label: 'contains', types: ['string', 'array'] },
  { value: 'not_contains', label: 'not contains', types: ['string', 'array'] },
  { value: 'starts_with', label: 'starts with', types: ['string'] },
  { value: 'ends_with', label: 'ends with', types: ['string'] },
  { value: 'is_empty', label: 'is empty', types: ['string', 'array'] },
  { value: 'is_not_empty', label: 'is not empty', types: ['string', 'array'] },
  { value: 'is_true', label: 'is true', types: ['boolean'] },
  { value: 'is_false', label: 'is false', types: ['boolean'] },
];

const LOGICAL_OPERATORS: { value: LogicalOperator; label: string }[] = [
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
];

/**
 * ConditionBuilder - Visual editor for building complex conditions
 */
export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  condition,
  onChange,
  variables: propVariables,
  choiceId,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get variables from manager or props
  const variables = useMemo(() => {
    return propVariables ?? variableManager.getAllVariables();
  }, [propVariables]);

  // Validation
  const validation = useMemo(() => {
    if (!condition) return null;
    const variableMap = new Map(variables.map(v => [v.id, v]));
    return conditionEngine.validate(condition, variableMap);
  }, [condition, variables]);

  // Create a new empty condition
  const createEmptyCondition = useCallback((): SimpleCondition => {
    const firstVariable = variables[0];
    return {
      type: 'simple',
      variableId: firstVariable?.id ?? '',
      operator: 'equals',
      value: firstVariable?.defaultValue ?? '',
    };
  }, [variables]);

  // Add a condition
  const handleAddCondition = useCallback(() => {
    if (!condition) {
      onChange(createEmptyCondition());
    } else if (condition.type === 'simple') {
      // Convert to compound
      onChange({
        type: 'compound',
        operator: 'and',
        conditions: [condition, createEmptyCondition()],
      });
    } else if (condition.type === 'compound') {
      onChange({
        ...condition,
        conditions: [...condition.conditions, createEmptyCondition()],
      });
    }
  }, [condition, onChange, createEmptyCondition]);

  // Remove a condition at index
  const handleRemoveCondition = useCallback((index: number) => {
    if (!condition || condition.type !== 'compound') return;

    const newConditions = condition.conditions.filter((_, i) => i !== index);
    if (newConditions.length === 1) {
      onChange(newConditions[0]);
    } else if (newConditions.length === 0) {
      onChange(undefined);
    } else {
      onChange({ ...condition, conditions: newConditions });
    }
  }, [condition, onChange]);

  // Update a simple condition
  const handleUpdateSimple = useCallback((
    index: number | null,
    updates: Partial<SimpleCondition>
  ) => {
    if (!condition) return;

    if (condition.type === 'simple' && index === null) {
      onChange({ ...condition, ...updates } as SimpleCondition);
    } else if (condition.type === 'compound' && index !== null) {
      const newConditions = [...condition.conditions];
      const target = newConditions[index];
      if (target.type === 'simple') {
        newConditions[index] = { ...target, ...updates };
        onChange({ ...condition, conditions: newConditions });
      }
    }
  }, [condition, onChange]);

  // Update logical operator
  const handleUpdateOperator = useCallback((operator: LogicalOperator) => {
    if (!condition || condition.type !== 'compound') return;
    onChange({ ...condition, operator });
  }, [condition, onChange]);

  // Clear all conditions
  const handleClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  // Render a simple condition editor
  const renderSimpleCondition = (
    cond: SimpleCondition,
    index: number | null,
    canRemove: boolean
  ) => {
    const variable = variables.find(v => v.id === cond.variableId);
    const availableOperators = OPERATORS.filter(op =>
      !variable || op.types.includes(variable.type)
    );
    const needsValue = !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(cond.operator);

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-lg"
      >
        {/* Variable Select */}
        <div className="flex-1 min-w-0">
          <select
            value={cond.variableId}
            onChange={(e) => {
              const newVar = variables.find(v => v.id === e.target.value);
              handleUpdateSimple(index, {
                variableId: e.target.value,
                value: newVar?.defaultValue ?? '',
              });
            }}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Select variable...</option>
            {variables.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.type})
              </option>
            ))}
          </select>
        </div>

        {/* Operator Select */}
        <div className="w-28">
          <select
            value={cond.operator}
            onChange={(e) => handleUpdateSimple(index, { operator: e.target.value as OperatorType })}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            {availableOperators.map(op => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        {needsValue && (
          <div className="w-28">
            {variable?.type === 'boolean' ? (
              <select
                value={String(cond.value)}
                onChange={(e) => handleUpdateSimple(index, { value: e.target.value === 'true' })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : variable?.type === 'number' ? (
              <input
                type="number"
                value={cond.value as number}
                onChange={(e) => handleUpdateSimple(index, { value: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            ) : (
              <input
                type="text"
                value={cond.value as string}
                onChange={(e) => handleUpdateSimple(index, { value: e.target.value })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                placeholder="value"
              />
            )}
          </div>
        )}

        {/* Remove Button */}
        {canRemove && (
          <button
            onClick={() => index !== null ? handleRemoveCondition(index) : handleClear()}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  // Get human-readable condition string
  const conditionString = useMemo(() => {
    if (!condition) return 'No conditions';
    const variableMap = new Map(variables.map(v => [v.id, v]));
    return conditionEngine.conditionToString(condition, variableMap);
  }, [condition, variables]);

  return (
    <div className={cn('bg-slate-900/30 border border-slate-800 rounded-lg', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Condition Builder</span>
          {condition && (
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] rounded',
              validation?.isValid
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            )}>
              {validation?.isValid ? 'Valid' : `${validation?.errors.length} errors`}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Condition Preview */}
              <div className="px-2 py-1.5 bg-slate-800/50 rounded text-[10px] font-mono text-slate-400 truncate">
                {conditionString}
              </div>

              {/* No Variables Warning */}
              {variables.length === 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300">
                    No variables defined. Create variables first.
                  </span>
                </div>
              )}

              {/* Condition Editor */}
              {variables.length > 0 && (
                <div className="space-y-2">
                  {/* Simple condition */}
                  {condition?.type === 'simple' && (
                    renderSimpleCondition(condition, null, true)
                  )}

                  {/* Compound condition */}
                  {condition?.type === 'compound' && (
                    <div className="space-y-2">
                      {/* Logical Operator Toggle */}
                      <div className="flex items-center gap-2">
                        {LOGICAL_OPERATORS.map(op => (
                          <button
                            key={op.value}
                            onClick={() => handleUpdateOperator(op.value)}
                            className={cn(
                              'px-3 py-1 text-xs font-medium rounded transition-colors',
                              condition.operator === op.value
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                            )}
                          >
                            {op.label}
                          </button>
                        ))}
                        <span className="text-[10px] text-slate-500 ml-2">
                          {condition.operator === 'and' ? 'All conditions must match' : 'Any condition can match'}
                        </span>
                      </div>

                      {/* Conditions List */}
                      {condition.conditions.map((cond, index) => (
                        <div key={index}>
                          {index > 0 && (
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex-1 h-px bg-slate-800" />
                              <span className="text-[10px] font-medium text-slate-500 uppercase">
                                {condition.operator}
                              </span>
                              <div className="flex-1 h-px bg-slate-800" />
                            </div>
                          )}
                          {cond.type === 'simple' && renderSimpleCondition(cond, index, true)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Condition Button */}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleAddCondition}
                    className="w-full h-8 border border-dashed border-slate-700 hover:border-cyan-500/30"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Condition
                  </Button>

                  {/* Clear Button */}
                  {condition && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleClear}
                      className="w-full h-7 text-slate-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              )}

              {/* Validation Errors */}
              {validation && !validation.isValid && (
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {error.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Warnings */}
              {validation && validation.warnings.length > 0 && (
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {warning.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * VariableEditor - Inline editor for creating/editing variables
 */
export const VariableEditor: React.FC<{
  variable?: VariableDefinition;
  onSave: (variable: VariableDefinition) => void;
  onCancel: () => void;
  className?: string;
}> = ({ variable, onSave, onCancel, className }) => {
  const [name, setName] = useState(variable?.name ?? '');
  const [type, setType] = useState<VariableDefinition['type']>(variable?.type ?? 'string');
  const [scope, setScope] = useState<VariableDefinition['scope']>(variable?.scope ?? 'global');
  const [defaultValue, setDefaultValue] = useState<string>(
    variable ? String(variable.defaultValue) : ''
  );
  const [description, setDescription] = useState(variable?.description ?? '');

  const handleSave = () => {
    let parsedDefault: VariableValue = defaultValue;
    if (type === 'number') {
      parsedDefault = parseFloat(defaultValue) || 0;
    } else if (type === 'boolean') {
      parsedDefault = defaultValue === 'true';
    } else if (type === 'array') {
      try {
        parsedDefault = JSON.parse(defaultValue) as string[];
      } catch {
        parsedDefault = [];
      }
    }

    onSave({
      id: variable?.id ?? `var-${Date.now()}`,
      name,
      type,
      scope,
      defaultValue: parsedDefault,
      description,
    });
  };

  return (
    <div className={cn('bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Variable className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">
          {variable ? 'Edit Variable' : 'New Variable'}
        </span>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] font-medium text-slate-400 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          placeholder="e.g., playerHealth"
        />
      </div>

      {/* Type & Scope */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VariableDefinition['type'])}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="array">Array</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as VariableDefinition['scope'])}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="global">Global</option>
            <option value="scene">Scene</option>
            <option value="character">Character</option>
          </select>
        </div>
      </div>

      {/* Default Value */}
      <div>
        <label className="block text-[10px] font-medium text-slate-400 mb-1">Default Value</label>
        {type === 'boolean' ? (
          <select
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : (
          <input
            type={type === 'number' ? 'number' : 'text'}
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            placeholder={type === 'array' ? '["item1", "item2"]' : 'default value'}
          />
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-medium text-slate-400 mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          placeholder="What does this variable track?"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button size="xs" onClick={handleSave} disabled={!name.trim()} className="flex-1">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
        <Button size="xs" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ConditionBuilder;
