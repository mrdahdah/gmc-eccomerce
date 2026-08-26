import { useState } from 'react';
import { useGetCategoriesQuery, useGetCategoryProductsQuery } from './categoriesApi';

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useGetCategoriesQuery();
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="content">
      <p className="eyebrow">Catalog</p>
      <h2>Shop by category</h2>

      {isLoading && <p>Loading categories…</p>}
      {isError && <p>Could not load categories. Please try again shortly.</p>}
      {categories && categories.length === 0 && <p>No categories yet.</p>}

      {categories && categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '20px 0' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.slug)}
              style={{
                marginTop: 0,
                background: active === c.slug ? '#20231f' : '#a34f32',
              }}
            >
              {c.name} ({c.productCount})
            </button>
          ))}
        </div>
      )}

      {active && <CategoryProducts slug={active} />}
    </section>
  );
}

function CategoryProducts({ slug }: { slug: string }) {
  const { data: products, isLoading, isError, isFetching } = useGetCategoryProductsQuery(slug);

  if (isLoading || isFetching) return <p>Loading products…</p>;
  if (isError) return <p>Could not load products for this category.</p>;
  if (!products || products.length === 0) return <p>No products in this category yet.</p>;

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {products.map((p) => (
        <article key={p.id} style={{ border: '1px solid #d8d5ca', padding: 16, background: '#fffdf8' }}>
          <strong>{p.name}</strong>
          <p style={{ fontSize: 14, color: '#5c5f56', margin: '6px 0' }}>{p.description}</p>
          <p style={{ fontWeight: 700 }}>${p.price.toFixed(2)}</p>
          <p style={{ fontSize: 12, color: p.stock > 0 ? '#2e7d32' : '#a33' }}>
            {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
          </p>
        </article>
      ))}
    </div>
  );
}
