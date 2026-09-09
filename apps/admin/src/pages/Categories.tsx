// apps/admin/src/pages/Categories.tsx
import { useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from '../features/catalog/catalogApi';
import type { Category } from '../features/catalog/types';
import { Banner, Button, errorMessage, Field, Input, Modal, TableScroll, Textarea, Toggle } from '../components/ui';
import { useToast } from '../components/Toast';

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  imageUrl: '',
  sortOrder: '0',
  isActive: true,
};

function toForm(category: Category): FormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    icon: category.icon ?? '',
    imageUrl: category.imageUrl ?? '',
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  };
}

export function Categories() {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const toast = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm(toForm(category));
    setError('');
    setIsOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const body = {
      name: form.name.trim(),
      // An empty slug lets the API derive one from the name.
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateCategory({ id: editing.id, body }).unwrap();
        toast.success(`Category "${body.name}" updated.`);
      } else {
        await createCategory(body).unwrap();
        toast.success(`Category "${body.name}" created.`);
      }
      setIsOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save the category.'));
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteCategory(category.id).unwrap();
      toast.success(`Category "${category.name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the category.'));
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin / Catalog</p>
          <h1 className="font-display text-2xl font-extrabold">Categories</h1>
          <p className="mt-1 text-sm text-admin-text/70">
            Categories drive the storefront navigation and the category grid on the home page.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New category
        </Button>
      </div>


      {isLoading ? (
        <p className="text-sm text-admin-text/60">Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border bg-admin-surface p-10 text-center">
          <FolderTree size={28} className="mx-auto mb-3 text-admin-text/40" />
          <h2 className="font-display text-base font-bold">No categories yet</h2>
          <p className="mt-1 text-sm text-admin-text/60">
            Create your first category — products cannot be added until one exists.
          </p>
        </div>
      ) : (
        <TableScroll>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{category.icon || '📁'}</span>
                      <div>
                        <div className="font-semibold">{category.name}</div>
                        {category.description && (
                          <div className="max-w-xs truncate text-xs text-admin-text/55">{category.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-admin-text/70">{category.slug}</td>
                  <td>{category.productCount}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        category.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {category.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        className="!bg-admin-card !text-admin-text hover:!bg-admin-border"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(category)} aria-label={`Delete ${category.name}`}>
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
          title={editing ? `Edit ${editing.name}` : 'New category'}
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
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="pc-games" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Icon" hint="Emoji shown in the grid">
                <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="🎮" maxLength={8} />
              </Field>
              <Field label="Sort order" hint="Lower shows first">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value)}
                  step={1}
                />
              </Field>
              <Field label="Image URL">
                <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
              </Field>
            </div>

            <Toggle
              checked={form.isActive}
              onChange={(next) => set('isActive', next)}
              label="Visible on the storefront"
              description="Hidden categories stay in the admin but disappear from the customer app."
            />

            <div className="flex justify-end gap-2 border-t border-admin-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
