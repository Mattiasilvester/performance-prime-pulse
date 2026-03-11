# ANALISI: PrimeBot Personalizzazione — app-user (Performance Prime)

**Data:** 11 Marzo 2026  
**Scope:** `packages/app-user/` + backend API OpenAI — solo analisi, nessuna modifica.

---

## 1. Edge Function PrimeBot

### 1.1 Esistenza

- **In `supabase/functions/` non esiste** alcuna Edge Function dedicata a PrimeBot, chat o AI Coach.
- Le uniche Edge Function presenti riguardano: admin, stripe, paypal, send-push-notification, send-scheduled-notifications, subscription-reminders, ensure-partner-subscription, send-test-email, ecc.

### 1.2 Dove viene chiamata l’API OpenAI

Le chiamate OpenAI per PrimeBot **non** passano da Supabase Edge Functions. Passano da:

- **Sviluppo:** server proxy Node `server/api-proxy.js` (script `dev:api` dalla root del monorepo), in ascolto su `http://localhost:3001/api/ai-chat`.
- **Produzione:** funzione serverless Vercel `api/ai-chat.ts` (rewrite in `vercel.json`: `/api/ai-chat` → `api/ai-chat.ts`).

Il client fa sempre `fetch('/api/ai-chat', { method: 'POST', body: JSON.stringify({ messages, model }) })`. In produzione la richiesta viene gestita da Vercel; in sviluppo serve avviare il proxy (`npm run dev:api` dalla root) e, se l’app gira su un altro port (es. 5173), serve un proxy Vite che inoltri `/api/ai-chat` al proxy (attualmente il proxy è definito nel `vite.config.ts` della root del repo, non in `packages/app-user`).

### 1.3 Contenuto di `api/ai-chat.ts` (produzione)

**Path:** `api/ai-chat.ts` (root del repo)

```ts
// Sintesi: riceve body { messages, model }, usa OPENAI_API_KEY da process.env,
// chiama https://api.openai.com/v1/chat/completions con messages, temperature 0.7, max_tokens 500.
// Non costruisce nessun system prompt: si limita a inoltrare il payload.
```

- **System prompt:** **non** è costruito nella Edge Function / serverless. Viene costruito **solo lato client** in `packages/app-user/src/lib/openai-service.ts` e inviato come primo messaggio nel array `messages` (role: `system`).
- **Variabili utente:** nessuna iniettata in `api/ai-chat.ts`; tutto ciò che è “personalizzato” arriva già dentro `messages` dal client.

---

## 2. Dati onboarding disponibili

### 2.1 Tabella

- **Tabella:** `user_onboarding_responses` (Supabase).
- **Chiave:** `user_id` (un record per utente; upsert con `onConflict: 'user_id'`).

### 2.2 Colonne (da `integrations/supabase/types.ts` e `onboardingService`)

| Colonna | Tipo | Salvata in onboarding | Usata in UserContext | Iniettata nel prompt |
|--------|------|------------------------|----------------------|-----------------------|
| user_id | string | sì | — | no |
| obiettivo | string | sì (Step 1) | sì → obiettivi[] | sì |
| livello_esperienza | string | sì (Step 2) | sì → livello_fitness_it | sì |
| giorni_settimana | number | sì (Step 2) | sì | sì |
| luoghi_allenamento | Json (array) | sì (Step 3) | sì | sì |
| tempo_sessione | number (15/30/45/60) | sì (Step 3) | sì → tempo_allenamento | sì |
| possiede_attrezzatura | boolean | sì (Step 3) | sì (per buildEquipmentList) | sì (attrezzatura) |
| attrezzi | string[] | sì (Step 3) | sì | sì |
| altri_attrezzi | string | sì (Step 3) | sì | sì |
| nome | string | sì (Step 4) | sì | sì |
| eta | number | sì (Step 4) | sì | **no** |
| peso | number | sì (Step 4) | sì | **no** |
| altezza | number | sì (Step 4) | sì | **no** |
| consigli_nutrizionali | boolean | sì (Step 4) | sì | sì |
| ha_limitazioni | boolean | sì (Step 5) | sì | sì (se true + descrizione) |
| limitazioni_fisiche | string | sì (Step 5) | sì → limitazioni_descrizione | sì |
| zone_evitare | string[] | sì (Step 5) | sì → zone_da_proteggere | sì |
| condizioni_mediche | string | sì (Step 5) | sì → note_mediche | sì |
| allergie_alimentari | string[] | sì (Step 5, se presente) | **no** (non mappato in UserContext) | **no** |
| limitazioni_compilato_at | string | sì (Step 5) | usato internamente | no |
| onboarding_completed_at | string | sì (fine onboarding) | sì → flag | no (solo regole) |
| zone_dolori_dettagli | Json | (pain tracking / altro) | non usato in getUserContext | no |
| created_at, last_modified_at | string | automatici | no | no |

### 2.3 Salvataggio: step per step

I dati vengono salvati **a ogni step** dell’onboarding tramite `onboardingService.saveOnboardingData(userId, payload)` da `useOnboardingNavigation.ts`:

