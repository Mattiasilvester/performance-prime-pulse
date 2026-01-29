import { useState, useLayoutEffect, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { PartnerSidebar } from '@/components/partner/dashboard/PartnerSidebar';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialExpiredGate } from '@/components/partner/TrialExpiredGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function PartnerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();
  const professionalId = useProfessionalId();
  const { user } = useAuth();
  const { subscription, loading, refetch } = useSubscription();

  // Al primo accesso: crea subscription con trial 90 giorni se non esiste (nessuna carta richiesta)
  useEffect(() => {
    const ensureSubscription = async () => {
      if (!user || !professionalId) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure-partner-subscription`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          await refetch();
        }
      } catch (e) {
        console.warn('[PartnerDashboard] ensure-partner-subscription:', e);
      }
    };
    ensureSubscription();
  }, [user?.id, professionalId, refetch]);

  // Inizializza service worker per notifiche push quando si entra nella dashboard
  useEffect(() => {
    const initPushNotifications = async () => {
      if (professionalId && pushNotificationService.isSupported()) {
        try {
          const initialized = await pushNotificationService.initialize();
          if (initialized) {
            console.log('[PartnerDashboard] Service Worker inizializzato per notifiche push');
          }
        } catch (error) {
          console.error('[PartnerDashboard] Errore inizializzazione push:', error);
        }
      }
    };

    initPushNotifications();
  }, [professionalId]);

  // useLayoutEffect viene eseguito prima del paint, evitando flash visivi
  useLayoutEffect(() => {
    // Salva il background originale del body e html
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    
    // Imposta sfondo chiaro per body e html IMMEDIATAMENTE (doppio check)
    document.body.style.backgroundColor = '#f9fafb'; // gray-50
    document.documentElement.style.backgroundColor = '#f9fafb';
    
    // Aggiungi classi per identificare che siamo nella dashboard partner
    // IMPORTANTE: Questo deve essere fatto PRIMA di qualsiasi altro script
    // per proteggere la sidebar dagli script in index.html
    document.body.classList.add('partner-dashboard-active');
    document.documentElement.classList.add('partner-dashboard-active');
    
    // Imposta isMounted IMMEDIATAMENTE - non serve delay
    // Il layout è gestito completamente via CSS media queries
    setIsMounted(true);
    
    // Cleanup: ripristina quando si esce dalla dashboard
    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.classList.remove('partner-dashboard-active');
      document.documentElement.classList.remove('partner-dashboard-active');
    };
  }, []);

  // Mostra uno sfondo vuoto mentre si carica per evitare flash
  if (!isMounted) {
    return <div className="min-h-[100dvh] bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bottone hamburger mobile - posizionato sopra l'header */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      <div className="flex">
        {/* Sidebar */}
        <PartnerSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath={location.pathname}
        />
        
        {/* Main content con margin-left su desktop */}
        <main
          className="flex-1 min-h-screen bg-gray-50 partner-dashboard-main"
        >
          <TrialExpiredGate subscription={subscription} loading={loading}>
            <div className="p-4 md:p-8">
              <Outlet />
            </div>
          </TrialExpiredGate>
        </main>
      </div>
    </div>
  );
}

