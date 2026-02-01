# Report verifica RLS (Row Level Security)

**Data verifica:** 2026-02-01  
**Base:** solo migration presenti nel repository (`supabase/migrations/`).  
Lo stato reale su Supabase (RLS abilitata/disabilitata) può differire se policy sono state create o modificate dalla dashboard.

---

## Tabelle con RLS definite nelle migration

Queste tabelle hanno `ENABLE ROW LEVEL SECURITY` e policy esplicite nelle migration del repo:

| Tabella | Migration | Note |
|---------|-----------|------|
| `professionals` | `20250129120000_professionals_rls_insert_select_update.sql` | INSERT/SELECT/UPDATE per `auth.uid() = user_id` |
| `professional_costs` | `20260131120000_professional_costs.sql` | SELECT/INSERT/UPDATE/DELETE per professionista (tramite `professional_id` → `professionals.user_id`) |
| `professional_subscriptions` | `20260201120000_professional_subscriptions_rls_insert.sql` | INSERT/SELECT/UPDATE per `professional_id` in (SELECT id FROM professionals WHERE user_id = auth.uid()) |

---

## Tabelle senza RLS nelle migration (sensibili)

Per le seguenti tabelle **non** risulta alcuna migration che abilita RLS o crea policy nel repo. Sono elencate per riferimento; la presenza in questo elenco non implica che RLS sia disabilitata in produzione (potrebbe essere configurata dalla dashboard).

### Dati partner / professionisti / clienti

- `bookings` — prenotazioni
- `booking_reminders` — promemoria prenotazioni
- `clients` — clienti
- `projects` — progetti
- `reviews` — recensioni
- `professional_services` — servizi e tariffe
- `professional_settings` — impostazioni professionista
- `professional_availability` — disponibilità
- `professional_notifications` — notifiche professionista
- `professional_clients` — relazione professionista–cliente
- `professional_applications` — candidature
- `professional_blocked_periods` — periodi bloccati
- `professional_languages` — lingue
- `subscription_invoices` — fatture abbonamento

### Dati utente / profilo / admin

- `profiles` — profili utente
- `admin_audit_logs` — log audit admin
- `admin_sessions` — sessioni admin
- `admin_settings` — impostazioni admin

### Notifiche e push

- `scheduled_notifications` — notifiche programmate
- `push_subscriptions` — sottoscrizioni push

### Dati app fitness / onboarding

- `custom_workouts` — allenamenti personalizzati
- `workout_diary` — diario allenamenti
- `workout_plans` — piani allenamento
- `workout_attachments` — allegati workout
- `user_workout_stats` — statistiche workout
- `monthly_workout_stats` — statistiche mensili
- `user_objectives` — obiettivi utente
- `notes` — note utente
- `health_disclaimer_acknowledgments` — accettazione disclaimer
- `primebot_interactions` — interazioni PrimeBot
- `primebot_preferences` — preferenze PrimeBot
- `user_onboarding_responses` — risposte onboarding
- `onboarding_analytics` — analytics onboarding
- `onboarding_obiettivo_principale` — obiettivo principale
- `onboarding_esperienza` — esperienza
- `onboarding_preferenze` — preferenze
- `onboarding_personalizzazione` — personalizzazione

### Altri

- `openai_usage_logs` — log utilizzo OpenAI

---

## Riepilogo

- **Con RLS nelle migration:** 3 tabelle (`professionals`, `professional_costs`, `professional_subscriptions`).
- **Senza RLS nelle migration:** tutte le altre tabelle pubbliche elencate sopra (decine di tabelle sensibili).

**Nota:** Per conoscere lo stato effettivo su Supabase (quali tabelle hanno RLS abilitata e quali policy sono attive), verificare dal dashboard Supabase (Database → Tables → [tabella] → RLS) o con query sul catalogo PostgreSQL.
