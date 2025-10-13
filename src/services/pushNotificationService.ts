// Servizio per gestire notifiche push
export interface PushPermissionStatus {
  status: 'granted' | 'denied' | 'default' | 'not-asked';
  timestamp: number;
  userChoice: 'accepted' | 'declined' | 'postponed' | null;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HIeFy8gW8Jw3IryPpg4LwDa5LkGv1VJ0lz0QH6BV1kLbM7o1fU0gD8WU';
const PERMISSION_KEY = 'pp_push_permission_status';
const SUBSCRIPTION_KEY = 'pp_push_subscription';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Inizializza il service worker
  async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return false;
      }

      if (!('PushManager' in window)) {
        console.log('Push messaging not supported');
        return false;
      }

      // Registra il service worker
      // DISABILITATO PER MOBILE REFRESH FIX
      // this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registration disabled for mobile refresh fix');
      console.log('Service Worker registered:', this.registration);

      return true;
    } catch (error) {
      console.error('Error registering service worker:', error);
      return false;
    }
  }

  // Controlla se le notifiche sono supportate
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Ottieni stato attuale dei permessi
  getPermissionStatus(): PushPermissionStatus {
    const saved = localStorage.getItem(PERMISSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      status: 'not-asked',
      timestamp: 0,
      userChoice: null
    };
  }

  // Salva stato permessi
  private savePermissionStatus(status: PushPermissionStatus): void {
    localStorage.setItem(PERMISSION_KEY, JSON.stringify(status));
  }

  // Controlla se dovremmo chiedere i permessi
  shouldAskPermission(): boolean {
    const status = this.getPermissionStatus();
    
    // Se già concessi o negati, non chiedere
    if (status.status === 'granted' || status.status === 'denied') {
      return false;
    }

    // Se posticipato, chiedi dopo 3 giorni
    if (status.userChoice === 'postponed') {
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      return status.timestamp < threeDaysAgo;
    }

    // Se mai chiesto, chiedi
    return status.status === 'not-asked';
  }

  // Richiedi permessi notifiche
  async requestPermission(): Promise<PushPermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      
      const status: PushPermissionStatus = {
        status: permission as any,
        timestamp: Date.now(),
        userChoice: permission === 'granted' ? 'accepted' : 'declined'
      };

      this.savePermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  // Crea subscription per notifiche
  async createSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not initialized');
    }

    try {
     // ... existing code ...
     const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
    });
// ... existing code ...

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Salva subscription localmente
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(pushSubscription));
      
      return pushSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Ottieni subscription esistente
  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };
    } catch (error) {
      console.error('Error getting existing subscription:', error);
      return null;
    }
  }

  // Invia subscription al backend
  async sendSubscriptionToBackend(subscription: PushSubscription): Promise<boolean> {
    try {
      // Qui implementerai l'invio al backend Supabase
      console.log('Sending subscription to backend:', subscription);
      
      // Placeholder per ora
      return true;
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      return false;
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Pulisci dati notifiche
  clearNotificationData(): void {
    localStorage.removeItem(PERMISSION_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  }
}

export const pushNotificationService = new PushNotificationService();
