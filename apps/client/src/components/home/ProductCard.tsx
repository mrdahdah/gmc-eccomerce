import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Product } from '../../features/catalog/catalogApi';
import { useAddItemMutation } from '../../features/cart/cartApi';
import { useAppSelector } from '../../store/hooks';
import { useToast } from '../Toast';

/** Renders the 0–5 rating as filled/empty stars rather than a fixed five-star string. */
function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span aria-label={`Rated ${rating} out of 5`} className="tracking-tight">
      {'★'.repeat(rounded)}
      <span className="text-gray-300">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { id, name, slug, price, compareAtPrice, discountPercent, rating, reviewCount, imageUrl, stock } = product;
  const soldOut = stock === 0;

  const user = useAppSelector((s) => s.auth.user);
  const [addItem, { isLoading }] = useAddItemMutation();
  const toast = useToast();
  const navigate = useNavigate();

  const addToCart = async (event: React.MouseEvent) => {
    // The whole card is a link to the product, so the button must not navigate.
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.info('Sign in to start a cart.');
      navigate('/login');
      return;
    }

    try {
      await addItem({ productId: id, quantity: 1 }).unwrap();
      toast.success(`${name} added to your cart.`);
    } catch (error) {
      const message = (error as { data?: { message?: string | string[] } })?.data?.message;
      toast.error(Array.isArray(message) ? message.join(', ') : (message ?? 'Could not add this to your cart.'));
    }
  };

  return (
    <Link
      to={`/products/${slug}`}
      className="group flex flex-col rounded-lg border border-[#c8c4b9] bg-white p-3 transition hover:shadow-lg sm:p-4"
    >
      <div className="relative mb-4 overflow-hidden rounded-md bg-[#f5f1e8]">
        {discountPercent !== null && (
          <span className="absolute left-2 top-2 z-10 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 z-10 rounded bg-gray-800 px-2 py-1 text-xs font-bold text-white">
            Sold out
          </span>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-48"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center text-sm text-gray-400 sm:h-48">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col text-sm">
        <h3 className="mb-2 line-clamp-2 font-semibold">{name}</h3>
        <div className="mb-2 flex items-center gap-1 text-xs text-[#a34f32]">
          <Stars rating={rating} />
          <span className="text-gray-500">({reviewCount})</span>
        </div>
        <div className="mb-4 mt-auto flex items-center gap-2">
          <span className="text-lg font-bold text-[#a34f32]">${price.toFixed(2)}</span>
          {compareAtPrice !== null && (
            <span className="text-sm text-gray-400 line-through">${compareAtPrice.toFixed(2)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#a34f32] py-2 text-sm font-bold text-white transition hover:bg-[#8b3f25] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {soldOut ? 'Out of stock' : isLoading ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}

/** Matches the card footprint so grids do not jump while data loads. */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#c8c4b9] bg-white p-3 sm:p-4">
      <div className="mb-4 h-36 w-full animate-pulse rounded-md bg-[#e8e4da] sm:h-48" />
      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-[#e8e4da]" />
      <div className="mb-4 h-4 w-1/3 animate-pulse rounded bg-[#e8e4da]" />
      <div className="h-9 w-full animate-pulse rounded-md bg-[#e8e4da]" />
    </div>
  );
}
