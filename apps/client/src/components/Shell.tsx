import { useNavigate } from 'react-router-dom';
import { authApi } from '../features/auth/authApi';
import { logout } from '../features/auth/authSlice';
import { ToastHost } from '../features/notifications/ToastHost';
import { useNotificationsSocket } from '../features/notifications/useNotificationsSocket';
import { PwaBanners } from '../features/pwa/PwaBanners';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { UnauthorizedView } from './auth/UnauthorizedView';
import { CategoryNav } from './layout/CategoryNav';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { TopBar } from './layout/TopBar';

export function Shell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  // The server-backed cart lands in a later ticket; until then read the
  // client-only slice defensively so the header badge still works.
  const cartCount = useAppSelector((s) => (s as any).cart?.items?.length ?? 0);

  // Opens one authenticated Socket.IO connection for the logged-in user.
  useNotificationsSocket();

  const signOut = () => {
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
    navigate('/login');
  };

  if (user && user.role === 'ADMIN') {
    return <UnauthorizedView onSignOut={signOut} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        fontFamily: 'var(--font-sans)',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <TopBar />
      <Header user={user} cartCount={cartCount} onSignOut={signOut} />
      <CategoryNav />

      <main style={{ flex: 1 }}>{children}</main>

      <Footer />
      <ToastHost />
      <PwaBanners />
    </div>
  );
}
