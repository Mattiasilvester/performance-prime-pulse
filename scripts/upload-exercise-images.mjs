/**
 * Script: scarica immagini esercizi da Wger API e carica su Supabase Storage.
 * Esegui dalla root del monorepo con VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';

// STEP 1 — Configurazione: carica .env dalla root del monorepo
const rootDir = process.cwd();
const envPath = resolve(rootDir, '.env');
try {
  const content = await readFile(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // .env opzionale se le variabili sono già in process.env
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Errore: imposta VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (env o .env nella root)');
  process.exit(1);
}

const WGER_BASE = 'https://wger.de';

// STEP 2 — Mappa esercizi → nome inglese per ricerca Wger
const EXERCISE_SEARCH_MAP = {
  // FORZA
  'flessioni': 'push up',
  'squat': 'squat',
  'panca-piana': 'bench press',
  'stacco-da-terra': 'deadlift',
  'pull-up': 'pull up',
  'affondi': 'lunge',
  'plank': 'plank',
  'crunch': 'crunch',
  'dip-alle-parallele': 'dips',
  'lat-machine': 'lat pulldown',
  'military-press': 'overhead press',
  'alzate-laterali': 'lateral raise',
  'curl-con-manubri': 'bicep curl',
  'tricep-extension': 'tricep extension',
  'glute-bridge': 'glute bridge',
  'russian-twist': 'russian twist',
  'leg-raises': 'leg raise',
  'shoulder-press': 'shoulder press',
  'rematore-con-manubri': 'dumbbell row',
  'stacco-su-una-gamba': 'single leg deadlift',
  'affondi-camminati': 'walking lunge',
  'goblet-squat': 'goblet squat',
  'bulgarian-split-squat': 'bulgarian split squat',
  'calf-raises': 'calf raise',
  // CARDIO
  'jumping-jacks': 'jumping jack',
  'burpees': 'burpee',
  'high-knees': 'high knees',
  'scalatori': 'mountain climber',
  'corsa-sul-posto': 'running in place',
  // HIIT
  'jump-squats': 'jump squat',
  'burpees-esplosivi': 'burpee',
  'affondi-saltati': 'jump lunge',
  // MOBILITÀ
  'cat-cow': 'cat cow',
  'posizione-del-bambino': 'child pose',
  'posizione-del-cobra': 'cobra stretch',
  'piegamento-in-avanti': 'forward fold',
  'hip-flexor-stretch': 'hip flexor stretch',
};

// Slug → categoria (allineata a exerciseGifs.ts)
const SLUG_TO_CATEGORY = {
  'flessioni': 'forza',
  'squat': 'forza',
  'panca-piana': 'forza',
  'stacco-da-terra': 'forza',
  'pull-up': 'forza',
  'affondi': 'forza',
  'plank': 'forza',
  'crunch': 'forza',
  'dip-alle-parallele': 'forza',
  'lat-machine': 'forza',
  'military-press': 'forza',
  'alzate-laterali': 'forza',
  'curl-con-manubri': 'forza',
  'tricep-extension': 'forza',
  'glute-bridge': 'forza',
  'russian-twist': 'forza',
  'leg-raises': 'forza',
  'shoulder-press': 'forza',
  'rematore-con-manubri': 'forza',
  'stacco-su-una-gamba': 'forza',
  'affondi-camminati': 'forza',
  'goblet-squat': 'forza',
  'bulgarian-split-squat': 'forza',
  'calf-raises': 'forza',
  'jumping-jacks': 'cardio',
  'burpees': 'cardio',
  'high-knees': 'cardio',
  'scalatori': 'cardio',
  'corsa-sul-posto': 'cardio',
  'jump-squats': 'hiit',
  'burpees-esplosivi': 'hiit',
  'affondi-saltati': 'hiit',
  'cat-cow': 'mobilita',
  'posizione-del-bambino': 'mobilita',
  'posizione-del-cobra': 'mobilita',
  'piegamento-in-avanti': 'mobilita',
  'hip-flexor-stretch': 'mobilita',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function getContentType(urlOrPath) {
  const p = (urlOrPath || '').toLowerCase();
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

async function processSlug(slug, searchTerm) {
  try {
    // 1) Chiamata search API
    const searchUrl = `${WGER_BASE}/api/v2/exercise/search/?term=${encodeURIComponent(searchTerm)}&language=english&format=json`;
    let imageUrl = null;
    let baseId = null;

    const searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const suggestions = searchData.suggestions || [];
      const withImage = suggestions.find((s) => s?.data?.image);
      if (withImage?.data) {
        imageUrl = withImage.data.image ? `${WGER_BASE}${withImage.data.image}` : null;
        baseId = withImage.data.base_id;
      }
      if (!imageUrl && suggestions[0]?.data?.base_id) {
        baseId = suggestions[0].data.base_id;
      }
    }

    // 2) Se non c'è immagine dalla search, prova exerciseimage con exercise_base
    if (!imageUrl && baseId) {
      const imgApiUrl = `${WGER_BASE}/api/v2/exerciseimage/?format=json&exercise_base=${baseId}&is_main=true`;
      const imgRes = await fetch(imgApiUrl);
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const first = imgData.results?.[0] || imgData[0];
        if (first?.image) {
          imageUrl = first.image.startsWith('http') ? first.image : `${WGER_BASE}${first.image}`;
        }
      }
    }

    // 3) Fallback: lista exercise con filtro nome (language=2 inglese)
    if (!imageUrl) {
      const listUrl = `${WGER_BASE}/api/v2/exercise/?format=json&language=2&limit=50`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData = await listRes.json();
        const results = listData.results || [];
        const term = searchTerm.toLowerCase();
        const match = results.find((e) => (e.name || '').toLowerCase().includes(term));
        if (match?.exercise_base) {
          const bid = typeof match.exercise_base === 'number' ? match.exercise_base : parseInt(String(match.exercise_base).split('/').filter(Boolean).pop(), 10);
          const imgApiUrl = `${WGER_BASE}/api/v2/exerciseimage/?format=json&exercise_base=${bid}&is_main=true`;
          const imgRes = await fetch(imgApiUrl);
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const first = imgData.results?.[0] || imgData[0];
            if (first?.image) {
              imageUrl = first.image.startsWith('http') ? first.image : `${WGER_BASE}${first.image}`;
            }
          }
        }
      }
    }

    if (!imageUrl) {
      console.log(`⚠️  ${slug} → nessuna immagine trovata su Wger`);
      return;
    }

    // 4) Scarica immagine
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.log(`❌  ${slug} → errore download (${imageResponse.status})`);
      return;
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = getContentType(imageUrl);
    const ext = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png';

    const categoria = SLUG_TO_CATEGORY[slug] || 'forza';
    const objectPath = `exercise-gifs/${categoria}/${slug}.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${objectPath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.log(`❌  ${slug} → errore upload: ${uploadRes.status} ${errText}`);
      return;
    }

    console.log(`✅  ${slug} → ${imageUrl} → caricato in ${objectPath}`);
  } catch (err) {
    console.log(`❌  ${slug} → errore: ${err.message}`);
  }
}

// STEP 3 — Logica principale
async function main() {
  console.log('Avvio upload immagini esercizi (Wger → Supabase Storage)...\n');
  const entries = Object.entries(EXERCISE_SEARCH_MAP);
  for (let i = 0; i < entries.length; i++) {
    const [slug, searchTerm] = entries[i];
    await processSlug(slug, searchTerm);
    if (i < entries.length - 1) await delay(500);
  }
  console.log('\nFine.');
}

main();

// COME ESEGUIRE:
// 1. Assicurati di avere Node 18+ installato
// 2. Dalla root del monorepo:
//    VITE_SUPABASE_URL=https://xxx.supabase.co \
//    SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//    node scripts/upload-exercise-images.mjs
// 3. Lo script logga ogni esercizio processato
// 4. Le immagini vengono caricate in exercise-gifs/forza/, /cardio/, ecc.
