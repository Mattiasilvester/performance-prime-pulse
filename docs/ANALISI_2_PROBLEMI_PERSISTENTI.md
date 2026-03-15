# ANALISI — 2 problemi persistenti
# app-user — Performance Prime

*(Solo analisi, nessuna modifica al codice.)*

---

## DOMANDA 1 — Origine "& &p" in safetyNotes

### 1. System prompt di getStructuredWorkoutPlan e sezione safetyNotes

**File:** `packages/app-user/src/lib/openai-service.ts`

Il system prompt per il piano allenamento **non** definisce un vero “schema JSON” con tipo per `safetyNotes`: il campo è introdotto solo tramite **esempio** e **istruzioni testuali**.

- **Esempio nel prompt (righe 674-677):**
  - Se ci sono limitazioni, all’`examplePlan` viene assegnato:
  - `examplePlan.safetyNotes = \`Piano adattato per ${limitationsCheck.limitations}. Gli esercizi sono stati selezionati per evitare stress sulla zona interessata.\``
  - Quindi nel prompt GPT vede una stringa **plain** (niente markdown) nell’esempio.

- **Istruzione esplicita (righe 684-686, 702-704):**
```text
IMPORTANTE: Se l'utente ha limitazioni fisiche, il JSON DEVE includere:
- "safetyNotes": stringa che spiega l'adattamento del piano. DEVI usare ESATTAMENTE questa frase: "Piano adattato per ..."
...
IMPORTANTE: Il JSON DEVE includere il campo "therapeuticAdvice" con i consigli terapeutici e "safetyNotes" con una nota di sicurezza.
```

Quindi nel prompt:
- **safetyNotes è descritto solo come “stringa” / “nota di sicurezza”**, mai come “markdown”.
- L’esempio è **testo plain**.
- GPT può comunque restituire testo con artefatti (es. `& &p`) o formattazione non richiesta.

Subito **dopo** il parsing della risposta OpenAI (righe 882-931), il codice **sovrascrive** `plan.safetyNotes` quando ci sono limitazioni:

- **Righe 916-929:** viene impostato un testo **con markdown** (`**Nota di sicurezza**`):
  - Es. singola zona:  
    `plan.safetyNotes = \`⚠️ **Nota di sicurezza**: Piano adattato per il dolore ${preposition}${zona}. ...\``
  - Stesso stile per più zone e per il fallback.

Quindi:
- **Con limitazioni:** la fonte di `safetyNotes` è il nostro codice (testo con `**`). `stripMarkdown` rimuove il bold; eventuale `& &p` in quel ramo può arrivare solo se qualcosa lo inietta prima (es. `zona` / `zonesText`).
- **Senza limitazioni:** `safetyNotes` viene **solo** dalla risposta JSON di GPT; lì è plausibile che compaiano artefatti come `& &p` (tipici di alcuni modelli).

La regex attuale in `stripMarkdown` è `&\s*&\w*\s*`. Se `& &p` è ancora visibile nel PDF, possibili cause:
- carattere diverso da `&` (es. entità HTML o Unicode);
- spazio/carattere invisibile diverso;
- ordine delle replace (stripMarkdown applicata dopo altre trasformazioni che reintroducono testo).

---

### 2. Flusso da generazione piano → downloadWorkoutPlanPDF

1. **Generazione:**  
   `getStructuredWorkoutPlan(request, userId, sessionId)` in `openai-service.ts`:
   - Chiama `fetch('/api/ai-chat', { body: { messages, model: 'gpt-4o-mini', max_tokens: 4000 } })`.
   - Parsing JSON della risposta → oggetto `plan` (con `safetyNotes` dalla risposta o sovrascritto dal blocco righe 882-931).
   - Ritorna `{ success: true, plan }`.

