# 📋 PROMPT CLOUDFLARE - IMPLEMENTAZIONE FASI 9-13 SISTEMA ABBONAMENTO

**Data:** 27 Gennaio 2025  
**Progetto:** Performance Prime Pulse - Sistema Abbonamento Partner  
**Contesto:** Completamento sistema pagamenti e abbonamenti PrimePro

---

## 🎯 OBIETTIVO GENERALE

Implementare le fasi finali del sistema abbonamento per completare la gestione pagamenti, fatture e analytics per i professionisti PrimePro.

**Stato Attuale:**
- ✅ Sistema abbonamento base completo (Fasi 1-8)
- ✅ Pagina Abbonamento con tutti i componenti
- ✅ Gestione cancellazione/riattivazione
- ✅ Notifiche Stripe eventi
- ✅ Integrazione fatture

**Da Implementare:**
- 🔄 FASE 9: Notifiche proattive (3 giorni prima + giorno stesso)
- 🔄 FASE 10: Export fatture CSV/PDF multiplo
- 🔄 FASE 11: Analytics pagamenti
- 🔄 FASE 12: Gestione multi-carta
- 🔄 FASE 13: Supporto PayPal completo

---

## 📊 ARCHITETTURA ATTUALE

### **Database Schema**
- **`professional_subscriptions`**: Abbonamenti professionisti
  - `trial_end`: Data fine trial
  - `current_period_end`: Data prossimo pagamento
  - `status`: 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid'
  - `card_exp_month`, `card_exp_year`: Scadenza carta
  - `card_last4`, `card_brand`: Info carta

- **`subscription_invoices`**: Storico fatture
  - `invoice_date`: Data fattura
  - `amount`: Importo
  - `status`: 'draft', 'open', 'paid', 'void', 'uncollectible'
  - `invoice_pdf_url`: URL PDF

- **`professional_notifications`**: Notifiche app
  - `type`: Tipo notifica (incluso 'custom')
  - `title`, `message`: Contenuto
  - `data`: JSON con dati aggiuntivi

### **Edge Functions Esistenti**
- `stripe-create-subscription`: Crea subscription
- `stripe-cancel-subscription`: Cancella subscription
- `stripe-reactivate-subscription`: Riattiva subscription
- `stripe-webhook`: Gestisce eventi Stripe
- `send-scheduled-notifications`: Invio notifiche programmate (esistente)

### **Cron Jobs Esistenti**
- GitHub Actions: `scheduled-notifications-cron.yml` (ogni 5 minuti)

### **Componenti UI Esistenti**
- `AbbonamentoPage.tsx`: Pagina principale abbonamento
- `InvoicesCard.tsx`: Card storico fatture
- `ManageSubscriptionCard.tsx`: Gestione cancellazione/riattivazione
- `PaymentMethodCard.tsx`: Card metodo pagamento

---

## 🔔 FASE 9: NOTIFICHE PROATTIVE

### **Requisiti**
Inviare notifiche automatiche per:
1. **Trial in scadenza**: 3 giorni prima e giorno stesso
2. **Prossimo pagamento**: 3 giorni prima e giorno stesso
3. **Carta in scadenza**: 3 giorni prima e giorno stesso (se scade entro 3 giorni)

### **Implementazione**

#### **1. Edge Function: `subscription-reminders`**

**File:** `supabase/functions/subscription-reminders/index.ts`

**Logica:**
```typescript
// 1. Query subscription con trial_end tra oggi e 3 giorni
// 2. Query subscription con current_period_end tra oggi e 3 giorni
// 3. Query subscription con card_exp_month/exp_year in scadenza
// 4. Per ogni subscription trovata:
//    - Calcola giorni rimanenti
//    - Verifica se notifica già inviata (tracking)
//    - Crea notifica se necessario
```

