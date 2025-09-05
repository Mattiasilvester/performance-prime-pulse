export const VF_VERSION_ID = import.meta.env.VITE_VF_VERSION_ID as string;
const VF_BASE = 'https://general-runtime.voiceflow.com';

const headers: Record<string, string> = {
  'Authorization': import.meta.env.VITE_VF_API_KEY as string,
  'Content-Type': 'application/json',
  'versionID': VF_VERSION_ID,
  'sessionID': 'default'
};

// DEBUG: Verifica variabili d'ambiente
console.log('🔍 DEBUG ENV VARIABLES:');
console.log('VF_VERSION_ID:', VF_VERSION_ID);
console.log('VF_API_KEY:', import.meta.env.VITE_VF_API_KEY ? 'Present' : 'Missing');
console.log('VF_BASE:', VF_BASE);

export async function vfPatchState(userId: string, vars: Record<string, any>) {
  // PROVA FORMATO A - Solo user ID (senza /v2/)
  const url = `${VF_BASE}/state/user/${encodeURIComponent(userId)}/interact`;
  
  // Headers dinamici con user ID
  const dynamicHeaders = {
    ...headers,
    'versionID': VF_VERSION_ID,
    'sessionID': userId
  };
  
  console.log('🔍 DEBUG VOICEFLOW PATCH STATE:');
  console.log('URL completo:', url);
  console.log('Version ID:', VF_VERSION_ID);
  console.log('User ID:', userId);
  console.log('Headers:', { 
    'Authorization': dynamicHeaders.Authorization ? 'Present' : 'Missing',
    'Content-Type': dynamicHeaders['Content-Type'],
    'versionID': dynamicHeaders.versionID,
    'sessionID': dynamicHeaders.sessionID
  });
  console.log('Variables:', vars);
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: dynamicHeaders,
      body: JSON.stringify({ variables: vars })
    });
    
    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Error response:', text);
      throw new Error(`VF state patch failed: ${res.status} ${text}`);
    }
    
    const responseData = await res.json();
    console.log('Success response:', responseData);
    return responseData;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export type VFTrace =
  | { type: 'text'; payload: { message: string } }
  | { type: 'choices'; payload: { choices: { name: string }[] } }
  | { type: string; payload?: any };

export async function vfInteract(userId: string, text: string, retries = 1): Promise<VFTrace[]> {
  // PROVA FORMATO A - Solo user ID (senza /v2/)
  const url = `${VF_BASE}/state/user/${encodeURIComponent(userId)}/interact`;
  const body = {
    request: { type: 'text', payload: text },
    config: { tts: false, stopAll: true, stripSSML: true }
  };

  // Headers dinamici con user ID
  const dynamicHeaders = {
    ...headers,
    'versionID': VF_VERSION_ID,
    'sessionID': userId
  };

  console.log('🔍 DEBUG VOICEFLOW INTERACT:');
  console.log('URL completo:', url);
  console.log('Version ID:', VF_VERSION_ID);
  console.log('User ID:', userId);
  console.log('Text:', text);
  console.log('Body:', body);
  console.log('Headers:', dynamicHeaders);

  try {
    const res = await fetch(url, { method: 'POST', headers: dynamicHeaders, body: JSON.stringify(body) });
    
    console.log('Interact response status:', res.status);
    console.log('Interact response headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('Interact error response:', errorText);
      throw new Error(`VF interact failed: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Interact success data:', data);
    return Array.isArray(data?.trace) ? (data.trace as VFTrace[]) : [];
  } catch (err) {
    console.error('Interact fetch error:', err);
    if (retries > 0) return vfInteract(userId, text, retries - 1);
    throw err;
  }
}

export function parseVF(traces: VFTrace[]) {
  const texts: string[] = [];
  let choices: string[] = [];
  for (const t of traces) {
    if (t.type === 'text' && (t as any).payload?.message) {
      texts.push((t as any).payload.message);
    }
    if (t.type === 'choices' && (t as any).payload?.choices) {
      choices = (t as any).payload.choices.map((c: any) => c.name);
    }
  }
  return { texts, choices };
}
