
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, BarChart3, ToggleLeft, ToggleRight, FileText, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/services/analytics';
import { useFileAccess } from '@/hooks/useFileAccess';

const Privacy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        
        <div className="bg-black border-2 border-[#EEBA2B] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-[#EEBA2B] mb-6">Privacy</h2>
          
          <div className="space-y-6">
            {/* Analytics Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-[#EEBA2B]" />
                <h3 className="text-lg font-medium text-white">Plausible Analytics</h3>
              </div>
              
              <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Analytics Privacy-Friendly</p>
                    <p className="text-text-secondary text-sm">
                      Aiutaci a migliorare l'app con dati anonimi
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleAnalyticsToggle}
                    className={`p-2 rounded-full ${
                      analyticsEnabled 
                        ? 'bg-interactive-success text-white' 
                        : 'bg-surface-tertiary text-text-secondary'
                    }`}
                  >
                    {analyticsEnabled ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-text-muted space-y-1">
                  <p>• Zero cookie di profilazione</p>
                  <p>• Dati completamente anonimi</p>
                  <p>• GDPR compliant di default</p>
                  <p>• Outbound links tracking</p>
                  <p>• Script ufficiale Plausible</p>
                </div>
              </div>
            </div>
            
            {/* File Access Consent */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#EEBA2B]" />
                <h3 className="text-lg font-medium text-white">Accesso ai File</h3>
              </div>
              
              <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Consenso Accesso File</p>
                    <p className="text-text-secondary text-sm">
                      {hasConsent === true 
                        ? 'Consentito - Puoi caricare allegati agli allenamenti'
                        : hasConsent === false
                        ? 'Non consentito - Funzionalità allegati disabilitata'
                        : 'Non ancora deciso'
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleAnalyticsToggle}
                    className={`p-2 rounded-full ${
                      hasConsent === true
                        ? 'bg-interactive-success text-white' 
                        : 'bg-surface-tertiary text-text-secondary'
                    }`}
                  >
                    {hasConsent === true ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-text-muted space-y-1">
                  <p>• Accesso solo ai file selezionati manualmente</p>
                  <p>• Nessun accesso automatico al sistema</p>
                  <p>• File utilizzati solo per allegati allenamenti</p>
                  <p>• Supporta JPEG, PNG e PDF (max 10MB)</p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  {hasConsent === null ? (
                    <>
                      <Button
                        onClick={acceptFileAccess}
                        className="flex-1 bg-[#EEBA2B] hover:bg-[#d4a61a] text-black text-sm"
                      >
                        Accetta
                      </Button>
                      <Button
                        onClick={declineFileAccess}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                      >
                        Rifiuta
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={resetFileAccess}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Cambia Decisione
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Privacy Policy Link */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#EEBA2B]" />
                <h3 className="text-lg font-medium text-white">Documenti Privacy</h3>
              </div>
              
              <Button
                onClick={() => navigate('/settings/privacy-policy')}
                className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black"
              >
                Informativa sulla privacy
              </Button>
            </div>
            
            {/* Save Button */}
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-[#EEBA2B] hover:bg-[#d4a61a] text-black disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salva impostazioni'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
