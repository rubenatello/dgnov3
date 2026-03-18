import { useCallback, useState } from 'react';

/**
 * Generic undo/redo history hook.
 * Uses structuredClone instead of JSON.parse(JSON.stringify()) for safer deep cloning.
 */
export function useBoardHistory<T>(initial: T) {
  const [history, setHistory] = useState<T[]>([structuredClone(initial)]);
  const [historyIndex, setHistoryIndex] = useState(0);

  /** Snapshot current state onto the history stack (call *before* mutating). */
  const pushHistory = useCallback(
    (snapshot: T) => {
      const cloned = structuredClone(snapshot);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), cloned]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  /** Restore previous state. Returns the restored snapshot or null. */
  const undo = useCallback((): T | null => {
    if (historyIndex <= 0) return null;
    const prev = history[historyIndex - 1];
    setHistoryIndex((i) => i - 1);
    return structuredClone(prev);
  }, [history, historyIndex]);

  /** Re-apply next state. Returns the restored snapshot or null. */
  const redo = useCallback((): T | null => {
    if (historyIndex >= history.length - 1) return null;
    const next = history[historyIndex + 1];
    setHistoryIndex((i) => i + 1);
    return structuredClone(next);
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return { pushHistory, undo, redo, canUndo, canRedo };
}
