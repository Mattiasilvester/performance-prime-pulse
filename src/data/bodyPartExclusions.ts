// Mappatura delle zone del corpo agli esercizi da ESCLUDERE
export const BODY_PART_EXCLUSIONS: Record<string, string[]> = {
  // SPALLA (sinistra, destra, o generica)
  spalla: [
    'push-up', 'flessioni', 'piegamenti',
    'military press', 'shoulder press', 'lento avanti',
    'alzate laterali', 'lateral raise',
    'alzate frontali', 'front raise',
    'arnold press',
    'dip', 'dips',
    'panca piana', 'bench press', 'panca inclinata', 'panca declinata',
    'croci', 'fly', 'chest fly',
    'pull-up', 'trazioni', 'chin-up',
    'rematore', 'row', 'rowing',
    'squat con bilanciere', 'back squat', 'front squat', // bilanciere sulle spalle
    'overhead press', 'push press', 'thruster',
    'snatch', 'clean', 'jerk',
    'plank', // stress sulla spalla
    'burpees',
  ],

  // SCHIENA (lombare, dorsale)
  schiena: [
    'stacco', 'deadlift', 'stacco rumeno', 'romanian deadlift',
    'good morning',
    'squat', 'back squat', 'front squat',
    'rematore', 'row', 'bent over row',
    'hyperextension',
    'superman',
    'kettlebell swing',
    'clean', 'snatch',
    'sit-up', 'crunch', // possono stressare la lombare
  ],

  // GINOCCHIO
  ginocchio: [
    'squat', 'back squat', 'front squat', 'goblet squat',
    'affondi', 'lunge', 'walking lunge',
    'leg press',
    'leg extension',
    'step-up',
    'box jump', 'jump squat',
    'burpees',
    'corsa', 'running', 'jogging',
    'salti', 'jump',
  ],

  // POLSO/MANO
  polso: [
    'push-up', 'flessioni',
    'plank',
    'bench press', 'panca',
    'dip',
    'pull-up', 'trazioni',
    'curl', 'bicep curl',
    'tricep extension',
    'kettlebell',
    'clean', 'snatch',
  ],

  // CAVIGLIA/PIEDE
  caviglia: [
    'corsa', 'running', 'jogging',
    'salti', 'jump', 'box jump',
    'squat', 'affondi', 'lunge',
    'calf raise', 'polpacci',
    'burpees',
    'step-up',
    'skipping', 'skip',
  ],

  // COLLO/CERVICALE
  collo: [
    'shoulder press', 'military press',
    'shrug', 'scrollate',
    'pull-up', 'trazioni',
    'sit-up', 'crunch',
    'plank',
    'deadlift', 'stacco',
  ],

  // GOMITO
  gomito: [
    'curl', 'bicep curl',
    'tricep extension', 'french press',
    'dip',
    'push-up', 'flessioni',
    'pull-up', 'trazioni',
    'bench press', 'panca',
    'row', 'rematore',
  ],

  // ANCA/ANCHE
  anca: [
    'squat',
    'affondi', 'lunge',
    'stacco', 'deadlift',
    'leg press',
    'hip thrust',
    'abductor', 'adductor',
    'step-up',
    'corsa', 'running',
  ],
};

// Funzione per trovare gli esercizi da escludere in base alla limitazione
export function getExcludedExercises(limitation: string): string[] {
  console.log('🔍 getExcludedExercises - Input ricevuto:', limitation);
  const limitationLower = limitation.toLowerCase();
  console.log('🔍 getExcludedExercises - Input lowercase:', limitationLower);
  const excluded: string[] = [];

  for (const [bodyPart, exercises] of Object.entries(BODY_PART_EXCLUSIONS)) {
    const matches = limitationLower.includes(bodyPart);
    console.log(`🔍 Controllo "${bodyPart}": "${limitationLower}".includes("${bodyPart}") = ${matches}`);
    if (matches) {
      console.log(`✅ Match trovato per: ${bodyPart} (${exercises.length} esercizi da escludere)`);
      excluded.push(...exercises);
    }
  }

  // Rimuovi duplicati
  const result = Array.from(new Set(excluded));
  console.log('✅ getExcludedExercises - Risultato finale:', result.length, 'esercizi esclusi');
  return result;
}

