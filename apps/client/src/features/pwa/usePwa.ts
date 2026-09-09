// apps/client/src/features/pwa/usePwa.ts
// Install / update / connectivity state for the installed-app experience.
import { useCallback, useEffect, useState } from 'react';
import { onNeedRefresh, updateServiceWorker } from './serviceWorker';

/**
 * `beforeinstallprompt` is not in lib.dom yet. Chrome fires it instead of
 * showing its own install UI, and hands us a prompt() we may call once.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'gmc:install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates display-mode and exposes this instead.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1' || isStandalone(),
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Suppress the mini-infobar so the banner appears where we place it.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDismissed(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use either way; drop it so the button cannot re-fire.
    setDeferred(null);
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, '1');
      setDismissed(true);
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  return { canInstall: Boolean(deferred) && !dismissed, install, dismiss };
}

/** True whenever the browser reports no connectivity. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/**
 * Watches for a newer build. The open tab keeps running the bundle it loaded
 * with, so we offer a reload rather than swapping code out underneath it.
 */
export function useServiceWorkerUpdate() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => onNeedRefresh(() => setUpdateReady(true)), []);

  // `updateServiceWorker(true)` activates the waiting worker and reloads.
  const reload = useCallback(() => void updateServiceWorker(true), []);

  return { updateReady, reload };
}
