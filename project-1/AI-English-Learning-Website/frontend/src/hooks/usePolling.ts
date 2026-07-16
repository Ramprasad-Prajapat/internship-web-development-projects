import { useEffect, useRef } from "react";

/**
 * Runs `callback` once on mount and then every `intervalMs` milliseconds.
 *
 * Used so pages (Lesson Library, Dashboard, Mistakes...) pick up new data
 * automatically — e.g. when the browser extension saves a lesson later.
 * For now the data is local (mock), but the polling shape stays the same
 * once the real backend exists.
 *
 * - Polling pauses while the browser tab is hidden (saves work) and runs an
 *   immediate refresh when the tab becomes visible again.
 * - Pass `enabled = false` to stop polling (e.g. while a form is open).
 */
export function usePolling(
  callback: () => void,
  intervalMs = 3000,
  enabled = true,
): void {
  const savedCallback = useRef(callback);

  // Always call the latest callback without restarting the interval.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    };

    // run immediately, then on an interval
    tick();
    const id = window.setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") savedCallback.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, enabled]);
}

export default usePolling;
