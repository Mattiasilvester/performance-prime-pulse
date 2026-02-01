import { useState, useLayoutEffect, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { PartnerSidebar } from '@/components/partner/dashboard/PartnerSidebar';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useProfessionalId } from '@/hooks/useProfessionalId';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialExpiredGate } from '@/components/partner/TrialExpiredGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function PartnerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showProfessionalNotFound, setShowProfessionalNotFound] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const professionalId = useProfessionalId();
  const { user, signOut } = useAuth();
  const { subscription, loading, refetch } = useSubscription();

  // Se l'utente è loggato ma dopo il caricamento non c'è un professionista associato, mostra schermata dedicata
  useEffect(() => {
    if (!user?.id) {
      setShowProfessionalNotFound(false);
      return;
    }
    const t = setTimeout(() => {
      setShowProfessionalNotFound(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [user?.id]);

  useEffect(() => {
    if (professionalId != null) setShowProfessionalNotFound(false);
  }, [professionalId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when user/professionalId/refetch change only
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

  // Utente loggato ma nessun profilo professionista (registrazione incompleta o trigger fallito)
  if (user?.id && professionalId == null && showProfessionalNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Professionista non trovato</h1>
          <p className="text-gray-600 text-sm mb-6">
            Il tuo account non è associato a un profilo professionista. Se hai appena completato la registrazione, attendi qualche secondo e ricarica. Altrimenti accedi di nuovo o contatta il supporto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ricarica
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/partner/login')}
              className="flex items-center justify-center gap-2"
            >
              Vai al login
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await signOut?.();
                navigate('/partner/login');
              }}
              className="flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </Button>
          </div>
        </div>
      </div>
    );
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

