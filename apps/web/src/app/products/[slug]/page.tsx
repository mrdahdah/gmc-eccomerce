'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/800';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');
  const { add } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    api
      .get<Product>(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [slug]);

  if (state === 'loading') return <p>Loading…</p>;
  if (state === 'error' || !product)
    return (
      <p className="error">
        Product not found. <Link href="/products">Back to products</Link>
      </p>
    );

  const outOfStock = product.stock <= 0;
  return (
    <div className="detail">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl ?? PLACEHOLDER}
        alt={product.name}
        style={{ width: '100%', borderRadius: 12, border: '1px solid var(--line)' }}
      />
      <div>
        <p className="eyebrow">{product.category?.name}</p>
        <h1>{product.name}</h1>
        <p className="price" style={{ fontSize: 24 }}>
          ${product.price.toFixed(2)}
        </p>
        <p style={{ color: 'var(--body)' }}>{product.description}</p>
        <p className="muted">{outOfStock ? 'Out of stock' : `${product.stock} in stock`}</p>
        <button
          className="btn btn-lg"
          disabled={outOfStock}
          onClick={() => {
            add(product);
            toast(`${product.name} added to cart`, 'success');
          }}
        >
          Add to cart
        </button>
      </div>
      <style>{`.detail{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start}@media(max-width:720px){.detail{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
