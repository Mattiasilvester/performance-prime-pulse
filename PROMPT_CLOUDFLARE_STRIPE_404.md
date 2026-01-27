# 🚨 PROBLEMA CRITICO: Supabase Edge Function Stripe restituisce 404

## 📋 CONTESTO DEL PROGETTO

**Progetto**: Performance Prime Pulse - App React + TypeScript + Supabase
**Progetto Supabase**: `kfxoyucatvvcgmqalxsg` (Performance Prime)
**CLI Supabase**: Versione 2.72.7 (aggiornato di recente)
**Ambiente**: Sviluppo locale (localhost:8080) → Supabase Cloud

---

## 🐛 PROBLEMA PRINCIPALE

**Sintomo**: La Supabase Edge Function `stripe-create-customer` restituisce **404 Not Found** quando viene chiamata dal frontend React, ma **funziona** quando testata dal Dashboard Supabase.

### Dettagli Errore

**Dal Frontend (Browser Console)**:
```
POST https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-create-customer 404 (Not Found)
[SUBSCRIPTION] Errore creazione customer: FunctionsHttpError: Edge Function returned a non-2xx status code
```

**Dal Dashboard Supabase**:
- La funzione **ESISTE** e risponde (restituisce 401 "Invalid user token" quando testata senza token, che è il comportamento atteso)
- La funzione è visibile nella lista delle Edge Functions deployate
- Il deploy mostra messaggio di successo: `Deployed Functions on project kfxoyucatvvcgmqalxsg: stripe-create-customer`

---

## 🔍 ANALISI DEL PROBLEMA

### 1. Stato Deploy
- ✅ Funzione deployata con successo (messaggio confermato)
- ✅ File presenti localmente: `supabase/functions/stripe-create-customer/index.ts` e `deno.json`
- ✅ Configurazione corretta in `supabase/config.toml`:
  ```toml
  stripe-create-customer = { 
    verify_jwt = true, 
    import_map = "./functions/stripe-create-customer/deno.json", 
    entrypoint = "./functions/stripe-create-customer/index.ts" 
  }
  ```

### 2. Log Supabase Dashboard
- ❌ **Errore precedente** (prima del fix): `Deno.core.runMicrotasks() is not supported in this environment`
- ✅ **Dopo fix**: Errore risolto, ma 404 persiste dal frontend

### 3. Configurazione Stripe Import
**File**: `supabase/functions/stripe-create-customer/deno.json`
```json
{
  "imports": {
    "@supabase/functions-js": "jsr:@supabase/functions-js@2",
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2",
    "stripe": "https://esm.sh/stripe@14?target=denonext"
  }
}
```

**File**: `supabase/functions/stripe-create-customer/index.ts`
```typescript
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
```

### 4. Secrets Configurati
Tutti i secrets sono stati impostati correttamente:
- ✅ `STRIPE_SECRET_KEY` (sk_test_...)
- ✅ `STRIPE_WEBHOOK_SECRET` (whsec_...)
- ✅ `STRIPE_PRICE_BUSINESS` (price_...)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

Verificato con: `supabase secrets list` → tutti presenti

---

## 🔧 SOLUZIONI TENTATE (SENZA SUCCESSO)

### Tentativo 1: Fix Import Stripe
**Problema iniziale**: `Deno.core.runMicrotasks() is not supported`
**Soluzione applicata**: 
- Cambiato import da `?target=deno` → `?target=denext` → `?target=denonext`
- Aggiornato `apiVersion` a `'2024-11-20.acacia'`
- Rimosso `httpClient: Stripe.createFetchHttpClient()`

**Risultato**: Errore `Deno.core.runMicrotasks()` risolto, ma 404 persiste

### Tentativo 2: Redeploy Completo
**Azioni**:
- Eseguito `supabase functions deploy stripe-create-customer --debug`
- Deploy completato con successo
- Asset caricati: `deno.json`, `index.ts`, `_shared/cors.ts`

**Risultato**: Deploy riuscito, ma 404 persiste dal frontend

### Tentativo 3: Verifica Dashboard
**Test eseguito**:
- Dashboard Supabase → `stripe-create-customer` → "Test" → "Send Request"
- **Risultato**: Funzione risponde con 401 "Invalid user token" (comportamento atteso con `verify_jwt = true`)

**Conclusione**: La funzione **ESISTE** e funziona, ma non è raggiungibile dal frontend

### Tentativo 4: Verifica Configurazione
**Controlli eseguiti**:
- ✅ `config.toml` corretto
- ✅ Nome funzione corretto (`stripe-create-customer`)
- ✅ Path entrypoint corretto
- ✅ `verify_jwt = true` (come altre funzioni funzionanti)

---

## 📁 STRUTTURA FILE

```
supabase/
├── config.toml
└── functions/
    ├── _shared/
    │   └── cors.ts
    ├── stripe-create-customer/
    │   ├── deno.json
    │   └── index.ts
    ├── stripe-create-subscription/
    │   ├── deno.json
    │   └── index.ts
    └── stripe-webhook/
        ├── deno.json
        └── index.ts
```

**Funzioni funzionanti** (per confronto):
- ✅ `send-push-notification` (stessa configurazione, funziona)
- ✅ `admin-stats`, `admin-users` (funzionano)

---

## 💻 CODICE FRONTEND

**File**: `src/services/subscriptionService.ts`
```typescript
export async function createCustomerAndSetupIntent(): Promise<CreateCustomerResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Utente non autenticato. Effettua il login.');
    }

    console.log('[SUBSCRIPTION] Chiamata stripe-create-customer...');
    const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
      body: {},
    });

    if (error) {
      console.error('[SUBSCRIPTION] Errore creazione customer:', error);
      // ... error handling
    }
    // ...
  }
}
```

