// apps/client/src/features/pwa/PwaBanners.tsx
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useInstallPrompt, useOnlineStatus, useServiceWorkerUpdate } from './usePwa';

/**
 * The three ambient PWA affordances, stacked bottom-centre so they never cover
 * the sticky header or the cart button:
 *
 *  - offline notice (highest priority, it explains why things look stale)
 *  - "a new version is ready" reload
 *  - "add to home screen"
 *
 * Only one shows at a time; an offline user does not need an install pitch.
 */
export function PwaBanners() {
  const online = useOnlineStatus();
  const { updateReady, reload } = useServiceWorkerUpdate();
  const { canInstall, install, dismiss } = useInstallPrompt();

  const shell =
    'fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:inset-x-auto sm:right-4 sm:left-auto';

  if (!online) {
    return (
      <div role="status" className={`${shell} border-[#c8c4b9] bg-[#20231f] text-white`}>
        <WifiOff size={18} className="shrink-0" aria-hidden="true" />
        <p className="text-sm">
          You are offline. Pages you have already visited still work.
        </p>
      </div>
    );
  }

  if (updateReady) {
    return (
      <div role="status" className={`${shell} border-[#c8c4b9] bg-[#fffdf8]`}>
        <RefreshCw size={18} className="shrink-0 text-[#a34f32]" aria-hidden="true" />
        <p className="flex-1 text-sm">A new version of the app is ready.</p>
        <button
          type="button"
          onClick={reload}
          className="shrink-0 rounded-md bg-[#a34f32] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#8b3f25]"
        >
          Reload
        </button>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <div className={`${shell} border-[#c8c4b9] bg-[#fffdf8]`}>
      <Download size={18} className="shrink-0 text-[#a34f32]" aria-hidden="true" />
      <p className="flex-1 text-sm">
        Install GoMyCode Games for faster access and order alerts.
      </p>
      <button
        type="button"
        onClick={install}
        className="shrink-0 rounded-md bg-[#a34f32] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#8b3f25]"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 rounded-md p-1 text-gray-500 transition hover:bg-[#f5f1e8] hover:text-[#20231f]"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
