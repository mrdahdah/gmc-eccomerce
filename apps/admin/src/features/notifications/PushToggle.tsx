// apps/admin/src/features/notifications/PushToggle.tsx
import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useToast } from '../../components/Toast';
import { currentState, subscribe, unsubscribe, type PushState } from './push';

/**
 * Opts this browser in to web push.
 *
 * Low-stock alerts already reach an open tab over the socket; this is what
 * makes them arrive when the admin has the tab closed.
 */
export function PushToggle() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const toast = useToast();
  const [pushState, setPushState] = useState<PushState>('unsubscribed');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    currentState().then(setPushState);
  }, []);

  const toggle = async () => {
    if (!token) return;
    setBusy(true);
    try {
      if (pushState === 'subscribed') await unsubscribe(token);
      else await subscribe(token);
      const next = await currentState();
      setPushState(next);
      toast.success(
        next === 'subscribed'
          ? 'Low-stock alerts will reach this device.'
          : 'Push alerts turned off for this device.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change your alert setting.');
    } finally {
      setBusy(false);
    }
  };

  const description =
    pushState === 'unsupported'
      ? 'This browser does not support web push.'
      : pushState === 'denied'
        ? 'Notifications are blocked for this site. Re-enable them in your browser settings, then reload.'
        : pushState === 'subscribed'
          ? 'This device receives low-stock and order alerts even with the tab closed.'
          : 'Get low-stock and order alerts on this device, even with the tab closed.';

  return (
    <section className="mt-6 rounded-xl border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              pushState === 'subscribed' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            {pushState === 'subscribed' ? <BellRing size={20} /> : <Bell size={20} />}
          </span>
          <div>
            <h3 className="font-display text-base font-bold">Desktop alerts</h3>
            <p className="mt-0.5 max-w-md text-sm text-admin-text/65">{description}</p>
          </div>
        </div>

        {pushState !== 'unsupported' && pushState !== 'denied' && (
          <button
            type="button"
            onClick={toggle}
            disabled={busy || !token}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 ${
              pushState === 'subscribed'
                ? 'border border-admin-border bg-white text-admin-text hover:bg-admin-card'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : pushState === 'subscribed' ? (
              <BellOff size={14} />
            ) : (
              <Bell size={14} />
            )}
            {pushState === 'subscribed' ? 'Turn off' : 'Enable alerts'}
          </button>
        )}
      </div>
    </section>
  );
}
