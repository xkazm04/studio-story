'use client';

import { useState, useRef, useEffect, forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { EntityType, NameSuggestion } from '@/app/types/NameSuggestion';

export interface SmartNameInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  entityType: EntityType;
  context?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  enableSuggestions?: boolean;
  onSuggestionSelect?: (suggestion: NameSuggestion) => void;
  debounceMs?: number;
  minChars?: number;
}

const sizeClasses = {
  sm: 'px-2 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export const SmartNameInput = forwardRef<HTMLInputElement, SmartNameInputProps>(
  (
    {
      entityType,
      context = {},
      size = 'md',
      label,
      helperText,
      error,
      fullWidth = true,
      enableSuggestions = true,
      onSuggestionSelect,
      debounceMs = 500,
      minChars = 2,
      className,
      id,
      value: controlledValue,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputId = id || `smart-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const [internalValue, setInternalValue] = useState<string>('');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch suggestions from API
    const fetchSuggestions = async (partialName: string, signal: AbortSignal) => {
      if (!enableSuggestions || partialName.trim().length < minChars) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/name-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            partialName,
            context,
          }),
          signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();

        if (!signal.aborted && data.success && data.suggestions) {
          setSuggestions(data.suggestions);
          setShowDropdown(true);
        }
      } catch (err) {
        if (!signal.aborted) {
          // Error fetching name suggestions - silently fail
          setSuggestions([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Handle input change with debouncing
    useEffect(() => {
      if (!enableSuggestions || !isFocused) return;

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const partialName = typeof value === 'string' ? value : '';

      if (partialName.trim().length < minChars) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Debounce the API call
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(partialName, abortController.signal);
      }, debounceMs);

      // Cleanup
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        abortController.abort();
      };
    }, [value, isFocused, enableSuggestions, entityType, minChars, debounceMs]);

    // Handle suggestion selection
    const selectSuggestion = (suggestion: NameSuggestion) => {
      const newValue = suggestion.name;

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }

      setSuggestions([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || suggestions.length === 0) {
        if (props.onKeyDown) props.onKeyDown(e);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
        default:
          if (props.onKeyDown) props.onKeyDown(e);
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
          setSelectedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (controlledValue === undefined) {
        setInternalValue(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
      setSelectedIndex(-1);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div className={clsx('relative flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-300 flex items-center gap-1.5"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
            {enableSuggestions && (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" data-testid="ai-indicator" />
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={clsx(
              'bg-gray-900/50 border rounded-lg text-white placeholder-gray-500',
              'transition-all outline-none',
              'focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              hasError
                ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                : 'border-gray-600/50',
              isLoading && 'pr-10',
              sizeClasses[size],
              fullWidth && 'w-full',
              className
            )}
            data-testid={`smart-name-input-${entityType}`}
            {...props}
          />

          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" data-testid="loading-spinner" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-xl overflow-hidden"
            data-testid="suggestions-dropdown"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={clsx(
                  'w-full text-left px-4 py-3 transition-colors',
                  'border-b border-gray-700/50 last:border-b-0',
                  'hover:bg-cyan-500/10 focus:bg-cyan-500/10',
                  selectedIndex === index && 'bg-cyan-500/10',
                  'focus:outline-none'
                )}
                data-testid={`suggestion-item-${index}`}
              >
                <div className="flex items-start gap-2">
                  <Check
                    className={clsx(
                      'w-4 h-4 mt-0.5 flex-shrink-0',
                      selectedIndex === index ? 'text-cyan-400' : 'text-gray-600'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm mb-1">
                      {suggestion.name}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {suggestion.description}
                    </div>
                    {suggestion.reasoning && (
                      <div className="text-xs text-gray-500 italic">
                        {suggestion.reasoning}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {(error || helperText) && (
          <span
            className={clsx(
              'text-xs',
              hasError ? 'text-red-400' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

SmartNameInput.displayName = 'SmartNameInput';
