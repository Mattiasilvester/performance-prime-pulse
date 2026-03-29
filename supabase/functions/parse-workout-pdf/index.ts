import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type ParseWorkoutPdfBody = {
  document_id?: string;
};

type Exercise = {
  nome: string;
  serie: number;
  ripetizioni: string;
  rest: string;
  note?: string;
};

type WorkoutDay = {
  nome: string;
  esercizi: Exercise[];
};

type WorkoutJson = {
  giorni: WorkoutDay[];
};

type UserDocumentRow = {
  id: string;
  user_id: string;
  category: string;
  file_path: string;
  workout_json: WorkoutJson | null;
  parsing_status: 'pending' | 'processing' | 'done' | 'error' | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const RESPONSE_USER_PROMPT = `Sei un assistente che analizza schede di allenamento.
Estrai la struttura degli esercizi dal PDF allegato e restituisci
SOLO un JSON valido, senza markdown, senza backtick, senza testo aggiuntivo.
Il JSON deve seguire esattamente questo schema:
{
  "giorni": [
    {
      "nome": "Giorno A - Petto e Tricipiti",
      "esercizi": [
        {
          "nome": "Panca piana",
          "serie": 4,
          "ripetizioni": "8-10",
          "rest": "90s",
          "note": "presa larga"
        }
      ]
    }
  ]
}
Usa sempre "rest" (non "recupero") per il tempo di recupero.
Se non riesci a identificare esercizi strutturati, restituisci:
{ "giorni": [] }`;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  status: number,
  code:
    | 'INVALID_PAYLOAD'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'FILE_NOT_FOUND'
    | 'UNPROCESSABLE_PDF'
    | 'NO_EXERCISES_FOUND'
    | 'INTERNAL_ERROR',
  message: string
): Response {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Estrae testo dalla Responses API: output_text aggregato o parti type output_text. */
function extractResponsesOutputText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const o = data as Record<string, unknown>;
  if (typeof o.output_text === 'string' && o.output_text.trim()) {
    return o.output_text.trim();
  }
  const output = o.output;
  if (!Array.isArray(output)) return '';
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const it = item as Record<string, unknown>;
    const content = it.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const p = part as Record<string, unknown>;
      if (p.type === 'output_text' && typeof p.text === 'string') {
        return p.text.trim();
      }
    }
  }
  return '';
}

function safeParseWorkoutJson(content: string): WorkoutJson | null {
  const tryParse = (raw: string): WorkoutJson | null => {
    try {
      return JSON.parse(raw) as WorkoutJson;
    } catch {
      return null;
    }
  };

  const direct = tryParse(content);
  if (direct) return direct;

  const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  return tryParse(cleaned);
}

async function markError(
  serviceClient: ReturnType<typeof createClient>,
  documentId: string,
  message: string
): Promise<void> {
  await serviceClient
    .from('user_documents')
    .update({
      parsing_status: 'error',
      parse_error: message,
    })
    .eq('id', documentId);
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return errorResponse(400, 'INVALID_PAYLOAD', 'Method not allowed');
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      return errorResponse(500, 'INTERNAL_ERROR', 'Missing server environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid Authorization Bearer token');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return errorResponse(401, 'UNAUTHORIZED', 'Bearer token is empty');
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user: authUser },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !authUser) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired bearer token');
    }

    let body: ParseWorkoutPdfBody;
    try {
      body = (await req.json()) as ParseWorkoutPdfBody;
    } catch {
      return errorResponse(400, 'INVALID_PAYLOAD', 'Invalid JSON payload');
    }

    const documentId = body.document_id?.trim();
    if (!documentId || !isValidUuid(documentId)) {
      return errorResponse(400, 'INVALID_PAYLOAD', 'document_id must be a valid UUID');
    }

    const { data: doc, error: docError } = await serviceClient
      .from('user_documents')
      .select('id, user_id, category, file_path, workout_json, parsing_status')
      .eq('id', documentId)
      .maybeSingle<UserDocumentRow>();

    if (docError || !doc) {
      return errorResponse(404, 'FILE_NOT_FOUND', 'Documento non trovato');
    }

    if (doc.user_id !== authUser.id) {
      return errorResponse(403, 'FORBIDDEN', 'Documento non autorizzato');
    }

    if (doc.category !== 'scheda_pt') {
      return errorResponse(422, 'UNPROCESSABLE_PDF', 'Il documento non e una scheda PT');
    }

    if (doc.workout_json && doc.parsing_status === 'done') {
      return jsonResponse({
        success: true,
        workout_json: doc.workout_json,
        cached: true,
      });
    }

    if (doc.parsing_status === 'processing') {
      return jsonResponse({
        success: false,
        status: 'processing',
      });
    }

    const { error: processingError } = await serviceClient
      .from('user_documents')
      .update({
        parsing_status: 'processing',
        parse_error: null,
      })
      .eq('id', documentId);

    if (processingError) {
      return errorResponse(500, 'INTERNAL_ERROR', 'Impossibile aggiornare stato parsing');
    }

    const { data: pdfBlob, error: downloadError } = await serviceClient.storage
      .from('user-documents')
      .download(doc.file_path);

    if (downloadError || !pdfBlob) {
      await markError(serviceClient, documentId, 'File non trovato');
      return errorResponse(404, 'FILE_NOT_FOUND', 'File non trovato');
    }

    const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const fileData = `data:application/pdf;base64,${base64}`;

    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: RESPONSE_USER_PROMPT,
              },
              {
                type: 'input_file',
                filename: 'scheda.pdf',
                file_data: fileData,
              },
            ],
          },
        ],
        max_output_tokens: 2000,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', errText);
      await markError(serviceClient, documentId, 'Errore chiamata AI');
      return jsonResponse(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Errore AI' } },
        500
      );
    }

    const openaiData = (await openaiRes.json()) as unknown;
    const rawText = extractResponsesOutputText(openaiData);

    let workoutJson: WorkoutJson;
    try {
      const parsed = safeParseWorkoutJson(rawText.replace(/```json|```/g, '').trim());
      if (!parsed || !Array.isArray(parsed.giorni) || parsed.giorni.length === 0) {
        throw new Error('Nessun giorno trovato');
      }
      workoutJson = parsed;
    } catch {
      await markError(serviceClient, documentId, 'Impossibile estrarre esercizi dal PDF');
      return jsonResponse(
        {
          success: false,
          error: { code: 'NO_EXERCISES_FOUND', message: 'Impossibile estrarre esercizi dal PDF' },
        },
        422
      );
    }

    const { error: updateDoneError } = await serviceClient
      .from('user_documents')
      .update({
        workout_json: workoutJson,
        parsing_status: 'done',
        parsed_at: new Date().toISOString(),
        parse_error: null,
      })
      .eq('id', documentId);

    if (updateDoneError) {
      return errorResponse(500, 'INTERNAL_ERROR', 'Impossibile salvare risultato parsing');
    }

    return jsonResponse({
      success: true,
      workout_json: workoutJson,
      cached: false,
    });
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Errore interno' },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
