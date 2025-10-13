import { useState, useEffect } from 'react';

const FILE_ACCESS_KEY = 'performance_prime_file_access_consent';

export const useFileAccess = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Controlla se esiste già un consenso salvato
    const savedConsent = localStorage.getItem(FILE_ACCESS_KEY);
    if (savedConsent !== null) {
      setHasConsent(savedConsent === 'true');
      setShowBanner(false);
    } else {
      // Se non c'è consenso salvato, mostra il banner
      setShowBanner(true);
    }
  }, []);

  const acceptFileAccess = () => {
    localStorage.setItem(FILE_ACCESS_KEY, 'true');
    setHasConsent(true);
    setShowBanner(false);
  };

  const declineFileAccess = () => {
    localStorage.setItem(FILE_ACCESS_KEY, 'false');
    setHasConsent(false);
    setShowBanner(false);
  };

  const resetFileAccess = () => {
    localStorage.removeItem(FILE_ACCESS_KEY);
    setHasConsent(null);
    setShowBanner(true);
  };

  return {
    hasConsent,
    showBanner,
    acceptFileAccess,
    declineFileAccess,
    resetFileAccess,
  };
};
