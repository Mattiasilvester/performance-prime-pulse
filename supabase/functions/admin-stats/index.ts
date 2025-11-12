// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface AdminStats {
  totalUsers: number;
  payingUsers: number;
  activeToday: number;
  revenue: number;
  churnRate: number;
  conversionRate: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersLast7Days: number;
  newUsersThisMonth: number;
  growth: number;
  engagement: number;
  totalWorkouts: number;
  monthlyWorkouts: number;
  totalPT: number;
  professionals: number;
  activeObjectives: number;
  totalNotes: number;
  activationD0Rate: number;
  activationRate: number;
  retentionD7: number;
  weeklyGrowth: number;
  workoutAnalytics?: {
    totalWorkouts: number;
    avgWorkoutsPerUser: number;
    mostActiveUsers: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: super_admin role required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const stats: AdminStats = {
      totalUsers: 0,
      payingUsers: 0,
      activeToday: 0,
      revenue: 0,
      churnRate: 0,
      conversionRate: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      newUsersLast7Days: 0,
      newUsersThisMonth: 0,
      growth: 0,
      engagement: 0,
      totalWorkouts: 0,
      monthlyWorkouts: 0,
      totalPT: 0,
      professionals: 0,
      activeObjectives: 0,
      totalNotes: 0,
      activationD0Rate: 0,
      activationRate: 0,
      retentionD7: 0,
      weeklyGrowth: 0,
    };

    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    stats.totalUsers = totalUsers ?? 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', thirtyDaysAgo.toISOString());
    stats.activeUsers = activeUsers ?? 0;
    stats.inactiveUsers = Math.max(stats.totalUsers - stats.activeUsers, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    stats.newUsersLast7Days = newUsers ?? 0;
    stats.newUsersThisMonth = stats.newUsersLast7Days;
    stats.weeklyGrowth = stats.newUsersLast7Days;

    const { count: usersWithWorkouts } = await supabaseAdmin
      .from('custom_workouts')
      .select('user_id', { count: 'exact', head: true });
    stats.activationD0Rate = stats.totalUsers > 0
      ? Math.round(((usersWithWorkouts ?? 0) / stats.totalUsers) * 100)
      : 0;
    stats.activationRate = stats.activationD0Rate;

    stats.growth = stats.totalUsers > 0
      ? Math.round((stats.newUsersLast7Days / stats.totalUsers) * 1000) / 10
      : 0;
    stats.engagement = stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 1000) / 10
      : 0;

    const url = new URL(req.url);
    const includeWorkouts = url.searchParams.get('includeWorkouts') === 'true';

    if (includeWorkouts) {
      const { count: totalWorkouts } = await supabaseAdmin
        .from('custom_workouts')
        .select('*', { count: 'exact', head: true });

      stats.totalWorkouts = totalWorkouts ?? 0;
      stats.workoutAnalytics = {
        totalWorkouts: totalWorkouts ?? 0,
        avgWorkoutsPerUser: stats.totalUsers > 0
          ? Math.round(((totalWorkouts ?? 0) / stats.totalUsers) * 10) / 10
          : 0,
        mostActiveUsers: 0,
      };
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
