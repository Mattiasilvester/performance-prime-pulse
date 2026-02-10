-- RLS su scheduled_notifications: il professionista può inserire, leggere e aggiornare
-- solo i propri promemoria (creazione da app + polling client-side che segna come 'sent').
-- Idempotente: DROP IF EXISTS evita errori se rieseguita.

ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional can insert own scheduled_notifications" ON scheduled_notifications;
CREATE POLICY "Professional can insert own scheduled_notifications"
  ON scheduled_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Professional can read own scheduled_notifications" ON scheduled_notifications;
CREATE POLICY "Professional can read own scheduled_notifications"
  ON scheduled_notifications FOR SELECT
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Professional can update own scheduled_notifications" ON scheduled_notifications;
CREATE POLICY "Professional can update own scheduled_notifications"
  ON scheduled_notifications FOR UPDATE
  TO authenticated
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );
