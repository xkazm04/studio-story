import { useState, useCallback, useRef } from 'react';

/**
 * Shared hook for copying text to the clipboard.
 * Handles async clipboard API, provides copied/error state with auto-reset,
 * and gracefully handles permission failures (common in HTTP/iframe contexts).
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(
    async (text: string) => {
      // Clear any pending reset
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch (err) {
        const copyError =
          err instanceof Error ? err : new Error('Clipboard write failed');
        setError(copyError);
        setCopied(false);
        timeoutRef.current = setTimeout(() => setError(null), resetMs);
        return false;
      }
    },
    [resetMs],
  );

  return { copy, copied, error } as const;
}
