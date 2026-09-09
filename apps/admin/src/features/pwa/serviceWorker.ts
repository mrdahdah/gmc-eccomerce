// apps/admin/src/features/pwa/serviceWorker.ts
// Registers the admin service worker so low-stock alerts can reach an admin
// with the tab closed. The worker's URL differs between dev and a production
// build, so registration goes through vite-plugin-pwa's helper.
import { registerSW } from 'virtual:pwa-register';

let resolveRegistration: (registration: ServiceWorkerRegistration | undefined) => void;

/** Resolves once the worker is registered; `undefined` if it could not be. */
export const swRegistration = new Promise<ServiceWorkerRegistration | undefined>((resolve) => {
  resolveRegistration = resolve;
});

registerSW({
  immediate: true,
  onRegisteredSW: (_url, registration) => resolveRegistration(registration),
  onRegisterError: () => resolveRegistration(undefined),
});
