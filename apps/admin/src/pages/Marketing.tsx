// apps/admin/src/pages/Marketing.tsx
import { useEffect, useState } from 'react';
import { Mail, Megaphone } from 'lucide-react';
import {
  useGetFlashSaleQuery,
  useGetSubscribersQuery,
  useUpdateFlashSaleMutation,
} from '../features/storefront/storefrontApi';
import { Button, Field, Input, Toggle, errorMessage } from '../components/ui';
import { useToast } from '../components/Toast';
import { PushBroadcast } from '../features/notifications/PushBroadcast';

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function Marketing() {
  const { data: flashSale, isLoading } = useGetFlashSaleQuery();
  const [updateFlashSale, { isLoading: isSaving }] = useUpdateFlashSaleMutation();
  const { data: newsletter } = useGetSubscribersQuery();
  const toast = useToast();

  const [enabled, setEnabled] = useState(true);
  const [headline, setHeadline] = useState('Flash Sale');
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => {
    if (!flashSale) return;
    setEnabled(flashSale.enabled);
    setHeadline(flashSale.headline);
    setEndsAt(toLocalInput(flashSale.endsAt));
  }, [flashSale]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateFlashSale({
        enabled,
        headline: headline.trim() || 'Flash Sale',
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }).unwrap();
      toast.success('Flash sale settings saved.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the flash sale settings.'));
    }
  };

  return (
    <section>
      <div className="mb-6">
        <p className="eyebrow">Admin / Marketing</p>
        <h1 className="font-display text-2xl font-extrabold">Marketing</h1>
        <p className="mt-1 text-sm text-admin-text/70">
          The flash sale strip, push announcements, and the newsletter list that the
          storefront feeds into.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Flash sale */}
        <form onSubmit={save} className="space-y-4 rounded-xl border border-admin-border bg-admin-surface p-5">
          <div className="flex items-center gap-2.5 border-b border-admin-border pb-3">
            <span className="flex rounded-lg bg-primary/10 p-2 text-primary">
              <Megaphone size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Flash sale strip</h2>
              <p className="text-xs text-admin-text/60">
                Products appear here automatically when their compare-at price is above their price.
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-admin-text/60">Loading…</p>
          ) : (
            <>
              <Toggle
                checked={enabled}
                onChange={setEnabled}
                label="Show the flash sale section"
                description="Hiding it removes the whole strip from the storefront home page."
              />

              <Field label="Headline">
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60} />
              </Field>

              <Field label="Countdown ends at" hint="Leave blank to show no countdown">
                <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </Field>

              <div className="flex justify-end border-t border-admin-border pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save settings'}
                </Button>
              </div>
            </>
          )}
        </form>

        {/* Newsletter */}
        <div className="rounded-xl border border-admin-border bg-admin-surface p-5">
          <div className="flex items-center gap-2.5 border-b border-admin-border pb-3">
            <span className="flex rounded-lg bg-primary/10 p-2 text-primary">
              <Mail size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Newsletter</h2>
              <p className="text-xs text-admin-text/60">
                {newsletter ? `${newsletter.active} active subscriber(s)` : 'Loading…'}
              </p>
            </div>
          </div>

          {!newsletter || newsletter.subscribers.length === 0 ? (
            <p className="py-8 text-center text-sm text-admin-text/60">No sign-ups yet.</p>
          ) : (
            <ul className="mt-3 max-h-80 divide-y divide-admin-border/60 overflow-y-auto">
              {newsletter.subscribers.map((subscriber) => (
                <li key={subscriber.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{subscriber.email}</p>
                    <p className="text-xs text-admin-text/55">
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                      {subscriber.source ? ` · ${subscriber.source}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      subscriber.unsubscribedAt
                        ? 'bg-zinc-200 text-zinc-600'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {subscriber.unsubscribedAt ? 'Unsubscribed' : 'Active'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <PushBroadcast />
      </div>
    </section>
  );
}
