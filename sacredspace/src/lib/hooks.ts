import { useRef, useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

/**
 * Shared theme state — mirrors the inline no-flash script in __root.tsx,
 * which applies the `dark` class before paint from localStorage. This hook
 * is the single place that reads/writes the theme afterwards; use it in
 * place of ad-hoc classList/localStorage logic.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === "dark") {
        setTheme("dark");
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

/**
 * Returns a debounced version of the callback that delays invocation
 * until `delay` ms after the last call. Cleans up the timer on unmount.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref current without re-triggering debounce
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: any[]) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;
}
