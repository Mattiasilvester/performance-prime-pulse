/**
 * Edge Function: admin-application-action
 * Approva o rifiuta un'applicazione professionista.
 * Approva: crea professional + professional_settings, aggiorna application.
 * Rifiuta: aggiorna application (status, rejection_reason).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type CategoryEnum = 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata';

function toCategory(cat: string | null | undefined): CategoryEnum {
  if (!cat) return 'pt';
  const c = String(cat).toLowerCase();
  if (c === 'nutrizionista') return 'nutrizionista';
  if (c === 'fisioterapista') return 'fisioterapista';
  if (c === 'mental_coach' || c === 'mental coach') return 'mental_coach';
  if (c === 'osteopata') return 'osteopata';
  return 'pt';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = (await req.json().catch(() => ({}))) as { applicationId: string; action: 'approve' | 'reject'; rejectionReason?: string };
    const { applicationId, action, rejectionReason } = body;
    if (!applicationId || !action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'applicationId and action (approve|reject) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: app, error: appError } = await supabase
      .from('professional_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('status', 'pending')
      .single();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: 'Application not found or not pending' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reject') {
      const { error: updError } = await supabase
        .from('professional_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason ?? 'Rifiutato da amministratore',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      if (updError) {
        return new Response(JSON.stringify({ error: updError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true, action: 'rejected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Approve: create professional (user_id null) + professional_settings, then update application
    const category = toCategory(app.category);
    const companyName = app.company_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Professionista';
    const professionalPayload = {
      user_id: null,
      first_name: app.first_name || '',
      last_name: app.last_name || '',
      email: (app.email || '').toLowerCase(),
      phone: app.phone || '',
      category,
      zona: app.city || '',
      bio: app.bio ?? null,
      company_name: companyName,
      titolo_studio: null,
      specializzazioni: Array.isArray(app.specializations) ? app.specializations : [],
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      attivo: true,
      is_partner: false,
      modalita: 'entrambi',
      prezzo_seduta: null,
      prezzo_fascia: '€€',
      rating: 0,
      reviews_count: 0,
      birth_date: '1990-01-01',
      birth_place: app.city || '',
      vat_number: app.vat_number || 'PENDING',
      vat_address: 'Da completare',
      vat_postal_code: '00000',
      vat_city: app.city || '',
    };

    const { data: newPro, error: insertProError } = await supabase
      .from('professionals')
      .insert(professionalPayload)
      .select('id')
      .single();

    if (insertProError || !newPro) {
      return new Response(
        JSON.stringify({ error: insertProError?.message || 'Failed to create professional' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('professional_settings').insert({
      professional_id: newPro.id,
      stripe_connect_enabled: false,
      subscription_status: null,
    });

    const { error: updAppError } = await supabase
      .from('professional_applications')
      .update({
        status: 'approved',
        professional_id: newPro.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updAppError) {
      return new Response(JSON.stringify({ error: updAppError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, action: 'approved', professionalId: newPro.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-application-action]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
