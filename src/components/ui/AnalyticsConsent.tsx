import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Shield, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analytics } from '@/services/analytics';

export const AnalyticsConsent = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Mostra banner solo se non è già stata fatta una scelta
    const hasConsent = localStorage.getItem('analytics_consent');
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    analytics.setEnabled(true);
    localStorage.setItem('analytics_consent', 'accepted');
    setShowBanner(false);
    
    // Traccia accettazione
    analytics.track('consent_accepted');
  };

  const handleDecline = () => {
    analytics.setEnabled(false);
    localStorage.setItem('analytics_consent', 'declined');
    setShowBanner(false);
    
    // Traccia rifiuto
    analytics.track('consent_declined');
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[45] bg-surface-primary border-t-2 border-brand-primary p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        <div className="flex-shrink-0">
          <BarChart3 className="h-6 w-6 text-brand-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">
                Miglioriamo la tua esperienza
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                Utilizziamo Plausible Analytics per migliorare Performance Prime. 
                Non raccogliamo dati personali, rispettiamo la tua privacy e tracciamo anche i link esterni. 
                Puoi disabilitare in qualsiasi momento dalle impostazioni.
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleAccept}
              className="bg-brand-primary text-background hover:bg-brand-primary/90"
            >
              Accetta Analytics
            </Button>
            
            <Button
              onClick={handleDecline}
              variant="outline"
              className="border-border-primary text-text-primary hover:bg-surface-secondary"
            >
              Rifiuta
            </Button>
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
            <Shield className="h-3 w-3" />
            <span>GDPR compliant • Zero cookie di profilazione • Outbound links tracking • Open source</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 