// ============================================
// SINONIMI PER RICONOSCERE LE ZONE DEL CORPO
// ============================================
export const BODY_PART_SYNONYMS: Record<string, string[]> = {
  spalla: ['spalla', 'spalle', 'shoulder', 'deltoide', 'deltoidi', 'cuffia dei rotatori', 'cuffia rotatori', 'sovraspinato'],
  schiena: ['schiena', 'back', 'dorsale', 'dorsali', 'lombare', 'lombari', 'lombalgia', 'rachide', 'colonna', 'vertebrale', 'ernia', 'disco', 'sciatalgia', 'sciatica', 'mal di schiena'],
  ginocchio: ['ginocchio', 'ginocchia', 'knee', 'rotula', 'menisco', 'legamenti', 'crociato', 'collaterale'],
  caviglia: ['caviglia', 'caviglie', 'ankle', 'piede', 'piedi', 'tallone', 'talloni', 'fascite', 'plantare', 'distorsione piede'],
  polso: ['polso', 'polsi', 'wrist', 'mano', 'mani', 'dita', 'dito', 'tunnel carpale', 'carpale', 'tendinite polso'],
  gomito: ['gomito', 'gomiti', 'elbow', 'epicondilite', 'gomito del tennista', 'gomito del golfista', 'epitrocleite'],
  anca: ['anca', 'anche', 'hip', 'bacino', 'inguine', 'pubalgia', 'flessori anca', 'coxalgia', 'femore'],
  collo: ['collo', 'cervicale', 'cervicali', 'neck', 'torcicollo', 'trapezio', 'cervicalgia'],
  petto: ['petto', 'pettorale', 'pettorali', 'chest', 'sterno', 'costole', 'costato', 'costola'],
  addome: ['addome', 'addominale', 'addominali', 'ernia inguinale', 'ernia ombelicale', 'pancia', 'core injury'],
  braccio: ['braccio', 'braccia', 'arm', 'bicipite', 'bicipiti', 'tricipite', 'tricipiti', 'avambraccio'],
  coscia: ['coscia', 'cosce', 'quadricipite', 'quadricipiti', 'femorale', 'femorali', 'hamstring', 'strappo coscia', 'stiramento'],
};

// ============================================
// FUNZIONE PER RILEVARE LA ZONA DAL MESSAGGIO
// ============================================
export function detectBodyPartFromMessage(message: string): string | null {
  const messageLower = message.toLowerCase();
  
  for (const [bodyPart, synonyms] of Object.entries(BODY_PART_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (messageLower.includes(synonym)) {
        console.log(`🎯 Zona rilevata: "${bodyPart}" (trovato: "${synonym}")`);
        return bodyPart;
      }
    }
  }
  
  console.log('⚠️ Nessuna zona specifica rilevata nel messaggio');
  return null;
}

