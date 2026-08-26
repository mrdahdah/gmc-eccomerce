'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/types';

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
};

type CartCtx = {
  lines: CartLine[];
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'guest-cart';

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Guest cart lives in localStorage — no account required to shop or buy.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota errors */
    }
  }, [lines, ready]);

  const add = useCallback((product: Product, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((l) => l.productId === product.id);
      if (found) {
        const nextQty = Math.min(found.quantity + qty, product.stock);
        return cur.map((l) => (l.productId === product.id ? { ...l, quantity: nextQty } : l));
      }
      return [
        ...cur,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: Math.min(qty, product.stock),
          stock: product.stock,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((cur) =>
      cur.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(qty, l.stock)) } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((cur) => cur.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
    return { lines, add, setQty, remove, clear, count, subtotal };
  }, [lines, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
