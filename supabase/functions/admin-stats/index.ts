/**
 * Edge Function: admin-stats
 * Restituisce KPI Pulse Check, applicazioni in attesa e lista professionisti per SuperAdmin.
 * Usa Service Role per leggere tutti i dati (bypass RLS).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const PROF_MRR_EUR = 50;

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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Professionisti: user_id per distinguere B2C da B2B
    const { data: proUserIdsData } = await supabase.from('professionals').select('user_id').not('user_id', 'is', null);
    const proUserIds = new Set((proUserIdsData ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean));

    // Query in parallelo
    const [profilesRes, newUsers7dRes, professionalsRes, professionalsListRes, bookingsRes, reviewsRes, settingsRes, applicationsRes, subsCanceledRes, subsInScadenzaRes, workoutStatsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved').eq('attivo', true),
      supabase.from('professionals').select('id, first_name, last_name, email, category, zona, approval_status, attivo, rating, reviews_count, created_at').order('created_at', { ascending: false }).range(0, 199),
      supabase.from('bookings').select('id, status, price, booking_date').gte('booking_date', monthStart).lte('booking_date', monthEnd),
      supabase.from('reviews').select('rating'),
      supabase.from('professional_settings').select('professional_id, stripe_connect_enabled, subscription_status').eq('stripe_connect_enabled', true),
      supabase.from('professional_applications').select('id, first_name, last_name, email, phone, category, city, company_name, vat_number, bio, specializations, status, submitted_at').eq('status', 'pending').order('submitted_at', { ascending: true }),
      supabase.from('professional_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled'),
      supabase.from('professional_subscriptions').select('id', { count: 'exact', head: true }).eq('cancel_at_period_end', true),
      supabase.from('user_workout_stats').select('user_id, total_workouts').gte('total_workouts', 1),
    ]);

    const totalUsers = profilesRes.count ?? 0;
    const newUsersLast7Days = newUsers7dRes.count ?? 0;
    const activeProfessionalsCount = professionalsRes.count ?? 0;
    const professionalsList = professionalsListRes.data ?? [];
    const bookingsThisMonthList = bookingsRes.data ?? [];
    const reviewsList = reviewsRes.data ?? [];
    const payingProIds = new Set((settingsRes.data ?? []).map((r: { professional_id: string }) => r.professional_id));
    const pendingApplications = applicationsRes.data ?? [];
    const churnB2BCanceledCount = subsCanceledRes.count ?? 0;
    const cancellationsInScadenza = subsInScadenzaRes.count ?? 0;
    const workoutStatsList = (workoutStatsRes.data ?? []) as { user_id: string; total_workouts: number | null }[];

    const bookingsThisMonth = bookingsThisMonthList.length;
    const completedThisMonth = bookingsThisMonthList.filter((b: { status: string | null }) => b.status === 'completed');
    const bookingsCompleted = completedThisMonth.length;
    const bookingCompletionRate = bookingsThisMonth > 0
      ? Math.round((bookingsCompleted / bookingsThisMonth) * 1000) / 10
      : 0;
    const gmvThisMonth = completedThisMonth.reduce(
      (sum: number, b: { price: number | null }) => sum + (Number(b.price) || 0),
      0
    );
    const avgRating = reviewsList.length > 0
      ? reviewsList.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewsList.length
      : 0;

    const b2cTotalCount = Math.max(0, totalUsers - proUserIds.size);
    const b2cActiveCount = workoutStatsList.filter((r) => !proUserIds.has(r.user_id)).length;
    const b2cActivePercent = b2cTotalCount > 0 ? Math.round((b2cActiveCount / b2cTotalCount) * 1000) / 10 : 0;

    const mrrProfessionals = payingProIds.size * PROF_MRR_EUR;
    const mrrUsers = 0; // quando avrai user_subscriptions
    const mrrTotal = mrrProfessionals + mrrUsers;

    // Trial conversion: placeholder (serve storico trial scaduti vs convertiti)
    const trialConversionRate = 0;

    const pulseCheck = {
      mrrTotal,
      mrrUsers,
      mrrProfessionals,
      totalUsers,
      activeProfessionals: activeProfessionalsCount,
      bookingsThisMonth,
      bookingsCompleted,
      gmvThisMonth,
      trialConversionRate,
      avgRating: Math.round(avgRating * 10) / 10,
      churnB2BCanceledCount,
      cancellationsInScadenza,
      bookingCompletionRate,
      b2cTotalCount,
      b2cActiveCount,
      b2cActivePercent,
    };

    const body = await req.json().catch(() => ({}));
    const includeProfessionals = (body as { includeProfessionals?: boolean }).includeProfessionals !== false;
    const includeApplications = (body as { includeApplications?: boolean }).includeApplications !== false;

    const response: Record<string, unknown> = {
      pulseCheck,
      totalUsers,
      professionals: activeProfessionalsCount,
      newUsersThisWeek: newUsersLast7Days,
      newUsersLast7Days,
      pendingApplicationsCount: pendingApplications.length,
      totalBookings: bookingsThisMonth,
      totalRevenue: gmvThisMonth,
      totalUsers: totalUsers,
      payingUsers: 0,
      activeToday: 0,
      revenue: gmvThisMonth,
      churnRate: 0,
      conversionRate: trialConversionRate,
      activeUsers: 0,
      inactiveUsers: 0,
      totalWorkouts: 0,
      monthlyWorkouts: 0,
      totalPT: activeProfessionalsCount,
      growth: 0,
      engagement: 0,
      newUsersThisMonth: 0,
      activationD0Rate: 0,
      activationRate: 0,
      retentionD7: 0,
      weeklyGrowth: newUsersLast7Days,
      churnB2BCanceledCount,
      cancellationsInScadenza,
      bookingCompletionRate,
      b2cTotalCount,
      b2cActiveCount,
      b2cActivePercent,
    };

    if (includeApplications) {
      response.pendingApplications = pendingApplications.map((a: Record<string, unknown>) => ({
        ...a,
        hoursWaiting: a.submitted_at
          ? Math.floor((Date.now() - new Date(a.submitted_at as string).getTime()) / 3600000)
          : null,
      }));
    }
    if (includeProfessionals) {
      response.professionalsList = professionalsList;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[admin-stats]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
