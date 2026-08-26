'use client';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/800';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { toast } = useToast();
  const outOfStock = product.stock <= 0;

  return (
    <div className="card">
      <Link href={`/products/${product.slug}`} className="card-img-link">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl ?? PLACEHOLDER} alt={product.name} className="card-img" loading="lazy" />
      </Link>
      <div className="card-body">
        <Link href={`/products/${product.slug}`}>
          <h3 className="card-title">{product.name}</h3>
        </Link>
        <p className="muted">{product.category?.name ?? ''}</p>
        <div className="card-foot">
          <span className="price">${product.price.toFixed(2)}</span>
          <button
            className="btn"
            disabled={outOfStock}
            onClick={() => {
              add(product);
              toast(`${product.name} added to cart`, 'success');
            }}
          >
            {outOfStock ? 'Out of stock' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
