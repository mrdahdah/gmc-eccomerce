// apps/admin/src/features/notifications/PushBroadcast.tsx
import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button, Field, Input, Textarea, errorMessage } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { useBroadcastMutation, useGetPushStatusQuery } from './notificationsApi';

/**
 * Sends one web-push announcement to every browser that has opted in.
 *
 * Push is best-effort by nature, so the result is reported honestly: how many
 * devices got it, how many failed, and how many dead subscriptions were
 * dropped. Silently claiming success would be misleading.
 */
export function PushBroadcast() {
  const { data: status, isLoading: isCheckingStatus } = useGetPushStatusQuery();
  const [broadcast, { isLoading: isSending }] = useBroadcastMutation();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/products');

  const pushEnabled = status?.enabled ?? false;
  const canSend = pushEnabled && title.trim().length > 0 && message.trim().length > 0;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await broadcast({
        title: title.trim(),
        message: message.trim(),
        url: url.trim() || undefined,
      }).unwrap();

      if (result.sent === 0 && result.failed === 0) {
        toast.info('Nobody has enabled browser notifications yet, so nothing was sent.');
      } else {
        const failed = result.failed > 0 ? `, ${result.failed} failed` : '';
        const pruned = result.pruned > 0 ? `, ${result.pruned} dead subscription(s) removed` : '';
        toast.success(`Delivered to ${result.sent} device(s)${failed}${pruned}.`);
      }
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the announcement.'));
    }
  };

  return (
    <form onSubmit={send} className="space-y-4 rounded-xl border border-admin-border bg-admin-surface p-5">
      <div className="flex items-center gap-2.5 border-b border-admin-border pb-3">
        <span className="flex rounded-lg bg-primary/10 p-2 text-primary">
          <BellRing size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold">Push announcement</h2>
          <p className="text-xs text-admin-text/60">
            Reaches every customer who turned on browser notifications, even with the tab closed.
          </p>
        </div>
      </div>

      {isCheckingStatus ? (
        <p className="text-sm text-admin-text/60">Loading…</p>
      ) : !pushEnabled ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Web push is switched off: the server has no VAPID keys. Set{' '}
          <code className="font-mono text-xs">VAPID_PUBLIC_KEY</code> and{' '}
          <code className="font-mono text-xs">VAPID_PRIVATE_KEY</code> and restart the API.
        </p>
      ) : (
        <>
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="Flash sale live now"
            />
          </Field>

          <Field label="Message">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Up to 50% off across the catalog for the next 4 hours."
            />
          </Field>

          <Field label="Opens" hint="The storefront path a tap on the notification lands on">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/products" />
          </Field>

          <div className="flex justify-end border-t border-admin-border pt-4">
            <Button type="submit" disabled={!canSend || isSending}>
              {isSending ? 'Sending…' : 'Send to all devices'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
