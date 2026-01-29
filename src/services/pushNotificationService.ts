// Servizio per gestire notifiche push professionali
import { supabase } from '@/integrations/supabase/client';

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

// VAPID Public Key (base64 URL-safe)
// NOTA: Questa è una chiave di test generata. Per produzione, genera le tue chiavi VAPID
// usando: npx web-push generate-vapid-keys
// Chiave generata: 2025-01-23
const VAPID_PUBLIC_KEY = 'BJLafKLwCjWph5pDeh6zaAVRrmURBhLUSssTUnpmW_QAFT44ulLMCNM8hXBGkcZUbatGD0XDTRFtiU7DFdY5eE8';
const PERMISSION_KEY = 'pp_push_permission_status';
const SUBSCRIPTION_KEY = 'pp_push_subscription';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Inizializza il service worker
  async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('[Push] Service Worker not supported');
        return false;
      }

      if (!('PushManager' in window)) {
        console.log('[Push] Push messaging not supported');
        return false;
      }

      // Registra il service worker (riabilitato per notifiche push)
      // Usa scope '/' per evitare conflitti con mobile refresh
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[Push] Service Worker registered:', this.registration);
      
      // Attendi che il service worker sia attivo (gestisce tutti i casi)
      if (this.registration.installing) {
        // Service worker in fase di installazione
        await new Promise<void>((resolve) => {
          const installing = this.registration!.installing!;
          
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' || installing.state === 'activated') {
              resolve();
            }
          });
          
          // Se già installato, risolvi immediatamente
          if (installing.state === 'installed' || installing.state === 'activated') {
            resolve();
          }
        });
      } else if (this.registration.waiting) {
        // Service worker in attesa (già installato ma non ancora attivo)
        console.log('[Push] Service Worker in attesa, attivazione...');
        // Il service worker si attiverà automaticamente con skipWaiting()
      } else if (this.registration.active) {
        // Service worker già attivo
        console.log('[Push] Service Worker già attivo');
      }

      return true;
    } catch (error) {
      console.error('[Push] Error registering service worker:', error);
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
  savePermissionStatus(status: PushPermissionStatus): void {
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
        status: permission === 'granted' || permission === 'denied' || permission === 'default' ? permission : 'default',
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
      // Converti VAPID key in Uint8Array
      let applicationServerKey: BufferSource;
      try {
        applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource;
      } catch (keyError) {
        console.error('[Push] Errore conversione VAPID key:', keyError);
        throw new Error('VAPID key non valida. Contatta il supporto tecnico.');
      }

      // Crea subscription push
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

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
  async sendSubscriptionToBackend(subscription: PushSubscription, professionalId: string): Promise<boolean> {
    try {
      if (!professionalId) {
        console.error('[Push] Professional ID mancante');
        return false;
      }

      console.log('[Push] Sending subscription to backend:', { endpoint: subscription.endpoint, professionalId });

      // Ottieni user agent per metadata
      const userAgent = navigator.userAgent;

      // Salva o aggiorna subscription nel database
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            professional_id: professionalId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_agent: userAgent,
            is_active: true,
            last_used_at: new Date().toISOString()
          },
          {
            onConflict: 'endpoint', // Se endpoint esiste già, aggiorna
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[Push] Error saving subscription to database:', error);
        return false;
      }

      console.log('[Push] Subscription saved successfully:', data);
      return true;
    } catch (error) {
      console.error('[Push] Error sending subscription to backend:', error);
      return false;
    }
  }

  // Rimuovi subscription dal backend
  async removeSubscriptionFromBackend(endpoint: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', endpoint);

      if (error) {
        console.error('[Push] Error removing subscription:', error);
        return false;
      }

      console.log('[Push] Subscription removed successfully');
      return true;
    } catch (error) {
      console.error('[Push] Error removing subscription:', error);
      return false;
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    try {
      // Rimuovi eventuali spazi o caratteri non validi
      let base64 = base64String.trim();
      
      // Aggiungi padding se necessario
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      base64 = base64 + padding;
      
      // Converti da base64 URL-safe a base64 standard
      base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decodifica base64
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    } catch (error) {
      console.error('[Push] Errore conversione VAPID key:', error);
      console.error('[Push] Chiave ricevuta:', base64String);
      throw new Error(`VAPID key non valida: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
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
  async clearNotificationData(): Promise<void> {
    // Rimuovi subscription dal backend se esiste
    const savedSubscription = localStorage.getItem(SUBSCRIPTION_KEY);
    if (savedSubscription) {
      try {
        const subscription: PushSubscription = JSON.parse(savedSubscription);
        await this.removeSubscriptionFromBackend(subscription.endpoint);
      } catch (error) {
        console.error('[Push] Error removing subscription during cleanup:', error);
      }
    }

    // Rimuovi subscription dal service worker
    if (this.registration) {
      try {
        const subscription = await this.registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      } catch (error) {
        console.error('[Push] Error unsubscribing from service worker:', error);
      }
    }

    // Pulisci localStorage
    localStorage.removeItem(PERMISSION_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  }

  // Ottieni registration (per uso esterno)
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

export const pushNotificationService = new PushNotificationService();
