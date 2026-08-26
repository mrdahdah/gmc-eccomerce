'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/providers/AuthProvider';

type AdminUser = { id: string; firstName: string; lastName: string; email: string; role: string; createdAt?: string };

export default function AdminUsers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);

  const load = () => api.get<AdminUser[]>('/admin/users').then(setUsers).catch(() => toast('Failed to load users', 'error'));
  useEffect(() => {
    load();
  }, []);

  const remove = async (u: AdminUser) => {
    if (u.id === user?.id) {
      toast("You can't delete your own account", 'error');
      return;
    }
    if (!confirm(`Delete ${u.email}?`)) return;
    try {
      await api.del(`/admin/users/${u.id}`);
      toast('Deleted', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <>
      <h1 className="section-title">Users</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td>
                <span className="badge">{u.role}</span>
              </td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>
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