// Consigli terapeutici per zona
export const THERAPEUTIC_ADVICE: Record<string, string[]> = {
  spalla: [
    "🧊 Applica ghiaccio per 15-20 minuti, 2-3 volte al giorno per ridurre l'infiammazione",
    "🔄 Esegui rotazioni dolci della spalla (cerchi piccoli) per mantenere la mobilità",
    "🧘 Stretching delicato: porta il braccio al petto e tienilo per 30 secondi",
    "💆 Massaggia delicatamente i muscoli del trapezio e del deltoide",
    "😴 Evita di dormire sul lato dolorante",
    "⚠️ Se il dolore persiste per più di 2 settimane, consulta un fisioterapista",
  ],
  schiena: [
    "🧊 Alterna ghiaccio (prime 48h) e calore (dopo) per 15-20 minuti",
    "🚶 Cammina leggermente per 10-15 minuti, evita di stare seduto troppo a lungo",
    "🧘 Stretching: posizione del bambino (child's pose) per allungare la lombare",
    "🛏️ Dormi con un cuscino sotto le ginocchia se dormi supino",
    "💺 Mantieni una postura corretta, usa un supporto lombare se lavori seduto",
    "⚠️ Evita di sollevare pesi e di piegarti in avanti. Consulta un medico se hai formicolii",
  ],
  ginocchio: [
    "🧊 Ghiaccio per 15-20 minuti dopo l'attività fisica",
    "🦵 Esercizi di rinforzo del quadricipite senza carico (es. contrazioni isometriche)",
    "🧘 Stretching delicato di quadricipiti e polpacci",
    "🩹 Considera una ginocchiera di supporto per le attività quotidiane",
    "⬇️ Evita scale e superfici irregolari quando possibile",
    "⚠️ Se c'è gonfiore persistente o blocco articolare, consulta un ortopedico",
  ],
  polso: [
    "🧊 Ghiaccio per 10-15 minuti, più volte al giorno",
    "🔄 Rotazioni dolci del polso in entrambe le direzioni",
    "✊ Esercizi di presa con pallina antistress",
    "🩹 Usa un tutore durante le attività che stressano il polso",
    "⌨️ Se lavori al computer, usa un supporto ergonomico per il polso",
    "⚠️ Se il dolore peggiora o c'è formicolio, potrebbe essere sindrome del tunnel carpale",
  ],
  caviglia: [
    "🧊 Ghiaccio immediato in caso di distorsione, 20 minuti ogni 2 ore",
    "⬆️ Tieni il piede sollevato quando sei a riposo",
    "🔄 Esercizi di mobilità: scrivi l'alfabeto con il piede",
    "💪 Rinforzo propriocettivo: stai in equilibrio su una gamba",
    "🩹 Usa una cavigliera elastica per supporto",
    "⚠️ Se non riesci a caricare peso, consulta un medico per escludere fratture",
  ],
  collo: [
    "🔄 Rotazioni lente e delicate del collo (non forzare mai)",
    "🧘 Stretching: inclina l'orecchio verso la spalla, tieni 30 secondi",
    "🔥 Applica calore umido per rilassare i muscoli",
    "💺 Controlla la postura, specialmente se lavori al computer",
    "😴 Usa un cuscino che supporti la curva cervicale",
    "⚠️ Se hai mal di testa, vertigini o formicolii, consulta un medico",
  ],
  gomito: [
    "🧊 Ghiaccio per 15 minuti, 2-3 volte al giorno",
    "🔄 Stretching: estendi il braccio e fletti il polso verso il basso",
    "💆 Massaggio trasversale profondo sul punto dolente",
    "🩹 Usa una fascia per epicondilite se hai dolore laterale",
    "✋ Evita movimenti ripetitivi di presa e torsione",
    "⚠️ Se peggiora, potrebbe essere epicondilite (gomito del tennista)",
  ],
  anca: [
    "🔥 Calore umido per rilassare i muscoli dell'anca",
    "🧘 Stretching: figura 4 (piriforme) e flessori dell'anca",
    "🚶 Camminate leggere per mantenere la mobilità",
    "🛏️ Dormi con un cuscino tra le ginocchia",
    "💺 Evita di stare seduto con le gambe incrociate",
    "⚠️ Se il dolore si irradia alla gamba, consulta un medico",
  ],
};

// Funzione per ottenere i consigli terapeutici
export function getTherapeuticAdvice(limitation: string): string[] {
  console.log('💊 getTherapeuticAdvice - Input ricevuto:', limitation);
  const limitationLower = limitation.toLowerCase();
  console.log('💊 getTherapeuticAdvice - Input lowercase:', limitationLower);

  for (const [bodyPart, advice] of Object.entries(THERAPEUTIC_ADVICE)) {
    const matches = limitationLower.includes(bodyPart);
    console.log(`💊 Controllo "${bodyPart}": "${limitationLower}".includes("${bodyPart}") = ${matches}`);
    if (matches) {
      console.log(`✅ Consigli trovati per: ${bodyPart} (${advice.length} consigli)`);
      return advice;
    }
  }

  // Consiglio generico se non trova la zona specifica
  console.warn('⚠️ Nessuna zona specifica trovata, uso consigli generici');
  return [
    "🧊 Applica ghiaccio per 15-20 minuti sulla zona dolorante",
    "🔄 Mantieni una leggera mobilità senza forzare",
    "😴 Riposa adeguatamente e ascolta il tuo corpo",
    "⚠️ Se il dolore persiste, consulta un professionista della salute",
  ];
}