// ============================================
// WHITELIST ESERCIZI SICURI PER OGNI ZONA
// ============================================
export const SAFE_EXERCISES_BY_INJURY: Record<string, Array<{
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
}>> = {
  
  // ========== SPALLA ==========
  spalla: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Movimento guidato, zero coinvolgimento spalle" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Isolamento quadricipiti, braccia a riposo" },
    { name: "Leg Curl Sdraiato", sets: "3", reps: "12-15", rest: "60s", notes: "Isolamento femorali, spalle rilassate" },
    { name: "Calf Raise alla Macchina", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci senza coinvolgimento spalle" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei, bilanciere sui fianchi non sulle spalle" },
    { name: "Adductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Interno coscia, braccia sui supporti" },
    { name: "Abductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Esterno coscia, braccia sui supporti" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Mani dietro la testa leggere, no trazione" },
    { name: "Crunch Inverso", sets: "3", reps: "15", rest: "45s", notes: "Addominali bassi, braccia lungo i fianchi" },
    { name: "Leg Raise Sdraiato", sets: "3", reps: "12-15", rest: "45s", notes: "Braccia lungo i fianchi, no pressione spalle" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei a corpo libero, braccia a terra" },
    { name: "Cyclette", sets: "1", reps: "15-20 min", rest: "-", notes: "Cardio senza coinvolgimento spalle" },
    { name: "Camminata Tapis Roulant", sets: "1", reps: "20 min", rest: "-", notes: "Cardio leggero, braccia rilassate" },
    { name: "Step Machine", sets: "1", reps: "10-15 min", rest: "-", notes: "Cardio gambe, mani leggere sui supporti" },
  ],
  
  // ========== SCHIENA ==========
  schiena: [
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, schiena completamente supportata" },
    { name: "Leg Curl Sdraiato", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, schiena a riposo sul lettino" },
    { name: "Calf Raise Seduto", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci, schiena supportata" },
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, schiena contro lo schienale" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle, schiena completamente supportata" },
    { name: "Pec Deck", sets: "3", reps: "12", rest: "60s", notes: "Pettorali, schiena contro lo schienale" },
    { name: "Bicep Curl Macchina", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti isolati, schiena supportata" },
    { name: "Tricep Pushdown Cavo", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti, posizione eretta stabile" },
    { name: "Lateral Raise Macchina", sets: "3", reps: "12-15", rest: "45s", notes: "Deltoidi, schiena supportata" },
    { name: "Crunch Macchina", sets: "3", reps: "15", rest: "45s", notes: "Addominali con supporto lombare" },
    { name: "Cyclette Reclinata", sets: "1", reps: "20 min", rest: "-", notes: "Cardio con supporto lombare completo" },
    { name: "Nuoto (Dorso)", sets: "1", reps: "20-30 min", rest: "-", notes: "Zero impatto, scarico colonna" },
  ],
  
  // ========== GINOCCHIO ==========
  ginocchio: [
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, ginocchia a riposo" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle, seduto senza carico ginocchia" },
    { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, ginocchia sotto il supporto" },
    { name: "Seated Row Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, posizione seduta" },
    { name: "Pec Deck", sets: "3", reps: "12", rest: "60s", notes: "Pettorali, seduto" },
    { name: "Bicep Curl", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti, in piedi o seduto" },
    { name: "Tricep Pushdown", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti, posizione stabile" },
    { name: "Lateral Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Deltoidi, in piedi stabile" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali, ginocchia piegate a riposo" },
    { name: "Leg Curl Sdraiato", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, movimento controllato" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei, piedi stabili a terra" },
    { name: "Glute Kickback Macchina", sets: "3", reps: "12 per lato", rest: "45s", notes: "Glutei isolati" },
    { name: "Cyclette Reclinata (resistenza bassa)", sets: "1", reps: "15 min", rest: "-", notes: "Cardio leggero, basso impatto" },
    { name: "Nuoto", sets: "1", reps: "30 min", rest: "-", notes: "Zero impatto sulle ginocchia" },
  ],
  
  // ========== CAVIGLIA/PIEDE ==========
  caviglia: [
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, piedi a riposo" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle, posizione seduta" },
    { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, piedi sotto il supporto" },
    { name: "Seated Row", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, posizione seduta" },
    { name: "Pec Deck", sets: "3", reps: "12", rest: "60s", notes: "Pettorali, seduto" },
    { name: "Bicep Curl Seduto", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti, nessun carico caviglie" },
    { name: "Tricep Pushdown", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti, posizione stabile" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, caviglie libere" },
    { name: "Leg Curl Sdraiato", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, caviglie libere" },
    { name: "Crunch Macchina", sets: "3", reps: "15", rest: "45s", notes: "Addominali, piedi a riposo" },
    { name: "Leg Raise Sdraiato", sets: "3", reps: "12-15", rest: "45s", notes: "Addominali bassi" },
    { name: "Cyclette (solo braccia)", sets: "1", reps: "15 min", rest: "-", notes: "Cardio upper body" },
    { name: "Nuoto (solo braccia)", sets: "1", reps: "20 min", rest: "-", notes: "Cardio senza caviglie" },
  ],
  
  // ========== POLSO/MANO ==========
  polso: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, mani sui supporti laterali" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, nessuna presa" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, nessuna presa" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei, bilanciere sui fianchi" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei, braccia a terra rilassate" },
    { name: "Abductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Esterno coscia, mani leggere" },
    { name: "Adductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Interno coscia, mani leggere" },
    { name: "Calf Raise Macchina", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci, spalle sotto i cuscinetti" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali, mani incrociate sul petto" },
    { name: "Leg Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Addominali, braccia lungo i fianchi" },
    { name: "Plank su Avambracci", sets: "3", reps: "30-45 sec", rest: "45s", notes: "Core, peso sugli avambracci non polsi" },
    { name: "Cyclette", sets: "1", reps: "20 min", rest: "-", notes: "Cardio, presa leggera o senza mani" },
    { name: "Camminata/Corsa", sets: "1", reps: "20-30 min", rest: "-", notes: "Cardio senza impugnatura" },
  ],
  
  // ========== GOMITO ==========
  gomito: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, gomiti a riposo" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, braccia rilassate" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, braccia rilassate" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei, gomiti a riposo" },
    { name: "Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci, spalle sotto i cuscinetti" },
    { name: "Abductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Esterno coscia" },
    { name: "Adductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Interno coscia" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali, mani dietro la testa leggere" },
    { name: "Crunch Inverso", sets: "3", reps: "15", rest: "45s", notes: "Addominali bassi" },
    { name: "Leg Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Addominali, braccia a terra" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei, braccia a terra" },
    { name: "Cyclette", sets: "1", reps: "20 min", rest: "-", notes: "Cardio, presa leggera" },
    { name: "Camminata", sets: "1", reps: "20-30 min", rest: "-", notes: "Cardio, braccia rilassate" },
  ],
  
  // ========== ANCA ==========
  anca: [
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, anche a riposo" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle, seduto stabile" },
    { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, anche stabili" },
    { name: "Seated Row", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, posizione seduta" },
    { name: "Bicep Curl", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti" },
    { name: "Tricep Pushdown", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti" },
    { name: "Lateral Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Deltoidi" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, movimento limitato" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, anche stabili" },
    { name: "Calf Raise Seduto", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci" },
    { name: "Crunch Macchina", sets: "3", reps: "15", rest: "45s", notes: "Addominali, no rotazione" },
    { name: "Cyclette Reclinata", sets: "1", reps: "15 min", rest: "-", notes: "Cardio leggero per anche" },
  ],
  
  // ========== COLLO/CERVICALE ==========
  collo: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, collo rilassato" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti, testa appoggiata" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali, collo rilassato" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei, testa a terra" },
    { name: "Calf Raise Seduto", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci, nessun carico collo" },
    { name: "Abductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Esterno coscia" },
    { name: "Adductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Interno coscia" },
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, testa appoggiata" },
    { name: "Pec Deck", sets: "3", reps: "12", rest: "60s", notes: "Pettorali, collo rilassato" },
    { name: "Bicep Curl Seduto", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti, no tensione collo" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei, testa a terra" },
    { name: "Cyclette Reclinata", sets: "1", reps: "20 min", rest: "-", notes: "Cardio, collo supportato" },
  ],
  
  // ========== PETTO ==========
  petto: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, petto a riposo" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei" },
    { name: "Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci" },
    { name: "Lat Pulldown (presa larga)", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali, no compressione petto" },
    { name: "Seated Row", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali" },
    { name: "Bicep Curl", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali" },
    { name: "Leg Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Addominali bassi" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei" },
    { name: "Cyclette", sets: "1", reps: "20 min", rest: "-", notes: "Cardio leggero" },
    { name: "Camminata", sets: "1", reps: "20-30 min", rest: "-", notes: "Cardio senza stress petto" },
  ],
  
  // ========== ADDOME ==========
  addome: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, addome a riposo" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali" },
    { name: "Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci" },
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali, no attivazione core" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle, schiena supportata" },
    { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali" },
    { name: "Seated Row", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali" },
    { name: "Bicep Curl", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti" },
    { name: "Tricep Pushdown", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti" },
    { name: "Lateral Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Deltoidi" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei, addome rilassato" },
    { name: "Cyclette Reclinata", sets: "1", reps: "20 min", rest: "-", notes: "Cardio senza stress addome" },
  ],
  
  // ========== BRACCIO ==========
  braccio: [
    { name: "Leg Press", sets: "4", reps: "10-12", rest: "90s", notes: "Gambe, braccia a riposo" },
    { name: "Leg Extension", sets: "3", reps: "12-15", rest: "60s", notes: "Quadricipiti" },
    { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Femorali" },
    { name: "Hip Thrust", sets: "3", reps: "12-15", rest: "60s", notes: "Glutei" },
    { name: "Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci" },
    { name: "Abductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Esterno coscia" },
    { name: "Adductor Machine", sets: "3", reps: "15", rest: "45s", notes: "Interno coscia" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali" },
    { name: "Crunch Inverso", sets: "3", reps: "15", rest: "45s", notes: "Addominali bassi" },
    { name: "Leg Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Addominali" },
    { name: "Glute Bridge", sets: "3", reps: "15", rest: "45s", notes: "Glutei" },
    { name: "Cyclette", sets: "1", reps: "20 min", rest: "-", notes: "Cardio, presa leggera" },
    { name: "Camminata/Corsa", sets: "1", reps: "20-30 min", rest: "-", notes: "Cardio" },
  ],
  
  // ========== COSCIA ==========
  coscia: [
    { name: "Chest Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Pettorali" },
    { name: "Shoulder Press Macchina", sets: "3", reps: "10-12", rest: "60s", notes: "Spalle" },
    { name: "Lat Pulldown", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali" },
    { name: "Seated Row", sets: "3", reps: "10-12", rest: "60s", notes: "Dorsali" },
    { name: "Pec Deck", sets: "3", reps: "12", rest: "60s", notes: "Pettorali" },
    { name: "Bicep Curl", sets: "3", reps: "12", rest: "45s", notes: "Bicipiti" },
    { name: "Tricep Pushdown", sets: "3", reps: "12", rest: "45s", notes: "Tricipiti" },
    { name: "Lateral Raise", sets: "3", reps: "12-15", rest: "45s", notes: "Deltoidi" },
    { name: "Crunch a Terra", sets: "3", reps: "15-20", rest: "45s", notes: "Addominali" },
    { name: "Crunch Inverso", sets: "3", reps: "15", rest: "45s", notes: "Addominali bassi" },
    { name: "Calf Raise Seduto", sets: "4", reps: "15-20", rest: "45s", notes: "Polpacci, coscia a riposo" },
    { name: "Cyclette (braccia)", sets: "1", reps: "15 min", rest: "-", notes: "Cardio solo upper body" },
  ],
};

// ============================================
// FUNZIONE PER OTTENERE ESERCIZI SICURI
// ============================================
export function getSafeExercises(limitation: string): Array<{name: string; sets: string; reps: string; rest: string; notes: string;}> | null {
  const bodyPart = detectBodyPartFromMessage(limitation);
  
  if (!bodyPart) {
    console.log('⚠️ getSafeExercises: Nessuna zona trovata, non uso whitelist');
    return null;
  }
  
  const exercises = SAFE_EXERCISES_BY_INJURY[bodyPart];
  
  if (exercises && exercises.length > 0) {
    console.log(`✅ getSafeExercises: Trovati ${exercises.length} esercizi sicuri per: ${bodyPart}`);
    return exercises;
  }
  
  console.log(`⚠️ getSafeExercises: Nessuna whitelist per: ${bodyPart}`);
  return null;
}

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
  petto: [
    "🧊 Applica ghiaccio se c'è gonfiore o infiammazione",
    "🚫 Evita movimenti di spinta (push-up, panca, dip) fino a guarigione",
    "🧘 Stretching delicato: allarga le braccia e respira profondamente",
    "💆 Massaggio leggero sui muscoli pettorali",
    "😴 Evita di dormire a pancia in giù",
    "⚠️ Se il dolore è al centro del petto o si irradia al braccio, consulta un medico IMMEDIATAMENTE",
  ],
  addome: [
    "🚫 Evita TUTTI gli esercizi addominali diretti (crunch, plank, sit-up)",
    "🧘 Respirazione diaframmatica per rilassare la zona",
    "🚶 Camminate leggere per mantenere attivo il corpo",
    "🍽️ Pasti piccoli e frequenti per non appesantire",
    "💺 Evita di piegarti in avanti bruscamente",
    "⚠️ Se hai ernia o dolore acuto, consulta un medico prima di allenarti",
  ],
  braccio: [
    "🧊 Ghiaccio per 15-20 minuti sulla zona dolorante",
    "🔄 Movimenti delicati di rotazione del braccio",
    "🚫 Evita di sollevare pesi con il braccio interessato",
    "💆 Massaggio leggero lungo il muscolo",
    "🧘 Stretching: estendi il braccio e tieni per 30 secondi",
    "⚠️ Se c'è gonfiore o lividi, consulta un medico",
  ],
  coscia: [
    "🧊 Ghiaccio immediato in caso di strappo o stiramento",
    "🚫 Evita squat, affondi e corsa fino a guarigione",
    "🧘 Stretching DELICATO dei quadricipiti e femorali",
    "💆 Massaggio trasversale sulla zona dolorante",
    "🩹 Fasciatura compressiva se c'è gonfiore",
    "⚠️ Se senti uno 'schiocco' durante l'infortunio, consulta un medico",
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
// Usa la nuova logica con sinonimi per riconoscere tutte le varianti
export function detectBodyPart(limitation: string): string {
  const detected = detectBodyPartFromMessage(limitation);
  return detected || 'zona interessata'; // fallback generico se non trova nulla
}

