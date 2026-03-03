
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, FileText, RefreshCw, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/services/analytics';
import { useFileAccess } from '@/hooks/useFileAccess';

const Privacy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const { hasConsent, acceptFileAccess, declineFileAccess, resetFileAccess } = useFileAccess();

  useEffect(() => {
    // Carica stato analytics
    const isEnabled = analytics.isAnalyticsEnabled();
    setAnalyticsEnabled(isEnabled);
    
    // Traccia visualizzazione pagina
    analytics.trackSettings('view', 'privacy');
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simula un salvataggio al server
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Aggiorna stato analytics
      analytics.setEnabled(analyticsEnabled);
      
      // Traccia cambio impostazioni
      analytics.trackSettings('update', 'privacy');
      
      toast({
        title: "Impostazioni privacy salvate con successo.",
        duration: 3000,
      });
      
      // Naviga automaticamente alla pagina precedente dopo il salvataggio
      navigate('/profile');
    } catch (error) {
      toast({
        title: "Errore nel salvataggio delle impostazioni privacy.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyticsToggle = () => {
    setAnalyticsEnabled(!analyticsEnabled);
    
    // Traccia toggle analytics
    analytics.trackUserAction('analytics_toggle', {
      enabled: !analyticsEnabled
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 px-5 pb-32">
      <div className="max-w-md mx-auto w-full pt-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-[#8A8A96] hover:text-[#EEBA2B] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[#F0EDE8]">Privacy</h1>
        </div>
        <p className="text-[13px] text-[#8A8A96]">Analytics, accesso file e documenti</p>
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col gap-6">
        {/* Analytics */}
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-5 w-5 text-[#EEBA2B]" />
            <h3 className="text-base font-bold text-[#F0EDE8]">Plausible Analytics</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#F0EDE8]">Analytics Privacy-Friendly</p>
              <p className="text-[13px] text-[#8A8A96]">Aiutaci a migliorare l'app con dati anonimi</p>
            </div>
            <button
              type="button"
              onClick={handleAnalyticsToggle}
              role="switch"
              aria-checked={analyticsEnabled}
              className={`relative inline-flex shrink-0 items-center p-[2px] transition-colors duration-200 ease-out rounded-full ${
                analyticsEnabled ? 'bg-[#34C759]' : 'bg-[#E9E9EB]'
              }`}
              style={{
                width: 56,
                height: 44,
              }}
            >
              <span
                className={`inline-block rounded-full bg-white transition-transform duration-200 ease-out shrink-0 ${
                  analyticsEnabled ? 'translate-x-[28px]' : 'translate-x-0'
                }`}
                style={{
                  width: 24,
                  height: 24,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
          <div className="text-[13px] text-[#8A8A96] space-y-1 mt-3">
            <p>• Zero cookie di profilazione</p>
            <p>• Dati completamente anonimi</p>
            <p>• GDPR compliant di default</p>
            <p>• Outbound links tracking</p>
            <p>• Script ufficiale Plausible</p>
          </div>
        </div>

        {/* File Access */}
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-[#EEBA2B]" />
            <h3 className="text-base font-bold text-[#F0EDE8]">Accesso ai File</h3>
          </div>
          <div className="mb-3">
            <p className="text-sm font-medium text-[#F0EDE8]">Consenso Accesso File</p>
            <p className="text-[13px] text-[#8A8A96]">
              {hasConsent === true ? 'Consentito - Puoi caricare allegati agli allenamenti' : hasConsent === false ? 'Non consentito - Funzionalità allegati disabilitata' : 'Non ancora deciso'}
            </p>
          </div>
          <div className="text-[13px] text-[#8A8A96] space-y-1 mt-3">
            <p>• Accesso solo ai file selezionati manualmente</p>
            <p>• Nessun accesso automatico al sistema</p>
            <p>• File utilizzati solo per allegati allenamenti</p>
            <p>• Supporta JPEG, PNG e PDF (max 10MB)</p>
          </div>
          <div className="flex gap-2 pt-4">
            {hasConsent === null ? (
              <>
                <Button onClick={acceptFileAccess} className="flex-1 rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0" style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}>
                  Accetta
                </Button>
                <Button onClick={declineFileAccess} className="flex-1 rounded-[14px] py-3 bg-[#1E1E24] text-[#8A8A96] border-0">
                  Rifiuta
                </Button>
              </>
            ) : (
              <Button onClick={resetFileAccess} className="w-full rounded-[14px] py-3 bg-[#1E1E24] text-[#8A8A96] border-0">
                <RefreshCw className="h-4 w-4 mr-2" />
                Cambia Decisione
              </Button>
            )}
          </div>
        </div>

        {/* Documenti */}
        <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-[#EEBA2B]" />
            <h3 className="text-base font-bold text-[#F0EDE8]">Documenti Privacy</h3>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/privacy-policy')} className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0" style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}>
              Informativa sulla privacy
            </Button>
            <Button onClick={() => navigate('/terms-and-conditions')} variant="outline" className="w-full rounded-[14px] py-3 border border-[#EEBA2B] text-[#EEBA2B] bg-transparent hover:bg-[#EEBA2B]/10">
              Termini e condizioni
            </Button>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full rounded-[14px] py-3 font-bold text-[#0A0A0C] border-0 disabled:opacity-50 mb-24"
          style={{ background: 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)' }}
        >
          {isLoading ? 'Salvando...' : 'Salva impostazioni'}
        </Button>
      </div>
    </div>
  );
};

export default Privacy;
