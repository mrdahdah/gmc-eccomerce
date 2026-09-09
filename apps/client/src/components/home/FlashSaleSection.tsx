import { useEffect, useState } from 'react';
import { useGetProductsQuery } from '../../features/catalog/catalogApi';
import { useGetFlashSaleQuery } from '../../features/storefront/storefrontApi';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Live countdown to the admin-configured end time. The previous version showed
 * a hardcoded "04:32:15" that never moved.
 */
function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (Number.isNaN(target) || remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex items-center gap-1 font-mono text-sm" aria-label={`Sale ends in ${hours} hours`}>
      <span>Ends in:</span>
      <span className="rounded bg-gray-800 px-2 py-1 text-white">{pad(hours)}</span>:
      <span className="rounded bg-gray-800 px-2 py-1 text-white">{pad(minutes)}</span>:
      <span className="rounded bg-gray-800 px-2 py-1 text-white">{pad(seconds)}</span>
    </div>
  );
}

export function FlashSaleSection() {
  // "On sale" means the admin set a compare-at price above the selling price.
  const { data, isLoading } = useGetProductsQuery({ onSale: true, limit: 4, sort: 'price-asc' });
  const { data: flashSale } = useGetFlashSaleQuery();
  const products = data?.items ?? [];

  if (flashSale && !flashSale.enabled) return null;
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">⚡ {flashSale?.headline ?? 'Flash Sale'}</h2>
        {flashSale?.endsAt && <Countdown endsAt={flashSale.endsAt} />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
