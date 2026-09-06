import { useRef, useCallback, useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

function subscribeTheme(onChange: () => void) {
  window.addEventListener("sacredspace:theme-change", onChange);
  return () => window.removeEventListener("sacredspace:theme-change", onChange);
}

function getThemeSnapshot(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light"; /* localStorage unavailable */
  }
}

function getThemeServerSnapshot(): Theme {
  return "light";
}

/**
 * Shared theme state — mirrors the inline no-flash script in __root.tsx,
 * which applies the `dark` class before paint from localStorage. This hook
 * is the single place that reads/writes the theme afterwards; use it in
 * place of ad-hoc classList/localStorage logic.
 *
 * Uses useSyncExternalStore so the initial render already reflects the
 * persisted theme (no post-mount setState flash).
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch { /* localStorage unavailable */ }
    window.dispatchEvent(new Event("sacredspace:theme-change"));
  }, []);

  return { theme, toggleTheme };
}

/**
 * Returns a debounced version of the callback that delays invocation
 * until `delay` ms after the last call. Cleans up the timer on unmount.
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
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
    (...args: Parameters<T>) => {
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