- Step 1 → `obiettivo`
- Step 2 → `livello_esperienza`, `giorni_settimana`
- Step 3 → `luoghi_allenamento`, `tempo_sessione`, `possiede_attrezzatura`, `attrezzi`, `altri_attrezzi`
- Step 4 → `nome`, `eta`, `peso`, `altezza`, `consigli_nutrizionali`
- Step 5 → `ha_limitazioni`, `limitazioni_fisiche`, `zone_evitare`, `condizioni_mediche`, `allergie_alimentari` (e simili), poi `markOnboardingComplete` imposta `onboarding_completed_at`

Upsert su `user_id`, quindi un solo record per utente aggiornato a ogni step.

---

## 3. Servizio PrimeBotContext (lato client)

### 3.1 File

- **Path:** `packages/app-user/src/services/primebotUserContextService.ts`

### 3.2 Cosa fa

- **getUserContext(userId):**  
  - Chiama `onboardingService.loadOnboardingData(userId)` (tabella `user_onboarding_responses`).  
  - Chiama `fetchUserProfile()` per il nome (fallback se manca in onboarding).  
  - Costruisce un oggetto **UserContext** (nome, eta, peso, altezza, obiettivi, livello_fitness, attrezzatura, tempo_allenamento, luoghi, giorni_settimana, consigli_nutrizionali, limitazioni, zone_da_proteggere, note_mediche, ecc.).  
  - **Non** chiama nessuna Edge Function: è solo client + Supabase.
- **formatUserContextForPrompt(context):**  
  Trasforma il `UserContext` in un unico testo in linguaggio naturale (nome, obiettivi, livello, attrezzatura, tempo, luoghi, giorni, consigli nutrizionali, limitazioni, zone da non sollecitare, note mediche).  
  **Non** include: `eta`, `peso`, `altezza`.
- **updatePrimeBotPreferences(userId, context):**  
  Aggiorna la tabella `primebot_preferences` (livello, obiettivi, tipi workout, onboarding_completed, ecc.). Usato per persistenza preferenze, non per costruire il prompt.

### 3.3 Interazione con “Edge Function”

- Non c’è Edge Function PrimeBot.  
- Il contesto viene usato **solo lato client** in `openai-service.ts`: si chiama `getUserContext(userId)` e `formatUserContextForPrompt(userContext)` e il risultato viene aggiunto al **system prompt** che il client invia in `messages` a `/api/ai-chat`.  
- L’API (`api/ai-chat.ts` o `server/api-proxy.js`) riceve già il system prompt completo e lo inoltra a OpenAI così com’è.

---

## 4. Componente chat PrimeBot

### 4.1 Componente principale

- **Path:** `packages/app-user/src/components/PrimeChat.tsx`
- Utilizza `getAIResponse` da `@/lib/openai-service` e servizi da `@/services/primebotUserContextService` (es. reset limitazioni, parse limitazioni da chat).

### 4.2 Chiamata alla “backend” e payload

La chiamata avviene in `openai-service.ts`, non in PrimeChat. PrimeChat fa solo:

```ts
const aiResponse = await getAIResponse(trimmed, userId, currentSessionId || undefined);
```

**In `openai-service.ts` (getAIResponse):**

1. Si recupera il contesto: `userContext = await getUserContext(userId)` e `userContextString = formatUserContextForPrompt(userContext)`.
2. Si recupera la cronologia conversazione (se `sessionId`) da `getSessionHistory` → `formatHistoryForOpenAI`.
3. Si costruisce il system prompt (vedi sotto) includendo `userContextString` nella sezione "CONTESTO UTENTE".
4. Si costruisce l’array `messages`: `[ { role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: message } ]`.
5. Si chiama:

```ts
response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    model: 'gpt-3.5-turbo'
  })
});
```

- **Non** si passa uno `userId` o `userProfile` separato nel body: l’utente è identificato solo dal fatto che il system prompt (costruito lato client) contiene già il contesto derivato da quel `userId` (e da Supabase).
- Il system prompt è **sempre** costruito nel client e inviato come primo messaggio; l’API non lo modifica.

### 4.3 System prompt: statico vs dinamico

- **Base fissa:** “Sei PrimeBot, l’AI Coach personale [di {nome}] su Performance Prime…” + regole (struttura risposte, personalità, azioni, gestione dolori/limitazioni, ecc.).
- **Dinamico:**  
  - Nome: `nomeUtente` da `userContext?.nome` (se presente e ≠ "Utente") → usato in “Coach personale di {nome}” e in “Chiama l’utente per nome ({nome})”.  
  - Blocco **CONTESTO UTENTE:** aggiunto solo se `userContextString` non è vuoto (cioè se `getUserContext` e `formatUserContextForPrompt` hanno prodotto testo). Contiene: nome, obiettivi, livello fitness, attrezzatura, tempo sessione, luoghi, giorni/settimana, consigli nutrizionali, limitazioni, zone da non sollecitare, note mediche.  
  **Non** include mai età, peso, altezza (mancano in `formatUserContextForPrompt`).

---

## 5. Sicurezza API Key

