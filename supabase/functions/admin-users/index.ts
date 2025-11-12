// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  full_name?: string;
  avatar_url?: string;
}

interface UpdateUserPayload {
  is_active?: boolean;
  role?: string;
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    switch (method) {
      case 'GET': {
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status');

        let query = supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.ilike('email', `%${search}%`);
        }

        if (status === 'active') {
          query = query.eq('is_active', true);
        } else if (status === 'inactive') {
          query = query.eq('is_active', false);
        }

        const { data: users, error: usersError, count } = await query;

        if (usersError) {
          throw usersError;
        }

        return new Response(
          JSON.stringify({
            users,
            count,
            limit,
            offset,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      case 'PATCH': {
        const pathParts = url.pathname.split('/');
        const userId = pathParts[pathParts.length - 1];

        if (!userId || userId === 'admin-users') {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }

        const body = await req.json() as UpdateUserPayload;

        if (
          body.is_active === undefined &&
          body.role === undefined
        ) {
          return new Response(
            JSON.stringify({ error: 'No valid fields to update' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }

        const updateData: Partial<UserProfile> = {};

        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.role) updateData.role = body.role;

        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            user: updatedUser,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      case 'DELETE': {
        const pathParts = url.pathname.split('/');
        const userId = pathParts[pathParts.length - 1];

        if (!userId || userId === 'admin-users') {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }

        const { error: softDeleteError } = await supabaseAdmin
          .from('profiles')
          .update({ is_active: false })
          .eq('id', userId);

        if (softDeleteError) {
          throw softDeleteError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'User deactivated successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      default: {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }
  } catch (error) {
    console.error('Error in admin-users:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
