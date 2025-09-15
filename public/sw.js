// Service Worker per Performance Prime Push Notifications
const CACHE_NAME = 'pp-push-v1';
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HIeFy8gW8Jw3IryPpg4LwDa5LkGv1VJ0lz0QH6BV1kLbM7o1fU0gD8WU';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - gestisce notifiche in arrivo
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Performance Prime',
    body: 'È ora di allenarsi!',
    icon: '/images/logo-pp-transparent.png',
    badge: '/images/logo-pp-transparent.png',
    tag: 'pp-workout-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'start-workout',
        title: 'Inizia Workout',
        icon: '/images/logo-pp-transparent.png'
      },
      {
        action: 'dismiss',
        title: 'Più tardi',
        icon: '/images/logo-pp-transparent.png'
      }
    ]
  };

  // Se il payload contiene dati specifici, usali
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (e) {
      console.log('Error parsing push payload:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'start-workout') {
    // Apri l'app alla pagina workout
    event.waitUntil(
      clients.openWindow('/workout/quick')
    );
  } else if (event.action === 'dismiss') {
    // Chiudi la notifica
    console.log('Notification dismissed');
  } else {
    // Click sulla notifica stessa - apri app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Background sync per inviare analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'pp-notification-analytics') {
    event.waitUntil(sendAnalytics());
  }
});

// Funzione per inviare analytics
async function sendAnalytics() {
  try {
    // Qui potresti inviare analytics al backend
    console.log('Sending notification analytics...');
  } catch (error) {
    console.log('Error sending analytics:', error);
  }
}
