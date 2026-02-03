// src/test/test-env.ts
import { supabase } from '@pp/shared'; // se l'alias @ non funziona, usa ../integrations/supabase/client

const write = (id: string, txt: string) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

async function ensureDevLogin() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const email = import.meta.env.VITE_DEV_TEST_EMAIL!;
  const password = import.meta.env.VITE_DEV_TEST_PASSWORD!;
  if (!email || !password) throw new Error('Missing VITE_DEV_TEST_EMAIL/PASSWORD');
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return res.data.user!;
}

async function run() {
  try {
    write('supabase-conn', 'OK ✅');
    const user = await ensureDevLogin();
    write('auth', `Login: ${user.email} ✅`);
    const uid = user.id;

    const p = await supabase.from('profiles').select('*').eq('id', uid).limit(1);
    if (p.error) throw p.error; write('profiles', `OK (${p.data?.length ?? 0}) ✅`);

    const cw = await supabase.from('custom_workouts').select('*').eq('user_id', uid).limit(5);
    if (cw.error) throw cw.error; write('custom_workouts', `OK (${cw.data?.length ?? 0}) ✅`);

    const st = await supabase.from('user_workout_stats').select('*').eq('user_id', uid).limit(5);
    if (st.error) throw st.error; write('user_workout_stats', `OK (${st.data?.length ?? 0}) ✅`);
  } catch (e: unknown) {
    const err = e as Error;
    console.error(e); write('errors', err?.message || String(e));
  }
}
document.addEventListener('DOMContentLoaded', run);
