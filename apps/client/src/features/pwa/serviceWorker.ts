// apps/client/src/features/pwa/serviceWorker.ts
// Single owner of the service worker registration.
//
// The worker's URL differs between dev (`/dev-sw.js?dev-sw`) and a production
// build (`/sw.js`), so registration goes through vite-plugin-pwa's helper
// rather than a hard-coded path. Everything that needs the registration —
// push subscription, the update banner — waits on the promise below.
import { registerSW } from 'virtual:pwa-register';

let resolveRegistration: (registration: ServiceWorkerRegistration | undefined) => void;

/** Resolves once the worker is registered; `undefined` if it could not be. */
export const swRegistration = new Promise<ServiceWorkerRegistration | undefined>((resolve) => {
  resolveRegistration = resolve;
});

type Listener = () => void;
const needRefreshListeners = new Set<Listener>();
let needRefresh = false;

/**
 * Subscribe to "a newer build is live". Fires immediately if the update was
 * detected before the component mounted. Returns an unsubscribe function.
 */
export function onNeedRefresh(listener: Listener): () => void {
  needRefreshListeners.add(listener);
  if (needRefresh) listener();
  return () => needRefreshListeners.delete(listener);
}

/** Activates the waiting worker and reloads the page onto the new bundle. */
export const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW: (_url, registration) => resolveRegistration(registration),
  onRegisterError: () => resolveRegistration(undefined),
  onNeedRefresh: () => {
    needRefresh = true;
    needRefreshListeners.forEach((listener) => listener());
  },
});
