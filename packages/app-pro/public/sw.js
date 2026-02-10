// Service Worker per PrimePro - Push Notifications

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    try {
      const data = event.data.json();
      const payloadData = data.data || {};
      // BUG 2 fix: notifiche/promemoria non silenziosi — explicit silent: false e vibrate
      const options = {
        body: data.body || 'Nuova notifica da PrimePro',
        icon: '/images/logo-pp-no-bg.jpg',
        badge: '/images/logo-pp-no-bg.jpg',
        vibrate: [100, 50, 100],
        silent: false,
        requireInteraction: payloadData.requireInteraction === true,
        data: payloadData,
        tag: data.tag || 'primepro-notification',
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'PrimePro', options)
      );
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
