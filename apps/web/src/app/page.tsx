'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Paginated, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');

  useEffect(() => {
    api
      .get<Paginated<Product>>('/products?limit=8')
      .then((r) => {
        setProducts(r.items);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Next.js storefront</p>
        <h1>
          Shop freely.
          <br />
          No account needed.
        </h1>
        <p className="lede">
          Browse the catalog and check out as a guest — sign in only if you want to track your orders.
        </p>
        <Link className="btn btn-lg" href="/products">
          Browse products
        </Link>
      </section>

      <section>
        <h2 className="section-title">New arrivals</h2>
        {state === 'loading' && <p>Loading…</p>}
        {state === 'error' && <p className="error">Couldn’t load products — is the API running on port 3000?</p>}
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
