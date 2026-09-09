import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useGetProductQuery } from '../features/products/productsApi';
import { ProductReviews } from '../features/reviews/ProductReviews';
import { useAddItemMutation } from '../features/cart/cartApi';
import { useAppSelector } from '../store/hooks';
import { useToast } from '../components/Toast';

export function ProductDetail() {
  const { id = '' } = useParams();
  const { data: product, isLoading, isError } = useGetProductQuery(id, { skip: !id });

  const user = useAppSelector((s) => s.auth.user);
  const [addItem, { isLoading: isAdding }] = useAddItemMutation();
  const toast = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return <section className="mx-auto max-w-4xl px-4 py-10">Loading…</section>;
  }
  if (isError || !product) {
    return <section className="mx-auto max-w-4xl px-4 py-10">Product not found.</section>;
  }

  const soldOut = product.stock === 0;
  // The server re-checks stock, but there is no point letting the stepper run
  // past what the catalog says is available.
  const maxQuantity = Math.max(1, Math.min(product.stock, 10));

  const addToCart = async () => {
    if (!user) {
      toast.info('Sign in to start a cart.');
      navigate('/login');
      return;
    }
    try {
      await addItem({ productId: product.id, quantity }).unwrap();
      toast.success(
        quantity === 1
          ? `${product.name} added to your cart.`
          : `${quantity} × ${product.name} added to your cart.`,
      );
    } catch (error) {
      const message = (error as { data?: { message?: string | string[] } })?.data?.message;
      toast.error(
        Array.isArray(message) ? message.join(', ') : (message ?? 'Could not add this to your cart.'),
      );
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <img
          src={product.imageUrl ?? 'https://placehold.co/600x400?text=No+image'}
          alt={product.name}
          className="aspect-square w-full rounded-lg border border-[#c8c4b9] object-cover"
        />
        <div>
          {product.category && (
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-xl font-bold text-[#a34f32] sm:text-2xl">${product.price}</p>
          <p className="mt-4 text-sm text-gray-700">{product.description}</p>
          <p className="mt-4 text-xs text-gray-500">
            {soldOut ? 'Out of stock' : `${product.stock} in stock`}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border border-[#c8c4b9] bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={soldOut || quantity <= 1}
                aria-label="Decrease quantity"
                className="p-2.5 text-gray-600 transition hover:text-[#a34f32] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span aria-live="polite" className="w-10 text-center text-sm font-bold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={soldOut || quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="p-2.5 text-gray-600 transition hover:text-[#a34f32] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={addToCart}
              disabled={soldOut || isAdding}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#a34f32] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#8b3f25] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isAdding ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingCart size={16} aria-hidden="true" />
              )}
              {soldOut ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </section>
  );
}
