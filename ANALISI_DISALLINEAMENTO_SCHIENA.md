# 🔍 ANALISI: Disallineamento "Schiena" nel Sistema Limitazioni

**Data**: 1 Ottobre 2025  
**Problema**: L'AI pensa che l'utente abbia dolore alla schiena quando il riepilogo mostra "Limitazioni fisiche: Nessuna"

---

## 📊 FLUSSO COMPLETO DEI DATI

### 1. GENERAZIONE RIEPILOGO ONBOARDING

**File**: `src/services/primebotUserContextService.ts` (righe 711-803)

**Funzione**: `generateOnboardingSummaryMessage(userId: string)`

```typescript
// Gestione limitazioni (righe 774-780)
let limitazioniText = 'Nessuna indicata';
if (data.ha_limitazioni === true && data.limitazioni_fisiche) {
  limitazioniText = data.limitazioni_fisiche;
} else if (data.ha_limitazioni === false) {
  limitazioniText = 'Nessuna';  // ✅ CORRETTO: Mostra "Nessuna"
}
```

**Risultato**: Il riepilogo mostra correttamente **"Limitazioni fisiche: Nessuna"** quando `ha_limitazioni = false`.

---

### 2. CONTROLLO INTELLIGENTE LIMITAZIONI

**File**: `src/services/primebotUserContextService.ts` (righe 437-611)

**Funzione**: `getSmartLimitationsCheck(userId: string)`

**Flusso**:

1. **Recupero dati** (riga 441):
   ```typescript
   const onboardingData = await onboardingService.loadOnboardingData(userId);
   ```

2. **Normalizzazione `ha_limitazioni`** (righe 449-463):
   ```typescript
   let hasLimitazioni: boolean | null = null;
   const rawHasLimitazioni = onboardingData?.ha_limitazioni;
   
   if (rawHasLimitazioni === true || String(rawHasLimitazioni) === 'true') {
     hasLimitazioni = true;
   } else if (rawHasLimitazioni === false || String(rawHasLimitazioni) === 'false') {
     hasLimitazioni = false;  // ✅ CORRETTO: ha_limitazioni = false
   }
   ```

3. **Recupero dati limitazioni** (righe 465-470):
   ```typescript
   const limitazioniFisiche = onboardingData?.limitazioni_fisiche || null;
   const zoneEvitare = onboardingData?.zone_evitare || null;
   const condizioniMediche = onboardingData?.condizioni_mediche || null;
   ```

   ⚠️ **PROBLEMA IDENTIFICATO**: Anche quando `ha_limitazioni = false`, questi campi potrebbero contenere ancora dati residui dal database!

4. **CASO B: `ha_limitazioni === false`** (righe 530-542):
   ```typescript
   else if (hasLimitazioni === false) {
     console.log('✅ CASO B: ha_limitazioni === false');
     if (daysSinceUpdate !== null && daysSinceUpdate > 60) {
       // Passati più di 60 giorni, chiedi se qualcosa è cambiato
       needsToAsk = true;
     } else {
       // Meno di 60 giorni, procedi senza chiedere
       needsToAsk = false;  // ✅ CORRETTO: Procede senza chiedere
     }
   }
   ```

5. **Ritorno risultato** (righe 584-595):
   ```typescript
   return {
     hasExistingLimitations: hasLimitazioni === true,  // ✅ CORRETTO: false quando ha_limitazioni = false
     limitations: limitazioniFisiche,  // ⚠️ PROBLEMA: Potrebbe contenere "schiena" anche se ha_limitazioni = false!
     zones: zoneEvitare,  // ⚠️ PROBLEMA: Potrebbe contenere ["schiena"] anche se ha_limitazioni = false!
     medicalConditions: condizioniMediche,
     lastUpdated: limitazioniCompilatoAt,
     daysSinceUpdate,
     needsToAsk,
     suggestedQuestion,
     hasAnsweredBefore,
   };
   ```

---

### 3. COSTRUZIONE SEZIONE LIMITAZIONI PER AI

**File**: `src/lib/openai-service.ts` (righe 425-480)

**Funzione**: `getStructuredWorkoutPlan(request, userId, sessionId)`

**Flusso**:

1. **Chiamata `getSmartLimitationsCheck`** (riga 384):
   ```typescript
   const limitationsCheck = await getSmartLimitationsCheck(userId);
   ```

2. **Controllo se costruire sezione limitazioni** (riga 430):
   ```typescript
   if (limitationsCheck.hasExistingLimitations && limitationsCheck.limitations) {
     // Costruisce sezione limitazioni per AI
   } else {
     limitationsSection = `
       L'utente non ha indicato limitazioni fisiche. Puoi proporre qualsiasi esercizio appropriato al suo livello.
     `;
   }
   ```

   ✅ **CORRETTO**: Se `hasExistingLimitations = false`, non costruisce la sezione limitazioni.

