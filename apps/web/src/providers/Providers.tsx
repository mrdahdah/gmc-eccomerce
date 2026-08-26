'use client';
import { type ReactNode } from 'react';
import { ToastProvider } from './ToastProvider';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
