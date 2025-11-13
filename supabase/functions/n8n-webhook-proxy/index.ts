// Edge Function proxy per webhook N8N con secret server-side
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

const N8N_WEBHOOKS = {
  welcome: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-welcome',
  passwordReset: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-password-reset',
  verification: 'https://gurfadigitalsolution.app.n8n.cloud/webhook/pp-email-verification',
} as const;

type WebhookType = 'welcome' | 'passwordReset' | 'verification';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const webhookType = url.searchParams.get('type') as WebhookType;

    if (!webhookType || !N8N_WEBHOOKS[webhookType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const webhookUrl = N8N_WEBHOOKS[webhookType];
    const payload = await req.json();

    // Aggiungi secret server-side
    const secret = Deno.env.get('N8N_WEBHOOK_SECRET') ?? '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      headers['x-pp-secret'] = secret;
    }

    // Forward request a N8N
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json().catch(() => ({}));

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in n8n-webhook-proxy:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