**Notifiche da creare:**
- `trial_expiring_3d`: "Il tuo periodo di prova scade tra 3 giorni. Aggiungi un metodo di pagamento per continuare."
- `trial_expiring_today`: "Il tuo periodo di prova scade oggi! Aggiungi un metodo di pagamento per continuare."
- `payment_due_3d`: "Il prossimo pagamento dell'abbonamento è previsto tra 3 giorni (€50,00)."
- `payment_due_today`: "Il pagamento dell'abbonamento è previsto oggi (€50,00)."
- `card_expiring_3d`: "La tua carta termina tra 3 giorni. Aggiorna il metodo di pagamento."
- `card_expiring_this_month`: "La tua carta scade questo mese. Aggiorna il metodo di pagamento."

**Tracking duplicati:**
- Usare tabella `professional_notifications` con `data->>'reminder_type'` e `data->>'reminder_date'`
- Verificare se notifica già esiste prima di crearne una nuova

#### **2. Cron Job**

**File:** `.github/workflows/subscription-reminders-cron.yml`

**Configurazione:**
- Esegui ogni giorno alle 09:00 UTC
- Chiama Edge Function `subscription-reminders`

**Alternativa:** Integrare in `send-scheduled-notifications` esistente (se preferibile)

#### **3. Database Tracking (Opzionale)**

Se necessario, creare tabella `subscription_reminders_sent` per tracking:
- `professional_id`
- `reminder_type`: 'trial_3d', 'trial_today', 'payment_3d', 'payment_today', 'card_3d', 'card_month'
- `reminder_date`: Data per cui è stata inviata
- `created_at`

**Oppure:** Usare `professional_notifications` con `data` JSON per tracking

---

## 📄 FASE 10: EXPORT FATTURE CSV/PDF MULTIPLO

### **Requisiti**
- Export multiplo fatture in formato CSV
- Export multiplo fatture in formato PDF
- Filtri per periodo (mese, trimestre, anno)
- Selezione multipla fatture

### **Implementazione**

#### **1. Componente Export Fatture**

**File:** `src/components/partner/subscription/InvoiceExportModal.tsx`

**Features:**
- Modal con filtri periodo
- Checkbox per selezione multipla fatture
- Pulsanti "Esporta CSV" e "Esporta PDF"
- Preview fatture selezionate

#### **2. Servizio Export**

**File:** `src/services/invoiceExportService.ts`

**Funzioni:**
- `exportInvoicesToCSV(invoices)`: Genera CSV con tutte le fatture
- `exportInvoicesToPDF(invoices)`: Genera PDF multiplo (usando jsPDF o PDF-lib)
- `downloadFile(blob, filename)`: Download file

**Formato CSV:**
```csv
Data,Numero Fattura,Importo,Stato,Descrizione
15/01/2025,INV-2025-001,€50,00,Paid,Abbonamento Prime Business - Gennaio 2025
15/12/2024,INV-2024-012,€50,00,Paid,Abbonamento Prime Business - Dicembre 2024
```

**Formato PDF:**
- Pagina per ogni fattura
- Header con logo PrimePro
- Dettagli fattura (data, numero, importo, stato)
- Footer con totale

#### **3. Integrazione in InvoicesCard**

**File:** `src/components/partner/subscription/InvoicesCard.tsx`

**Modifiche:**
- Aggiungere bottone "Esporta" sopra lista fatture
- Aprire `InvoiceExportModal` al click
- Passare lista fatture al modal

---

## 📊 FASE 11: ANALYTICS PAGAMENTI

### **Requisiti**
Visualizzare analytics pagamenti nella pagina Abbonamento:
- Grafico spese mensili (ultimi 12 mesi)
- Storico pagamenti annuale
- Confronto costi per periodo
- Statistiche riepilogative

### **Implementazione**

#### **1. Componente Analytics**

**File:** `src/components/partner/subscription/SubscriptionAnalytics.tsx`

**Features:**
- Card con grafico spese mensili (Chart.js o Recharts)
- Card con statistiche (totale pagato, media mensile, etc.)
- Filtri periodo (ultimi 3/6/12 mesi)
- Export dati analytics

#### **2. Servizio Analytics**

