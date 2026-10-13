import { useEffect, useState } from 'react';

/**
 * useState that is saved to localStorage under `key`, so data survives reloads.
 * Falls back to `initial` when nothing is stored or the stored value is invalid.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const storageKey = `bizflow:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private mode or quota); keep working in memory.
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}
