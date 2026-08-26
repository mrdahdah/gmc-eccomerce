import { useState } from 'react';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
  type Category,
} from './categoriesApi';

/** Pull a human-readable message out of an RTK Query error shape. */
function errorMessage(error: unknown): string {
  const data = (error as { data?: { message?: string | string[] } })?.data;
  const msg = data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Something went wrong. Check you are signed in as an admin.';
}

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useGetCategoriesQuery();
  const [createCategory, createState] = useCreateCategoryMutation();
  const [name, setName] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return;
    await createCategory({ name: name.trim() }).unwrap();
    setName('');
  };

  return (
    <section>
      <p className="eyebrow">Admin / Categories</p>
      <h1>Categories</h1>

      <form onSubmit={submit} style={{ display: 'flex', gap: 10, margin: '18px 0' }}>
        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
          style={{ padding: 12, border: '1px solid #c8c4b9', background: '#fffdf8', font: 'inherit' }}
        />
        <button disabled={createState.isLoading} style={{ marginTop: 0 }}>
          {createState.isLoading ? 'Adding…' : 'Add category'}
        </button>
      </form>
      {createState.isError && <p style={{ color: '#a33' }}>{errorMessage(createState.error)}</p>}

      {isLoading && <p>Loading categories…</p>}
      {isError && <p style={{ color: '#a33' }}>Could not load categories.</p>}
      {categories && categories.length === 0 && <p className="todo">No categories yet — add the first one above.</p>}

      {categories && categories.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #d8d5ca' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Slug</th>
              <th style={{ padding: 8 }}>Products</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const [deleteCategory, deleteState] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const save = async () => {
    await updateCategory({ id: category.id, name: name.trim() }).unwrap();
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    await deleteCategory(category.id).unwrap().catch(() => {});
  };

  const error = updateState.isError ? updateState.error : deleteState.isError ? deleteState.error : null;

  return (
    <>
      <tr style={{ borderBottom: '1px solid #e4e1d7' }}>
        <td style={{ padding: 8 }}>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} />
          ) : (
            category.name
          )}
        </td>
        <td style={{ padding: 8, color: '#5c5f56' }}>{category.slug}</td>
        <td style={{ padding: 8 }}>{category.productCount}</td>
        <td style={{ padding: 8, display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button style={{ marginTop: 0 }} disabled={updateState.isLoading} onClick={save}>
                Save
              </button>
              <button style={{ marginTop: 0, background: '#6b6f64' }} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button style={{ marginTop: 0 }} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button style={{ marginTop: 0, background: '#a33' }} disabled={deleteState.isLoading} onClick={remove}>
                Delete
              </button>
            </>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={4} style={{ padding: '4px 8px', color: '#a33' }}>
            {errorMessage(error)}
          </td>
        </tr>
      )}
    </>
  );
}
