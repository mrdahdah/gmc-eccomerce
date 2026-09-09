// apps/admin/src/pages/Orders.tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, ShoppingBag, UserCircle } from 'lucide-react';
import {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  type AdminOrder,
  type OrderStatus,
} from '../features/orders/ordersApi';
import { Banner, errorMessage, TableScroll } from '../components/ui';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 20;

const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

const STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  PROCESSING: 'bg-sky-100 text-sky-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-zinc-200 text-zinc-700',
  CANCELLED: 'bg-red-100 text-red-800',
};

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONES[status]}`}>
      {status}
    </span>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const [expanded, setExpanded] = useState(false);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const toast = useToast();

  // Only moves the server will accept, so an admin cannot pick a dead end.
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const change = async (status: OrderStatus) => {
    try {
      await updateStatus({ id: order.id, status }).unwrap();
      toast.success(`Order #${order.id.slice(-6).toUpperCase()} is now ${status}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this order.'));
    }
  };

  return (
    <>
      <tr>
        <td>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} items for order ${order.id.slice(-6).toUpperCase()}`}
            className="flex items-center gap-1.5 font-mono text-xs font-bold"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}#
            {order.id.slice(-6).toUpperCase()}
          </button>
        </td>
        <td>
          {order.user ? (
            <div className="flex items-center gap-2">
              <UserCircle size={18} className="shrink-0 text-admin-text/35" />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="truncate text-xs text-admin-text/60">{order.user.email}</p>
              </div>
            </div>
          ) : (
            <span className="text-xs text-admin-text/45">Deleted account</span>
          )}
        </td>
        <td className="whitespace-nowrap text-xs">{new Date(order.createdAt).toLocaleString()}</td>
        <td className="whitespace-nowrap text-xs">
          {itemCount} unit{itemCount === 1 ? '' : 's'}
        </td>
        <td className="whitespace-nowrap font-bold text-primary">{money(order.total)}</td>
        <td>
          <StatusPill status={order.status} />
        </td>
        <td>
          {nextStatuses.length === 0 ? (
            <span className="text-xs text-admin-text/45">Final</span>
          ) : (
            <select
              value=""
              disabled={isUpdating}
              onChange={(e) => e.target.value && change(e.target.value as OrderStatus)}
              aria-label={`Change status of order ${order.id.slice(-6).toUpperCase()}`}
              className="rounded-md border border-admin-border bg-admin-surface px-2 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              <option value="">Move to…</option>
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="bg-admin-bg/60">
            <ul className="divide-y divide-admin-border/60">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-md border border-admin-border object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-admin-border text-admin-text/35">
                      <Package size={14} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm">
                    {/* The product row can be gone if the catalog was cleaned up later. */}
                    {item.product?.name ?? 'Product no longer available'}
                  </span>
                  <span className="whitespace-nowrap text-xs text-admin-text/70">
                    {money(item.unitPrice)} × {item.quantity}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm font-semibold">
                    {money(Number(item.unitPrice) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

export function Orders() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error } = useGetOrdersQuery({
    status,
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const counts = data?.countsByStatus ?? {};
  const allCount = ORDER_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filter = (next: OrderStatus | undefined) => {
    setStatus(next);
    setPage(0); // The old page number is meaningless against a different filter.
  };

  const chipClasses = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active ? 'bg-primary text-white' : 'bg-admin-surface border border-admin-border hover:bg-admin-bg'
    }`;

  return (
    <section>
      <div className="mb-6">
        <p className="eyebrow">Admin / Orders</p>
        <h1 className="font-display text-2xl font-extrabold">Orders</h1>
        <p className="mt-1 text-sm text-admin-text/70">
          Every order placed on the storefront. Status moves follow the documented flow.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => filter(undefined)} className={chipClasses(!status)}>
          All ({allCount})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => filter(s)} className={chipClasses(status === s)}>
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-admin-text/60">Loading orders…</p>
      ) : isError ? (
        <Banner tone="error">
          {errorMessage(error, 'Could not load orders. Check that the API is running.')}
        </Banner>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-admin-border bg-admin-surface p-10 text-center">
          <ShoppingBag size={28} className="mx-auto mb-3 text-admin-text/30" />
          <p className="font-semibold">{status ? `No ${status} orders.` : 'No orders yet.'}</p>
          <p className="mt-1 text-sm text-admin-text/60">
            Orders placed at storefront checkout show up here.
          </p>
        </div>
      ) : (
        <>
          <TableScroll>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </TableScroll>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-admin-text/60">
                Page {page + 1} of {pageCount} · {total} order{total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="rounded-md border border-admin-border px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= pageCount}
                  className="rounded-md border border-admin-border px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
