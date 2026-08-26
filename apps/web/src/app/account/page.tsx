'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import type { Order } from '@/lib/types';

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');

  useEffect(() => {
    if (!user) return;
    api
      .get<Order[]>('/orders')
      .then((r) => {
        setOrders(r);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [user]);

  if (loading) return <p>Loading…</p>;
  if (!user)
    return (
      <>
        <h1 className="section-title">Account</h1>
        <p>
          Please <Link href="/login">sign in</Link> to see your profile and orders.
        </p>
      </>
    );

  return (
    <>
      <h1 className="section-title">
        {user.firstName} {user.lastName}
      </h1>
      <p className="muted">
        {user.email} · <span className="badge">{user.role}</span>
      </p>

      <h2 className="section-title" style={{ marginTop: 32 }}>
        My orders
      </h2>
      {state === 'loading' && <p>Loading orders…</p>}
      {state === 'error' && <p className="error">Couldn’t load orders.</p>}
      {state === 'ok' && orders.length === 0 && <p>No orders yet.</p>}
      {orders.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Order</th>
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
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td>${o.total.toFixed(2)}</td>
                <td>
                  <span className="badge">{o.status}</span>
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
