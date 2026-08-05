import { useEffect, useState } from "react";

// Mobile browsers reload a backgrounded tab to reclaim memory (screen
// lock, switching apps, no fixed time threshold), wiping any state that
// only lives in React. Browsing preferences survive that by mirroring
// into localStorage instead of plain useState.
export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (e.g. private browsing). Preference just won't persist.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
