// apps/admin/src/pages/Users.tsx
import { useState } from 'react';
import { ShieldCheck, Trash2, UserCircle } from 'lucide-react';
import { useDeleteUserMutation, useGetUsersQuery } from '../features/auth/authApi';
import { useAppSelector } from '../store/hooks';
import { Banner, errorMessage, TableScroll } from '../components/ui';
import { useToast } from '../components/Toast';

export function Users() {
  const { data, isLoading, error } = useGetUsersQuery({});
  const users: any[] = data?.data ?? [];
  const [deleteUser] = useDeleteUserMutation();
  const me = useAppSelector((s) => s.auth.user);
  const toast = useToast();

  const remove = async (id: string, email: string) => {
    if (!window.confirm(`Delete ${email}? This cannot be undone.`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success(`${email} deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this user.'));
    }
  };

  return (
    <section>
      <div className="mb-6">
        <p className="eyebrow">Admin / Users</p>
        <h1 className="font-display text-2xl font-extrabold">User Management</h1>
        <p className="mt-1 text-sm text-admin-text/70">
          {users.length} account{users.length === 1 ? '' : 's'} registered on the platform.
        </p>
      </div>


      {isLoading ? (
        <p className="text-sm text-admin-text/60">Loading users…</p>
      ) : error ? (
        <Banner tone="error">Could not load users. Check that the API is running.</Banner>
      ) : (
        <TableScroll>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === me?.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <UserCircle size={20} className="shrink-0 text-admin-text/35" />
                        <span className="font-semibold">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="text-admin-text/80">{user.email}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          user.role === 'ADMIN' ? 'bg-primary/12 text-primary' : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {user.role === 'ADMIN' && <ShieldCheck size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {isSelf ? (
                        <span className="text-xs text-admin-text/45">Signed in</span>
                      ) : (
                        <button onClick={() => remove(user.id, user.email)} aria-label={`Delete ${user.email}`}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </section>
  );
}
