/** Risposta preimpostata PrimeBot */
export interface PresetResponseItem {
  text: string;
  action?: { label: string; link: string };
  warning?: boolean;
  askForPlanConfirmation?: boolean;
}

// Messaggio disclaimer iniziale (SEMPRE mostrato)
export const disclaimerMessage = {
  id: 'disclaimer',
  role: 'bot' as const,
  text: `⚠️ **Importante:** PrimeBot è un assistente AI che può commettere errori. Non sostituisce professionisti qualificati (personal trainer, nutrizionisti, medici). Per problemi di salute o programmi personalizzati, consulta sempre un esperto. Usa il buon senso e ascolta il tuo corpo! 💪`,
  isDisclaimer: true
};

// Risposte preimpostate che NON usano token AI (GRATIS)
export const presetResponses: Record<string, PresetResponseItem> = {
  // MOTIVAZIONE
  "non ho tempo": {
    text: "Capisco! Con soli 10 minuti puoi fare un allenamento efficace. Prova il nostro Quick Workout!",
    action: { label: "Quick Workout 10min", link: "/workout/quick" }
  },
  "non ho voglia": {
    text: "È normale! Inizia con solo 5 minuti di movimento leggero. Il difficile è iniziare, poi il corpo ti ringrazierà!",
    action: { label: "Esercizi Mobilità", link: "/workouts?category=mobility" }
  },
  
  // PROBLEMI COMUNI - CON CAUTELA
  "male schiena": {
    text: "⚠️ Per dolori persistenti, consulta SEMPRE un medico o fisioterapista. Nel frattempo, potresti provare mobilità dolce, ma fermati se senti dolore.",
    action: { label: "Mobilità Dolce", link: "/workouts?category=mobility" },
    warning: true
  },
  "dolore": {
    text: "⚠️ Il dolore è un segnale importante del corpo. Se persiste, consulta un professionista. Non allenarti mai con dolore acuto.",
    warning: true
  },
  "infortunio": {
    text: "⚠️ Con un infortunio, FERMATI e consulta un medico. Il riposo e il recupero guidato da un professionista sono fondamentali.",
    warning: true
  },
  
  // ALLENAMENTI
  'come iniziare': {
    text: '🎯 Perfetto! Per iniziare il tuo percorso fitness: valuta il tuo livello, scegli obiettivi realistici, inizia gradualmente.',
    action: { label: "Quick Workout", link: "/workout/quick" }
  },
  
  'quick workout': {
    text: '⚡ Ottima scelta! I Quick Workout sono perfetti per chi ha poco tempo. Durata: 10-15 minuti, nessuna attrezzatura, risultati garantiti!',
    action: { label: "Inizia Subito", link: "/workout/quick" }
  },

  'perdere peso': {
    text: '🎯 Per perdere peso in modo sano: deficit calorico moderato, allenamento misto (cardio + forza), costanza nel tempo, alimentazione equilibrata.',
    action: { label: "Cardio HIIT", link: "/workouts?category=hiit" }
  },

  'aumentare massa': {
    text: '💪 Per aumentare massa muscolare: allenamento di forza progressivo, surplus calorico controllato, riposo adeguato, proteine sufficienti.',
    action: { label: "Allenamento Forza", link: "/workouts?category=strength" }
  },

  'alimentazione': {
    text: '🥗 Alimentazione fondamentale: equilibrio macronutrienti, idratazione adeguata, timing pasti, qualità alimenti. Per piani personalizzati, consulta un nutrizionista.',
    warning: true
  },

  'proteine': {
    text: '🍖 Proteine essenziali per: costruzione muscolare, recupero, sazietà. Fabbisogno: 1.6-2.2g per kg peso. Fonti: carne, pesce, uova, legumi.',
  },

  'recupero': {
    text: '😴 Il recupero è quando i muscoli crescono! Sonno: 7-9 ore, riposo attivo, stretching, gestione stress.',
    action: { label: "Stretching", link: "/workouts?category=mobility" }
  },

  'plateau': {
    text: '📈 Plateau normale! Strategie: variare allenamento, aumentare intensità, cambiare volume, rivedere alimentazione.',
  },

  'motivazione': {
    text: '🔥 La motivazione va allenata! Obiettivi SMART, traccia progressi, celebra successi, trova partner, varia routine. Costanza > Perfezione!',
  },

  'casa': {
    text: '🏠 Allenarsi a casa è perfetto! Vantaggi: zero costi, flessibilità, privacy. Corpo libero, HIIT, yoga sono ottime opzioni.',
    action: { label: "Workout Casa", link: "/workouts" }
  },

  'principiante': {
    text: '🌟 Benvenuto! Come principiante: inizia gradualmente, impara tecnica corretta, ascolta il corpo, sii paziente.',
    action: { label: "Primo Allenamento", link: "/workout/quick" }
  },

  'risultati': {
    text: '📊 Tempistiche realistiche: prime sensazioni 2-4 settimane, cambiamenti visibili 6-8 settimane, trasformazioni 3-6 mesi. Serve costanza!',
  }
};

