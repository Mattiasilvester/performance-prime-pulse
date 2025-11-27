// =====================================================
// SERVICE: Pain Tracking per PrimeBot
// Data: 27 Novembre 2025
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { 
  PainDetail, 
  PainCheckResult, 
  PainUpdateResult,
  daysSince,
  isPainPersistent,
  PAIN_WARNING_THRESHOLD_DAYS,
  getZoneLabel,
  getRandomHappyEmoji,
  formatTimeAgo
} from '@/types/painTracking.types';
import { detectBodyPartFromMessage } from '@/data/bodyPartExclusions';

// ─────────────────────────────────────────────────────
// GET: Recupera tutti i dolori dell'utente
// ─────────────────────────────────────────────────────
export async function getUserPains(userId: string): Promise<PainCheckResult> {
  try {
    // ⭐ FIX 3: Recupera anche ha_limitazioni per controllo
    const { data, error } = await supabase
      .from('user_onboarding_responses')
      .select('zone_dolori_dettagli, zone_evitare, limitazioni_fisiche, ha_limitazioni, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Errore recupero dolori:', error);
      return { hasPain: false, pains: [], oldestPain: null, persistentPains: [], totalPains: 0, painOverTwoMonths: [] };
    }

    let pains: PainDetail[] = [];

    // Prima: dolori dettagliati (nuovo sistema)
    const zoneDoloriDettagli = data?.zone_dolori_dettagli;
    console.log('🔍 getUserPains - zone_dolori_dettagli:', zoneDoloriDettagli);
    
    if (zoneDoloriDettagli && Array.isArray(zoneDoloriDettagli) && zoneDoloriDettagli.length > 0) {
      pains = zoneDoloriDettagli as PainDetail[];
    }

    // Poi: zone_evitare vecchio (retrocompatibilità)
    if (data?.zone_evitare && Array.isArray(data.zone_evitare)) {
      const existingZones = pains.map(p => p.zona.toLowerCase());
      const legacyPains = (data.zone_evitare as string[])
        .filter((z: string) => !existingZones.includes(z.toLowerCase()))
        .map((z: string) => ({
          zona: z,
          aggiunto_il: new Date().toISOString().split('T')[0],
          descrizione: null,
          fonte: 'onboarding' as const
        }));
      pains = [...pains, ...legacyPains];
    }

    // ⭐ FIX 3: Controlla ha_limitazioni PRIMA del fallback
    const haLimitazioni = data?.ha_limitazioni === true;
    const limitazioniFisiche = data?.limitazioni_fisiche;
    console.log('🔍 getUserPains - limitazioni_fisiche:', limitazioniFisiche);
    console.log('🔍 getUserPains - ha_limitazioni:', haLimitazioni);
    
    // ⭐ FIX 3: FALLBACK - Solo se ha_limitazioni = true E zone_dolori_dettagli è vuoto
    // Se ha_limitazioni è false o null, NON entrare nel fallback
    if (!haLimitazioni) {
      console.log('🧹 FIX 3: ha_limitazioni = false/null, ignoro fallback limitazioni_fisiche');
    } else if (pains.length === 0 && haLimitazioni === true && limitazioniFisiche && typeof limitazioniFisiche === 'string' && limitazioniFisiche.trim().length > 0) {
      console.log('🔄 FIX 3: Fallback attivo - ha_limitazioni = true, leggo da limitazioni_fisiche');
      // Estrai zona del corpo dal testo usando detectBodyPartFromMessage
      const detectedZona = detectBodyPartFromMessage(limitazioniFisiche);
      
      if (detectedZona) {
        // Verifica che questa zona non sia già presente
        const existingZones = pains.map(p => p.zona.toLowerCase());
        if (!existingZones.includes(detectedZona.toLowerCase())) {
          const painDetail: PainDetail = {
            zona: detectedZona,
            aggiunto_il: data.created_at 
              ? new Date(data.created_at).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            descrizione: limitazioniFisiche.trim(),
            fonte: 'onboarding' as const
          };
          pains.push(painDetail);
          console.log('✅ getUserPains - Dolore estratto da limitazioni_fisiche:', painDetail);
        }
      } else {
        console.warn('⚠️ getUserPains - Nessuna zona rilevata in limitazioni_fisiche:', limitazioniFisiche);
      }
    }

    // Ordina per data (più vecchio prima)
    pains.sort((a, b) => new Date(a.aggiunto_il).getTime() - new Date(b.aggiunto_il).getTime());

    // Dolori che persistono da più di 2 settimane (suggerire consulto medico)
    const persistentPains = pains.filter(p => isPainPersistent(p.aggiunto_il));

    console.log('🔍 getUserPains - pains trovati:', pains);
    console.log(`📋 Dolori utente ${userId}:`, pains.length > 0 ? pains : 'nessuno');

    return {
      hasPain: pains.length > 0,
      pains,
      oldestPain: pains.length > 0 ? pains[0] : null,
      persistentPains,
      totalPains: pains.length,
      // Campo legacy per retrocompatibilità
      painOverTwoMonths: persistentPains
    };
  } catch (err) {
    console.error('❌ Errore getUserPains:', err);
    return { hasPain: false, pains: [], oldestPain: null, persistentPains: [], totalPains: 0, painOverTwoMonths: [] };
  }
}