**File:** `src/services/subscriptionAnalyticsService.ts`

**Funzioni:**
- `getMonthlySpending(professionalId, months)`: Calcola spese mensili
- `getYearlySummary(professionalId, year)`: Riepilogo annuale
- `getPaymentHistory(professionalId, period)`: Storico pagamenti

**Query Database:**
```sql
-- Spese mensili
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  SUM(amount) as total
FROM subscription_invoices
WHERE professional_id = ? 
  AND status = 'paid'
  AND invoice_date >= ?
GROUP BY month
ORDER BY month DESC;
```

#### **3. Integrazione in AbbonamentoPage**

**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`

**Posizionamento:**
- Dopo `InvoicesCard`
- Prima di `ManageSubscriptionCard`

**Layout:**
```tsx
<SubscriptionAnalytics
  professionalId={professionalId}
  invoices={invoices}
/>
```

---

## 💳 FASE 12: GESTIONE MULTI-CARTA

### **Requisiti**
- Aggiungere più carte di pagamento
- Selezionare carta predefinita
- Visualizzare tutte le carte salvate
- Storico pagamenti per carta

### **Implementazione**

#### **1. Database Schema**

**Modifiche a `professional_subscriptions`:**
- Aggiungere tabella `professional_payment_methods`:
  - `id`, `professional_id`
  - `stripe_payment_method_id`
  - `card_last4`, `card_brand`, `card_exp_month`, `card_exp_year`
  - `is_default`: BOOLEAN
  - `created_at`, `updated_at`

**Oppure:** Usare Stripe Payment Methods API direttamente (non salvare nel database)

#### **2. Componente Gestione Carte**

**File:** `src/components/partner/subscription/PaymentMethodsManager.tsx`

**Features:**
- Lista tutte le carte salvate
- Badge "Predefinita" su carta default
- Bottone "Imposta come predefinita"
- Bottone "Rimuovi carta"
- Bottone "Aggiungi nuova carta"

#### **3. Servizio Gestione Carte**

**File:** `src/services/paymentMethodsService.ts`

**Funzioni:**
- `getPaymentMethods(professionalId)`: Recupera tutte le carte
- `setDefaultPaymentMethod(professionalId, paymentMethodId)`: Imposta predefinita
- `removePaymentMethod(professionalId, paymentMethodId)`: Rimuove carta
- `addPaymentMethod(professionalId, setupIntentId)`: Aggiunge nuova carta

**Stripe API:**
- `stripe.paymentMethods.list({ customer })`: Lista carte
- `stripe.customers.update({ default_payment_method })`: Imposta default
- `stripe.paymentMethods.detach()`: Rimuove carta

#### **4. Integrazione in PaymentMethodCard**

**File:** `src/components/partner/subscription/PaymentMethodCard.tsx`

**Modifiche:**
- Se ci sono più carte, mostra lista con `PaymentMethodsManager`
- Se c'è una sola carta, mostra card attuale
- Bottone "Gestisci carte" per aprire modal

---

## 💰 FASE 13: SUPPORTO PAYPAL COMPLETO

### **Requisiti**
- Integrazione PayPal API completa
- Switch tra Stripe e PayPal
- Gestione subscription PayPal
- Visualizzazione subscription PayPal nell'UI

### **Implementazione**

#### **1. Database Schema**

**Modifiche a `professional_subscriptions`:**
- Aggiungere colonne PayPal:
  - `paypal_subscription_id`: ID subscription PayPal
  - `paypal_plan_id`: ID piano PayPal
  - `payment_provider`: 'stripe' | 'paypal' (default: 'stripe')

**Modifiche a `subscription_invoices`:**
- Aggiungere colonna `paypal_invoice_id` (oltre a `stripe_invoice_id`)

#### **2. Edge Functions PayPal**

**File:** `supabase/functions/paypal-create-subscription/index.ts`
- Crea subscription PayPal
- Salva nel database

**File:** `supabase/functions/paypal-cancel-subscription/index.ts`
- Cancella subscription PayPal
- Aggiorna database

**File:** `supabase/functions/paypal-webhook/index.ts`
- Gestisce eventi PayPal webhook
- Aggiorna subscription e crea notifiche

#### **3. Componente Selezione Provider**

**File:** `src/components/partner/subscription/PaymentProviderSelector.tsx`

**Features:**
- Toggle/Radio per scegliere Stripe o PayPal
- Mostra solo se non c'è subscription attiva
- Salva preferenza in `professional_settings`

#### **4. Integrazione PayPal SDK**

**File:** `src/lib/paypal.ts`

**Configurazione:**
- PayPal JavaScript SDK
- Client ID da variabili ambiente
- Funzioni per creare subscription

#### **5. Modifiche UI Esistenti**

**File:** `src/components/partner/subscription/PaymentMethodCard.tsx`
- Mostra logo PayPal se provider è PayPal
- Mostra info subscription PayPal

**File:** `src/pages/partner/dashboard/AbbonamentoPage.tsx`
- Supporto per subscription PayPal
- Mostra info corrette in base al provider

---

## 🗄️ MIGRAZIONI DATABASE NECESSARIE

### **FASE 9:**
- Nessuna migrazione (usa `professional_notifications` esistente)

### **FASE 10:**
- Nessuna migrazione (usa `subscription_invoices` esistente)

### **FASE 11:**
- Nessuna migrazione (usa `subscription_invoices` esistente)

### **FASE 12:**
```sql
-- Tabella payment methods (opzionale, se non usiamo Stripe API direttamente)
CREATE TABLE IF NOT EXISTS professional_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 VARCHAR(4) NOT NULL,
  card_brand VARCHAR(20) NOT NULL,
  card_exp_month INT NOT NULL,
  card_exp_year INT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, stripe_payment_method_id)
);
```

### **FASE 13:**
```sql
-- Aggiungi colonne PayPal a professional_subscriptions
ALTER TABLE professional_subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'stripe';