- **Frontend:**  
  - Il codice dichiara deprecato l’uso di `VITE_OPENAI_API_KEY` e indica di usare l’endpoint `/api/ai-chat`.  
  - In `packages/app-user` non risulta uso di `import.meta.env.VITE_OPENAI` o chiave OpenAI nel client per le chiamate chat; la chiave è presente in `.env.example` come `VITE_OPENAI_API_KEY` (per eventuale uso legacy o altro), ma il flusso PrimeBot usa solo `fetch('/api/ai-chat')`.
- **Backend:**  
  - **api/ai-chat.ts (Vercel):** legge `process.env.OPENAI_API_KEY` e la usa nell’header `Authorization` verso `api.openai.com`.  
  - **server/api-proxy.js (dev):** legge `OPENAI_API_KEY` da `.env` e la usa allo stesso modo.  
Quindi la chiave OpenAI **non** è esposta nel bundle frontend per il flusso PrimeBot; passa solo dal backend (serverless o proxy).

---

## 6. Test / dati hardcoded nel system prompt

- Non c’è nessun nome o obiettivo utente hardcoded tipo “Sei un coach per Marco” o “obiettivo: perdere peso”.  
- Il prompt è generico più un blocco “CONTESTO UTENTE” generato a partire da `UserContext` reale (onboarding + profilo).  
- Se `getUserContext` fallisce, si usa un contesto di default (nome “Utente”, obiettivi “fitness generale”, livello “principiante”, attrezzatura “corpo libero”, nessuna limitazione, ecc.) e il prompt resta comunque “dinamico” ma con valori default.

---

## 7. Valutazione: system prompt personalizzato o generico?

- **Personalizzato in parte:**  
  - Nome utente (se presente).  
  - Obiettivi, livello, attrezzatura, tempo sessione, luoghi, giorni/settimana, consigli nutrizionali, limitazioni fisiche, zone da proteggere, note mediche: tutti inclusi nel blocco CONTESTO UTENTE quando disponibili.  
- **Generico per:**  
  - Età, peso, altezza: **non** inseriti nel prompt (anche se presenti in `UserContext` e in DB).  
  - Allergie alimentari: **non** in `UserContext` e **non** nel prompt (ma presenti in `user_onboarding_responses`).

Quindi il system prompt è **parzialmente personalizzato**: tutto ciò che è in `formatUserContextForPrompt` è usato; il resto dei dati onboarding (eta, peso, altezza, allergie) è disponibile in DB ma non usato nel prompt.

---

## 8. Dati onboarding disponibili ma NON usati nel system prompt

| Dato | Dove esiste | Nel UserContext? | Nel prompt? |
|------|-------------|-------------------|------------|
| eta | user_onboarding_responses, OnboardingResponse | sì | no |
| peso | user_onboarding_responses, OnboardingResponse | sì | no |
| altezza | user_onboarding_responses, OnboardingResponse | sì | no |
| allergie_alimentari | user_onboarding_responses, OnboardingResponse | no (non mappato) | no |
| zone_dolori_dettagli | user_onboarding_responses (tabella) | no (non usato in getUserContext) | no |

---

## 9. Riepilogo: cosa funziona, cosa manca, cosa fixare

### Funziona

- Recupero contesto da `user_onboarding_responses` e profilo (nome) e costruzione di `UserContext`.
- Iniezione nel system prompt di: nome, obiettivi, livello, attrezzatura, tempo, luoghi, giorni/settimana, consigli nutrizionali, limitazioni, zone da proteggere, note mediche.
- Chiamata a OpenAI tramite backend (Vercel o proxy) senza esporre la API key nel frontend.
- Cronologia conversazione e sessionId usati per contesto multi-turn.
- Aggiornamento `primebot_preferences` per persistenza preferenze.

### Manca / gap

1. **eta, peso, altezza** non vengono mai aggiunti al testo del system prompt (mancano in `formatUserContextForPrompt`), pur essendo in `UserContext` e in DB.
2. **allergie_alimentari** non sono mappate in `UserContext` e non compaiono nel prompt, pur essendo salvate in onboarding (Step 5).
3. **zone_dolori_dettagli** (tabella) non sono lette/usate in `getUserContext` né nel prompt.

### Cosa fixare (priorità)

1. **Personalizzazione prompt:** in `formatUserContextForPrompt` aggiungere, se presenti:  
   - età (eta), peso, altezza (es. una riga tipo “Ha X anni, peso Y kg, altezza Z cm” per consigli più mirati).  
   - allergie alimentari: prima includerle in `UserContext` da `onboardingData.allergie_alimentari`, poi aggiungerle al testo (es. “Allergie alimentari: …”).
2. **zone_dolori_dettagli:** valutare se debbano entrare nel contesto PrimeBot (es. lettura da `user_onboarding_responses` o da pain tracking) e, in caso, aggiungerle a `UserContext` e a `formatUserContextForPrompt`.
3. **API key:** confermare che in produzione nessun codice usi `VITE_OPENAI_API_KEY` per chiamate OpenAI e che sia usato solo `OPENAI_API_KEY` lato server (Vercel / proxy).

---

*Fine report — solo analisi, nessuna modifica al codice.*
