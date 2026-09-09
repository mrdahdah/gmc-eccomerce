import { useState } from 'react';
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from '../features/notifications/notificationsApi';
import { PushToggle } from '../features/notifications/PushToggle';

export function Notifications() {
  const [take, setTake] = useState(20);
  const { data: page, isFetching } = useGetNotificationsQuery({ take });
  const [markRead] = useMarkReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  return (
    <section>
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Operations</span>
          <h2 className="text-2xl font-bold text-text mt-1">Notifications</h2>
        </div>
        <button
          onClick={() => markAllRead()}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover"
        >
          Mark all read
        </button>
      </div>

      <PushToggle />

      {!page?.items.length && !isFetching && (
        <p className="mt-6 text-sm text-gray-500">No notifications yet.</p>
      )}

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {page?.items.map((n) => (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-4 py-4 ${n.readAt ? 'opacity-60' : ''}`}
          >
            <div>
              <div className="flex items-center gap-2">
                {!n.readAt && <span className="h-2 w-2 rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-text">{n.title}</span>
                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                  {n.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{n.message}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.readAt && (
              <button
                onClick={() => markRead(n.id)}
                className="shrink-0 text-xs text-primary hover:underline"
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>

      {page && page.items.length < page.total && (
        <button
          onClick={() => setTake((t) => t + 20)}
          className="mt-4 text-xs text-primary hover:underline"
        >
          {isFetching ? 'Loading…' : 'Load older'}
        </button>
      )}
    </section>
  );
}
