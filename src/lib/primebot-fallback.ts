// Messaggio disclaimer iniziale (SEMPRE mostrato)
export const disclaimerMessage = {
  id: 'disclaimer',
  role: 'bot' as const,
  text: `⚠️ **Importante:** PrimeBot è un assistente AI che può commettere errori. Non sostituisce professionisti qualificati (personal trainer, nutrizionisti, medici). Per problemi di salute o programmi personalizzati, consulta sempre un esperto. Usa il buon senso e ascolta il tuo corpo! 💪`,
  isDisclaimer: true
};

// Risposte preimpostate che NON usano token AI (GRATIS)
export const presetResponses: Record<string, any> = {
  // SALUTI
  "ciao": {
    text: "Ciao! 👋 Sono PrimeBot, il tuo coach fitness AI. Sono qui per aiutarti con allenamenti, motivazione e consigli fitness. Come posso aiutarti oggi? 💪"
  },
  "salve": {
    text: "Salve! 👋 Benvenuto in Performance Prime! Sono PrimeBot e sono qui per supportarti nel tuo percorso fitness. Cosa posso fare per te? 🚀"
  },
  "buongiorno": {
    text: "Buongiorno! ☀️ Perfetto momento per parlare di fitness! Sono PrimeBot, il tuo assistente per allenamenti e motivazione. Come posso aiutarti? 💪"
  },
  "buonasera": {
    text: "Buonasera! 🌙 Anche la sera è un ottimo momento per pianificare i tuoi allenamenti! Sono PrimeBot, come posso supportarti? 🏋️‍♀️"
  },
  
  // QUICK QUESTIONS PREIMPOSTATE
  "come posso migliorare la mia resistenza?": {
    text: "🏃‍♀️ Per migliorare la resistenza ti consiglio: 1) Allenamenti HIIT 2-3 volte/settimana 2) Cardio a bassa intensità 30-45 min 3) Aumenta gradualmente la durata. Inizia dalla sezione Workouts!",
    action: { label: "Vai a Workouts HIIT", link: "/workouts?category=hiit" }
  },
  "quale workout è meglio per oggi?": {
    text: "🎯 Dipende dai tuoi obiettivi! Per forza: allenamento Forza. Per cardio: HIIT o Cardio. Per relax: Mobilità. Che tipo di energia hai oggi?",
    action: { label: "Scegli il tuo Workout", link: "/workouts" }
  },
  "consigli per la nutrizione pre-allenamento": {
    text: "🍎 Pre-workout perfetto: 1) Carboidrati semplici 30-60 min prima (banana, fette biscottate) 2) Idratazione 500ml acqua 3) Evita grassi e fibre. Energia pulita per performance ottimali! 💪",
    action: { label: "Vai al tuo Profilo", link: "/profile" }
  },
  "come posso raggiungere i miei obiettivi?": {
    text: "🎯 Strategia vincente: 1) Definisci obiettivi SMART nel tuo profilo 2) Costanza > Intensità 3) Traccia progressi 4) Celebra piccole vittorie. Il successo è un processo, non un evento!",
    action: { label: "Imposta Obiettivi", link: "/profile" }
  },
  
  // MOTIVAZIONE
  "non ho tempo": {
    text: "Capisco! Con soli 10 minuti puoi fare un allenamento efficace. Prova il nostro Quick Workout!",
    action: { label: "Quick Workout 10min", link: "/quick-workout" }
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
    action: { label: "Quick Workout", link: "/quick-workout" }
  },
  
  'quick workout': {
    text: '⚡ Ottima scelta! I Quick Workout sono perfetti per chi ha poco tempo. Durata: 10-15 minuti, nessuna attrezzatura, risultati garantiti!',
    action: { label: "Inizia Subito", link: "/quick-workout" }
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
    action: { label: "Primo Allenamento", link: "/quick-workout" }
  },

  'risultati': {
    text: '📊 Tempistiche realistiche: prime sensazioni 2-4 settimane, cambiamenti visibili 6-8 settimane, trasformazioni 3-6 mesi. Serve costanza!',
  }
};

// Funzione per trovare risposta
export function findPresetResponse(message: string): any {
  const lowerMessage = message.toLowerCase().trim();
  
  // Controllo parole chiave mediche/pericolose
  const medicalKeywords = ['male', 'dolore', 'infortunio', 'ferito', 'problema cardiaco', 'vertigini', 'svenimento'];
  const hasMedicalConcern = medicalKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (hasMedicalConcern && !presetResponses[lowerMessage]) {
    return {
      text: "⚠️ Per questioni mediche o dolori, ti consiglio vivamente di consultare un professionista sanitario. La tua salute viene prima di tutto!",
      warning: true
    };
  }
  
  // Cerca match esatto prima
  if (presetResponses[lowerMessage]) {
    return presetResponses[lowerMessage];
  }
  
  // Cerca match parziale
  for (const [key, response] of Object.entries(presetResponses)) {
    if (lowerMessage.includes(key) || key.includes(lowerMessage)) {
      return response;
    }
  }
  
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
export function getPrimeBotFallbackResponse(message: string): any {
  const presetResponse = findPresetResponse(message);
  
  if (presetResponse) {
    return presetResponse;
  }
  
  // Risposta generica randomica
  const randomIndex = Math.floor(Math.random() * genericResponses.length);
  return {
    text: genericResponses[randomIndex]
  };
}