// Production bootstrap entry. This module intentionally delays React until any
// legacy Service Worker/cache from older mobile sessions has been removed.
const cleanupKey = 'som-legacy-sw-cleanup-v5';

async function cleanupLegacyWorker() {
  try {
    const registrations = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistrations()
      : [];
    const hadController = Boolean(navigator.serviceWorker?.controller);
    const hadRegistration = registrations.length > 0;

    if (registrations.length) {
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }

    const reloadCount = Number(sessionStorage.getItem(cleanupKey) || '0');
    if ((hadController || hadRegistration) && reloadCount < 2) {
      sessionStorage.setItem(cleanupKey, String(reloadCount + 1));
      location.reload();
      return false;
    }
    sessionStorage.removeItem(cleanupKey);
  } catch (_) {
    // Restricted/custom-tab browsers may reject SW/cache APIs. Continue with the
    // current bundle instead of blocking application startup.
  }
  return true;
}

cleanupLegacyWorker().then((shouldStart) => {
  if (shouldStart) {
    void import('./main');
  }
}).catch(() => {
  // The global bootstrap guard in index.html will surface any fatal startup error.
});
