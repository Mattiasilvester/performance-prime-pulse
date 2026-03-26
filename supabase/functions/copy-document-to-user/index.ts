import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type CopyDocumentToUserBody = {
  professional_id: string;
  client_id: string;
  source_file_path: string;
  source_file_name: string;
  source_file_size: number;
  source_file_type: string;
  idempotency_key?: string;
};

type ErrorCode =
  | 'INVALID_PAYLOAD'
  | 'MISSING_BEARER_TOKEN'
  | 'INVALID_TOKEN'
  | 'PROFESSIONAL_NOT_FOUND'
  | 'PROFESSIONAL_OWNERSHIP_MISMATCH'
  | 'CLIENT_NOT_FOUND'
  | 'CLIENT_NOT_OWNED_BY_PROFESSIONAL'
  | 'CLIENT_WITHOUT_ACCOUNT'
  | 'SOURCE_FILE_NOT_FOUND'
  | 'STORAGE_COPY_FAILED'
  | 'DB_INSERT_FAILED';

type JsonRecord = Record<string, unknown>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(payload: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, code: ErrorCode, message: string): Response {
  return jsonResponse(
    {
      success: false,
      error: { code, message },
    },
    status
  );
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function getFileExtension(fileName: string, mimeType: string): string {
  const maybeExt = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '';
  if (maybeExt) return maybeExt;

  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'bin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Method not allowed' } }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(
      {
        success: false,
        error: { code: 'DB_INSERT_FAILED', message: 'Missing Supabase environment variables' },
      },
      500
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(401, 'MISSING_BEARER_TOKEN', 'Missing or invalid Authorization Bearer token');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return errorResponse(401, 'MISSING_BEARER_TOKEN', 'Bearer token is empty');
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  let body: CopyDocumentToUserBody;
  try {
    const parsed = (await req.json()) as Partial<CopyDocumentToUserBody>;
    body = {
      professional_id: parsed.professional_id ?? '',
      client_id: parsed.client_id ?? '',
      source_file_path: parsed.source_file_path ?? '',
      source_file_name: parsed.source_file_name ?? '',
      source_file_size: Number(parsed.source_file_size),
      source_file_type: parsed.source_file_type ?? '',
      idempotency_key: parsed.idempotency_key,
    };
  } catch {
    return errorResponse(400, 'INVALID_PAYLOAD', 'Invalid JSON payload');
  }

  if (
    !body.professional_id ||
    !body.client_id ||
    !body.source_file_path ||
    !body.source_file_name ||
    !body.source_file_type ||
    !Number.isFinite(body.source_file_size) ||
    body.source_file_size <= 0
  ) {
    return errorResponse(400, 'INVALID_PAYLOAD', 'Missing required fields in request body');
  }

  if (!isValidUuid(body.professional_id) || !isValidUuid(body.client_id)) {
    return errorResponse(400, 'INVALID_PAYLOAD', 'professional_id and client_id must be valid UUIDs');
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !authUser) {
    return errorResponse(401, 'INVALID_TOKEN', 'Invalid or expired bearer token');
  }

  const { data: professionalRow, error: professionalErr } = await serviceClient
    .from('professionals')
    .select('id, user_id')
    .eq('id', body.professional_id)
    .maybeSingle<{ id: string; user_id: string }>();

  if (professionalErr) {
    return errorResponse(500, 'DB_INSERT_FAILED', professionalErr.message);
  }
  if (!professionalRow) {
    return errorResponse(404, 'PROFESSIONAL_NOT_FOUND', 'Professional not found');
  }
  if (professionalRow.user_id !== authUser.id) {
    return errorResponse(403, 'PROFESSIONAL_OWNERSHIP_MISMATCH', 'Professional does not belong to authenticated user');
  }

  const { data: clientRow, error: clientErr } = await serviceClient
    .from('clients')
    .select('id, professional_id, user_id')
    .eq('id', body.client_id)
    .maybeSingle<{ id: string; professional_id: string; user_id: string | null }>();

  if (clientErr) {
    return errorResponse(500, 'DB_INSERT_FAILED', clientErr.message);
  }
  if (!clientRow) {
    return errorResponse(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }
  if (clientRow.professional_id !== body.professional_id) {
    return errorResponse(403, 'CLIENT_NOT_OWNED_BY_PROFESSIONAL', 'Client is not owned by this professional');
  }
  if (!clientRow.user_id) {
    return errorResponse(422, 'CLIENT_WITHOUT_ACCOUNT', 'Client has no linked Performance Prime account');
  }

  const { data: existingAssignment, error: existingErr } = await serviceClient
    .from('pt_assigned_documents')
    .select('id')
    .eq('professional_id', body.professional_id)
    .eq('client_id', body.client_id)
    .eq('user_id', clientRow.user_id)
    .eq('file_path', body.source_file_path)
    .maybeSingle<{ id: string }>();

  if (existingErr) {
    return errorResponse(500, 'DB_INSERT_FAILED', existingErr.message);
  }

  if (existingAssignment) {
    return jsonResponse({
      success: true,
      assignment_id: existingAssignment.id,
      user_document_id: null,
      notification_id: null,
      user_id: clientRow.user_id,
      target_file_path: null,
      already_assigned: true,
    });
  }

  const { data: sourceBlob, error: downloadErr } = await serviceClient.storage
    .from('project-attachments')
    .download(body.source_file_path);

  if (downloadErr || !sourceBlob) {
    return errorResponse(404, 'SOURCE_FILE_NOT_FOUND', 'Source file not found in project-attachments');
  }

  const ext = getFileExtension(body.source_file_name, body.source_file_type);
  const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const targetPath = `${clientRow.user_id}/pt_${Date.now()}_${randomSuffix}.${ext}`;

  const { error: uploadErr } = await serviceClient.storage.from('user-documents').upload(targetPath, sourceBlob, {
    contentType: body.source_file_type,
    upsert: false,
  });

  if (uploadErr) {
    return errorResponse(500, 'STORAGE_COPY_FAILED', uploadErr.message);
  }

  let assignmentId: string | null = null;
  let userDocumentId: string | null = null;

  const { data: assignmentInsert, error: assignmentErr } = await serviceClient
    .from('pt_assigned_documents')
    .insert({
      professional_id: body.professional_id,
      client_id: body.client_id,
      user_id: clientRow.user_id,
      name: body.source_file_name,
      file_path: body.source_file_path,
      file_size: body.source_file_size,
      file_type: body.source_file_type,
    })
    .select('id')
    .single<{ id: string }>();

  if (assignmentErr || !assignmentInsert) {
    await serviceClient.storage.from('user-documents').remove([targetPath]);
    return errorResponse(500, 'DB_INSERT_FAILED', assignmentErr?.message ?? 'Failed to insert pt_assigned_documents');
  }
  assignmentId = assignmentInsert.id;

  const { data: userDocInsert, error: userDocErr } = await serviceClient
    .from('user_documents')
    .insert({
      user_id: clientRow.user_id,
      name: body.source_file_name,
      file_path: targetPath,
      file_size: body.source_file_size,
      file_type: body.source_file_type,
      category: 'scheda_pt',
      source: 'pt',
      parsing_status: 'pending',
    })
    .select('id')
    .single<{ id: string }>();

  if (userDocErr || !userDocInsert) {
    await serviceClient.storage.from('user-documents').remove([targetPath]);
    await serviceClient.from('pt_assigned_documents').delete().eq('id', assignmentId);
    return errorResponse(500, 'DB_INSERT_FAILED', userDocErr?.message ?? 'Failed to insert user_documents');
  }
  userDocumentId = userDocInsert.id;

  let notificationId: string | null = null;
  const notificationMessage = `Il tuo PT ha condiviso "${body.source_file_name}"`;

  const { data: notificationInsert, error: notificationErr } = await serviceClient
    .from('notifications')
    .insert({
      user_id: clientRow.user_id,
      type: 'pt_document',
      title: 'Nuova scheda dal tuo PT',
      message: notificationMessage,
      data: {
        assignment_id: assignmentId,
        user_document_id: userDocumentId,
        idempotency_key: body.idempotency_key ?? null,
      },
    })
    .select('id')
    .maybeSingle<{ id: string }>();

  if (notificationErr) {
    console.warn('[copy-document-to-user] Notification insert failed (non-blocking):', notificationErr.message);
  } else if (notificationInsert?.id) {
    notificationId = notificationInsert.id;
  }

  return jsonResponse({
    success: true,
    assignment_id: assignmentId,
    user_document_id: userDocumentId,
    notification_id: notificationId,
    user_id: clientRow.user_id,
    target_file_path: targetPath,
    already_assigned: false,
  });
});
