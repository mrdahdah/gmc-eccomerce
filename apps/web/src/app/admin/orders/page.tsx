'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import type { Order } from '@/lib/types';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => api.get<Order[]>('/orders/all').then(setOrders).catch(() => toast('Failed to load orders', 'error'));
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (o: Order, status: string) => {
    try {
      await api.patch(`/orders/${o.id}/status`, { status });
      toast('Status updated', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <>
      <h1 className="section-title">Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id.slice(0, 8)}…</td>
                <td>
                  {o.customer}
                  <br />
                  <span className="muted">{o.email}</span>
                </td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td>${o.total.toFixed(2)}</td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
