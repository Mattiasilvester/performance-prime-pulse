/**
 * Edge Function: notifica "Report settimanale" per professionisti con notify_weekly_summary = true.
 * Da invocare ogni lunedì alle 8:00 (cron esterno o pg_cron).
 *
 * Esempio cron esterno (cron-job.org, GitHub Actions, ecc.):
 *   POST https://<project-ref>.supabase.co/functions/v1/weekly-report-notification
 *   Authorization: Bearer <SUPABASE_ANON_KEY o SERVICE_ROLE_KEY>
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const reminderKey = `weekly_report_${todayStr}`;

    // Professionisti con "Report settimanale" attivo
    const { data: settingsRows, error: settingsError } = await supabase
      .from('professional_settings')
      .select('professional_id')
      .eq('notify_weekly_summary', true);

    if (settingsError) {
      console.error('❌ [weekly-report-notification] Errore query professional_settings:', settingsError);
      throw settingsError;
    }

    const professionalIds = (settingsRows ?? []).map((r) => r.professional_id).filter(Boolean);
    console.log(`🔔 [weekly-report-notification] Professionisti con notify_weekly_summary=true: ${professionalIds.length}`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const professionalId of professionalIds) {
      try {
        const { data: existing } = await supabase
          .from('professional_notifications')
          .select('id, data')
          .eq('professional_id', professionalId)
          .eq('type', 'custom')
          .order('created_at', { ascending: false })
          .limit(50);

        const alreadySent = existing?.some(
          (n) => n.data && typeof n.data === 'object' && (n.data as { reminder_key?: string }).reminder_key === reminderKey
        );

        if (alreadySent) {
          skipped++;
          continue;
        }

        const { error: insertError } = await supabase.from('professional_notifications').insert({
          professional_id: professionalId,
          type: 'custom',
          title: 'Report settimanale',
          message: 'Visualizza il tuo report settimanale: appuntamenti, incassi e confronto con la settimana precedente.',
          data: {
            reminder_key: reminderKey,
            notification_type: 'weekly_report',
            action_url: '/partner/dashboard/report-settimanale',
          },
          is_read: false,
        });

        if (insertError) {
          console.error(`❌ [weekly-report-notification] Insert per ${professionalId}:`, insertError);
          errors++;
        } else {
          created++;
        }
      } catch (err) {
        console.error(`❌ [weekly-report-notification] Errore per ${professionalId}:`, err);
        errors++;
      }
    }

    const result = {
      success: true,
      summary: {
        professionals_with_setting: professionalIds.length,
        created,
        skipped,
        errors,
        date: todayStr,
        reminder_key: reminderKey,
      },
    };

    console.log('🔔 [weekly-report-notification] Completato:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ [weekly-report-notification] Errore:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