3. **Esempio piano nel prompt** (righe 587-590):
   ```typescript
   if (limitationsCheck.hasExistingLimitations && therapeuticAdvice.length > 0) {
     examplePlan.therapeuticAdvice = therapeuticAdvice;
     examplePlan.safetyNotes = `Piano adattato per ${limitationsCheck.limitations}...`;
   }
   ```

   ✅ **CORRETTO**: Se `hasExistingLimitations = false`, non aggiunge `therapeuticAdvice` all'esempio.

4. **Prompt finale per AI** (righe 595-599):
   ```typescript
   ${limitationsCheck.hasExistingLimitations && therapeuticAdvice.length > 0 ? `
     IMPORTANTE: Se l'utente ha limitazioni fisiche, il JSON DEVE includere:
     - "therapeuticAdvice": array di stringhe con consigli terapeutici
     - "safetyNotes": stringa che spiega l'adattamento del piano...
   ` : ''}
   ```

   ✅ **CORRETTO**: Se `hasExistingLimitations = false`, non aggiunge istruzioni per limitazioni.

---

## 🐛 PROBLEMA IDENTIFICATO

### SCENARIO PROBLEMATICO

1. **Utente dice "Nessuna limitazione"** durante onboarding
2. **`parseAndSaveLimitationsFromChat`** setta:
   - `ha_limitazioni = false` ✅
   - `limitazioni_fisiche = null` ✅
   - `zone_evitare = []` ✅

3. **MA** se nel database ci sono ancora dati residui da test precedenti:
   - `limitazioni_fisiche` potrebbe contenere ancora `"schiena"` o `"mal di schiena"`
   - `zone_evitare` potrebbe contenere ancora `["schiena"]`

4. **Quando viene chiamato `getSmartLimitationsCheck`**:
   - `hasExistingLimitations: false` ✅ (corretto)
   - `limitations: "schiena"` ⚠️ (dati residui!)
   - `zones: ["schiena"]` ⚠️ (dati residui!)

5. **Anche se `hasExistingLimitations = false`**, questi dati residui potrebbero essere usati in altri punti o l'AI potrebbe vederli da:
   - Cronologia conversazione precedente
   - Context utente (ma `getUserContext` NON include limitazioni, quindi escluso)
   - System prompt generale con esempi (riga 221-227 in `openai-service.ts`)

---

## 🔍 PUNTI DI CONTROLLO

### 1. DATI RESIDUI NEL DATABASE

**Possibile causa**: Quando l'utente dice "Nessuna limitazione", potrebbe non essere stato pulito correttamente il campo `limitazioni_fisiche` se era già popolato.

**Verifica necessaria**:
```sql
-- Controlla utenti con ha_limitazioni = false ma limitazioni_fisiche non null
SELECT 
  user_id,
  ha_limitazioni,
  limitazioni_fisiche,
  zone_evitare,
  limitazioni_compilato_at
FROM user_onboarding_responses
WHERE ha_limitazioni = false 
  AND (limitazioni_fisiche IS NOT NULL OR zone_evitare IS NOT NULL AND array_length(zone_evitare, 1) > 0);
```

### 2. SISTEMA PAIN TRACKING

**File**: `src/services/painTrackingService.ts`

**Funzione**: `getUserPains(userId: string)`

**FALLBACK PROBLEMATICO** (righe 60-86):
```typescript
// FALLBACK: Se zone_dolori_dettagli è vuoto, leggi da limitazioni_fisiche (TEXT)
const limitazioniFisiche = data?.limitazioni_fisiche;

if (pains.length === 0 && limitazioniFisiche && typeof limitazioniFisiche === 'string' && limitazioniFisiche.trim().length > 0) {
  // Estrai zona del corpo dal testo usando detectBodyPartFromMessage
  const detectedZona = detectBodyPartFromMessage(limitazioniFisiche);
  
  if (detectedZona) {
    // Aggiunge dolore anche se ha_limitazioni = false!
    pains.push(painDetail);
  }
}
```

⚠️ **PROBLEMA**: Se `limitazioni_fisiche` contiene ancora "schiena" (dati residui), `getUserPains` lo legge e lo aggiunge ai dolori, anche se `ha_limitazioni = false`!

**Ma**: `getUserPains` viene chiamato solo in `PrimeChat.tsx` per il sistema pain tracking, non direttamente per la generazione del piano.

### 3. CRONOLOGIA CONVERSAZIONE

**Possibile causa**: Se in una conversazione precedente l'utente aveva menzionato "schiena", l'AI potrebbe ricordarlo dalla cronologia.

**Verifica necessaria**: Controllare la cronologia conversazione che viene passata all'AI (righe 414-423 in `openai-service.ts`).

### 4. SYSTEM PROMPT GENERALE

