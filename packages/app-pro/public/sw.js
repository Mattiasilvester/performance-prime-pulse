// Service Worker per notifiche push professionali
// Funziona anche quando l'app è chiusa

const CACHE_NAME = 'pp-push-v1';

// Installazione service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installato');
  self.skipWaiting(); // Attiva immediatamente
});

// Attivazione service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker attivato');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Rimozione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Prendi controllo immediato
});

// Gestione notifiche push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification ricevuta:', event);

  let notificationData = {
    title: 'Nuova notifica',
    body: 'Hai ricevuto una nuova notifica',
    icon: '/images/logo-pp-transparent.png',
    badge: '/images/logo-pp-transparent.png',
    tag: 'professional-notification',
    requireInteraction: false,
    data: {}
  };

  // Se il payload contiene dati, usali
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: notificationData.badge,
        tag: payload.tag || `notification-${payload.id || Date.now()}`,
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {},
        actions: payload.actions || []
      };
    } catch (e) {
      // Se non è JSON, usa come testo
      notificationData.body = event.data.text();
    }
  }

  // Mostra notifica
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: [200, 100, 200], // Vibrazione per mobile
      timestamp: Date.now()
    })
  );
});

// Gestione click su notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click su notifica:', event.notification);

  event.notification.close();

  // Se c'è un'azione, gestiscila
  if (event.action) {
    console.log('[SW] Azione selezionata:', event.action);
    // Qui puoi gestire azioni specifiche (es. "Apri", "Segna come letta")
    return;
  }

  // Apri l'app alla pagina notifiche
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, portala in primo piano
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Se c'è un notification_id nei data, apri direttamente quella notifica
          if (event.notification.data?.notification_id) {
            return client.focus().then(() => {
              // Invia messaggio al client per aprire la notifica specifica
              return client.postMessage({
                type: 'OPEN_NOTIFICATION',
                notificationId: event.notification.data.notification_id
              });
            });
          }
          // Altrimenti apri solo la pagina notifiche
          return client.focus().then(() => {
            return client.navigate('/partner/dashboard?tab=notifications');
          });
        }
      }
      // Se non c'è una finestra aperta, aprine una nuova
      if (clients.openWindow) {
        const url = event.notification.data?.notification_id
          ? `/partner/dashboard?tab=notifications&notification=${event.notification.data.notification_id}`
          : '/partner/dashboard?tab=notifications';
        return clients.openWindow(url);
      }
    })
  );
});

// Gestione messaggi dal client
self.addEventListener('message', (event) => {
  console.log('[SW] Messaggio ricevuto:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