// Funzione per trovare risposta
export function findPresetResponse(message: string): PresetResponseItem | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // ⭐ FIX BUG 2: Riconosci quando il dolore è RISOLTO
  const painResolvedKeywords = [
    'dolore è passato',
    'dolore mi è passato', 
    'non ho più dolore',
    'il dolore è passato',
    'non fa più male',
    'sto meglio',
    'sono guarito',
    'è guarito',
    'non mi fa più male',
    'passato il dolore'
  ];

  const isPainResolved = painResolvedKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  // Se il dolore è risolto, NON intercettare - passa all'LLM
  if (isPainResolved) {
    console.log('✅ FIX BUG 2: Dolore risolto rilevato, passo all\'LLM');
    return null;
  }

  // Parole chiave per dolore/limitazioni fisiche
  const painKeywords = ['fa male', 'male', 'dolore', 'dolori', 'infortunio', 'infortunato', 'ferito', 'problema cardiaco', 'vertigini', 'svenimento'];
  // Parole chiave per richiesta piano/allenamento
  const planKeywords = ['piano', 'allenamento', 'workout', 'esercizi', 'programma', 'scheda', 'creami', 'fammi', 'genera', 'crea un piano', 'fammi un piano', 'mi serve un piano', 'voglio un piano'];
  
  const hasPainMention = painKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasPlanRequest = planKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // FIX CRITICO: Se c'è dolore + richiesta piano, passa a OpenAI (userà whitelist automaticamente)
  if (hasPainMention && hasPlanRequest) {
    console.log('🏋️ Dolore + richiesta piano: procedo con OpenAI + whitelist');
    return null; // Passa all'AI che userà la whitelist
  }
  
  // Se c'è solo dolore SENZA richiesta piano, mostra warning con bottone professionista
  if (hasPainMention && !hasPlanRequest && !presetResponses[lowerMessage]) {
    return {
      text: `⚠️ Per questioni mediche o dolori, ti consiglio vivamente di consultare un professionista sanitario. La tua salute viene prima di tutto!


💡 **Se preferisci, puoi contattare uno dei nostri professionisti per un consulto personalizzato.**


Vuoi comunque che ti crei un piano di allenamento tenendo conto delle tue limitazioni?`,
      warning: true,
      action: { 
        label: "👨‍⚕️ Contatta un professionista", 
        link: "/professionals" 
      },
      askForPlanConfirmation: true
    };
  }
  
  // SOLO match esatto - NO match parziale per evitare interferenze
  if (presetResponses[lowerMessage]) {
    return presetResponses[lowerMessage];
  }
  
  // Nessun match trovato - passa all'AI
  return null;
}

// Risposte generiche di fallback
export const genericResponses = [
  "🤖 Sono qui per aiutarti con il fitness! Puoi chiedermi di allenamenti, nutrizione, motivazione o consigli generali.",
  "💪 Dimmi pure cosa ti serve: allenamenti, consigli alimentari, motivazione o altro!",
  "🎯 Sono il tuo coach AI! Posso consigliarti su allenamenti, obiettivi fitness, alimentazione e molto altro.",
  "⚡ Pronto ad aiutarti! Che si tratti di workout, nutrizione o motivazione, sono qui per te!"
];

// Funzione principale per ottenere risposta
export function getPrimeBotFallbackResponse(message: string): PresetResponseItem | null {
  const presetResponse = findPresetResponse(message);
  
  if (presetResponse) {
    return presetResponse;
  }
  
  // Nessun match trovato - passa all'AI OpenAI
  return null;
}