import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { googleProviderClientId } from './features/auth/googleConfig';
import { store } from './store';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import './styles.css';

// Side-effect import: registers the service worker up front, so an
// already-subscribed browser keeps receiving push and the offline shell is
// cached before the user navigates anywhere.
import './features/pwa/serviceWorker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleProviderClientId}>
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
