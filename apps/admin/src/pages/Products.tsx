// apps/admin/src/pages/Products.tsx
import { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
} from '../features/catalog/catalogApi';
import type { Product } from '../features/catalog/types';
import { Banner, Button, errorMessage, Field, Input, Modal, Select, TableScroll, Textarea, Toggle } from '../components/ui';
import { useToast } from '../components/Toast';

interface FormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  imageUrl: string;
  stock: string;
  rating: string;
  reviewCount: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compareAtPrice: '',
  imageUrl: '',
  stock: '0',
  rating: '0',
  reviewCount: '0',
  categoryId: '',
  isFeatured: false,
  isActive: true,
};

function toForm(product: Product): FormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice === null ? '' : String(product.compareAtPrice),
    imageUrl: product.imageUrl ?? '',
    stock: String(product.stock),
    rating: String(product.rating),
    reviewCount: String(product.reviewCount),
    categoryId: product.categoryId,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
}

const money = (value: number) => `$${value.toFixed(2)}`;

export function Products() {
  const { data: products = [], isLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const toast = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const visible = useMemo(
    () => (categoryFilter ? products.filter((product) => product.categoryId === categoryFilter) : products),
    [products, categoryFilter],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setError('');
    setIsOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(toForm(product));
    setError('');
    setIsOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const body = {
      name: form.name.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      description: form.description.trim(),
      price: Number(form.price),
      // An empty compare-at price clears the discount badge.
      compareAtPrice: form.compareAtPrice.trim() === '' ? null : Number(form.compareAtPrice),
      imageUrl: form.imageUrl.trim() || undefined,
      stock: Number(form.stock) || 0,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      categoryId: form.categoryId,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateProduct({ id: editing.id, body }).unwrap();
        toast.success(`Product "${body.name}" updated.`);
      } else {
        await createProduct(body).unwrap();
        toast.success(`Product "${body.name}" created.`);
      }
      setIsOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save the product.'));
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteProduct(product.id).unwrap();
      toast.success(`Product "${product.name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the product.'));
    }
  };

  const noCategories = categories.length === 0;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin / Catalog</p>
          <h1 className="font-display text-2xl font-extrabold">Products</h1>
          <p className="mt-1 text-sm text-admin-text/70">
            Names, prices, stock and imagery all publish straight to the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="!w-auto"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          )}
          <Button onClick={openCreate} disabled={noCategories}>
            <Plus size={16} /> New product
          </Button>
        </div>
      </div>

      {noCategories && !isLoading && (
        <Banner tone="error">Create a category first — every product must belong to one.</Banner>
      )}

      {isLoading ? (
        <p className="text-sm text-admin-text/60">Loading products…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border bg-admin-surface p-10 text-center">
          <Package size={28} className="mx-auto mb-3 text-admin-text/40" />
          <h2 className="font-display text-base font-bold">
            {products.length === 0 ? 'No products yet' : 'Nothing in this category'}
          </h2>
          <p className="mt-1 text-sm text-admin-text/60">
            {products.length === 0
              ? 'Add your first product and it appears on the storefront immediately.'
              : 'Pick another category or clear the filter.'}
          </p>
        </div>
      ) : (
        <TableScroll>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-md border border-admin-border object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-admin-border bg-admin-card text-admin-text/40">
                          <Package size={16} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{product.name}</div>
                        <div className="font-mono text-xs text-admin-text/55">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="whitespace-nowrap">
                      {product.category.icon} {product.category.name}
                    </span>
                  </td>
                  <td>
                    <div className="whitespace-nowrap font-semibold">{money(product.price)}</div>
                    {product.compareAtPrice !== null && (
                      <div className="text-xs text-admin-text/50">
                        <s>{money(product.compareAtPrice)}</s>{' '}
                        <span className="font-bold text-primary">-{product.discountPercent}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={product.stock === 0 ? 'font-bold text-danger' : ''}>{product.stock}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {product.isActive ? 'Live' : 'Hidden'}
                      </span>
                      {product.isFeatured && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="!bg-admin-card !text-admin-text hover:!bg-admin-border"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(product)} aria-label={`Delete ${product.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      {isOpen && (
        <Modal
          title={editing ? `Edit ${editing.name}` : 'New product'}
          subtitle="Everything here is live on the storefront as soon as you save."
          onClose={() => setIsOpen(false)}
        >
          <form onSubmit={submit} className="space-y-4">
            {error && <Banner tone="error">{error}</Banner>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required minLength={2} />
              </Field>
              <Field label="Slug" hint="Leave blank to generate it from the name">
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} />
              </Field>
            </div>

            <Field label="Description" required>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  required
                />
              </Field>
              <Field label="Compare-at price" hint="Must exceed the price">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Stock">
                <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" required>
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Rating" hint="0 to 5">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => set('rating', e.target.value)}
                />
              </Field>
              <Field label="Review count">
                <Input
                  type="number"
                  min="0"
                  value={form.reviewCount}
                  onChange={(e) => set('reviewCount', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Image URL">
              <Input
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://images.unsplash.com/…"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                checked={form.isActive}
                onChange={(next) => set('isActive', next)}
                label="Live on the storefront"
                description="Hidden products stay in the admin only."
              />
              <Toggle
                checked={form.isFeatured}
                onChange={(next) => set('isFeatured', next)}
                label="Feature on the home page"
                description="Shows in the Trending row."
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-admin-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
