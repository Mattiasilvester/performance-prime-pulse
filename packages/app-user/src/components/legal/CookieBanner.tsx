import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Sempre true, non modificabile
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Controlla se l'utente ha già dato il consenso
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Mostra il banner dopo un breve delay per UX migliore
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);

    // Attiva/disattiva cookie in base alle preferenze (es. Google Analytics se analytics === true)
    if (prefs.analytics) {
      // Qui si può abilitare Google Analytics o altri script analitici
      window.dispatchEvent(new CustomEvent('cookieConsentAnalytics', { detail: { enabled: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('cookieConsentAnalytics', { detail: { enabled: false } }));
    }
  };

  const acceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Overlay - pointer-events-auto per cliccare solo sul banner */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" aria-hidden="true" />

      {/* Banner */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg mx-0 sm:mx-4 p-6 shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🍪</span>
            <h2 className="text-lg font-semibold text-white">Utilizziamo i Cookie</h2>
          </div>
        </div>

        {!showSettings ? (
          <>
            {/* Descrizione base */}
            <p className="text-gray-300 text-sm mb-6">
              Utilizziamo cookie tecnici necessari per il funzionamento del sito e, con il tuo consenso, cookie analitici per migliorare i nostri servizi.
              <Link to="/partner/cookies" className="text-[#EEBA2B] hover:underline ml-1">
                Leggi la Cookie Policy
              </Link>
            </p>

            {/* Bottoni principali */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 bg-[#EEBA2B] hover:bg-[#d4a826] text-black font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Accetta tutti
              </button>
              <button
                type="button"
                onClick={acceptNecessary}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Solo necessari
              </button>
            </div>

            {/* Link personalizza */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="w-full mt-3 text-gray-400 hover:text-white text-sm underline transition-colors"
            >
              Personalizza le preferenze
            </button>
          </>
        ) : (
          <>
            {/* Impostazioni dettagliate */}
            <div className="space-y-4 mb-6">
              {/* Cookie necessari */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Cookie Necessari</p>
                  <p className="text-gray-400 text-xs">Essenziali per il funzionamento</p>
                </div>
                <div className="bg-[#EEBA2B] text-black text-xs font-semibold px-2 py-1 rounded">
                  Sempre attivi
                </div>
              </div>

              {/* Cookie analytics */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Cookie Analitici</p>
                  <p className="text-gray-400 text-xs">Ci aiutano a migliorare il servizio</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Abilita cookie analitici"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EEBA2B]" />
                </label>
              </div>

              {/* Cookie marketing */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Cookie Marketing</p>
                  <p className="text-gray-400 text-xs">Per pubblicità personalizzata</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Abilita cookie marketing"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EEBA2B]" />
                </label>
              </div>
            </div>

            {/* Bottoni impostazioni */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={saveCustom}
                className="flex-1 bg-[#EEBA2B] hover:bg-[#d4a826] text-black font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Salva preferenze
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Indietro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;
