'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Order } from '@/lib/types';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  if (order) {
    return (
      <>
        <h1 className="section-title">Order confirmed 🎉</h1>
        <p>
          Thanks{order.customer ? `, ${order.customer}` : ''}! Order <strong>{order.id}</strong> for{' '}
          <strong>${order.total.toFixed(2)}</strong> is <span className="badge">{order.status}</span>.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link className="btn" href="/products">
            Keep shopping
          </Link>
        </p>
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        <h1 className="section-title">Checkout</h1>
        <p>
          Your cart is empty. <Link href="/products">Browse products</Link>.
        </p>
      </>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const result = await api.post<Order>('/orders/checkout', {
        email,
        firstName,
        lastName,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      setOrder(result);
      clear();
      toast('Order placed!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <h1 className="section-title">Checkout</h1>
      <p className="muted">No account required — just your email.</p>
      <form className="form" onSubmit={submit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          First name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <div className="summary">
          <span>Total</span>
          <strong>${subtotal.toFixed(2)}</strong>
        </div>
        <button className="btn btn-lg" disabled={placing}>
          {placing ? 'Placing…' : 'Place order'}
        </button>
      </form>
    </>
  );
}
