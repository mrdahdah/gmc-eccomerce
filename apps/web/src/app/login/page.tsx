'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.firstName}`, 'success');
      router.push('/account');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="section-title">Sign in</h1>
      <form className="form" onSubmit={submit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-lg" disabled={busy}>
          {busy ? '…' : 'Sign in'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        No account? <Link href="/register">Create one</Link> — or just <Link href="/products">shop as a guest</Link>.
      </p>
    </>
  );
}