-- Aggiungi colonna PayPal a subscription_invoices
ALTER TABLE subscription_invoices
  ADD COLUMN IF NOT EXISTS paypal_invoice_id TEXT;
```

---

## 📦 DIPENDENZE NECESSARIE

### **FASE 10:**
- `papaparse` o `csv-writer`: Generazione CSV
- `jspdf` o `pdf-lib`: Generazione PDF

### **FASE 11:**
- `recharts` o `chart.js`: Grafici analytics
- `date-fns`: Manipolazione date

### **FASE 13:**
- `@paypal/react-paypal-js`: PayPal React SDK

---

## 🎨 UI/UX CONSIDERATIONS

### **FASE 9:**
- Notifiche app (non email)
- Badge "Promemoria" su notifiche
- Design coerente con notifiche esistenti

### **FASE 10:**
- Modal export con filtri chiari
- Progress indicator durante generazione PDF
- Toast successo dopo export

### **FASE 11:**
- Grafici responsive (mobile/desktop)
- Colori coerenti con design system (#EEBA2B)
- Tooltip informativi su hover

### **FASE 12:**
- Card carta con design moderno
- Animazioni smooth per switch default
- Conferma prima di rimuovere carta

### **FASE 13:**
- Toggle provider chiaro e visibile
- Logo PayPal e Stripe visibili
- Messaggi informativi per differenze provider

---

## 🔒 SICUREZZA E VALIDAZIONE

### **Tutte le Fasi:**
- Verifica autenticazione utente
- Verifica ownership (professional_id corrisponde a user_id)
- Validazione input lato client e server
- Error handling robusto
- Logging per debugging

### **FASE 12:**
- Verifica che almeno una carta rimanga se si rimuove default
- Non permettere rimozione ultima carta

### **FASE 13:**
- Validazione webhook PayPal (firma)
- Rate limiting su API PayPal
- Fallback a Stripe se PayPal fallisce

---

## 🧪 TESTING

### **FASE 9:**
- Test Edge Function con subscription trial in scadenza
- Test notifiche duplicate (non devono essere create 2 volte)
- Test cron job esecuzione

### **FASE 10:**
- Test export CSV con 1, 10, 100 fatture
- Test export PDF con fatture multiple
- Test filtri periodo

### **FASE 11:**
- Test query analytics con dati reali
- Test grafici con dati vuoti
- Test responsive mobile

### **FASE 12:**
- Test aggiunta/rimozione carte
- Test switch carta default
- Test con Stripe test mode

### **FASE 13:**
- Test creazione subscription PayPal
- Test webhook PayPal
- Test switch provider

---

## 📋 CHECKLIST IMPLEMENTAZIONE

### **FASE 9: Notifiche Proattive**
- [ ] Creare Edge Function `subscription-reminders`
- [ ] Implementare logica controllo trial_end (3 giorni + oggi)
- [ ] Implementare logica controllo current_period_end (3 giorni + oggi)
- [ ] Implementare logica controllo card_exp (3 giorni + questo mese)
- [ ] Implementare tracking duplicati
- [ ] Creare cron job GitHub Actions
- [ ] Test notifiche create correttamente

### **FASE 10: Export Fatture**
- [ ] Creare `InvoiceExportModal.tsx`
- [ ] Creare `invoiceExportService.ts`
- [ ] Implementare export CSV
- [ ] Implementare export PDF
- [ ] Integrare in `InvoicesCard.tsx`
- [ ] Test export con dati reali

### **FASE 11: Analytics Pagamenti**
- [ ] Creare `SubscriptionAnalytics.tsx`
- [ ] Creare `subscriptionAnalyticsService.ts`
- [ ] Implementare grafico spese mensili
- [ ] Implementare statistiche riepilogative
- [ ] Integrare in `AbbonamentoPage.tsx`
- [ ] Test con dati reali

### **FASE 12: Gestione Multi-Carta**
- [ ] Creare tabella `professional_payment_methods` (se necessario)
- [ ] Creare `PaymentMethodsManager.tsx`
- [ ] Creare `paymentMethodsService.ts`
- [ ] Implementare lista carte
- [ ] Implementare set default
- [ ] Implementare rimozione carta
- [ ] Integrare in `PaymentMethodCard.tsx`
- [ ] Test con Stripe

### **FASE 13: Supporto PayPal**
- [ ] Eseguire migrazioni database PayPal
- [ ] Creare Edge Functions PayPal
- [ ] Creare `PaymentProviderSelector.tsx`
- [ ] Integrare PayPal SDK
- [ ] Modificare UI per supportare PayPal
- [ ] Test con PayPal sandbox

---

## 🚀 PRIORITÀ DI IMPLEMENTAZIONE

1. **FASE 9** (Alta) - Notifiche proattive migliorano UX
2. **FASE 10** (Media) - Export utile per contabilità
3. **FASE 11** (Media) - Analytics utili per professionisti
4. **FASE 12** (Bassa) - Feature avanzata
5. **FASE 13** (Bassa) - Dipende da necessità business

---

## 📝 NOTE TECNICHE

### **Pattern da Seguire:**
- Usare `notificationService.ts` esistente per creare notifiche
- Usare `getStripeErrorMessage()` per errori Stripe
- Usare design system esistente (colori, componenti)
- Mantenere coerenza con codice esistente

### **Error Handling:**
- Tutte le operazioni devono avere try-catch
- Logging dettagliato per debugging
- Messaggi errore user-friendly
- Fallback graceful quando possibile

### **Performance:**
- Query database ottimizzate (indici)
- Lazy loading per componenti pesanti (grafici)
- Caching dati analytics quando possibile
- Paginazione per liste lunghe

---

## ✅ CONCLUSIONE

Questo documento descrive tutte le fasi da implementare per completare il sistema abbonamento PrimePro. Ogni fase è indipendente e può essere implementata separatamente, ma seguono un ordine logico di priorità.

**Pronto per iniziare l'implementazione!** 🚀
