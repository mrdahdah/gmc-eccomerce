'use client';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          ATELIER / SHOP
        </Link>
        <nav className="nav">
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart{count > 0 ? ` (${count})` : ''}</Link>
          {user ? (
            <>
              {user.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
              <Link href="/account">Account</Link>
              <button className="link-btn" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
