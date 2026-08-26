'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import type { Category, Paginated, Product } from '@/lib/types';

const EMPTY = { name: '', description: '', price: '', stock: '', categoryId: '', image: '' };

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<Paginated<Product>>('/products?limit=100')
      .then((r) => setProducts(r.items))
      .catch(() => toast('Failed to load products', 'error'));

  useEffect(() => {
    load();
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        categoryId: form.categoryId,
        image: form.image || undefined,
      });
      setForm({ ...EMPTY });
      toast('Product created', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.del(`/products/${p.id}`);
      toast('Deleted', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <>
      <h1 className="section-title">Products</h1>
      <form className="form" onSubmit={create} style={{ maxWidth: 560 }}>
        <input placeholder="Name" required value={form.name} onChange={set('name')} />
        <textarea placeholder="Description" required rows={2} value={form.description} onChange={set('description')} />
        <div className="toolbar" style={{ margin: 0 }}>
          <input placeholder="Price" type="number" step="0.01" required value={form.price} onChange={set('price')} style={{ maxWidth: 120 }} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={set('stock')} style={{ maxWidth: 120 }} />
          <select required value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input placeholder="Image URL or data URI (normalised via Cloudinary)" value={form.image} onChange={set('image')} />
        <button className="btn" disabled={busy}>
          {busy ? 'Saving…' : 'Add product'}
        </button>
      </form>

      <table style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                ) : null}
              </td>
              <td>{p.name}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>{p.category?.name}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
