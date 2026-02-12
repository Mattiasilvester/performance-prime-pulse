/**
 * Edge Function: admin-professional-detail
 * Restituisce il dettaglio completo di un professionista per il pannello SuperAdmin.
 * Usa Service Role per bypassare RLS.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type AnyRecord = Record<string, unknown>;

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapProfessional(raw: AnyRecord | null): AnyRecord | null {
  if (!raw) return null;

  const firstName = asString(raw.first_name) ?? '';
  const lastName = asString(raw.last_name) ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || (asString(raw.email) ?? 'Professionista');

  return {
    id: raw.id,
    user_id: raw.user_id ?? null,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: asString(raw.email),
    phone: asString(raw.phone) ?? asString(raw.office_phone),
    category: asString(raw.category),
    professions: asArray(raw.professions).length > 0 ? asArray(raw.professions) : asArray(raw.titolo_studio),
    bio: asString(raw.bio),
    specializations: asArray(raw.specializations).length > 0 ? asArray(raw.specializations) : asArray(raw.specializzazioni),
    city: asString(raw.city) ?? asString(raw.vat_city),
    address: asString(raw.address) ?? asString(raw.vat_address),
    company_name: asString(raw.company_name),
    vat_number: asString(raw.vat_number),
    profile_image_url: asString(raw.profile_image_url) ?? asString(raw.foto_url),
    cover_image_url: asString(raw.cover_image_url),
    rating: asNumber(raw.rating),
    reviews_count: asNumber(raw.reviews_count),
    is_active: typeof raw.is_active === 'boolean' ? raw.is_active : raw.attivo === true,
    is_approved:
      typeof raw.is_approved === 'boolean'
        ? raw.is_approved
        : (asString(raw.approval_status) ?? '').toLowerCase() === 'approved',
    approval_status: asString(raw.approval_status),
    created_at: asString(raw.created_at),
    updated_at: asString(raw.updated_at),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server config missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      professionalId?: string;
      userId?: string;
    };
    const professionalId = typeof body.professionalId === 'string' ? body.professionalId : '';
    const userId = typeof body.userId === 'string' ? body.userId : '';

    if (!professionalId && !userId) {
      return new Response(JSON.stringify({ error: 'professionalId o userId richiesto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let professionalQuery = supabase.from('professionals').select('*').limit(1);
    professionalQuery = professionalId
      ? professionalQuery.eq('id', professionalId)
      : professionalQuery.eq('user_id', userId);

    const { data: professionalRaw, error: professionalError } = await professionalQuery.maybeSingle();
    if (professionalError) {
      return new Response(JSON.stringify({ error: professionalError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const professional = mapProfessional((professionalRaw ?? null) as AnyRecord | null);
    if (!professional || !professional.id) {
      return new Response(
        JSON.stringify({
          professional: null,
          services: [],
          clients: [],
          bookings: [],
          booking_stats: { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 },
          projects: [],
          totals: { clients: 0, bookings: 0, projects: 0, attachments: 0, services: 0 },
          last_login: null,
          subscription: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resolvedProfessionalId = String(professional.id);
    const resolvedUserId = asString(professional.user_id);

    const [servicesRes, clientsRes, bookingsRes, projectsRes, profileRes, subscriptionRes] = await Promise.all([
      supabase
        .from('professional_services')
        .select('id,name,description,duration_minutes,price,is_active,created_at')
        .eq('professional_id', resolvedProfessionalId)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id,full_name,email,phone,notes,is_pp_subscriber,created_at')
        .eq('professional_id', resolvedProfessionalId)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('id,booking_date,booking_time,duration_minutes,status,notes,service_type,client_name,created_at,confirmed_at,cancelled_at')
        .eq('professional_id', resolvedProfessionalId)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .limit(50),
      supabase
        .from('projects')
        .select('id,name,objective,status,start_date,end_date,notes,created_at,client_id,clients(full_name)')
        .eq('professional_id', resolvedProfessionalId)
        .order('created_at', { ascending: false }),
      resolvedUserId
        ? supabase.from('profiles').select('last_login').eq('id', resolvedUserId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('professional_subscriptions')
        .select('status,trial_ends_at,current_period_end,cancel_at_period_end,created_at')
        .eq('professional_id', resolvedProfessionalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (servicesRes.error || clientsRes.error || bookingsRes.error || projectsRes.error || profileRes.error || subscriptionRes.error) {
      const firstError =
        servicesRes.error ??
        clientsRes.error ??
        bookingsRes.error ??
        projectsRes.error ??
        profileRes.error ??
        subscriptionRes.error;

      return new Response(JSON.stringify({ error: firstError?.message ?? 'Errore query dettaglio professionista' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const services = (servicesRes.data ?? []) as AnyRecord[];
    const clients = (clientsRes.data ?? []) as AnyRecord[];
    const bookings = (bookingsRes.data ?? []) as AnyRecord[];
    const projectsRaw = (projectsRes.data ?? []) as AnyRecord[];

    const projectIds = projectsRaw
      .map((p) => asString(p.id))
      .filter((v): v is string => Boolean(v));

    let attachmentRows: AnyRecord[] = [];
    if (projectIds.length > 0) {
      const attachmentsRes = await supabase
        .from('project_attachments')
        .select('id,project_id,file_size')
        .in('project_id', projectIds);
      if (!attachmentsRes.error) {
        attachmentRows = (attachmentsRes.data ?? []) as AnyRecord[];
      }
    }

    const attachmentMap = new Map<string, { count: number; totalSize: number }>();
    attachmentRows.forEach((row) => {
      const pid = asString(row.project_id);
      if (!pid) return;
      const curr = attachmentMap.get(pid) ?? { count: 0, totalSize: 0 };
      const size = asNumber(row.file_size) ?? 0;
      attachmentMap.set(pid, { count: curr.count + 1, totalSize: curr.totalSize + size });
    });

    const projects = projectsRaw.map((project) => {
      const pid = asString(project.id) ?? '';
      const counts = attachmentMap.get(pid) ?? { count: 0, totalSize: 0 };
      const clientRel = Array.isArray(project.clients) ? project.clients[0] : project.clients;
      const clientName =
        clientRel && typeof clientRel === 'object'
          ? asString((clientRel as AnyRecord).full_name)
          : null;

      return {
        id: pid,
        name: asString(project.name),
        objective: asString(project.objective),
        status: asString(project.status),
        start_date: asString(project.start_date),
        end_date: asString(project.end_date),
        notes: asString(project.notes),
        created_at: asString(project.created_at),
        client_name: clientName,
        attachment_count: counts.count,
        attachments_total_size: counts.totalSize,
      };
    });

    const bookingStats = bookings.reduce(
      (acc, booking) => {
        const status = (asString(booking.status) ?? '').toLowerCase();
        acc.total += 1;
        if (status === 'confirmed') acc.confirmed += 1;
        if (status === 'pending') acc.pending += 1;
        if (status === 'cancelled') acc.cancelled += 1;
        if (status === 'completed') acc.completed += 1;
        return acc;
      },
      { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 }
    );

    const totals = {
      clients: clients.length,
      bookings: bookings.length,
      projects: projects.length,
      attachments: attachmentRows.length,
      services: services.length,
    };

    return new Response(
      JSON.stringify({
        professional,
        services,
        clients,
        bookings,
        booking_stats: bookingStats,
        projects,
        totals,
        last_login: profileRes.data?.last_login ?? null,
        subscription: subscriptionRes.data ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-professional-detail]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

