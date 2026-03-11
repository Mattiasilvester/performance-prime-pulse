# ANALISI: Sistema Notifiche Push — app-user (Performance Prime)

**Data:** 11 Marzo 2026  
**Scope:** `packages/app-user/` — solo analisi, nessuna modifica.

---

## 1. Service Worker

### 1.1 Esistenza del file

- **In app-user:** **Non esiste** nessun file `sw.js` né `service-worker.js` in `packages/app-user/public/`.
- **Contenuto di `packages/app-user/public/`:** `_redirects`, `clear-auth.html`, `data/`, `images/`, `robots.txt`, `sitemap.xml`.

**Conseguenza:** il client registra `/sw.js` (vedi sotto) ma il file non viene servito da app-user → la registrazione del Service Worker **fallisce con 404** in runtime.

### 1.2 Dove è registrato

- **File:** `packages/app-user/src/services/pushNotificationService.ts`  
- **Righe 44–46:**

```ts
this.registration = await navigator.serviceWorker.register('/sw.js', {
  scope: '/'
});
```

- **Chiamata a `initialize()`:** da `usePushNotifications.tsx` (useEffect) e da `PushPermissionModal.tsx` (handleActivate). Entrambi dipendono da questa registrazione.

### 1.3 Bonifica SW in main.tsx

- **File:** `packages/app-user/src/main.tsx` (righe 9–25)
- **Logica:** all’avvio, `navigator.serviceWorker.getRegistrations()` → per ogni registration, se lo scope **non** include `'/sw.js'` e lo scriptURL **non** include `sw.js`, viene chiamato `r.unregister()`. Poi `caches.keys()` → elimina tutte le cache che **non** contengono `'pp-push'`.
- **Effetto:** rimuove vecchi SW/conflitti PWA; **non** registra `sw.js` (manca il file).

### 1.4 MIME type in produzione (Vercel)

- Non è presente nel codice alcun controllo o commento sul MIME type per `sw.js`.
- Se in futuro si aggiungesse `public/sw.js`, su Vercel di solito viene servito con MIME corretto per `.js`; non risulta documentazione di errori noti su questo nel repo.

---

## 2. Permessi e subscription push

### 2.1 Richiesta permessi

- **File:** `packages/app-user/src/services/pushNotificationService.ts`
- **Metodo:** `requestPermission()` (righe 127–146):
  - Chiama `Notification.requestPermission()`.
  - Salva lo stato in `localStorage` sotto chiave `pp_push_permission_status` (status, timestamp, userChoice).
  - Ritorna `PushPermissionStatus`.

- **Chiamata da UI:** `PushPermissionModal.tsx` (riga 91) in `handleActivate` dopo `pushNotificationService.initialize()`.

### 2.2 Creazione PushSubscription

