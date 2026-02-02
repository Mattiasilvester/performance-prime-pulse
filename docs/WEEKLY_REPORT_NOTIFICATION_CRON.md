# Notifica Report Settimanale — Cron Lunedì 8:00

L’Edge Function **weekly-report-notification** invia a ogni professionista con **Report settimanale** attivo (impostazione **notify_weekly_summary** in Impostazioni notifiche) una notifica in-app: *"Visualizza il tuo report settimanale"*, con link alla pagina Report Settimanale.

## Quando inviare

- **Giorno:** lunedì (settimana appena chiusa Lun–Dom).
- **Ora:** 8:00 (ora italiana o del fuso del progetto).

## Come attivare il cron

Supabase non espone un cron nativo per le Edge Functions. Puoi usare uno di questi metodi.

### 1. Servizio esterno (consigliato)

Usa un servizio tipo **cron-job.org**, **EasyCron** o **GitHub Actions** per chiamare l’Edge Function ogni lunedì alle 8:00.

- **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/weekly-report-notification`
- **Metodo:** `POST`
- **Header:** `Authorization: Bearer <SUPABASE_ANON_KEY>` oppure `Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- **Schedule:** ogni lunedì alle 8:00 (es. `0 8 * * 1` in cron)

Sostituisci:
- `<PROJECT_REF>` con il ref del progetto Supabase (es. `abcdefghijklmnop`).
- `<SUPABASE_ANON_KEY>` o `<SUPABASE_SERVICE_ROLE_KEY>` con la chiave da Dashboard → Settings → API.

### 2. pg_cron (Supabase Pro)

Se hai Supabase Pro puoi usare **pg_cron** per chiamare l’Edge Function tramite `net.http_post` (estensione e setup da documentare in base alla tua versione).

### 3. Test manuale

Per provare subito senza cron:

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/weekly-report-notification" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json"
```

Risposta attesa: `{ "success": true, "summary": { "created": N, "skipped": N, "errors": 0, ... } }`.

## Comportamento

- Legge da **professional_settings** i `professional_id` con `notify_weekly_summary = true`.
- Per ognuno inserisce al massimo **una notifica per giorno** (deduplicazione con `reminder_key`: `weekly_report_YYYY-MM-DD`).
- La notifica ha **action_url** `/partner/dashboard/report-settimanale`: cliccandola in app si apre la pagina Report Settimanale.

## Deploy Edge Function

```bash
supabase functions deploy weekly-report-notification
```

Variabili d’ambiente richieste (già impostate nel progetto): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
