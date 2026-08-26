'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await register(form);
      toast(`Welcome, ${user.firstName}!`, 'success');
      router.push('/account');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="section-title">Create your account</h1>
      <form className="form" onSubmit={submit}>
        <label>
          First name
          <input required value={form.firstName} onChange={set('firstName')} />
        </label>
        <label>
          Last name
          <input required value={form.lastName} onChange={set('lastName')} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={set('email')} />
        </label>
        <label>
          Password
          <input type="password" required minLength={8} value={form.password} onChange={set('password')} />
        </label>
        <button className="btn btn-lg" disabled={busy}>
          {busy ? '…' : 'Create account'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        Already have an account? <Link href="/login">Sign in</Link>.
      </p>
    </>
  );
}
