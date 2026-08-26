'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import type { Category } from '@/lib/types';

export default function AdminCategories() {
  const { toast } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get<Category[]>('/categories').then(setCats).catch(() => toast('Failed to load categories', 'error'));
  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      await api.post('/categories', { name: name.trim() });
      setName('');
      toast('Category created', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const rename = async (c: Category) => {
    const next = prompt('New name', c.name);
    if (!next) return;
    try {
      await api.patch(`/categories/${c.id}`, { name: next });
      toast('Renamed', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await api.del(`/categories/${c.id}`);
      toast('Deleted', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <>
      <h1 className="section-title">Categories</h1>
      <form className="toolbar" onSubmit={create}>
        <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 260 }} />
        <button className="btn" disabled={busy}>
          Add category
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td className="muted">{c.slug}</td>
              <td>{c.productCount}</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => rename(c)}>
                    Rename
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