2. **In PrimeChat.tsx:**
   - Il `plan` viene messo nello stato (es. `setPendingPlan`) e/o aggiunto a un messaggio bot come `workoutPlan: planResponse.plan` (righe 889, 1061, 1732, 2106).
   - Il messaggio ha quindi `m.workoutPlan` con lo stesso oggetto `plan` (incluso `plan.safetyNotes`).

3. **Scarica PDF:**
   - Render del messaggio (riga 2345): `{m.role === 'bot' && m.workoutPlan && ( ... )}`.
   - Pulsante “Scarica PDF” (riga 2432):  
     `onClick={() => downloadWorkoutPlanPDF(m.workoutPlan!)}`.
   - Quindi **safetyNotes** arriva a **downloadWorkoutPlanPDF** esattamente come è in `m.workoutPlan.safetyNotes` (o da GPT o dal blocco post-parsing con `**Nota di sicurezza**`).

4. **In pdfExport.ts:**
   - `downloadWorkoutPlanPDF(plan)` usa `plan.safetyNotes` qui (circa riga 262):
   - `const safetyLines = doc.splitTextToSize(\`⚠ ${stripMarkdown(plan.safetyNotes)}\`, 175);`
   - Quindi il testo **viene passato a stripMarkdown** prima di andare nel PDF. Se “& &p” appare ugualmente, o stripMarkdown non sta ricevendo quella stringa, o la regex non la sta matchando (variante del carattere/sequenza).

---

### 3. Nel prompt, safetyNotes è markdown o plain?

- **Nel system prompt:** safetyNotes è descritto solo come “stringa” / “nota di sicurezza”; l’esempio è **plain**.
- **Nel codice post-risposta (con limitazioni):** viene scritto **noi** con **markdown** (`**Nota di sicurezza**`).
- **Conclusione:** il prompt chiede testo plain; la sola fonte “markdown” è il nostro override. L’artefatto “& &p” è più probabile nella risposta raw di GPT quando non c’è override (o in campi usati per costruire la nota, se presenti).

---

## DOMANDA 2 — Tempo generazione piano nutrizione (20+ secondi)

### 1. Chiamata fetch in getStructuredNutritionPlan

**File:** `packages/app-user/src/lib/openai-service.ts` (righe 1155-1166)

```typescript
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'system', content: nutritionSystemPrompt },
      { role: 'user', content: request },
    ],
    model: 'gpt-4o-mini',
    max_tokens: 6000,
  }),
});
```

- **model:** `gpt-4o-mini`
- **max_tokens:** `6000`
- **Lunghezza system prompt stimata:**  
  `nutritionSystemPrompt` è una stringa di circa **60 righe** (da riga 1092 a 1151), con allergie, contesto utente, istruzioni e schema JSON. Stimabile **~1200–1800 token** a seconda di allergie/contesto (con allergie e contesto pieni può avvicinarsi o superare 1500 token). Il body totale (system + user) è quindi nell’ordine di **~1300–2000+ token** in input.

---

### 2. System prompt getStructuredNutritionPlan — lunghezza, prime 30 e ultime 20 righe

- **Lunghezza:** il blocco del prompt va dalla riga 1092 alla 1151, quindi **circa 60 righe** (una sessantina).

**Prime ~30 righe (da inizio prompt fino a metà istruzioni):**

```text
  const nutritionSystemPrompt = `Sei PrimeBot, esperto nutrizionista AI di Performance Prime.
L'utente ha richiesto un piano alimentare personalizzato.

${allergieSection}
${contextSection}

ISTRUZIONI:
- Genera un piano alimentare di 3 giorni rappresentativi (Giorno 1, Giorno 2, Giorno 3) a meno che l'utente non specifichi esplicitamente il numero di giorni.
- Mantieni ogni giorno CONCISO: massimo 4 pasti per giorno, massimo 4 alimenti per pasto.
- Non aggiungere testo extra fuori dal JSON.
- Ogni giorno può avere: Colazione, Spuntino (opzionale), Pranzo, Cena.
- Indica quantità precise in grammi per ogni alimento.
- Calcola le calorie totali giornaliere approssimative.
- Adatta il piano all'obiettivo dell'utente (dimagrimento / massa muscolare / mantenimento / performance).
- Il piano deve essere realistico, vario e bilanciato.
- Includi almeno 3 consigli generali sulla nutrizione.

