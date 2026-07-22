import { lazy, type ComponentType } from "react";

// After a new deploy, an already-open tab still holds JS that references the
// OLD build's chunk file hashes. Navigating to a route whose chunk changed
// (or was renamed) makes the browser fetch a file that no longer exists on
// the server — the dynamic import() rejects, and without this the page just
// hangs on the Suspense spinner (or the user has to know to hard-refresh).
// This retries once via a full reload (which fetches the fresh index.html
// and correct chunk manifest), guarded by sessionStorage so a genuinely
// broken chunk doesn't reload-loop forever.
export function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const key = `chunk-retry:${factory.toString()}`;
    try {
      const mod = await factory();
      sessionStorage.removeItem(key);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // Reload is navigating away — return a never-resolving promise so
        // React doesn't render an error before the page actually reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
