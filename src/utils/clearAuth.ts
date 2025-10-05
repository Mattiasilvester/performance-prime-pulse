// Utility per pulire completamente l'autenticazione
export const clearAllAuth = () => {
  try {
    // Pulisci localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.includes('auth') ||
        key.includes('session')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Pulisci sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.includes('auth') ||
        key.includes('session')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });

    console.log(`🧹 Cleared ${keysToRemove.length} localStorage keys and ${sessionKeysToRemove.length} sessionStorage keys`);
    
    // Forza reload per pulire completamente lo stato
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

// Utility per verificare se ci sono sessioni corrotte
export const hasCorruptedAuth = (): boolean => {
  try {
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        authKeys.push(key);
      }
    }
    
    // Se ci sono più di 2 chiavi auth, probabilmente c'è corruzione
    return authKeys.length > 2;
  } catch {
    return false;
  }
};
