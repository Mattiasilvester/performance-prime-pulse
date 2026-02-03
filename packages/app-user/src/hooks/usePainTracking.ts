import { useState, useEffect, useCallback } from 'react';
import {
  getUserPains,
  addPain,
  removePain,
  removeAllPains,
  generatePainCheckMessage,
  generateHappyPainGoneResponse,
  generatePainStillPresentResponse,
  generateAllPainsGoneResponse,
} from '@/services/painTrackingService';
import { PainDetail, PainCheckResult } from '@/types/painTracking.types';

/**
 * Hook React per gestire il tracking dolori dell'utente
 */
export default function usePainTracking(userId: string | null) {
  // State
  const [pains, setPains] = useState<PainDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasPersistentPains, setHasPersistentPains] = useState<boolean>(false);
  const [painCheckMessage, setPainCheckMessage] = useState<string | null>(null);

  /**
   * Carica i dolori dell'utente dal database
   */
  const loadPains = useCallback(async () => {
    if (!userId) {
      setPains([]);
      setLoading(false);
      setHasPersistentPains(false);
      setPainCheckMessage(null);
      return;
    }

    setLoading(true);
    try {
      const result: PainCheckResult = await getUserPains(userId);
      
      setPains(result.pains || []);
      setHasPersistentPains(result.persistentPains?.length > 0 || false);
      
      // Genera messaggio di check se ci sono dolori
      if (result.hasPain && result.pains.length > 0) {
        const message = generatePainCheckMessage(result);
        setPainCheckMessage(message || null);
      } else {
        setPainCheckMessage(null);
      }
    } catch (error) {
      console.error('❌ Errore caricamento dolori:', error);
      setPains([]);
      setHasPersistentPains(false);
      setPainCheckMessage(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Gestisce quando un dolore è passato
   * Rimuove il dolore e ritorna messaggio felice
   */
  const handlePainGone = useCallback(async (zona: string): Promise<string> => {
    if (!userId) {
      console.error('🗑️ BUG 7 DEBUG: userId non disponibile');
      return 'Errore: utente non autenticato';
    }

    try {
      console.log('🗑️ BUG 7 DEBUG: Chiamando removePain per zona:', zona, 'userId:', userId.substring(0, 8) + '...');
      const result = await removePain(userId, zona);
      console.log('🗑️ BUG 7 DEBUG: Risultato removePain:', {
        success: result.success,
        error: result.error,
        updatedPainsCount: result.updatedPains?.length || 0
      });
      
      if (result.success) {
        // Ricarica i dolori aggiornati
        console.log('🗑️ BUG 7 DEBUG: Ricarico dolori dopo rimozione...');
        await loadPains();
        console.log('🗑️ BUG 7 DEBUG: Dolori ricaricati, nuovo count:', result.updatedPains?.length || 0);
        
        // Genera messaggio felice
        return generateHappyPainGoneResponse(zona, result.updatedPains);
      } else {
        console.error('🗑️ BUG 7 DEBUG: removePain fallito:', result.error);
        return `Errore durante la rimozione del dolore: ${result.error || 'Errore sconosciuto'}`;
      }
    } catch (error) {
      console.error('❌ Errore handlePainGone:', error);
      return 'Errore durante la gestione del dolore. Riprova più tardi.';
    }
  }, [userId, loadPains]);

  /**
   * Gestisce quando un dolore è ancora presente
   * Ritorna messaggio empatico
   */
  const handlePainStillPresent = useCallback((zona: string): string => {
    return generatePainStillPresentResponse(zona);
  }, []);

  /**
   * Gestisce quando tutti i dolori sono passati
   * Rimuove tutti i dolori e ritorna messaggio super felice
   */
  const handleAllPainsGone = useCallback(async (): Promise<string> => {
    if (!userId) {
      console.error('🗑️ BUG 7 DEBUG: userId non disponibile');
      return 'Errore: utente non autenticato';
    }

    try {
      console.log('🗑️ BUG 7 DEBUG: Chiamando removeAllPains per userId:', userId.substring(0, 8) + '...');
      const result = await removeAllPains(userId);
      console.log('🗑️ BUG 7 DEBUG: Risultato removeAllPains:', {
        success: result.success,
        error: result.error,
        updatedPainsCount: result.updatedPains?.length || 0
      });
      
      if (result.success) {
        // Ricarica i dolori (saranno vuoti)
        console.log('🗑️ BUG 7 DEBUG: Ricarico dolori dopo rimozione tutti...');
        await loadPains();
        console.log('🗑️ BUG 7 DEBUG: Dolori ricaricati, dovrebbero essere vuoti');
        
        // Genera messaggio super felice
        return generateAllPainsGoneResponse();
      } else {
        console.error('🗑️ BUG 7 DEBUG: removeAllPains fallito:', result.error);
        return `Errore durante la rimozione dei dolori: ${result.error || 'Errore sconosciuto'}`;
      }
    } catch (error) {
      console.error('❌ Errore handleAllPainsGone:', error);
      return 'Errore durante la gestione dei dolori. Riprova più tardi.';
    }
  }, [userId, loadPains]);

  /**
   * Gestisce l'aggiunta di un nuovo dolore
   */
  const handleNewPain = useCallback(async (zona: string, descrizione?: string): Promise<void> => {
    if (!userId) {
      console.error('❌ Errore: utente non autenticato');
      return;
    }

    try {
      const result = await addPain(userId, zona, descrizione, 'chat');
      
      if (result.success) {
        // Ricarica i dolori aggiornati
        await loadPains();
      } else {
        console.error('❌ Errore aggiunta dolore:', result.error);
      }
    } catch (error) {
      console.error('❌ Errore handleNewPain:', error);
    }
  }, [userId, loadPains]);

  /**
   * Ricarica i dolori manualmente
   */
  const refreshPains = useCallback(() => {
    loadPains();
  }, [loadPains]);

  // Carica i dolori quando userId cambia
  useEffect(() => {
    loadPains();
  }, [loadPains]);

  return {
    pains,
    loading,
    hasPersistentPains,
    painCheckMessage,
    handlePainGone,
    handlePainStillPresent,
    handleAllPainsGone,
    handleNewPain,
    refreshPains,
  };
}

