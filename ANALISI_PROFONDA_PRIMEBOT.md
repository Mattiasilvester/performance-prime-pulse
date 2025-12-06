# 🔬 ANALISI PROFONDA COMPLETA - FLUSSO PRIMEBOT

**Data Analisi**: 28 Novembre 2025  
**Analista**: AI Assistant  
**Stato**: Analisi completata - Documento di riferimento completo

---

## 📋 INDICE

1. [Sezione 1: Mappa Completa dei Flussi](#sezione-1-mappa-completa-dei-flussi)
2. [Sezione 2: Gestione Dolore/Limitazioni](#sezione-2-gestione-dolorelimitazioni)
3. [Sezione 3: Quando Interviene LLM vs Logica Locale](#sezione-3-quando-interviene-llm-vs-logica-locale)
4. [Sezione 4: Conflitti Identificati](#sezione-4-conflitti-identificati)
5. [Sezione 5: Keyword Analysis](#sezione-5-keyword-analysis)
6. [Sezione 6: Gestione Rimozione Dolore](#sezione-6-gestione-rimozione-dolore)
7. [Sezione 7: Raccomandazioni](#sezione-7-raccomandazioni)

---

## 📊 SEZIONE 1: MAPPA COMPLETA DEI FLUSSI

### 1.1 Quali sono TUTTI i possibili "stati" di PrimeBot?

#### **STATI PRINCIPALI (useState hooks)**

| Stato | Riga | Tipo | Scopo | Quando Attivato | Quando Disattivato |
|-------|------|------|-------|-----------------|-------------------|
| `msgs` | 142 | `Msg[]` | Array messaggi chat | Inizialmente vuoto | Reset quando si chiude chat |
| `input` | 143 | `string` | Input utente corrente | Focus input | Reset dopo invio |
| `loading` | 144 | `boolean` | Stato caricamento | Inizio operazione async | Fine operazione |
| `userId` | 147 | `string` | ID utente | Mount componente | Reset se logout |
| `userName` | 148 | `string` | Nome utente | Caricamento profilo | Reset se logout |
| `userEmail` | 149 | `string` | Email utente | Caricamento profilo | Reset se logout |
| `hasStartedChat` | 150 | `boolean` | Chat iniziata? | Click "Inizia Chat" | Reset quando si chiude |
| `sessionId` | 151 | `string \| null` | ID sessione conversazione | Prima richiesta | Reset se logout |
| `pendingPlan` | 152 | `any` | Piano in attesa di disclaimer | Piano generato con limitazioni | Dopo accettazione disclaimer |
| `showPlanDisclaimer` | 153 | `boolean` | Mostra disclaimer medico? | Piano con limitazioni | Dopo accettazione/rifiuto |
| `awaitingLimitationsResponse` | 154 | `boolean` | Aspetta risposta limitazioni? | `getStructuredWorkoutPlan` ritorna `question` | Dopo risposta utente |
| `originalWorkoutRequest` | 155 | `string \| null` | Richiesta piano originale | Quando si chiede limitazioni | Dopo generazione piano |
| `isNewUser` | 158 | `boolean` | Utente nuovo? | Prima interazione | Dopo prima interazione |
| `waitingForPainResponse` | 172 | `boolean` | Aspetta risposta dolore? | Dolore rilevato nel database | Dopo risposta utente |
| `currentPainZone` | 173 | `string \| null` | Zona dolore corrente | Quando si chiede dolore | Dopo gestione risposta |
| `waitingForPlanConfirmation` | 176 | `boolean` | Aspetta conferma riepilogo? | Riepilogo onboarding mostrato | Dopo conferma/modifica |
| `pendingPlanRequest` | 177 | `string \| null` | Richiesta piano salvata | Quando si mostra riepilogo | Dopo generazione piano |
| `waitingForModifyChoice` | 180 | `boolean` | Aspetta modifica preferenze? | Utente dice "modifica" | Dopo modifica completata |
| `waitingForModifyValue` | 181 | `string \| null` | Campo in modifica | Durante modifica | Dopo salvataggio |
| `skipUserMessageAdd` | 184 | `boolean` | Evita duplicazione messaggio | Quando messaggio già aggiunto | Reset dopo uso |
| `waitingForPainPlanConfirmation` | 187 | `boolean` | Aspetta conferma piano dopo dolore? | Fallback chiede conferma | Dopo conferma/rifiuto |
| `skipFallbackCheck` | 190 | `boolean` | Salta controllo fallback? | Dopo `waitingForPainPlanConfirmation` | Reset dopo uso |
| `waitingForPainDetails` | 193 | `boolean` | Aspetta dettagli dolore? | Dolore rilevato nel messaggio | Dopo salvataggio dolore |
| `tempPainBodyPart` | 194 | `string \| null` | Zona dolore temporanea | Quando si rileva dolore | Dopo salvataggio |

#### **STATI DERIVATI (da hooks)**

| Stato | Hook | Scopo | Quando Disponibile |
|-------|------|-------|-------------------|
| `pains` | `usePainTracking` | Array dolori utente | Dopo caricamento database |
| `painsLoading` | `usePainTracking` | Caricamento dolori | Durante fetch database |
| `painCheckMessage` | `usePainTracking` | Messaggio check dolore | Se `pains.length > 0` |

---

### 1.2 Quali sono TUTTI i "blocchi decisionali" nella funzione send()?

#### **ORDINE DI ESECUZIONE (TOP-TO-BOTTOM)**

**File**: `src/components/PrimeChat.tsx`  
**Funzione**: `send(text: string)` - riga 367

#### **BLOCCO 0: Controlli Preliminari (righe 368-378)**

```typescript
const trimmed = text.trim();
let shouldAddUserMessage = true;

if (skipUserMessageAdd) {
  shouldAddUserMessage = false;
  setSkipUserMessageAdd(false);
}
```

**Priorità**: ⭐ **PRIORITÀ MASSIMA (sempre eseguito per primo)**  
**Condizione**: Nessuna (sempre eseguito)  
**Cosa fa**: Prepara variabili e controlla duplicazione messaggio  
**Return**: ❌ No, continua sempre

---

#### **BLOCCO 1: Sistema Tracking Dolori - Risposta (righe 381-439)**

```typescript
if (waitingForPainResponse && trimmed) {
  // Gestisce risposta quando PrimeBot chiede se dolore è passato
}
```

**Priorità**: 🟡 **ALTA (controllato subito dopo preliminari)**  
**Condizione**: `waitingForPainResponse === true`  
**Cosa fa**: 
- Rileva se dolore è passato ("passato", "meglio", "guarito", "ok", "sì")
- Rileva se dolore c'è ancora ("ancora", "male", "no", "persiste")
- Rimuove dolore dal database se passato
- Continua flusso se ancora presente

**Return**: ✅ **SÌ** (dopo gestione dolore passato) o continua (se ancora presente)  
**File Logico**: Gestione risposta a domanda dolore esistente

---

#### **BLOCCO 2: Gestione Risposta Dettaglio Dolore (righe 442-625)**

```typescript
if (waitingForPainDetails && trimmed && tempPainBodyPart) {
  // Gestisce risposta dettagli dolore (destro/sinistro/entrambi)
}
```

**Priorità**: 🟡 **ALTA (controllato subito dopo BLOCCO 1)**  
**Condizione**: `waitingForPainDetails === true && tempPainBodyPart !== null`  
**Cosa fa**:
- Estrae lato dolore (destro/sinistro/entrambi)
- Salva dolore nel database con zona completa
- Genera piano immediatamente dopo salvataggio

**Return**: ✅ **SÌ** (dopo generazione piano)  
**File Logico**: Gestione risposta a domanda dettagli dolore nuovo

---

#### **BLOCCO 3: Conferma Piano Dopo Dolore (righe 628-801)**

```typescript
if (waitingForPainPlanConfirmation && trimmed) {
  // Gestisce risposta quando fallback chiede conferma piano dopo dolore
}
```

**Priorità**: 🟡 **ALTA**  
**Condizione**: `waitingForPainPlanConfirmation === true`  
**Cosa fa**:
- Rileva conferma ("sì", "ok", "procedi", "genera", "crea")
- Rileva rifiuto ("no", "non voglio", "lascia stare")
- Genera piano direttamente se conferma
- Chiusura flusso se rifiuta

**Return**: ✅ **SÌ** (dopo gestione)  
**File Logico**: Gestione conferma piano quando fallback rileva dolore

---

#### **BLOCCO 4: Riepilogo Onboarding - Gestione Risposta (righe 804-875)**

```typescript
if (waitingForPlanConfirmation && trimmed) {
  // Gestisce risposta a riepilogo onboarding
}
```

**Priorità**: 🟡 **ALTA**  
**Condizione**: `waitingForPlanConfirmation === true`  
**Cosa fa**:
- Rileva conferma ("sì", "ok", "procedi", "vai", "genera", "crea", "confermo")
- Rileva richiesta modifica ("modifica", "cambia", "diverso")
- Setta `pendingPlanRequest` se conferma
- Attiva `waitingForModifyChoice` se modifica

**Return**: ✅ **SÌ** (se modifica o chiarimento) o continua (se conferma)  
**File Logico**: Gestione risposta a riepilogo onboarding

---

#### **BLOCCO 5: Modifica Preferenze in Chat (righe 879-1005)**

```typescript
if (waitingForModifyChoice && trimmed) {
  // Gestisce modifica preferenze durante chat
}
```

**Priorità**: 🟡 **ALTA**  
**Condizione**: `waitingForModifyChoice === true`  
**Cosa fa**:
- Rileva "procedi" per terminare modifica
- Rileva campi da modificare (obiettivo, giorni, durata, luogo, livello)
- Salva modifiche nel database
- Rigenera riepilogo aggiornato

**Return**: ✅ **SÌ** (dopo gestione)  
**File Logico**: Gestione modifica preferenze in chat

---

#### **BLOCCO 6: Analisi Dolore Messaggio Corrente (righe 1031-1062)**

```typescript
if (isPlanRequestForPainCheck && isPainContext && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation) {
  // Rileva dolore nel messaggio corrente e chiede dettagli
}
```

**Priorità**: 🟠 **MEDIA-ALTA (dopo gestione stati attivi)**  
**Condizione**: 
- `isPlanRequestForPainCheck === true` (contiene keywords piano)
- `isPainContext === true` (zona corpo + contesto dolore)
- Tutti gli stati di attesa sono `false`

**Cosa fa**:
- Chiede dettagli dolore (destro/sinistro o conferma)
- Setta `waitingForPainDetails = true`
- Salva zona temporanea in `tempPainBodyPart`

**Return**: ✅ **SÌ** (dopo aver chiesto dettagli)  
**File Logico**: Rilevamento dolore nuovo nel messaggio corrente

---

#### **BLOCCO 7: Check Dolori Database Esistenti (righe 1065-1103)**

```typescript
if (isPlanRequestForPainCheck && pains.length > 0 && painCheckMessage && !waitingForPainResponse && !waitingForPainDetails) {
  // Mostra messaggio check dolore esistente
}
```

**Priorità**: 🟠 **MEDIA-ALTA**  
**Condizione**: 
- `isPlanRequestForPainCheck === true`
- `pains.length > 0` (ci sono dolori salvati)
- `painCheckMessage !== null`
- Stati di attesa sono `false`

**Cosa fa**:
- Mostra messaggio check dolore esistente
- Setta `waitingForPainResponse = true`
- Setta `currentPainZone` se un solo dolore

**Return**: ✅ **SÌ** (dopo aver mostrato messaggio)  
**File Logico**: Check dolore esistente nel database

---

#### **BLOCCO 8: Riepilogo Onboarding - Mostra Riepilogo (righe 1109-1153)**

```typescript
if (isPlanRequestForPainCheck && !waitingForPlanConfirmation && !waitingForPainResponse && !waitingForPainDetails && !waitingForPainPlanConfirmation) {
  // Mostra riepilogo onboarding se prima richiesta piano
}
```

**Priorità**: 🟢 **MEDIA**  
**Condizione**: 
- `isPlanRequestForPainCheck === true`
- Tutti gli stati di attesa sono `false`
- `pendingPlanRequest === null` (prima richiesta)

**Cosa fa**:
- Genera riepilogo onboarding
- Mostra riepilogo e aspetta conferma
- Setta `waitingForPlanConfirmation = true`
- Salva richiesta in `pendingPlanRequest`

**Return**: ✅ **SÌ** (se mostra riepilogo) o continua (se no dati onboarding)  
**File Logico**: Mostra riepilogo onboarding prima richiesta piano

---

#### **BLOCCO 9: Controlli Generali - Blocco Loading (righe 1156-1161)**

```typescript
if (!trimmed || loading) {
  return;
}
```

**Priorità**: 🟡 **ALTA**  
**Condizione**: Messaggio vuoto o già in loading  
**Cosa fa**: Blocca esecuzione  
**Return**: ✅ **SÌ** (interrompe flusso)

---

#### **BLOCCO 10: Aggiunta Messaggio Utente Generale (righe 1163-1173)**

```typescript
if (shouldAddUserMessage) {
  setMsgs(m => [...m, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
}
setInput('');
setLoading(true);
```

**Priorità**: 🟠 **MEDIA**  
**Condizione**: `shouldAddUserMessage === true`  
**Cosa fa**: Aggiunge messaggio utente alla chat  
**Return**: ❌ No, continua sempre

---

#### **BLOCCO 11: Risposta Limitazioni (righe 1196-1311)**

```typescript
if (awaitingLimitationsResponse) {
  // Gestisce risposta a domanda limitazioni da getStructuredWorkoutPlan
}
```

**Priorità**: 🟡 **ALTA**  
**Condizione**: `awaitingLimitationsResponse === true`  
**Cosa fa**:
- Salva limitazioni nel database
- Rigenera piano con limitazioni aggiornate
- Mostra piano con/senza disclaimer

**Return**: ✅ **SÌ** (dopo generazione piano)  
**File Logico**: Gestione risposta a domanda limitazioni

---

#### **BLOCCO 12: Sistema Fallback (righe 1314-1373)**

```typescript
if (!skipFallbackCheck) {
  presetResponse = getPrimeBotFallbackResponse(trimmed);
}

if (presetResponse) {
  // Mostra risposta preimpostata
}
```

**Priorità**: 🟢 **MEDIA-BASSA**  
**Condizione**: `skipFallbackCheck === false`  
**Cosa fa**:
- Cerca risposta preimpostata
- Se trovata, mostra risposta
- Se `askForPlanConfirmation`, setta `waitingForPainPlanConfirmation`

**Return**: ✅ **SÌ** (se trova risposta preimpostata)  
**File Logico**: Sistema risposte preimpostate (fallback)

---

#### **BLOCCO 13: Richiesta Piano Allenamento (righe 1377-1606)**

```typescript
const isPlanRequest = isWorkoutPlanRequest(trimmed) || isPlanRequestFromConfirmation;

if (isPlanRequest) {
  // Genera piano allenamento con getStructuredWorkoutPlan
}
```

**Priorità**: 🟢 **MEDIA**  
**Condizione**: 
- `isWorkoutPlanRequest(trimmed) === true` OPPURE
- `pendingPlanRequest !== null`

**Cosa fa**:
- Chiama `getStructuredWorkoutPlan()`
- Gestisce risposta (plan/question/error)
- Mostra piano con/senza disclaimer

**Return**: ✅ **SÌ** (dopo generazione piano)  
**File Logico**: Generazione piano allenamento principale

---

#### **BLOCCO 14: LLM Generica (righe 1608-1623)**

```typescript
else {
  // Usa AI normale (OpenAI)
  const aiResponse = await getAIResponse(trimmed, userId, currentSessionId || undefined);
}
```

**Priorità**: 🔴 **PRIORITÀ MINIMA (ultimo blocco)**  
**Condizione**: Nessun altro blocco ha intercettato il messaggio  
**Cosa fa**: Chiama OpenAI per risposta generica  
**Return**: ❌ No (ultimo blocco)

---

### 1.3 Qual è l'ORDINE di priorità dei blocchi?

#### **DIAGRAMMA FLUSSO DECISIONALE**

```
INIZIO send(text)
│
├─► [PRIORITÀ 0] Controlli Preliminari
│   └─► Continua sempre
│
├─► [PRIORITÀ 1] waitingForPainResponse?
│   ├─► SÌ → Gestisci risposta dolore → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 2] waitingForPainDetails?
│   ├─► SÌ → Salva dolore + genera piano → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 3] waitingForPainPlanConfirmation?
│   ├─► SÌ → Genera piano dopo conferma → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 4] waitingForPlanConfirmation?
│   ├─► SÌ → Gestisci risposta riepilogo
│   │   ├─► Conferma → Continua (genera piano)
│   │   └─► Modifica → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 5] waitingForModifyChoice?
│   ├─► SÌ → Gestisci modifica preferenze → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 6] isPlanRequest + isPainContext (messaggio corrente)?
│   ├─► SÌ → Chiedi dettagli dolore → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 7] isPlanRequest + pains.length > 0 (database)?
│   ├─► SÌ → Mostra check dolore esistente → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 8] isPlanRequest + prima richiesta?
│   ├─► SÌ → Mostra riepilogo onboarding → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 9] Controlli Generali
│   ├─► trimmed vuoto o loading? → RETURN
│   └─► Continua
│
├─► [PRIORITÀ 10] Aggiungi messaggio utente
│   └─► Continua sempre
│
├─► [PRIORITÀ 11] awaitingLimitationsResponse?
│   ├─► SÌ → Salva limitazioni + rigenera piano → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 12] Fallback (risposte preimpostate)
│   ├─► Trovata risposta? → Mostra → RETURN
│   └─► NO → Continua
│
├─► [PRIORITÀ 13] isPlanRequest?
│   ├─► SÌ → Genera piano → RETURN
│   └─► NO → Continua
│
└─► [PRIORITÀ 14] LLM Generica (ultimo blocco)
    └─► Chiama OpenAI → RETURN
```

#### **REGOLE DI PRIORITÀ**

1. **Stati attivi hanno priorità assoluta** - Se un flag `waitingFor*` è `true`, il blocco corrispondente viene eseguito per primo
2. **Ordine TOP-TO-BOTTOM** - I blocchi vengono controllati nell'ordine in cui appaiono nel codice
3. **Return interrompe il flusso** - Quando un blocco fa `return`, i blocchi successivi NON vengono eseguiti
4. **Condizioni mutuamente esclusive** - Gli stati `waitingFor*` dovrebbero essere mutuamente esclusivi (solo uno `true` alla volta)
5. **BLOCCO 13 e 14 sono OR, non AND** - Se non è richiesta piano, va direttamente a LLM generica

---

## 📊 SEZIONE 2: GESTIONE DOLORE/LIMITAZIONI

### 2.1 Quando PrimeBot CHIEDE se ci sono dolori?

#### **SCENARIO 1: Dolore Rilevato nel Messaggio Corrente**

**Condizioni**:
- `isPlanRequestForPainCheck === true` (messaggio contiene keywords piano)
- `isPainContext === true` (zona corpo + contesto dolore)
- Tutti gli stati di attesa sono `false`

**Dove nel codice**: Righe 1031-1062  
**Cosa chiede**:
- Se zona ha lato: `"Quale [zona] ti fa male? Destro, sinistro o entrambi?"`
- Se zona non ha lato: `"Confermi che il dolore è ancora presente?"`

**Stati attivati**: `waitingForPainDetails = true`, `tempPainBodyPart = [zona]`

---

#### **SCENARIO 2: Dolori Esistenti nel Database**

**Condizioni**:
- `isPlanRequestForPainCheck === true`
- `pains.length > 0` (dolori salvati nel database)
- `painCheckMessage !== null`
- Stati di attesa sono `false`

**Dove nel codice**: Righe 1065-1103  
**Cosa chiede**: Messaggio generato da `generatePainCheckMessage()` (righe 270-322 in `painTrackingService.ts`)

**Esempi messaggi**:
- Dolore recente: `"💬 Ieri mi avevi detto che ti faceva male [zona]. È passato o c'è ancora?"`
- Dolore persistente (> 14 giorni): `"⚠️ **Nota importante**: Mi avevi detto che ti faceva male [zona] 2 settimane fa, il dolore è passato o c'è ancora?"`

**Stati attivati**: `waitingForPainResponse = true`, `currentPainZone = [zona]` (se un solo dolore)

---

#### **SCENARIO 3: Domanda Limitazioni da getStructuredWorkoutPlan**

**Condizioni**:
- `getStructuredWorkoutPlan()` ritorna `type === 'question'`
- `needsToAsk === true` in `getSmartLimitationsCheck()`

**Dove nel codice**: 
- `openai-service.ts` righe 396-404 (ritorna question)
- `PrimeChat.tsx` righe 1453-1469 (mostra question)

**Cosa chiede**: Domanda da `limitationsCheck.suggestedQuestion`

**Esempi**:
- Prima volta: `"Prima di creare il tuo piano personalizzato, hai dolori, infortuni o limitazioni fisiche da considerare?"`
- Dopo 30 giorni: `"L'ultima volta mi avevi parlato di [limitazioni]. Come sta andando? Il problema persiste o è migliorato?"`

**Stati attivati**: `awaitingLimitationsResponse = true`, `originalWorkoutRequest = [richiesta originale]`

---

### 2.2 Quando PrimeBot CHIEDE "il dolore è passato o c'è ancora"?

#### **SOLO SCENARIO 2 (Dolori Esistenti nel Database)**

**Condizioni esatte**:
1. Richiesta piano (`isPlanRequestForPainCheck === true`)
2. Dolori salvati nel database (`pains.length > 0`)
3. Messaggio check disponibile (`painCheckMessage !== null`)
4. Non in attesa di altre risposte (tutti gli stati `waitingFor*` sono `false`)

**Dove viene generato il messaggio**: `src/services/painTrackingService.ts` - `generatePainCheckMessage()` (righe 270-322)

**Logica generazione**:
- Se 1 solo dolore: usa messaggio semplice con quella zona
- Se più dolori: usa messaggio con la zona più vecchia
- Se dolore persistente (> 14 giorni): aggiunge warning medico
- Se dolore recente (< 14 giorni): messaggio amichevole

**Quando viene mostrato**: Righe 1065-1103 in `PrimeChat.tsx`

---

### 2.3 Come vengono gestite le RISPOSTE dell'utente riguardo al dolore?

#### **GESTIONE RISPOSTA DOLORE ESISTENTE (waitingForPainResponse)**

**Dove nel codice**: Righe 381-439 in `PrimeChat.tsx`

#### **Risposta 1: "Il dolore è passato"**

**Keywords rilevate**:
```typescript
const isPainGone = userMessageLower.includes('passato') || 
                   userMessageLower.includes('meglio') || 
                   userMessageLower.includes('guarito') || 
                   userMessageLower.includes('ok') ||
                   userMessageLower.includes('sì') || 
                   userMessageLower.includes('si');
```

**Azioni**:
- Se contiene "tutti" o "tutto": Chiama `handleAllPainsGone()` → rimuove TUTTI i dolori
- Altrimenti: Chiama `handlePainGone(currentPainZone)` → rimuove SOLO quel dolore

**Cosa succede nel database**:
- `removePain()` o `removeAllPains()` viene chiamato
- Aggiorna `zone_dolori_dettagli` (rimuove elemento)
- Aggiorna `zone_evitare` (rimuove zona)
- Setta `ha_limitazioni = false` se non ci sono più dolori

**Messaggio bot**: 
- Se tutti passati: `"🎉🎉🎉 **Che bella notizia!** Sono super felice che stai bene!..."`
- Se uno passato: `"🎉 **Fantastico!** Sono contentissimo che stai meglio!..."`

**Return**: ✅ **SÌ** (interrompe flusso)

---

#### **Risposta 2: "Il dolore c'è ancora"**

**Keywords rilevate**:
```typescript
const isPainStill = userMessageLower.includes('ancora') || 
                    userMessageLower.includes('male') || 
                    userMessageLower.includes('no') || 
                    userMessageLower.includes('persiste') ||
                    userMessageLower.includes('fa male');
```

**Azioni**:
- Chiama `handlePainStillPresent(currentPainZone)`
- NON rimuove dolore dal database
- Continua flusso per generare piano con whitelist

**Messaggio bot**: `"Capisco, nessun problema! 💪 Ti creerò un piano di allenamento sicuro che evita completamente [zona]..."`

**Return**: ❌ **NO** (continua per generare piano)

---

#### **Risposta 3: Risposta ambigua/non riconosciuta**

**Cosa succede**: Il blocco `waitingForPainResponse` NON intercetta → il flusso continua verso LLM generica

**Problema potenziale**: L'utente potrebbe rispondere qualcosa che non viene riconosciuto e il flusso continua

---

### 2.4 Cosa succede DOPO che l'utente dice che il dolore è passato?

#### **RIMOZIONE DOLORE DAL DATABASE**

**File**: `src/services/painTrackingService.ts` - `removePain()` (righe 174-238)

**Cosa fa**:
1. Recupera dolori esistenti
2. Filtra via il dolore specifico
3. Aggiorna database:
   ```typescript
   await supabase
     .from('user_onboarding_responses')
     .update({
       zone_dolori_dettagli: updatedPains,  // Array senza il dolore
       zone_evitare: updatedPains.map(p => p.zona),  // Array zone aggiornato
       ha_limitazioni: updatedPains.length > 0,  // false se array vuoto
       last_modified_at: new Date().toISOString()
     })
   ```
4. Pulisce anche `limitazioni_fisiche` se contiene quella zona

**Cosa NON fa**: 
- ❌ NON aggiorna `limitazioni_compilato_at`
- ⚠️ Se rimuove tutti i dolori, `ha_limitazioni = false`, ma `limitazioni_compilato_at` rimane invariato

**Problema identificato**: Quando tutti i dolori sono rimossi, `ha_limitazioni = false` ma `limitazioni_compilato_at` potrebbe ancora avere un valore, causando potenziali problemi in `getSmartLimitationsCheck()`.

---

## 📊 SEZIONE 3: QUANDO INTERVIENE LLM vs LOGICA LOCALE

### 3.1 Quali messaggi vanno SEMPRE a LLM (OpenAI)?

#### **CONDIZIONI PER LLM GENERICA**

**Dove nel codice**: Righe 1608-1623 in `PrimeChat.tsx`

**Condizioni**:
1. ✅ Tutti gli stati `waitingFor*` sono `false`
2. ✅ Non è richiesta piano (`isPlanRequest === false`)
3. ✅ Non c'è risposta preimpostata (`presetResponse === null`)
4. ✅ `skipFallbackCheck === false` (o già processato)

**Esempi messaggi che vanno a LLM**:
- `"Come posso migliorare la resistenza?"`
- `"Consigli per la nutrizione"`
- `"Quale workout è meglio per oggi?"`
- `"Spiegami le funzionalità premium"`
- `"Quali sono i prossimi passi?"`
- Domande generali su fitness, nutrizione, motivazione

---

### 3.2 Quali messaggi NON vanno MAI a LLM?

#### **MESSAGGI INTERCETTATI PRIMA**

**1. Risposte a stati attivi (`waitingFor*`)**

Questi messaggi vengono intercettati PRIMA di arrivare a LLM:

- `waitingForPainResponse === true` → Gestito in BLOCCO 1
- `waitingForPainDetails === true` → Gestito in BLOCCO 2
- `waitingForPainPlanConfirmation === true` → Gestito in BLOCCO 3
- `waitingForPlanConfirmation === true` → Gestito in BLOCCO 4
- `waitingForModifyChoice === true` → Gestito in BLOCCO 5
- `awaitingLimitationsResponse === true` → Gestito in BLOCCO 11

**2. Richieste piano (`isPlanRequest === true`)**

Vanno a `getStructuredWorkoutPlan()` invece di LLM generica (BLOCCO 13)

**3. Risposte preimpostate (fallback)**

Se `getPrimeBotFallbackResponse()` trova match, NON va a LLM (BLOCCO 12)

---

### 3.3 Quali messaggi potrebbero andare a LLM MA vengono intercettati prima?

#### **POTENZIALI CONFLITTI**

**Conflitto 1: Messaggio che matcha più blocchi**

**Esempio**: `"procedi"`

- ✅ Matcha BLOCCO 4 (`waitingForPlanConfirmation`) - "procedi" è keyword conferma
- ✅ Matcha BLOCCO 5 (`waitingForModifyChoice`) - "procedi" è keyword per terminare modifica
- ✅ Potrebbe matchare fallback (ma non dovrebbe)

**Risoluzione**: Ordine di priorità → BLOCCO 4 viene prima di BLOCCO 5

---

**Conflitto 2: Keyword ambigue**

**Esempio**: `"piano"`

- ✅ Matcha `isPlanRequestForPainCheck` → va a generazione piano
- ✅ Potrebbe matchare fallback (ma non dovrebbe)
- ✅ Potrebbe essere interpretato come "piano generale" → dovrebbe andare a LLM

**Problema**: La regex `/piano|allenamento|.../i.test(trimmed)` è troppo ampia e intercetta anche "piano" generico

**Risoluzione attuale**: Non c'è distinzione tra "piano allenamento" e "piano generico"

---

**Conflitto 3: "no" come risposta vs nuovo messaggio**

**Esempio**: `"no"`

- ✅ Potrebbe essere risposta a `waitingForPainResponse` ("no" = dolore ancora presente)
- ✅ Potrebbe essere risposta a `waitingForPainPlanConfirmation` ("no" = rifiuta piano)
- ✅ Potrebbe essere nuovo messaggio → dovrebbe andare a LLM

**Problema**: Se `waitingForPainResponse === false`, "no" viene interpretato come nuovo messaggio

**Risoluzione attuale**: Dipende dallo stato attivo

---

### 3.4 Qual è il ruolo del "fallback" (primebot-fallback.ts)?

#### **SCOPO DEL FALLBACK**

**File**: `src/lib/primebot-fallback.ts`

**Scopo principale**: Fornire risposte **GRATUITE** (senza usare token AI) per domande comuni

**Vantaggi**:
- ✅ Risparmio costi OpenAI
- ✅ Risposte immediate (no latenza API)
- ✅ Risposte prevedibili per domande comuni

---

#### **QUANDO VIENE CHIAMATO**

**Dove nel codice**: Righe 1314-1373 in `PrimeChat.tsx`

**Condizioni**:
1. `skipFallbackCheck === false`
2. Tutti gli stati `waitingFor*` sono `false`
3. Non è richiesta piano (o non ancora processata)

**Ordine nel flusso**: DOPO gestione stati attivi, PRIMA di LLM generica

---

#### **KEYWORDS INTERCETTATE**

**Keywords Dolore**:
```typescript
const painKeywords = [
  'fa male', 'male', 'dolore', 'dolori', 'infortunio', 
  'infortunato', 'ferito', 'problema cardiaco', 'vertigini', 'svenimento'
];
```

**Keywords Piano**:
```typescript
const planKeywords = [
  'piano', 'allenamento', 'workout', 'esercizi', 'programma', 
  'scheda', 'creami', 'fammi', 'genera', 'crea un piano', 
  'fammi un piano', 'mi serve un piano', 'voglio un piano'
];
```

**Keywords Dolore Risolto** (FIX BUG 2):
```typescript
const painResolvedKeywords = [
  'dolore è passato', 'dolore mi è passato', 'non ho più dolore',
  'il dolore è passato', 'non fa più male', 'sto meglio',
  'sono guarito', 'è guarito', 'non mi fa più male', 'passato il dolore'
];
```

---

#### **LOGICA DECISIONALE FALLBACK**

```typescript
// 1. Se dolore risolto → passa a LLM (non intercettare)
if (isPainResolved) {
  return null; // Passa all'AI
}

// 2. Se dolore + richiesta piano → passa a LLM (usa whitelist automaticamente)
if (hasPainMention && hasPlanRequest) {
  return null; // Passa all'AI
}

// 3. Se solo dolore SENZA richiesta piano → mostra warning + chiedi conferma
if (hasPainMention && !hasPlanRequest) {
  return {
    text: "⚠️ Per questioni mediche... Vuoi comunque che ti crei un piano?",
    askForPlanConfirmation: true  // Setta waitingForPainPlanConfirmation
  };
}

// 4. Match esatto → ritorna risposta preimpostata
if (presetResponses[lowerMessage]) {
  return presetResponses[lowerMessage];
}

// 5. Nessun match → passa a LLM
return null;
```

---

#### **PUÒ CREARE CONFLITTI?**

**SÌ - Conflitti Potenziali**:

1. **Conflitto con BLOCCO 6** (Analisi dolore messaggio corrente):
   - Fallback intercetta "dolore" prima che arrivi a BLOCCO 6
   - Se `waitingForPainPlanConfirmation` viene settato, BLOCCO 6 non viene mai raggiunto
   - **Problema**: Doppio sistema per gestire dolore

2. **Conflitto con keywords ambigue**:
   - "piano" può essere intercettato sia da fallback che da `isPlanRequest`
   - Ordine di esecuzione: BLOCCO 13 (isPlanRequest) viene DOPO BLOCCO 12 (fallback)
   - Se fallback trova match per "piano", interrompe prima di arrivare a generazione piano

3. **Conflitto con "dolore risolto"**:
   - Fallback ha logica per "dolore risolto" (righe 98-120)
   - Ma BLOCCO 1 ha logica simile per `waitingForPainResponse`
   - Potenziale duplicazione logica

---

## 📊 SEZIONE 4: CONFLITTI IDENTIFICATI

### 4.1 Lista TUTTI i potenziali conflitti

#### **CONFLITTO 1: Doppio Sistema Gestione Dolore**

**Scenari**:
- **Fallback** intercetta "dolore" senza richiesta piano → chiede conferma
- **BLOCCO 6** intercetta "dolore + piano" nel messaggio → chiede dettagli

**Cosa succede attualmente**:
- Se utente dice solo "dolore": fallback chiede conferma → setta `waitingForPainPlanConfirmation`
- Se utente dice "dolore + piano": fallback passa a LLM → BLOCCO 6 intercetta dopo

**Cosa DOVREBBE succedere**:
- Sistema unificato per gestire dolore
- Un solo punto di decisione

**Dove fixare**: Unificare logica tra `primebot-fallback.ts` e BLOCCO 6

**Priorità**: 🟡 **MEDIA**

---

#### **CONFLITTO 2: Keyword "piano" ambigua**

**Scenari**:
- `"piano"` → intercettato da `isPlanRequest` → va a generazione piano
- `"piano generale"` → dovrebbe andare a LLM ma viene intercettato

**Cosa succede attualmente**:
- Regex `/piano|.../i.test(trimmed)` intercetta qualsiasi "piano"
- Non distingue tra "piano allenamento" e "piano generico"

**Cosa DOVREBBE succedere**:
- Distinzione tra contesti
- "piano" solo → LLM generica
- "piano allenamento" o "creami un piano" → generazione piano

**Dove fixare**: Migliorare regex in `isWorkoutPlanRequest()` (riga 60) e `isPlanRequestForPainCheck` (riga 1008)

**Priorità**: 🟡 **MEDIA**

---

#### **CONFLITTO 3: "no" come risposta vs nuovo messaggio**

**Scenari**:
- `"no"` quando `waitingForPainResponse === true` → risposta dolore
- `"no"` quando nessuno stato attivo → nuovo messaggio → dovrebbe andare a LLM

**Cosa succede attualmente**:
- Funziona correttamente se stato attivo
- Se nessuno stato attivo, "no" va a LLM generica (corretto)

**Cosa DOVREBBE succedere**:
- ✅ Già corretto - comportamento attuale è OK

**Dove fixare**: Nessun fix necessario

**Priorità**: ⚪ **N/A**

---

#### **CONFLITTO 4: "procedi" matcha più blocchi**

**Scenari**:
- `"procedi"` quando `waitingForPlanConfirmation === true` → conferma riepilogo
- `"procedi"` quando `waitingForModifyChoice === true` → termina modifica

**Cosa succede attualmente**:
- ✅ Già gestito - BLOCCO 4 viene prima di BLOCCO 5
- ✅ Ordine corretto

**Cosa DOVREBBE succedere**:
- ✅ Già corretto

**Dove fixare**: Nessun fix necessario

**Priorità**: ⚪ **N/A**

---

#### **CONFLITTO 5: getSmartLimitationsCheck ritorna needsToAsk DOPO salvataggio dolore**

**Scenari**:
- Utente salva dolore → `addPain()` eseguito
- Subito dopo, `getStructuredWorkoutPlan()` chiama `getSmartLimitationsCheck()`
- `getSmartLimitationsCheck()` ritorna `needsToAsk: true` perché `limitazioni_compilato_at` è null

**Cosa succede attualmente**:
- ❌ Chiede di nuovo limitazioni anche se dolore appena salvato
- ❌ `addPain()` NON setta `limitazioni_compilato_at`
- ❌ `addPain()` NON setta `limitazioni_fisiche`

**Cosa DOVREBBE succedere**:
- ✅ Non chiedere di nuovo limitazioni
- ✅ `addPain()` dovrebbe settare `limitazioni_compilato_at`
- ✅ `addPain()` dovrebbe settare `limitazioni_fisiche`

**Dove fixare**: `src/services/painTrackingService.ts` - `addPain()` (righe 150-158)

**Priorità**: 🔴 **ALTA**

---

#### **CONFLITTO 6: Safety note usa messaggio originale invece di zona database**

**Scenari**:
- Utente dice: `"gia ti ho detto il mio dolore"`
- Safety note mostra: `"Piano adattato per gia ti ho detto il mio dolore"`

**Cosa succede attualmente**:
- ❌ Safety note usa `limitationsCheck.limitations` (messaggio originale)
- ❌ `detectBodyPartFromMessage()` non trova zona in messaggio generico

**Cosa DOVREBBE succedere**:
- ✅ Safety note usa zona dal database (`user_pains`)
- ✅ Mostra: `"Piano adattato per il dolore al ginocchio sinistro"`

**Dove fixare**: `src/lib/openai-service.ts` - righe 758-769

**Priorità**: 🟡 **MEDIA**

---

#### **CONFLITTO 7: "petto" interpretato come dolore invece di zona target**

**Scenari**:
- Utente: `"creami un piano per il petto"`
- PrimeBot: `"Ho capito che hai dolore alla petto..."`

**Cosa succede attualmente**:
- ✅ **RISOLTO** - Funzione `isBodyPartForPain()` distingue contesto
- ✅ BLOCCO 6 usa `isPainContext` invece di `hasPainInMessage`

**Cosa DOVREBBE succedere**:
- ✅ Già corretto con FIX PROBLEMA 3

**Dove fixare**: ✅ **Già fixato**

**Priorità**: ⚪ **RISOLTO**

---

### 4.2 Per ogni conflitto: Scenario, Cosa succede, Cosa dovrebbe succedere, Dove fixare

Vedi tabella sopra nella sezione 4.1 per dettagli completi.

---

## 📊 SEZIONE 5: KEYWORD ANALYSIS

### 5.1 Tabella di TUTTE le keywords utilizzate

| Keyword/Pattern | File | Riga | Scopo | Potenziale Conflitto |
|-----------------|------|------|-------|---------------------|
| `'piano'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ⚠️ Troppo ampia - intercetta "piano" generico |
| `'allenamento'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ✅ OK |
| `'workout'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ✅ OK |
| `'scheda'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ✅ OK |
| `'programma'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ⚠️ Potrebbe intercettare "programma" generico |
| `'esercizi'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ⚠️ Troppo ampia - intercetta domande su esercizi |
| `'allena'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ✅ OK |
| `'creami'` | `PrimeChat.tsx` | 1008 | Rileva richiesta piano | ✅ OK |
| `'dolore'` | `primebot-fallback.ts` | 123 | Rileva menzione dolore | ⚠️ Conflitto con BLOCCO 6 |
| `'dolori'` | `primebot-fallback.ts` | 123 | Rileva menzione dolore | ⚠️ Conflitto con BLOCCO 6 |
| `'male'` | `primebot-fallback.ts` | 123 | Rileva menzione dolore | ⚠️ Ambiguo - può essere "male" come avverbio |
| `'fa male'` | `primebot-fallback.ts` | 123 | Rileva menzione dolore | ✅ OK |
| `'infortunio'` | `primebot-fallback.ts` | 123 | Rileva menzione dolore | ✅ OK |
| `'dolore è passato'` | `primebot-fallback.ts` | 99 | Rileva dolore risolto | ✅ OK - FIX BUG 2 |
| `'non ho più dolore'` | `primebot-fallback.ts` | 99 | Rileva dolore risolto | ✅ OK - FIX BUG 2 |
| `'passato'` | `PrimeChat.tsx` | 396 | Rileva dolore passato | ⚠️ Ambiguo - può essere "passato" come tempo |
| `'meglio'` | `PrimeChat.tsx` | 397 | Rileva dolore passato | ⚠️ Ambiguo - può essere "sto meglio" per altro |
| `'guarito'` | `PrimeChat.tsx` | 398 | Rileva dolore passato | ✅ OK |
| `'sì'` / `'si'` | `PrimeChat.tsx` | 400, 820, 645 | Conferma generica | ⚠️ Ambiguo - può essere conferma a qualsiasi cosa |
| `'ok'` | `PrimeChat.tsx` | 400, 822, 647 | Conferma generica | ⚠️ Ambiguo - può essere conferma a qualsiasi cosa |
| `'procedi'` | `PrimeChat.tsx` | 823, 896, 648 | Conferma generica | ⚠️ Matcha più blocchi (ma gestito con ordine) |
| `'ancora'` | `PrimeChat.tsx` | 426 | Rileva dolore presente | ⚠️ Ambiguo - "ancora" può essere avverbio tempo |
| `'no'` | `PrimeChat.tsx` | 428, 654 | Rifiuto/Negazione | ⚠️ Ambiguo - può essere risposta o nuovo messaggio |
| `'modifica'` | `PrimeChat.tsx` | 840 | Richiesta modifica | ✅ OK |
| `'cambia'` | `PrimeChat.tsx` | 840 | Richiesta modifica | ✅ OK |
| `'spalla'`, `'schiena'`, `'ginocchio'`, etc. | `bodyPartExclusions.ts` | 4-17 | Rileva zona corpo | ⚠️ Conflitto PROBLEMA 3 (risolto con `isBodyPartForPain()`) |

---

### 5.2 Keywords AMBIGUE

#### **Keyword 1: "piano"**

**Problema**: Intercetta sia "piano allenamento" che "piano generale"

**Esempi ambigui**:
- ✅ `"creami un piano"` → Piano allenamento (corretto)
- ✅ `"voglio un piano"` → Piano allenamento (corretto)
- ❌ `"piano"` → Dovrebbe andare a LLM (attualmente intercettato)
- ❌ `"piano generale"` → Dovrebbe andare a LLM (attualmente intercettato)

**Soluzione proposta**: Migliorare regex per richiedere contesto:
```typescript
// PRIMA (troppo ampia)
/piano|allenamento|.../i.test(trimmed)

// DOPO (più specifica)
/(piano|programma|scheda).*(allenamento|fitness|workout)|creami.*piano|fammi.*piano|voglio.*piano/i.test(trimmed)
```

---

#### **Keyword 2: "passato"**

**Problema**: Può significare "dolore passato" o "tempo passato"

**Esempi ambigui**:
- ✅ `"il dolore è passato"` → Dolore passato (corretto)
- ✅ `"passato"` (risposta a domanda dolore) → Dolore passato (corretto)
- ⚠️ `"ho passato l'esame"` → Potrebbe essere interpretato come dolore passato (falso positivo)

**Soluzione proposta**: Richiedere contesto:
```typescript
// PRIMA
userMessageLower.includes('passato')

// DOPO (più specifico)
userMessageLower.includes('dolore è passato') || 
userMessageLower.includes('dolore mi è passato') ||
(userMessageLower.includes('passato') && currentPainZone !== null) // Solo se in contesto dolore
```

---

#### **Keyword 3: "no"**

**Problema**: Può essere risposta a domanda o nuovo messaggio

**Esempi ambigui**:
- ✅ `"no"` quando `waitingForPainResponse === true` → Risposta dolore (corretto)
- ✅ `"no"` quando nessuno stato attivo → Nuovo messaggio → LLM (corretto)
- ⚠️ `"no, non voglio"` → Potrebbe essere risposta o nuovo messaggio

**Soluzione proposta**: Mantenere logica attuale (gestione per contesto)

---

## 📊 SEZIONE 6: GESTIONE RIMOZIONE DOLORE

### 6.1 Esiste una funzione per RIMUOVERE un dolore dal database?

**SÌ - Funzioni disponibili**:

#### **Funzione 1: `removePain(userId, zona)`**

**File**: `src/services/painTrackingService.ts` - righe 174-238

**Cosa fa**:
1. Normalizza zona (`detectBodyPartFromMessage()`)
2. Recupera dolori esistenti
3. Filtra via il dolore specifico
4. Aggiorna database:
   - `zone_dolori_dettagli`: rimuove elemento
   - `zone_evitare`: aggiorna array
   - `ha_limitazioni`: `false` se array vuoto
5. Pulisce `limitazioni_fisiche` se contiene quella zona

**Quando viene chiamata**: 
- `handlePainGone()` in `usePainTracking.ts` (riga 64-85)
- Chiamato quando utente risponde che dolore è passato (BLOCCO 1, righe 416-421)

**Viene chiamata?**: ✅ **SÌ** - Quando utente dice che dolore è passato

---

#### **Funzione 2: `removeAllPains(userId)`**

**File**: `src/services/painTrackingService.ts` - righe 243-265

**Cosa fa**:
1. Aggiorna database:
   - `zone_dolori_dettagli`: `[]`
   - `zone_evitare`: `[]`
   - `ha_limitazioni`: `false`
   - `limitazioni_fisiche`: `null`

**Quando viene chiamata**: 
- `handleAllPainsGone()` in `usePainTracking.ts` (riga 99-120)
- Chiamato quando utente dice "tutti i dolori sono passati" (BLOCCO 1, righe 406-411)

**Viene chiamata?**: ✅ **SÌ** - Quando utente dice che tutti i dolori sono passati

---

### 6.2 Cosa succede nel database quando...

#### **UTENTE AGGIUNGE DOLORE**

**Funzione**: `addPain()` - righe 123-169 in `painTrackingService.ts`

**Cosa fa nel database**:
```typescript
await supabase
  .from('user_onboarding_responses')
  .upsert({
    user_id: userId,
    zone_dolori_dettagli: updatedPains,  // Array con nuovo dolore
    zone_evitare: updatedPains.map(p => p.zona),  // Array zone aggiornato
    ha_limitazioni: true,  // ✅ Setta a true
    last_modified_at: new Date().toISOString()
    // ❌ NON setta limitazioni_compilato_at
    // ❌ NON setta limitazioni_fisiche
  }, { onConflict: 'user_id' });
```

**Problema**: 
- ❌ `limitazioni_compilato_at` non viene settato
- ❌ `limitazioni_fisiche` non viene settato
- ⚠️ Questo causa `needsToAsk: true` in `getSmartLimitationsCheck()`

---

#### **UTENTE DICE CHE DOLORE È PASSATO**

**Funzione**: `removePain()` - righe 174-238

**Cosa fa nel database**:
```typescript
await supabase
  .from('user_onboarding_responses')
  .update({
    zone_dolori_dettagli: updatedPains,  // Array senza dolore rimosso
    zone_evitare: updatedPains.map(p => p.zona),
    ha_limitazioni: updatedPains.length > 0,  // false se array vuoto
    last_modified_at: new Date().toISOString()
  })
  .eq('user_id', userId);

// Pulisce anche limitazioni_fisiche se contiene quella zona
if (containsZona) {
  await supabase
    .from('user_onboarding_responses')
    .update({ limitazioni_fisiche: null })
    .eq('user_id', userId);
}
```

**Cosa NON fa**:
- ❌ NON aggiorna `limitazioni_compilato_at`
- ⚠️ Se rimuove tutti i dolori, `ha_limitazioni = false` ma `limitazioni_compilato_at` potrebbe ancora avere valore

---

#### **UTENTE RICHIEDE PIANO**

**Cosa succede**:
1. `getStructuredWorkoutPlan()` viene chiamato
2. Chiama `getSmartLimitationsCheck()` (righe 383-404 in `openai-service.ts`)
3. `getSmartLimitationsCheck()` legge dal database:
   - `ha_limitazioni`
   - `limitazioni_fisiche`
   - `limitazioni_compilato_at`
   - `zone_dolori_dettagli` (via `getUserPains()`)

**Se `needsToAsk === true`**:
- Ritorna `question` invece di generare piano
- Setta `awaitingLimitationsResponse = true`

**Se `needsToAsk === false`**:
- Genera piano considerando limitazioni dal database

---

## 📊 SEZIONE 7: RACCOMANDAZIONI

### 7.1 Lista prioritizzata di tutti i fix necessari

#### **PRIORITÀ ALTA (Blocca funzionalità)**

**1. FIX PROBLEMA 1: `addPain()` non setta `limitazioni_compilato_at`**
- **File**: `src/services/painTrackingService.ts` - righe 150-158
- **Fix**: Aggiungere `limitazioni_compilato_at: new Date().toISOString()` in `addPain()`
- **Fix**: Aggiungere `limitazioni_fisiche: zone_dolori_dettagli.map(p => p.zona).join(', ')`
- **Impatto**: Risolve conflitto dove chiede limitazioni dopo salvataggio dolore

---

**2. FIX PROBLEMA 2: Safety note usa messaggio originale**
- **File**: `src/lib/openai-service.ts` - righe 758-769
- **Fix**: Usare `getUserPains()` per recuperare zona dal database
- **Impatto**: Safety note mostra zona corretta invece di messaggio generico

---

#### **PRIORITÀ MEDIA (Migliora UX)**

**3. FIX Conflitto Doppio Sistema Gestione Dolore**
- **File**: `src/lib/primebot-fallback.ts` + `src/components/PrimeChat.tsx`
- **Fix**: Unificare logica tra fallback e BLOCCO 6
- **Impatto**: Sistema più coerente e prevedibile

---

**4. FIX Keyword "piano" ambigua**
- **File**: `src/components/PrimeChat.tsx` - righe 60-77, 1008
- **Fix**: Migliorare regex per richiedere contesto
- **Impatto**: "piano" generico va a LLM, "piano allenamento" genera piano

---

**5. FIX Keyword "passato" ambigua**
- **File**: `src/components/PrimeChat.tsx` - righe 396-401
- **Fix**: Richiedere contesto dolore per keyword "passato"
- **Impatto**: Riduce falsi positivi

---

#### **PRIORITÀ BASSA (Ottimizzazioni)**

**6. FIX Rimozione dolore non aggiorna `limitazioni_compilato_at`**
- **File**: `src/services/painTrackingService.ts` - `removePain()` e `removeAllPains()`
- **Fix**: Quando tutti i dolori rimossi, settare `limitazioni_compilato_at` a null
- **Impatto**: Coerenza database migliorata

---

### 7.2 Proponi una struttura più chiara per evitare conflitti futuri

#### **ARCHITETTURA PROPOSTA**

**1. Sistema Stati Centralizzato**

Creare un enum o costanti per gli stati:

```typescript
enum PrimeBotState {
  IDLE = 'idle',
  WAITING_FOR_PAIN_RESPONSE = 'waiting_for_pain_response',
  WAITING_FOR_PAIN_DETAILS = 'waiting_for_pain_details',
  WAITING_FOR_PLAN_CONFIRMATION = 'waiting_for_plan_confirmation',
  WAITING_FOR_MODIFY_CHOICE = 'waiting_for_modify_choice',
  WAITING_FOR_PAIN_PLAN_CONFIRMATION = 'waiting_for_pain_plan_confirmation',
  AWAITING_LIMITATIONS_RESPONSE = 'awaiting_limitations_response'
}

const [botState, setBotState] = useState<PrimeBotState>(PrimeBotState.IDLE);
```

**Vantaggi**:
- ✅ Stati mutuamente esclusivi garantiti
- ✅ Più facile debuggare (un solo stato attivo)
- ✅ Logica più chiara

---

**2. Sistema Router per Messaggi**

Creare un router che decide quale handler chiamare:

```typescript
function routeMessage(message: string, state: PrimeBotState): MessageHandler {
  // 1. Check stati attivi
  if (state !== PrimeBotState.IDLE) {
    return getStateHandler(state);
  }
  
  // 2. Check richiesta piano
  if (isWorkoutPlanRequest(message)) {
    return workoutPlanHandler;
  }
  
  // 3. Check fallback
  const fallbackResponse = getPrimeBotFallbackResponse(message);
  if (fallbackResponse) {
    return fallbackHandler;
  }
  
  // 4. Default: LLM
  return llmHandler;
}
```

**Vantaggi**:
- ✅ Logica centralizzata
- ✅ Ordine di priorità esplicito
- ✅ Facile aggiungere nuovi handler

---

**3. Unificare Gestione Dolore**

Creare un unico sistema per gestire dolore:

```typescript
function handlePainDetection(message: string): PainDetectionResult {
  const bodyPart = detectBodyPartFromMessage(message);
  if (!bodyPart) return { type: 'none' };
  
  const context = isBodyPartForPain(message, bodyPart);
  
  if (context === 'pain') {
    return { type: 'pain', bodyPart };
  } else if (context === 'target') {
    return { type: 'target', bodyPart };
  }
  
  return { type: 'none' };
}
```

**Vantaggi**:
- ✅ Logica unificata
- ✅ Elimina duplicazione tra fallback e BLOCCO 6
- ✅ Più facile da mantenere

---

**4. Sistema Keyword Più Specifico**

Migliorare rilevamento keywords:

```typescript
const WORKOUT_PLAN_PATTERNS = [
  /creami.*piano/i,
  /fammi.*piano/i,
  /voglio.*piano/i,
  /(piano|programma|scheda).*(allenamento|fitness|workout)/i,
  /allenamento.*per/i,
  /workout.*per/i
];

function isWorkoutPlanRequest(text: string): boolean {
  return WORKOUT_PLAN_PATTERNS.some(pattern => pattern.test(text));
}
```

**Vantaggi**:
- ✅ Più specifico
- ✅ Riduce falsi positivi
- ✅ Facile aggiungere nuovi pattern

---

## 📊 DIAGRAMMA FLUSSO DECISIONALE COMPLETO

```
┌─────────────────────────────────────────────────────────┐
│                   MESSAGGIO UTENTE                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ CONTROLLI PRELIMINARI │
         │ - skipUserMessageAdd  │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ STATI ATTIVI?    │    │ NO STATI ATTIVI  │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
    ┌────┴────┐                 │
    │         │                 │
    ▼         ▼                 ▼
[BLOCCO 1] [BLOCCO 2-5]   [BLOCCO 6-8]
waitingFor*   Altri stati   Check dolore
                              Check riepilogo
    │         │                 │
    └────┬────┘                 │
         │                       │
         ▼                       ▼
┌─────────────────────────────────┐
│   GESTIONE LIMITAZIONI          │
│   (BLOCCO 11)                   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   SISTEMA FALLBACK              │
│   (BLOCCO 12)                   │
│   - Risposte preimpostate       │
│   - Keywords dolore             │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌─────────────┐  ┌─────────────┐
│ RICHIESTA   │  │ LLM GENERICA│
│ PIANO?      │  │ (BLOCCO 14) │
│ (BLOCCO 13) │  │             │
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────────────────────────┐
│   GENERAZIONE PIANO             │
│   getStructuredWorkoutPlan()    │
└─────────────────────────────────┘
```

---

## 📊 TABELLA CONFLITTI CON PRIORITÀ

| # | Conflitto | Priorità | File da Fixare | Complessità |
|---|-----------|----------|----------------|-------------|
| 1 | Doppio sistema gestione dolore | 🟡 Media | `primebot-fallback.ts` + `PrimeChat.tsx` | Media |
| 2 | Keyword "piano" ambigua | 🟡 Media | `PrimeChat.tsx` (righe 60, 1008) | Bassa |
| 3 | "no" ambiguo | ⚪ Bassa | Nessuno (già gestito) | N/A |
| 4 | "procedi" matcha più blocchi | ⚪ Bassa | Nessuno (già gestito) | N/A |
| 5 | getSmartLimitationsCheck dopo salvataggio | 🔴 Alta | `painTrackingService.ts` (riga 150) | Bassa |
| 6 | Safety note messaggio sbagliato | 🔴 Alta | `openai-service.ts` (riga 758) | Media |
| 7 | "petto" come dolore | ⚪ Risolto | ✅ Già fixato | N/A |

---

## 📊 PIANO D'AZIONE PER I FIX

### **FASE 1: Fix Critici (Priorità Alta)**

1. **FIX PROBLEMA 1**: Aggiornare `addPain()` per settare `limitazioni_compilato_at` e `limitazioni_fisiche`
2. **FIX PROBLEMA 2**: Usare `getUserPains()` per safety note invece di `limitationsCheck.limitations`

### **FASE 2: Fix Miglioramenti (Priorità Media)**

3. **FIX Conflitto Doppio Sistema**: Unificare logica dolore tra fallback e BLOCCO 6
4. **FIX Keyword "piano"**: Migliorare regex per richiedere contesto

### **FASE 3: Ottimizzazioni (Priorità Bassa)**

5. **FIX Rimozione dolore**: Aggiornare `limitazioni_compilato_at` quando tutti i dolori rimossi
6. **REFACTOR Architettura**: Implementare sistema stati centralizzato (opzionale, lungo termine)

---

**Documento creato**: 28 Novembre 2025  
**Stato**: Analisi completata - Pronto per implementazione fix

