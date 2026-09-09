import { Link } from 'react-router-dom';
import { useGetProductsQuery } from '../../features/catalog/catalogApi';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

export function FeaturedSection() {
  // Populated by the "Feature on the home page" switch in the admin product form.
  const { data, isLoading } = useGetProductsQuery({ featured: true, limit: 4, sort: 'rating' });
  const products = data?.items ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trending Games</h2>
        <Link
          to="/products"
          className="rounded-md border border-[#a34f32] px-4 py-2 text-sm font-bold text-[#a34f32] transition hover:bg-[#a34f32] hover:text-white"
        >
          Browse All
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