- **Stesso file:** `createSubscription()` (righe 150–186):
  - Usa `this.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
  - `applicationServerKey` è la VAPID public key hardcoded (vedi §5).
  - Salva la subscription in `localStorage` sotto `pp_push_subscription`.
  - Ritorna oggetto `{ endpoint, keys: { p256dh, auth } }`.

### 2.3 Salvataggio subscription (backend)

- **Metodo:** `sendSubscriptionToBackend(subscription, professionalId)` (righe 215–259).
- **Tabella Supabase:** `push_subscriptions`.
- **Colonne usate (da types e codice):**
  - `professional_id` (obbligatorio)
  - `endpoint`
  - `p256dh`
  - `auth`
  - `user_agent` (da `navigator.userAgent`)
  - `is_active: true`
  - `last_used_at`
- **Upsert:** conflitto su `endpoint`, `ignoreDuplicates: false`.

**Nota:** la subscription è legata a un **professional_id**. In app-user, `useProfessionalId()` restituisce l’id del professionista **se l’utente loggato è un professionista** (tabella `professionals` con `user_id = user.id`). Per un utente “atleta” senza riga in `professionals`, `professionalId` è `null` → in `PushPermissionModal` l’attivazione fallisce con messaggio “ID professionista non disponibile”.

---

## 3. Tipi di notifica esistenti

Riepilogo di dove e come vengono create/gestite notifiche in app-user.

| Tipo | Dove viene triggerata | Come viene inviata | Lato client/server |
|------|------------------------|--------------------|---------------------|
| **Notifiche in-app (context)** | `useNotifications.tsx`: `addNotification()` | Solo stato React + `localStorage` | Solo client |
| **Notifiche “demo” in-app** | `useNotifications.tsx`: defaultNotifications (id 1–3) | localStorage + UI | Solo client |
| **Recensioni → professionista** | `reviewsService.ts`: dopo creazione/risposta recensione | `notificationService.createNotification()` → insert `professional_notifications` + `send-push-notification` Edge Function | Server (DB) + chiamata Edge Function (push non implementata) |
| **Riepilogo mensile** | `monthlyStatsService.ts`: `addMonthlyNotification()` | Solo toast; funzione vuota (commento “Per ora utilizziamo solo il toast”) | Solo client (toast) |
| **Push “promemoria” (UI)** | `PushPermissionModal` + `pushNotificationService` | Subscription salvata in `push_subscriptions`; nessun invio reale push da server | Client crea subscription; server non invia |

Dettaglio:

- **notificationService.ts**  
  - `createNotification()`: insert in `professional_notifications` e chiamata asincrona a Edge Function `send-push-notification` (righe 45–46, 59–80).  
  - Errori push sono catturati e non bloccanti (try/catch, log in DEV).  
  - Usato da `reviewsService.ts` per `notifyNewReview` e `notifyReviewResponse` (notifiche al professionista quando un utente lascia/risponde a una recensione).

- **useNotifications (NotificationProvider)**  
  - Notifiche solo in-app e in localStorage; nessuna push, nessuna chiamata a Supabase per notifiche utente.

- **addMonthlyNotification (monthlyStatsService)**  
  - Funzione vuota; solo toast lato client per il riepilogo mensile.

---

## 4. Edge Functions legate alle notifiche

### 4.1 send-push-notification

- **Path:** `supabase/functions/send-push-notification/index.ts`
- **Cosa fa:**
  - Verifica Bearer token e utente Supabase.
  - Legge `professionalId` e `notificationId` dal body.
  - **Non invia alcuna push reale:** ritorna `{ ok: true, message: 'Push not yet implemented' }` (righe 68–71).
- **Chiamata da:** client app-user in `notificationService.sendPushNotificationAsync()` dopo insert in `professional_notifications`.
- **VAPID:** non usa VAPID; nessuna lettura di env per chiavi; nessuna libreria web-push.

### 4.2 send-scheduled-notifications

- **Path:** `supabase/functions/send-scheduled-notifications/index.ts`
- **Cosa fa:**
  - Legge da `scheduled_notifications` le righe `status = 'pending'` e `scheduled_for <= now`.
  - Per ognuna: insert in `professional_notifications` (titolo, messaggio, tipo, data, professional_id).
  - Aggiorna `scheduled_notifications` a `status: 'sent'`, `sent_at`, `updated_at`.
  - **Non invia push:** solo insert in-app per professionisti; nessuna chiamata a web-push o FCM.
- **Chiamata da:** cron (esterno, es. ogni 5 minuti).
- **VAPID:** non usate.

---

## 5. VAPID Keys

- **Nel codice app-user:**  
  - **File:** `packages/app-user/src/services/pushNotificationService.ts` (righe 18–22).  
  - Chiave pubblica **hardcoded** (stessa di app-pro):
    - `VAPID_PUBLIC_KEY = 'BJLafKLwCjWph5pDeh6zaAVRrmURBhLUSssTUnpmW_QAFT44ulLMCNM8hXBGkcZUbatGD0XDTRFtiU7DFdY5eE8'`
  - Commento: “chiave di test”, “Per produzione genera con npx web-push generate-vapid-keys”.
- **Env:** in `packages/app-user/.env.example` **non** compaiono `VITE_VAPID` né altre variabili VAPID. Solo `VITE_SUPABASE_*`, `VITE_OPENAI_*`, `VITE_ENABLE_PRIMEBOT`.
- **Edge Function:** `send-push-notification` non legge né usa VAPID (nessun invio push).

---

## 6. Stato in produzione / robustezza

### 6.1 Commenti / TODO

- **notificationService.ts:**  
  - “TODO: remove partner dependency — type was from @/hooks/usePartnerNotifications” (riga 4).  
  - Indica origine PrimePro; tipi e tabelle sono comunque per professionisti.
- **pushNotificationService.ts:**  
  - “NOTA: Questa è una chiave di test generata. Per produzione, genera le tue chiavi VAPID” (righe 19–20).  
  - “Registra il service worker (riabilitato per notifiche push)” (riga 41).

### 6.2 Try/catch che silenziano errori

- **notificationService.createNotification:** catch su errore generale, `console.error`, non rilancio (righe 49–52).
- **sendPushNotificationAsync:** errori gestiti con return/console.warn in DEV; nessun throw (righe 71–80).
- **pushNotificationService:** errori in `initialize`, `createSubscription`, `sendSubscriptionToBackend`, `clearNotificationData` sono loggati; alcuni ritornano `false` o `null` senza propagare.

### 6.3 Service Worker: handler `push` e `notificationclick`

- **In app-user:** non esiste `sw.js` → nessun handler.
- **In app-pro:** esiste `packages/app-pro/public/sw.js` con:
  - `self.addEventListener('push', ...)`: fa `event.data.json()`, `showNotification` con titolo, body, icon, badge, vibrate, silent: false, tag, data.
  - `self.addEventListener('notificationclick', ...)`: chiude notifica, apre/focus finestra con `urlToOpen` (da `event.notification.data?.url` o `/`).

Quindi in **app-user** non c’è alcun handler push/notificationclick perché il file SW non c’è.

---

## 7. Tabella riepilogativa tipi notifica e stato

| Tipo | Trigger | Destinatario | Canale | Stato |
|------|--------|---------------|--------|--------|
| Notifiche in-app (context) | `addNotification()` da componenti | Utente loggato | localStorage + UI | Funzionante (solo client) |
| Default demo (3 notifiche) | Caricamento se nessun dato in localStorage | Utente | localStorage + UI | Funzionante |
| Recensioni → professionista | Creazione/risposta recensione | Professionista | DB `professional_notifications` + Edge Function push | Parziale: DB + chiamata EF ok; push **non implementata** |
| Riepilogo mensile | Logica mensile stats | Utente | Toast + `addMonthlyNotification()` | Parziale: toast ok; `addMonthlyNotification` vuota |
| Push promemoria (modal) | Modal “Attiva Promemoria” | Professionista (solo se professionalId) | Subscription in `push_subscriptions` | Rotto: nessun `sw.js` → registrazione SW fallisce; EF non invia push |
| Scheduled notifications | Cron | Professionista | Insert `professional_notifications` | Funzionante (solo in-app, no push) |

---

## 8. Riepilogo finale

### Cosa funziona end-to-end

- Notifiche in-app nel context (lista, badge, mark read) con persistenza in localStorage.
- Creazione notifiche per professionisti in DB (`professional_notifications`) quando un utente lascia/risponde a una recensione.
- Edge Function `send-scheduled-notifications`: promemoria schedulati scritti in `professional_notifications` (in-app per professionisti).
- Logica di permessi e “promemoria” in UI (modal, hook usePushNotifications) e salvataggio stato in localStorage (senza push reale).

### Cosa è solo client-side

- Tutte le notifiche del `NotificationProvider` (nessun backend).
- Riepilogo mensile: solo toast; `addMonthlyNotification` non persiste nulla.
- Subscription push: creata e salvata in DB solo se l’utente è un professionista e se la registrazione SW avesse successo (in app-user non ha successo per mancanza di `sw.js`).

### Cosa manca o è rotto

1. **File `sw.js` assente in app-user**  
   La registrazione di `/sw.js` fallisce (404). Di fatto le push non possono funzionare in app-user anche se il resto fosse pronto.

2. **Edge Function `send-push-notification` non invia push**  
   Risponde “Push not yet implemented”; non usa VAPID, non usa web-push né FCM. Le notifiche restano solo in DB (in-app per chi usa PrimePro).

3. **Modello “promemoria” in app-user**  
   La UI parla di “promemoria intelligenti” per l’utente, ma le subscription e le notifiche push sono progettate per **professional_id** (professionisti). Per un utente atleta, `professionalId` è null → il modal può apparire ma l’attivazione fallisce. Manca un flusso push dedicato agli utenti (user_id / profilo utente).

4. **VAPID solo in frontend, hardcoded**  
   Chiave di test nel client; nessuna chiave privata lato server e nessun uso nella Edge Function.

5. **Riepilogo mensile**  
   `addMonthlyNotification` non fa nulla; nessuna notifica persistente o push per il riepilogo.

---

## 9. Priorità di fix consigliate

1. **Alta – Service Worker in app-user**  
   Aggiungere `packages/app-user/public/sw.js` (adattato da app-pro: handler `push` e `notificationclick`, stessi campi payload se si vuole riuso). Senza questo, nessuna push può funzionare in app-user.

2. **Alta – Edge Function push reale**  
   Implementare in `send-push-notification` l’invio effettivo (es. web-push con VAPID): leggere subscription da `push_subscriptions` per il `professionalId`, usare chiave privata VAPID da secrets Supabase, inviare payload alla subscription. Configurare VAPID (e eventuale subject) come secrets.

3. **Media – Modello utente vs professionista**  
   Decidere se app-user deve avere push per **utenti atleti** (promemoria allenamenti, ecc.): in quel caso servono tabella/colonna per subscription per `user_id` (o profilo utente) e flusso di attivazione che non dipenda da `professionalId`. Eventualmente separare “push per professionisti” (booking, recensioni) da “push per atleti” (promemoria, obiettivi).

4. **Media – VAPID in env**  
   Spostare la chiave pubblica VAPID in variabile d’ambiente (es. `VITE_VAPID_PUBLIC_KEY`) e documentarla in `.env.example`; usare la chiave privata solo nella Edge Function.

5. **Bassa – Riepilogo mensile**  
   Implementare `addMonthlyNotification` (tabella notifiche utente o insert in un modello esistente) se si vogliono notifiche persistenti/push per il riepilogo mensile.

6. **Bassa – MIME type e cache**  
   Verificare che su Vercel `sw.js` sia servito con `Content-Type: application/javascript` e che la strategia di cache non impedisca aggiornamenti del SW (es. no cache lunga per `/sw.js`).

---

*Fine report — solo analisi, nessuna modifica al codice.*