**File**: `src/lib/openai-service.ts` (righe 204-235)

**Contenuto**: Il system prompt generale include esempi di gestione dolori (es. "Ho mal di schiena").

⚠️ **POSSIBILE PROBLEMA**: L'AI potrebbe interpretare questi esempi come istruzioni generali e applicarli anche quando non dovrebbe.

---

## 🎯 FIX PROPOSTI

### FIX 1: Pulire dati residui quando `ha_limitazioni = false`

**File**: `src/services/primebotUserContextService.ts`

**Funzione**: `getSmartLimitationsCheck`

**Modifica** (righe 584-595):

```typescript
return {
  hasExistingLimitations: hasLimitazioni === true,
  // ⭐ FIX: Se ha_limitazioni = false, forza limitations/zones a null/[]
  limitations: hasLimitazioni === true ? limitazioniFisiche : null,
  zones: hasLimitazioni === true ? zoneEvitare : null,
  medicalConditions: hasLimitazioni === true ? condizioniMediche : null,
  lastUpdated: limitazioniCompilatoAt,
  daysSinceUpdate,
  needsToAsk,
  suggestedQuestion,
  hasAnsweredBefore,
};
```

**Vantaggio**: Garantisce che quando `hasExistingLimitations = false`, anche `limitations` e `zones` siano null, eliminando dati residui.

---

### FIX 2: Pulire database quando utente dice "Nessuna limitazione"

**File**: `src/services/primebotUserContextService.ts`

**Funzione**: `parseAndSaveLimitationsFromChat`

**Modifica** (righe 670-683):

```typescript
// Salva nel database
const { error } = await supabase
  .from('user_onboarding_responses')
  .upsert(
    {
      user_id: userId,
      ha_limitazioni: hasLimitations,
      limitazioni_fisiche: hasLimitations ? parsed : null,  // ⭐ FIX: Se false, forza null
      zone_evitare: hasLimitations ? (/* estrai zone se necessario */) : [],  // ⭐ FIX: Se false, forza []
      zone_dolori_dettagli: hasLimitations ? (/* mantieni se necessario */) : [],  // ⭐ FIX: Se false, forza []
      limitazioni_compilato_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
```

**Vantaggio**: Quando l'utente dice "Nessuna limitazione", pulisce TUTTI i campi relativi, non solo `ha_limitazioni`.

---

### FIX 3: Aggiungere controllo in `getUserPains` per rispettare `ha_limitazioni`

**File**: `src/services/painTrackingService.ts`

**Funzione**: `getUserPains`

**Modifica** (righe 60-86):

```typescript
// ⭐ FIX: Controlla ha_limitazioni prima del fallback
const { data: onboardingData } = await supabase
  .from('user_onboarding_responses')
  .select('ha_limitazioni, limitazioni_fisiche, zone_dolori_dettagli, zone_evitare, created_at')
  .eq('user_id', userId)
  .maybeSingle();

const haLimitazioni = onboardingData?.ha_limitazioni === true;

// FALLBACK: Solo se ha_limitazioni = true
if (pains.length === 0 && haLimitazioni && limitazioniFisiche && typeof limitazioniFisiche === 'string' && limitazioniFisiche.trim().length > 0) {
  // ... resto del codice fallback
}
```

**Vantaggio**: Non legge `limitazioni_fisiche` se `ha_limitazioni = false`, evitando dati residui.

---

## 📋 CHECKLIST VERIFICA

- [ ] Verificare nel database se ci sono utenti con `ha_limitazioni = false` ma `limitazioni_fisiche` non null
- [ ] Verificare cronologia conversazione per vedere se contiene riferimenti a "schiena"
- [ ] Verificare se `getUserPains` viene chiamato durante la generazione del piano
- [ ] Aggiungere log dettagliati per tracciare da dove arriva "schiena" nell'AI
- [ ] Implementare FIX 1, 2, 3 in ordine di priorità

---

## 🎯 PRIORITÀ FIX

1. **FIX 1** (Priorità ALTA): Impedisce che dati residui vengano passati all'AI anche quando `hasExistingLimitations = false`
2. **FIX 2** (Priorità ALTA): Pulisce il database quando l'utente dice "Nessuna limitazione"
3. **FIX 3** (Priorità MEDIA): Evita che `getUserPains` legga dati residui

---

## 📝 CONCLUSIONI

Il problema è causato da **dati residui nel database** che non vengono puliti quando l'utente dice "Nessuna limitazione". Anche se `hasExistingLimitations = false` è corretto, i campi `limitations` e `zones` possono ancora contenere dati vecchi che potrebbero influenzare l'AI in modi inattesi.

**Soluzione immediata**: Implementare FIX 1 per garantire che quando `hasExistingLimitations = false`, anche `limitations` e `zones` siano null.

