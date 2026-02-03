// src/hooks/usePartnerNotifications.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@pp/shared';
import { useProfessionalId } from './useProfessionalId';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { notificationSoundService } from '@/services/notificationSoundService';

export interface ProfessionalNotification {
  id: string;
  professional_id: string;
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'new_client' | 'new_project' | 'new_review' | 'review_response' | 'custom';
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePartnerNotificationsReturn {
  notifications: ProfessionalNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function usePartnerNotifications(): UsePartnerNotificationsReturn {
  const professionalId = useProfessionalId();
  const [notifications, setNotifications] = useState<ProfessionalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Ref per gestire subscription e cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifiche dal database
  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (!professionalId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('professional_notifications')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })
        .limit(50); // Limita a 50 notifiche più recenti

      if (fetchError) throw fetchError;

      setNotifications((data as ProfessionalNotification[]) || []);
    } catch (err: unknown) {
      console.error('Errore fetch notifiche:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId]);

  // Funzione helper per verificare preferenze e riprodurre suono
  const checkAndPlayNotificationSound = useCallback(async (notificationType: ProfessionalNotification['type']) => {
    try {
      if (!professionalId) return;

      // Carica preferenze dal database
      const { data: settings } = await supabase
        .from('professional_settings')
        .select('notification_sound_enabled, notification_vibration_enabled')
        .eq('professional_id', professionalId)
        .maybeSingle();

      // Se preferenze non trovate, usa default (abilitato)
      const soundEnabled = settings?.notification_sound_enabled ?? true;
      const vibrationEnabled = settings?.notification_vibration_enabled ?? true;

      // Aggiorna servizio suoni con preferenze
      notificationSoundService.setSoundEnabled(soundEnabled);
      notificationSoundService.setVibrationEnabled(vibrationEnabled);

      // Se suoni o vibrazioni sono abilitati, riproduci
      if (soundEnabled || vibrationEnabled) {
        // Determina tipo suono basato sul tipo notifica
        let soundType: 'default' | 'success' | 'warning' | 'info' = 'default';
        if (notificationType === 'booking_cancelled') {
          soundType = 'warning';
        } else if (notificationType === 'booking_confirmed' || notificationType === 'new_review') {
          soundType = 'success';
        } else {
          soundType = 'info';
        }

        // Riproduci suono e/o vibrazione in base alle preferenze
        if (soundEnabled && vibrationEnabled) {
          await notificationSoundService.playNotification(soundType);
        } else if (soundEnabled) {
          await notificationSoundService.playNotificationSound(soundType);
        } else if (vibrationEnabled) {
          await notificationSoundService.vibrate([200, 50, 100]);
        }
      }
    } catch (error) {
      console.error('[Notifications] Errore riproduzione suono/vibrazione:', error);
      // Non bloccare se fallisce
    }
  }, [professionalId]);

  // Carica notifiche all'avvio e quando cambia professionalId
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup Realtime subscription (solo se professionalId è disponibile)
  useEffect(() => {
    if (!professionalId) {
      // Cleanup se professionalId non è disponibile
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      return;
    }

    // Evita subscription multiple
    if (isSubscribedRef.current) {
      return;
    }

    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 secondi

    const setupSubscription = () => {
      try {
        // Crea channel per questo professionista
        const channel = supabase
          .channel(`notifications:${professionalId}`, {
            config: {
              broadcast: { self: false },
              presence: { key: professionalId }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'professional_notifications',
              filter: `professional_id=eq.${professionalId}`
            },
            (payload) => {
              if (!mounted) return;

              console.log('[REALTIME] Evento notifica:', payload.eventType, payload.new || payload.old);

              // Aggiorna state in base all'evento
              if (payload.eventType === 'INSERT' && payload.new) {
                const newNotification = payload.new as ProfessionalNotification;
                setNotifications(prev => {
                  // Evita duplicati
                  if (prev.some(n => n.id === newNotification.id)) {
                    return prev;
                  }
                  // Aggiungi in cima (più recente)
                  return [newNotification, ...prev].slice(0, 50);
                });

                // Riproduci suono e vibrazione per nuova notifica (solo se non letta)
                if (!newNotification.is_read) {
                  // Verifica preferenze utente dal database (async, non blocca)
                  checkAndPlayNotificationSound(newNotification.type).catch((error) => {
                    console.error('[Notifications] Errore verifica preferenze suono:', error);
                  });
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedNotification = payload.new as ProfessionalNotification;
                setNotifications(prev =>
                  prev.map(n =>
                    n.id === updatedNotification.id ? updatedNotification : n
                  )
                );
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const deletedId = (payload.old as ProfessionalNotification).id;
                setNotifications(prev => prev.filter(n => n.id !== deletedId));
              }
            }
          )
          .subscribe((status) => {
            if (!mounted) return;

            console.log('[REALTIME] Status subscription:', status);

            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              retryCount = 0; // Reset retry count su successo
              console.log('[REALTIME] Subscription attiva per professional_id:', professionalId);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              isSubscribedRef.current = false;
              console.warn('[REALTIME] Errore subscription, tentativo riconnessione...');
              
              // Retry con backoff esponenziale
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
                console.log(`[REALTIME] Retry ${retryCount}/${MAX_RETRIES} tra ${delay}ms`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                  if (mounted && !isSubscribedRef.current) {
                    setupSubscription();
                  }
                }, delay);
              } else {
                console.error('[REALTIME] Max retries raggiunto, fallback a polling');
                // Fallback: refresh periodico ogni 30 secondi (senza loading)
                const fallbackInterval = setInterval(() => {
                  if (mounted && !isSubscribedRef.current) {
                    fetchNotifications(false); // No loading durante polling
                  } else {
                    clearInterval(fallbackInterval);
                  }
                }, 30000);
                
                // Cleanup fallback quando component si smonta
                return () => clearInterval(fallbackInterval);
              }
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('[REALTIME] Errore setup subscription:', err);
        isSubscribedRef.current = false;
        
        // Fallback a polling se subscription fallisce (senza loading)
        const fallbackInterval = setInterval(() => {
          if (mounted) {
            fetchNotifications(false); // No loading durante polling
          } else {
            clearInterval(fallbackInterval);
          }
        }, 30000);
        
        return () => clearInterval(fallbackInterval);
      }
    };

    // Setup iniziale
    setupSubscription();

    // Cleanup quando component si smonta o professionalId cambia
    return () => {
      mounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        isSubscribedRef.current = false;
        console.log('[REALTIME] Subscription cleanup completato');
      }
    };
  }, [professionalId, fetchNotifications, checkAndPlayNotificationSound]);

  // Calcola notifiche non lette
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Marca notifica come letta
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!professionalId) return;

    try {
      const { error: updateError } = await supabase
        .from('professional_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('professional_id', professionalId);

      if (updateError) throw updateError;

      // Aggiorna state locale
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err: unknown) {
      console.error('Errore marcatura notifica come letta:', err);
      throw err;
    }
  }, [professionalId]);

  // Marca tutte come lette
  const markAllAsRead = useCallback(async () => {
    if (!professionalId || unreadCount === 0) return;

    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error: updateError } = await supabase
        .from('professional_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('professional_id', professionalId)
        .in('id', unreadIds);

      if (updateError) throw updateError;

      // Aggiorna state locale
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString()
        }))
      );
    } catch (err: unknown) {
      console.error('Errore marcatura tutte come lette:', err);
      throw err;
    }
  }, [professionalId, notifications, unreadCount]);

  // Rimuovi notifica
  const removeNotification = useCallback(async (notificationId: string) => {
    if (!professionalId) return;

    try {
      const { error: deleteError } = await supabase
        .from('professional_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('professional_id', professionalId);

      if (deleteError) throw deleteError;

      // Aggiorna state locale
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: unknown) {
      console.error('Errore rimozione notifica:', err);
      throw err;
    }
  }, [professionalId]);

  // Refresh notifiche
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications
  };
}
