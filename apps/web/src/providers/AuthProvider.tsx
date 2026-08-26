'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

type RegisterInput = { firstName: string; lastName: string; email: string; password: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function persistToken(value: string | null) {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem('token', value);
    document.cookie = `token=${value}; path=/; max-age=86400; samesite=lax`;
  } else {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/users/me')
      .then(setUser)
      .catch(() => persistToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    persistToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/admin/auth/login', { email, password });
    persistToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    persistToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, adminLogin, register, logout }}>{children}</Ctx.Provider>
  );
}
