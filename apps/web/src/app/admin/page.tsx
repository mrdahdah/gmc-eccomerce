'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category, Order, Paginated, Product, User } from '@/lib/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0, users: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      api.get<Paginated<Product>>('/products?limit=1').then((r) => r.total).catch(() => 0),
      api.get<Category[]>('/categories').then((r) => r.length).catch(() => 0),
      api.get<Order[]>('/orders/all').catch(() => [] as Order[]),
      api.get<User[]>('/admin/users').then((r) => r.length).catch(() => 0),
    ]).then(([products, categories, orders, users]) => {
      setStats({
        products,
        categories,
        orders: orders.length,
        users,
        revenue: orders.reduce((s, o) => s + o.total, 0),
      });
    });
  }, []);

  const cards = [
    { label: 'Products', value: String(stats.products) },
    { label: 'Categories', value: String(stats.categories) },
    { label: 'Orders', value: String(stats.orders) },
    { label: 'Customers', value: String(stats.users) },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}` },
  ];

  return (
    <>
      <h1 className="section-title">Dashboard</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
        {cards.map((c) => (
          <div key={c.label} className="card" style={{ padding: 18 }}>
            <p className="muted">{c.label}</p>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 30, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
