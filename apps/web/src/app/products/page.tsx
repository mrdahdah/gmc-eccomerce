'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category, Paginated, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export default function ProductsPage() {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setState('loading');
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    api
      .get<Paginated<Product>>(`/products?${params.toString()}`)
      .then((r) => {
        setData(r);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [search, category, page]);

  return (
    <>
      <h1 className="section-title">Products</h1>
      <div className="toolbar">
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{ maxWidth: 240 }}
        />
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          style={{ maxWidth: 220 }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} ({c.productCount})
            </option>
          ))}
        </select>
      </div>

      {state === 'loading' && <p>Loading…</p>}
      {state === 'error' && <p className="error">Couldn’t load products.</p>}
      {data && data.items.length === 0 && <p>No products match your filters.</p>}

      <div className="grid">
        {data?.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {data && data.pages > 1 && (
        <div className="toolbar" style={{ justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            Page {data.page} / {data.pages}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
}