**Client Supabase**: `src/integrations/supabase/client.ts`
- Configurato correttamente con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- URL: `https://kfxoyucatvvcgmqalxsg.supabase.co`

---

## 🔍 IPOTESI SUL PROBLEMA

### Ipotesi 1: Problema di Propagazione
- La funzione è deployata ma non ancora propagata all'URL pubblico
- **Test**: Atteso 10-15 minuti, problema persiste

### Ipotesi 2: Crash all'Avvio con Token Valido
- La funzione crasha quando viene chiamata con un token JWT valido (diverso dal test dashboard)
- **Test**: Log Supabase mostrano solo errori precedenti, nessun log recente quando chiamata dal frontend

### Ipotesi 3: Problema di Routing/Cache
- Cache del browser/CDN che restituisce 404
- **Test**: Hard refresh (Cmd+Shift+R), problema persiste

### Ipotesi 4: Problema con Import Stripe
- L'import di Stripe causa crash silenzioso che Supabase interpreta come 404
- **Test**: Funzione funziona dal dashboard (senza eseguire codice Stripe), crasha dal frontend (quando esegue Stripe)

### Ipotesi 5: Problema con verify_jwt
- Configurazione `verify_jwt = true` causa problemi con il token dal frontend
- **Test**: Altre funzioni con `verify_jwt = true` funzionano (`send-push-notification`)

---

## 📊 INFORMAZIONI TECNICHE

### Versione Software
- **Supabase CLI**: 2.72.7
- **Node.js**: (versione non specificata)
- **Deno Runtime**: (versione usata da Supabase Edge Functions)
- **Stripe SDK**: v14 (via esm.sh)

### URL e Endpoint
- **Supabase URL**: `https://kfxoyucatvvcgmqalxsg.supabase.co`
- **Function URL**: `https://kfxoyucatvvcgmqalxsg.supabase.co/functions/v1/stripe-create-customer`
- **Project ID**: `kfxoyucatvvcgmqalxsg`

### Configurazione CORS
**File**: `supabase/functions/_shared/cors.ts`
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

---

## 🎯 COSA SERVE PER RISOLVERE

### 1. Diagnosi Completa
- [ ] Verificare se la funzione è effettivamente raggiungibile all'URL corretto
- [ ] Controllare log Supabase in tempo reale quando viene chiamata dal frontend
- [ ] Verificare se ci sono errori di inizializzazione Stripe che causano crash silenzioso
- [ ] Confrontare con funzioni funzionanti (`send-push-notification`) per differenze

### 2. Test da Eseguire
- [ ] Test cURL diretto con token JWT valido
- [ ] Test dal Dashboard Supabase con token JWT valido (non solo service role)
- [ ] Verificare se altre funzioni Stripe (`stripe-create-subscription`, `stripe-webhook`) hanno lo stesso problema
- [ ] Test con versione diversa di Stripe o import alternativo

### 3. Soluzioni Alternative da Valutare
- [ ] Usare import dinamico di Stripe invece di top-level import
- [ ] Provare versione diversa di Stripe (v13 invece di v14)
- [ ] Usare `npm:` import invece di `esm.sh`
- [ ] Creare versione semplificata della funzione senza Stripe per testare se il problema è Stripe-specific
- [ ] Verificare se c'è un problema con la configurazione `verify_jwt = true` per questa specifica funzione

### 4. Informazioni Aggiuntive Necessarie
- [ ] Log completi di Supabase quando la funzione viene chiamata dal frontend (se disponibili)
- [ ] Risposta esatta del test cURL con token valido
- [ ] Confronto tra request headers dal frontend vs dal dashboard
- [ ] Verifica se il problema si verifica anche in produzione o solo in sviluppo

---

## ❓ DOMANDE SPECIFICHE

1. **Perché la funzione funziona dal Dashboard ma non dal frontend?**
   - Differenze nella chiamata HTTP?
   - Problema di autenticazione/routing?
   - Cache o propagazione?

2. **L'import di Stripe può causare un 404 invece di un errore più specifico?**
   - Se Stripe crasha all'import, Supabase restituisce 404?
   - Come verificare se l'import è il problema?

3. **C'è un modo per testare la funzione senza eseguire il codice Stripe?**
   - Versione semplificata per isolare il problema?

4. **Il problema potrebbe essere legato alla versione di Deno usata da Supabase?**
   - Incompatibilità con `stripe@14?target=denonext`?

5. **Come verificare se la funzione è effettivamente deployata e raggiungibile?**
   - Comandi CLI o endpoint di verifica?

---

## 🚀 OBIETTIVO FINALE

Riuscire a chiamare la funzione `stripe-create-customer` dal frontend React e ricevere una risposta valida (non 404), permettendo di:
1. Creare un customer Stripe
2. Creare un SetupIntent per aggiungere payment method
3. Procedere con l'integrazione completa di Stripe per abbonamenti

---

## 📝 NOTE AGGIUNTIVE

- Il problema si verifica **solo** per le funzioni Stripe (3 funzioni: `stripe-create-customer`, `stripe-create-subscription`, `stripe-webhook`)
- Altre Edge Functions funzionano correttamente
- Il deploy mostra sempre successo, ma la funzione non è raggiungibile dal frontend
- Il problema persiste anche dopo multiple redeploy e fix dell'import Stripe

---

**Data problema**: 26 Gennaio 2025
**Tempo speso**: ~2 ore di troubleshooting
**Stato**: 🔴 BLOCCANTE - Impedisce completamento integrazione Stripe