// ─────────────────────────────────────────────────────
// ADD: Aggiunge un nuovo dolore
// ─────────────────────────────────────────────────────
export async function addPain(
  userId: string, 
  zona: string, 
  descrizione?: string,
  fonte: 'onboarding' | 'chat' = 'chat'
): Promise<PainUpdateResult> {
  try {
    // Normalizza zona
    const normalizedZona = detectBodyPartFromMessage(zona) || zona.toLowerCase();
    
    // Recupera dolori esistenti
    const { pains } = await getUserPains(userId);
    
    // Controlla se zona già presente
    if (pains.some(p => p.zona.toLowerCase() === normalizedZona)) {
      console.log(`⚠️ Dolore ${normalizedZona} già presente per utente ${userId}`);
      return { success: true, updatedPains: pains };
    }
    // Crea nuovo dolore
    const newPain: PainDetail = {
      zona: normalizedZona,
      aggiunto_il: new Date().toISOString().split('T')[0],
      descrizione: descrizione || null,
      fonte
    };
    const updatedPains = [...pains, newPain];
    // Salva nel database
    const { error } = await supabase
      .from('user_onboarding_responses')
      .upsert({
        user_id: userId,
        zone_dolori_dettagli: updatedPains,
        zone_evitare: updatedPains.map(p => p.zona),
        ha_limitazioni: true,
        last_modified_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    if (error) {
      console.error('❌ Errore salvataggio dolore:', error);
      return { success: false, error: error.message, updatedPains: pains };
    }
    console.log(`✅ Dolore aggiunto: ${normalizedZona} per utente ${userId}`);
    return { success: true, updatedPains };
  } catch (err) {
    console.error('❌ Errore addPain:', err);
    return { success: false, error: String(err), updatedPains: [] };
  }
}

// ─────────────────────────────────────────────────────
// REMOVE: Rimuove un dolore (è passato!)
// ─────────────────────────────────────────────────────
export async function removePain(userId: string, zona: string): Promise<PainUpdateResult> {
  try {
    const normalizedZona = detectBodyPartFromMessage(zona) || zona.toLowerCase();
    
    // Recupera dolori esistenti
    const { pains } = await getUserPains(userId);
    
    // Filtra via il dolore
    const updatedPains = pains.filter(p => p.zona.toLowerCase() !== normalizedZona);
    // Salva nel database
    const { error } = await supabase
      .from('user_onboarding_responses')
      .update({
        zone_dolori_dettagli: updatedPains,
        zone_evitare: updatedPains.map(p => p.zona),
        ha_limitazioni: updatedPains.length > 0,
        last_modified_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    if (error) {
      console.error('❌ Errore rimozione dolore:', error);
      return { success: false, error: error.message, updatedPains: pains };
    }
    
    // Pulisci anche limitazioni_fisiche se contiene questa zona
    try {
      const { data: currentData } = await supabase
        .from('user_onboarding_responses')
        .select('limitazioni_fisiche')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (currentData?.limitazioni_fisiche && typeof currentData.limitazioni_fisiche === 'string') {
        const limitazioniLower = currentData.limitazioni_fisiche.toLowerCase();
        const zonaLower = normalizedZona.toLowerCase();
        
        // Verifica se il testo contiene la zona (controlla anche sinonimi)
        const containsZona = limitazioniLower.includes(zonaLower) || 
                            detectBodyPartFromMessage(currentData.limitazioni_fisiche) === normalizedZona;
        
        if (containsZona) {
          const { error: clearError } = await supabase
            .from('user_onboarding_responses')
            .update({ limitazioni_fisiche: null })
            .eq('user_id', userId);
          
          if (clearError) {
            console.warn('⚠️ Errore pulizia limitazioni_fisiche:', clearError);
          } else {
            console.log('🧹 Pulito anche limitazioni_fisiche per zona:', normalizedZona);
          }
        }
      }
    } catch (clearErr) {
      console.warn('⚠️ Errore durante pulizia limitazioni_fisiche:', clearErr);
      // Non bloccare il flusso se la pulizia fallisce
    }
    
    console.log(`✅ Dolore rimosso: ${normalizedZona} per utente ${userId} ${getRandomHappyEmoji()}`);
    return { success: true, updatedPains };
  } catch (err) {
    console.error('❌ Errore removePain:', err);
    return { success: false, error: String(err), updatedPains: [] };
  }
}

// ─────────────────────────────────────────────────────
// REMOVE ALL: Rimuove tutti i dolori
// ─────────────────────────────────────────────────────
export async function removeAllPains(userId: string): Promise<PainUpdateResult> {
  try {
    const { error } = await supabase
      .from('user_onboarding_responses')
      .update({
        zone_dolori_dettagli: [],
        zone_evitare: [],
        ha_limitazioni: false,
        limitazioni_fisiche: null, // Pulisci anche limitazioni_fisiche quando rimuovi tutti i dolori
        last_modified_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    if (error) {
      console.error('❌ Errore rimozione tutti i dolori:', error);
      return { success: false, error: error.message, updatedPains: [] };
    }
    console.log(`✅ Tutti i dolori rimossi per utente ${userId} ${getRandomHappyEmoji()}`);
    return { success: true, updatedPains: [] };
  } catch (err) {
    console.error('❌ Errore removeAllPains:', err);
    return { success: false, error: String(err), updatedPains: [] };
  }
}

// ─────────────────────────────────────────────────────
// GENERA MESSAGGIO: Chiedi se i dolori sono passati
// ─────────────────────────────────────────────────────
export function generatePainCheckMessage(painResult: PainCheckResult): string {
  if (!painResult.hasPain) return '';

  const { pains, persistentPains } = painResult;

  // Se c'è un solo dolore, usa messaggio semplice
  if (pains.length === 1) {
    const pain = pains[0];
    const days = daysSince(pain.aggiunto_il);
    const zoneLabel = getZoneLabel(pain.zona);
    
    // Dolore persistente (> 14 giorni)
    if (isPainPersistent(pain.aggiunto_il)) {
      const weeks = Math.floor(days / 7);
      let timeAgo = '';
      if (weeks <= 3) {
        timeAgo = `circa ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'} fa`;
      } else {
        const months = Math.floor(days / 30);
        timeAgo = `circa ${months} ${months === 1 ? 'mese' : 'mesi'} fa`;
      }
      
      return `⚠️ **Nota importante**: Mi avevi detto che ti faceva male ${zoneLabel} ${timeAgo}, il dolore è passato o c'è ancora?\n\nSe il dolore persiste, ti consiglio di consultare un medico, un fisioterapista o un professionista.`;
    }
    
    // Dolore recente (< 14 giorni)
    const timeAgo = formatTimeAgo(pain.aggiunto_il);
    return `💬 ${timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1)} mi avevi detto che ti faceva male ${zoneLabel}. È passato o c'è ancora?`;
  }

  // Più dolori: usa il più vecchio per il messaggio principale
  const oldestPain = pains[0];
  const days = daysSince(oldestPain.aggiunto_il);
  const zoneLabel = getZoneLabel(oldestPain.zona);
  
  // Dolore persistente (> 14 giorni)
  if (isPainPersistent(oldestPain.aggiunto_il)) {
    const weeks = Math.floor(days / 7);
    let timeAgo = '';
    if (weeks <= 3) {
      timeAgo = `circa ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'} fa`;
    } else {
      const months = Math.floor(days / 30);
      timeAgo = `circa ${months} ${months === 1 ? 'mese' : 'mesi'} fa`;
    }
    
    return `⚠️ **Nota importante**: Mi avevi detto che ti faceva male ${zoneLabel} ${timeAgo}, il dolore è passato o c'è ancora?\n\nSe il dolore persiste, ti consiglio di consultare un medico, un fisioterapista o un professionista.`;
  }
  
  // Dolore recente (< 14 giorni)
  const timeAgo = formatTimeAgo(oldestPain.aggiunto_il);
  return `💬 ${timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1)} mi avevi detto che ti faceva male ${zoneLabel}. È passato o c'è ancora?`;
}

// ─────────────────────────────────────────────────────
// GENERA RISPOSTA FELICE: Quando dolore è passato
// ─────────────────────────────────────────────────────
export function generateHappyPainGoneResponse(
  removedZona: string, 
  remainingPains: PainDetail[]
): string {
  const emoji = getRandomHappyEmoji();
  const zoneLabel = getZoneLabel(removedZona);
  
  if (remainingPains.length === 0) {
    return `${emoji} **Fantastico!** Sono contentissimo che stai meglio! Ora posso crearti un piano di allenamento completo senza limitazioni! 💪\n\nChe tipo di allenamento vorresti fare?`;
  } else {
    const remainingLabels = remainingPains.map(p => getZoneLabel(p.zona)).join(' e ');
    return `${emoji} **Ottima notizia per ${zoneLabel}!** Sono contento che stia meglio!\n\nPer ${remainingLabels}, come va? È passato anche quello?`;
  }
}

// ─────────────────────────────────────────────────────
// GENERA RISPOSTA: Dolore ancora presente
// ─────────────────────────────────────────────────────
export function generatePainStillPresentResponse(zona: string): string {
  const zoneLabel = getZoneLabel(zona);
  return `Capisco, nessun problema! 💪 Ti creerò un piano di allenamento sicuro che evita completamente ${zoneLabel}. Tutti gli esercizi saranno selezionati per non stressare quella zona.\n\nHai altri dolori o fastidi che devo considerare?`;
}

// ─────────────────────────────────────────────────────
// GENERA RISPOSTA: Tutti i dolori passati
// ─────────────────────────────────────────────────────
export function generateAllPainsGoneResponse(): string {
  const emoji = getRandomHappyEmoji();
  return `${emoji}${emoji}${emoji} **Che bella notizia!** Sono super felice che stai bene! Ora posso crearti qualsiasi tipo di allenamento!\n\nCosa ti va di fare oggi? 💪`;
}

