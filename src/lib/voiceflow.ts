export const VF_VERSION_ID = import.meta.env.VITE_VF_VERSION_ID as string;
const VF_BASE = 'https://general-runtime.voiceflow.com';

const headers: Record<string, string> = {
  'Authorization': import.meta.env.VITE_VF_API_KEY as string,
  'Content-Type': 'application/json'
};

export async function vfPatchState(userId: string, vars: Record<string, any>) {
  const url = `${VF_BASE}/state/${VF_VERSION_ID}/user/${encodeURIComponent(userId)}/state`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ variables: vars })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`VF state patch failed: ${res.status} ${text}`);
  }
}

export type VFTrace =
  | { type: 'text'; payload: { message: string } }
  | { type: 'choices'; payload: { choices: { name: string }[] } }
  | { type: string; payload?: any };

export async function vfInteract(userId: string, text: string, retries = 1): Promise<VFTrace[]> {
  const url = `${VF_BASE}/state/${VF_VERSION_ID}/user/${encodeURIComponent(userId)}/interact`;
  const body = {
    request: { type: 'text', payload: text },
    config: { tts: false, stopAll: true, stripSSML: true }
  };

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`VF interact failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.trace) ? (data.trace as VFTrace[]) : [];
  } catch (err) {
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
