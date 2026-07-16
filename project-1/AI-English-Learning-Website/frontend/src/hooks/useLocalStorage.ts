import { useEffect, useState } from "react";

/**
 * Generic localStorage-backed state.
 * Reads once on mount, writes back whenever the value changes.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors (storage full / private mode)
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