// Esercizi sicuri alternativi per zona problematica
export function getSafeAlternativeExercises(limitation: string, workoutType: string): Array<{
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
  exercise_type: 'isolation' | 'isolation_light' | 'compound';
}> {
  const limitationLower = limitation.toLowerCase();
  const safeExercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes: string;
    exercise_type: 'isolation' | 'isolation_light' | 'compound';
  }> = [];

  // Esercizi sicuri per spalla
  if (limitationLower.includes('spalla')) {
    safeExercises.push(
      { name: 'Leg Press', sets: 4, reps: '10-12', rest_seconds: 60, notes: 'Esercizio sicuro per gambe senza stress spalle', exercise_type: 'compound' },
      { name: 'Leg Extension', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Isolamento quadricipiti', exercise_type: 'isolation' },
      { name: 'Leg Curl', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Isolamento bicipiti femorali', exercise_type: 'isolation' },
      { name: 'Crunch', sets: 3, reps: '15-20', rest_seconds: 45, notes: 'Addominali senza stress spalle', exercise_type: 'isolation_light' },
      { name: 'Calf Raise', sets: 3, reps: '15-20', rest_seconds: 30, notes: 'Polpacci', exercise_type: 'isolation_light' },
    );
  }
  // Esercizi sicuri per schiena
  else if (limitationLower.includes('schiena')) {
    safeExercises.push(
      { name: 'Leg Press', sets: 4, reps: '10-12', rest_seconds: 60, notes: 'Esercizio sicuro per gambe senza stress schiena', exercise_type: 'compound' },
      { name: 'Leg Extension', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Isolamento quadricipiti', exercise_type: 'isolation' },
      { name: 'Leg Curl', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Isolamento bicipiti femorali', exercise_type: 'isolation' },
      { name: 'Calf Raise', sets: 3, reps: '15-20', rest_seconds: 30, notes: 'Polpacci', exercise_type: 'isolation_light' },
      { name: 'Curl Bicipiti', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Bicipiti da seduto', exercise_type: 'isolation' },
    );
  }
  // Esercizi sicuri per ginocchio
  else if (limitationLower.includes('ginocchio')) {
    safeExercises.push(
      { name: 'Curl Bicipiti', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Bicipiti da seduto', exercise_type: 'isolation' },
      { name: 'Tricipiti Pushdown', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Tricipiti', exercise_type: 'isolation' },
      { name: 'Alzate Laterali', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Spalle da seduto', exercise_type: 'isolation' },
      { name: 'Crunch', sets: 3, reps: '15-20', rest_seconds: 45, notes: 'Addominali', exercise_type: 'isolation_light' },
      { name: 'Calf Raise Seduto', sets: 3, reps: '15-20', rest_seconds: 30, notes: 'Polpacci senza carico', exercise_type: 'isolation_light' },
    );
  }
  // Esercizi sicuri generici
  else {
    safeExercises.push(
      { name: 'Leg Press', sets: 4, reps: '10-12', rest_seconds: 60, notes: 'Esercizio sicuro per gambe', exercise_type: 'compound' },
      { name: 'Curl Bicipiti', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Bicipiti', exercise_type: 'isolation' },
      { name: 'Tricipiti Pushdown', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Tricipiti', exercise_type: 'isolation' },
      { name: 'Crunch', sets: 3, reps: '15-20', rest_seconds: 45, notes: 'Addominali', exercise_type: 'isolation_light' },
      { name: 'Calf Raise', sets: 3, reps: '15-20', rest_seconds: 30, notes: 'Polpacci', exercise_type: 'isolation_light' },
    );
  }

  return safeExercises;
}

// Funzione helper per estrarre la zona del corpo dalla limitazione
export function detectBodyPart(limitation: string): string {
  const limitationLower = limitation.toLowerCase();
  
  const bodyParts = ['spalla', 'schiena', 'ginocchio', 'polso', 'caviglia', 'collo', 'gomito', 'anca'];
  
  for (const part of bodyParts) {
    if (limitationLower.includes(part)) {
      return part;
    }
  }
  
  return 'zona interessata'; // fallback generico
}

