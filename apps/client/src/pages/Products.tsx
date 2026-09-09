// apps/client/src/pages/Products.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useGetCategoriesQuery, useGetProductsQuery, type ProductQuery } from '../features/catalog/catalogApi';
import { ProductCard, ProductCardSkeleton } from '../components/home/ProductCard';

const SORTS: { value: NonNullable<ProductQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
];

const PAGE_SIZE = 12;

/** Serves both `/products` and `/category/:slug`; the route param pins the category. */
export function Products() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') as ProductQuery['sort']) ?? 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const [searchDraft, setSearchDraft] = useState(search);
  useEffect(() => setSearchDraft(search), [search]);

  const { data: categories = [] } = useGetCategoriesQuery();
  const activeCategory = categories.find((category) => category.slug === slug);

  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery({
    ...(slug ? { category: slug } : {}),
    ...(search ? { search } : {}),
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const products = data?.items ?? [];
  const pageCount = data?.pageCount ?? 1;

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next);
  };

  const submitSearch = () => patchParams({ q: searchDraft, page: null });

  const title = activeCategory?.name ?? 'All Products';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <header className="mb-6">
        <p className="eyebrow">Catalog</p>
        <h1 className="text-3xl font-bold">
          {activeCategory?.icon ? `${activeCategory.icon} ` : ''}
          {title}
        </h1>
        {activeCategory?.description && <p className="mt-1 text-sm text-gray-600">{activeCategory.description}</p>}
        {data && (
          <p className="mt-1 text-sm text-gray-500">
            {data.total} {data.total === 1 ? 'product' : 'products'}
          </p>
        )}
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
          className="flex flex-1 gap-2"
        >
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              // Explicit, so Enter never depends on implicit form submission.
              if (event.key === 'Enter') {
                event.preventDefault();
                submitSearch();
              }
            }}
            placeholder="Search the catalog…"
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-md border border-[#c8c4b9] bg-white px-3 py-2 text-sm outline-none focus:border-[#a34f32]"
          />
          <button
            type="submit"
            className="rounded-md bg-[#a34f32] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8b3f25]"
          >
            Search
          </button>
        </form>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Sort</span>
          <select
            value={sort}
            onChange={(event) => patchParams({ sort: event.target.value, page: null })}
            className="rounded-md border border-[#c8c4b9] bg-white px-3 py-2 text-sm outline-none focus:border-[#a34f32]"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-12 text-center"
        >
          <AlertTriangle size={28} className="mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-bold text-red-900">The catalog could not be loaded</h2>
          <p className="mt-1 text-sm text-red-800">
            The storefront could not reach the API. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-md bg-[#a34f32] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8b3f25]"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#c8c4b9] bg-white p-12 text-center">
          <h2 className="text-lg font-bold">No products found</h2>
          <p className="mt-1 text-sm text-gray-600">
            {search ? `Nothing matches “${search}”.` : 'This category has no published products yet.'}
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${isFetching ? 'opacity-60' : ''}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => patchParams({ page: String(page - 1) })}
            className="rounded-md border border-[#c8c4b9] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-gray-600">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => patchParams({ page: String(page + 1) })}
            className="rounded-md border border-[#c8c4b9] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
