import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The app previously registered a cache-first Service Worker that could serve a
// stale SPA shell/assets and leave production on a blank screen. Do not register
// a Service Worker until offline caching is re-designed around hashed assets.
// Clear any legacy registrations/caches once, before React mounts.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  }).catch(() => {
    // Cache cleanup is best-effort and must never block application startup.
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('SOM root element is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