IMPORTANTE — SICUREZZA:
- Aggiungi sempre una nota finale che raccomanda di consultare un nutrizionista o dietologo certificato per un piano personalizzato e monitorato.
- Non prescrivere integratori o farmaci.
- Se l'utente ha patologie (diabete, ipertensione, ecc.), raccomanda il medico prima di tutto.

FORMATO RISPOSTA — rispondi SOLO con JSON valido, nessun testo prima o dopo:
{
```

**Ultime ~20 righe (schema JSON di esempio):**

```text
  "nome": "Piano Alimentare Settimanale",
  "descrizione": "...",
  "obiettivo": "...",
  "calorie_giornaliere": 2000,
  "macronutrienti": { ... },
  "allergie_considerate": ["..."],
  "giorni": [
    {
      "giorno": "Lunedì",
      "pasti": [ { "nome": "Colazione", "orario": "07:30", "alimenti": [...], "calorie_totali": 450 } ],
      "calorie_totali": 2000
    }
  ],
  "consigli_generali": ["...", "...", "..."],
  "note_finali": "Consulta un nutrizionista..."
}`;
```

---

### 3. Streaming in api/ai-chat.ts

**Risposta:** **No, non c’è streaming.**

Il file fa una sola chiamata a `fetch('https://api.openai.com/v1/chat/completions', ...)` con body standard (model, messages, temperature, max_tokens), attende la risposta completa, fa `await response.json()` e restituisce `res.status(200).json(data)`. Non ci sono:
- `stream: true`
- lettura di `response.body` come stream
- Server-Sent Events (SSE)
- invio progressivo di chunk al client.

Quindi il client (getStructuredNutritionPlan) riceve la risposta **solo quando OpenAI ha finito** l’intera completion; i 20+ secondi sono coerenti con risposta lunga (max_tokens 6000, JSON di 3 giorni) e assenza di feedback incrementale.

**Contenuto completo di api/ai-chat.ts** (come da codice attuale):

```typescript
// api/ai-chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ ERRORE CRITICO: OPENAI_API_KEY non configurata...');
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: '...', message: '...' });

    const { messages, model = 'gpt-4o-mini', max_tokens: clientMaxTokens } = req.body as { ... };
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });

    const max_tokens = typeof clientMaxTokens === 'number' && clientMaxTokens > 0 ? clientMaxTokens : 1000;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: 'OpenAI API error', details: error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
```

---

## Riepilogo

| Tema | Risposta |
|------|----------|
| **safetyNotes nel prompt** | Descritto come stringa/nota di sicurezza, esempio plain; nessuno schema “markdown”. |
| **safetyNotes nel codice** | Con limitazioni viene sovrascritto con testo che contiene `**Nota di sicurezza**` (markdown). |
| **Flusso verso PDF** | `getStructuredWorkoutPlan` → `plan` → messaggio `m.workoutPlan` → `downloadWorkoutPlanPDF(m.workoutPlan)` → `stripMarkdown(plan.safetyNotes)`. |
| **& &p** | Probabile artefatto da risposta GPT (soprattutto quando non si applica l’override). stripMarkdown ha già `&\s*&\w*\s*`; se persiste, verificare caratteri reali (encoding/Unicode). |
| **Piano nutrizione** | fetch con model `gpt-4o-mini`, max_tokens 6000, system prompt ~60 righe (~1200–1800 token stimati). |
| **Streaming** | Non implementato in api/ai-chat.ts; risposta unica a fine completion → latenza 20+ secondi attesa. |
