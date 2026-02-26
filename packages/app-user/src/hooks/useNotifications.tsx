/* eslint-disable react-refresh/only-export-components -- Notifications context exports hook and provider */
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from './useAuth';

// Interfaccia per le notifiche
export interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
  userId?: string; // Per associare notifiche all'utente
}

// Interfaccia per il context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  clearAllNotifications: () => void;
  isLoading: boolean;
}

// Chiave per localStorage
const NOTIFICATIONS_STORAGE_KEY = 'performance_prime_notifications';

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook per usare il context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Provider component
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carica notifiche dal localStorage
  const loadNotifications = useCallback(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtra per utente se necessario
        const userNotifications = user 
          ? parsed.filter((n: Notification) => !n.userId || n.userId === user.id)
          : parsed;
        setNotifications(userNotifications);
      } else {
        // Notifiche di default per demo
        const defaultNotifications: Notification[] = [
          { id: 1, message: "Nuovo allenamento disponibile", time: "2 ore fa", read: false },
          { id: 2, message: "Ricordati di completare il tuo obiettivo settimanale", time: "1 giorno fa", read: false },
          { id: 3, message: "Il tuo piano è stato aggiornato", time: "2 giorni fa", read: false }
        ];
        setNotifications(defaultNotifications);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(defaultNotifications));
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Salva notifiche nel localStorage
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (error) {
      // Errore nel salvataggio notifiche
    }
  }, []);

  // Carica notifiche all'avvio e quando cambia l'utente
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Calcola notifiche non lette
  const unreadCount = notifications.filter(n => !n.read).length;

  // Aggiungi notifica (functional update per evitare dipendenza da notifications)
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      userId: user?.id
    };
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      saveNotifications(updated);
      return updated;
    });
  }, [user, saveNotifications]);

  // Segna come letta
  const markAsRead = useCallback((id: number) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id 
        ? { ...notification, read: true }
        : notification
    );
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Segna tutte come lette
  const markAllAsRead = useCallback(() => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Rimuovi notifica
  const removeNotification = useCallback((id: number) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  }, [notifications, saveNotifications]);

  // Cancella tutte le notifiche
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  // Sincronizza con backend (opzionale)
  const syncWithBackend = useCallback(async () => {
    if (!user) return;
    
    try {
      // Qui puoi implementare la sincronizzazione con Supabase o altro backend
      // Per ora usiamo solo localStorage
      
      // Esempio di chiamata API (da implementare)
      // const { data, error } = await supabase
      //   .from('notifications')
      //   .upsert(notifications.map(n => ({ ...n, user_id: user.id })));
      
    } catch (error) {
      // Errore sincronizzazione notifiche
    }
  }, [user]);

  // Sincronizza quando cambiano le notifiche
  useEffect(() => {
    if (user && notifications.length > 0) {
      syncWithBackend();
    }
  }, [notifications, user, syncWithBackend]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    isLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
