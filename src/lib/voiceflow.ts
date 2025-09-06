import { Message } from "@/types/chat";

// Mappa delle funzionalità dell'app per navigazione
const APP_FEATURES = {
  dashboard: {
    path: '/dashboard',
    description: 'Panoramica generale dei tuoi progressi',
    features: ['grafici performance', 'statistiche', 'obiettivi']
  },
  workouts: {
    path: '/workouts',
    description: 'Libreria esercizi e programmi di allenamento',
    features: ['crea workout', 'cerca esercizi', 'salva preferiti']
  },
  nutrition: {
    path: '/nutrition',
    description: 'Piani alimentari e tracking nutrizione',
    features: ['calcolo calorie', 'ricette', 'diario alimentare']
  },
  profile: {
    path: '/profile',
    description: 'Impostazioni personali e obiettivi',
    features: ['modifica dati', 'obiettivi', 'preferenze']
  },
  analytics: {
    path: '/analytics',
    description: 'Analisi dettagliate dei tuoi progressi',
    features: ['grafici avanzati', 'trend', 'previsioni']
  }
};

// Sistema di context awareness
class PrimeBotContext {
  private currentPage: string = '';
  private userHistory: any[] = [];
  private knowledgeBase: Map<string, any> = new Map();
  
  updateContext(page: string, userData?: any) {
    this.currentPage = page;
    if (userData) {
      this.userHistory.push({
        timestamp: new Date(),
        page,
        ...userData
      });
    }
  }
  
  getContextualHelp(): string {
    const feature = Object.entries(APP_FEATURES).find(([key]) => 
      this.currentPage.includes(key)
    );
    
    if (feature) {
      const [key, data] = feature;
      return `Sei nella sezione ${data.description}. Qui puoi: ${data.features.join(', ')}.`;
    }
    return '';
  }
  
  suggestNavigation(userIntent: string): any {
    const intent = (userIntent || '').toString().toLowerCase().trim();
    
    // Riconosce TUTTE le domande sui workout (sistema intelligente)
    if (isWorkoutIntent(intent)) {
      return {
        suggestion: `Per creare un allenamento, vai alla sezione workouts`,
        path: '/workouts',
        action: 'navigate_to_workouts',
        label: '➜ Vai alla sezione Workouts'
      };
    }
    
    // Riconosce domande che iniziano con "dove" per creare allenamenti (fallback)
    if (intent.includes('dove') && (intent.includes('creare') || intent.includes('allenamento'))) {
      return {
        suggestion: `Per creare un allenamento, vai alla sezione workouts`,
        path: '/workouts',
        action: 'navigate_to_workouts',
        label: '➜ Vai alla sezione Workouts'
      };
    }
    
    // Riconosce TUTTE le domande sulla nutrizione (sistema intelligente)
    if (isNutritionIntent(intent)) {
      return {
        suggestion: `Per gestire la nutrizione, vai alla sezione nutrition`,
        path: '/nutrition',
        action: 'navigate_to_nutrition',
        label: '➜ Vai alla sezione Nutrition'
      };
    }
    
    // Riconosce domande sui progressi e dashboard
    if (intent.includes('progressi') || intent.includes('dashboard') || intent.includes('statistiche') || intent.includes('grafici')) {
      return {
        suggestion: `Per vedere i tuoi progressi, vai alla sezione dashboard`,
        path: '/dashboard',
        action: 'navigate_to_dashboard',
        label: '➜ Vai alla Dashboard'
      };
    }
    
    // Riconosce domande sul profilo e impostazioni
    if (intent.includes('profilo') || intent.includes('impostazioni') || intent.includes('settings') || intent.includes('account')) {
      return {
        suggestion: `Per gestire il profilo, vai alla sezione profile`,
        path: '/profile',
        action: 'navigate_to_profile',
        label: '➜ Vai al Profilo'
      };
    }
    
    // Riconosce domande che iniziano con "dove" per dashboard (fallback)
    if (intent.includes('dove') && (intent.includes('progressi') || intent.includes('dashboard') || intent.includes('statistiche'))) {
      return {
        suggestion: `Per vedere i tuoi progressi, vai alla sezione dashboard`,
        path: '/dashboard',
        action: 'navigate_to_dashboard',
        label: '➜ Vai alla Dashboard'
      };
    }
    
    // Riconosce domande che iniziano con "dove" per nutrizione (fallback)
    if (intent.includes('dove') && (intent.includes('nutrizione') || intent.includes('dieta') || intent.includes('alimentazione'))) {
      return {
        suggestion: `Per gestire la nutrizione, vai alla sezione nutrition`,
        path: '/nutrition',
        action: 'navigate_to_nutrition',
        label: '➜ Vai alla sezione Nutrition'
      };
    }
    
    // Riconosce domande che iniziano con "dove" per profilo (fallback)
    if (intent.includes('dove') && (intent.includes('profilo') || intent.includes('impostazioni') || intent.includes('settings'))) {
      return {
        suggestion: `Per gestire il profilo, vai alla sezione profile`,
        path: '/profile',
        action: 'navigate_to_profile',
        label: '➜ Vai al Profilo'
      };
    }
    
    for (const [key, feature] of Object.entries(APP_FEATURES)) {
      if (feature.features.some(f => intent.includes(f.split(' ')[0]))) {
        return {
          suggestion: `Per ${userIntent}, vai alla sezione ${key}`,
          path: feature.path,
          action: `navigate_to_${key}`
        };
      }
    }
    return null;
  }
}

const botContext = new PrimeBotContext();

// Funzione principale migliorata - COMPLETAMENTE AUTONOMA
export const interact = async (
  chatID: string,
  request: any,
  conversationHistory: Message[] = []
): Promise<{ 
  message: string;
  suggestions?: string[];
  navigation?: any;
  confidence?: number;
}> => {
  
  // Estrai il messaggio correttamente
  let messageText = '';
  
  if (typeof request === 'string') {
    messageText = request;
  } else if (request?.message) {
    messageText = request.message;
  } else if (request?.text) {
    messageText = request.text;
  } else if (request?.payload) {
    messageText = typeof request.payload === 'string' ? request.payload : request.payload?.message || request.payload?.text || '';
  }
  
  if (!messageText || messageText.trim() === '') {
    return {
      message: "Non ho ricevuto il tuo messaggio. Puoi ripetere?",
      suggestions: ["Come creo un workout?", "Chi è Mattia?"],
      confidence: 0.2
    };
  }

  try {
    // Analizza intento con AI migliorata
    const analysis = analyzeAdvancedIntent(messageText, conversationHistory);
    
    // Verifica se serve navigazione
    const navigation = botContext.suggestNavigation(messageText);
    
    // Genera risposta intelligente
    const response = generateIntelligentResponse(messageText, analysis, navigation, conversationHistory);
    
    // Genera suggerimenti intelligenti basati su contesto
    const suggestions = generateContextualSuggestions(
      analysis.category,
      response.message,
      navigation
    );
    
    // Salva per apprendimento
    await saveLearningData(chatID, request, response, analysis);
    
    return {
      message: response.message,
      suggestions,
      navigation,
      confidence: calculateConfidence(analysis)
    };
    
  } catch (error) {
    console.error("PrimeBot error:", error);
    
    // Fallback intelligente basato su intento
    const messageText = typeof request === 'string' 
      ? request 
      : request?.message || request?.text || '';
    return handleFallback(messageText);
  }
};

// Genera risposta intelligente completa
function generateIntelligentResponse(
  message: string, 
  analysis: any, 
  navigation: any, 
  history: Message[]
): { message: string; confidence: number } {
  const lowerMessage = (message || '').toString().toLowerCase().trim();
  
  // FITNESS E ALLENAMENTI (priorità alta)
  if (analysis.category === 'WORKOUT' || lowerMessage.includes('workout') || lowerMessage.includes('esercizio') || lowerMessage.includes('allenamento') || lowerMessage.includes('creo') || lowerMessage.includes('creare')) {
    return generateFitnessResponse(message, lowerMessage);
  }
  
  // NAVIGAZIONE APP
  if (analysis.category === 'APP_NAVIGATION') {
    return generateNavigationResponse(message, navigation);
  }
  
  // NUTRIZIONE
  if (analysis.category === 'NUTRITION' || lowerMessage.includes('nutrizione') || lowerMessage.includes('dieta') || lowerMessage.includes('calorie')) {
    return generateNutritionResponse(message, lowerMessage);
  }
  
  // TEAM PERFORMANCE PRIME
  if (analysis.category === 'TEAM_INFO' || lowerMessage.includes('mattia') || lowerMessage.includes('fondatore') || lowerMessage.includes('performance prime')) {
    return generateTeamResponse(message, lowerMessage);
  }
  
  // CONOSCENZA GENERALE
  if (analysis.category === 'GENERAL_KNOWLEDGE' || lowerMessage.includes('capitale') || lowerMessage.includes('storia') || lowerMessage.includes('cos\'è')) {
    return generateGeneralKnowledgeResponse(message, lowerMessage);
  }
  
  // AIUTO E SUPPORTO
  if (analysis.category === 'HELP' || lowerMessage.includes('aiuto') || lowerMessage.includes('problema') || lowerMessage.includes('non riesco')) {
    return generateHelpResponse(message, lowerMessage);
  }
  
  // SALUTO E BENVENUTO
  if (lowerMessage.includes('ciao') || lowerMessage.includes('salve') || lowerMessage.includes('buongiorno') || lowerMessage.includes('buonasera')) {
    return generateGreetingResponse(message, lowerMessage);
  }
  
  // RISPOSTA GENERALE INTELLIGENTE
  return generateGeneralResponse(message, lowerMessage);
}

// Risposta per navigazione app
function generateNavigationResponse(message: string, navigation: any): { message: string; confidence: number } {
  if (navigation) {
    return {
      message: `Perfetto! ${navigation.suggestion}. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!`,
      confidence: 0.9
    };
  }
  
  return {
    message: `Posso guidarti in qualsiasi sezione dell'app! Ecco le principali funzionalità:\n\n📊 Dashboard - Monitora i tuoi progressi\n💪 Workouts - Crea e gestisci allenamenti\n🍎 Nutrition - Piani alimentari e ricette\n👤 Profile - Impostazioni personali\n📈 Analytics - Analisi dettagliate\n\nCosa ti interessa esplorare?`,
    confidence: 0.8
  };
}

// Risposta per fitness e allenamenti
function generateFitnessResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  if (lowerMessage.includes('squat')) {
    return {
      message: `🏋️‍♀️ SQUAT - Tecnica Corretta\n\nPosizione iniziale:\n• Piedi larghezza spalle\n• Punte leggermente in fuori\n• Peso sui talloni\n\nEsecuzione:\n• Scendi piegando le ginocchia\n• Mantieni la schiena dritta\n• Ginocchia in linea con i piedi\n• Scendi fino a cosce parallele al suolo\n\nRisalita:\n• Spingi sui talloni\n• Estendi ginocchia e anche\n• Mantieni il core contratto\n\nVarianti:\n• Squat con salto (avanzato)\n• Squat sumo (glutei)\n• Squat bulgaro (unilaterale)\n\nSe vuoi, posso mostrarti altri esercizi o creare un workout completo!`,
      confidence: 0.95
    };
  }
  
  if (lowerMessage.includes('push up') || lowerMessage.includes('flessioni')) {
    return {
      message: `💪 PUSH-UP - Tecnica Corretta\n\nPosizione iniziale:\n• Pancia in giù, mani a terra\n• Mani larghezza spalle\n• Corpo in linea retta\n• Core contratto\n\nEsecuzione:\n• Scendi controllando il movimento\n• Petto quasi a terra\n• Gomiti a 45° dal corpo\n• Mantieni la linea del corpo\n\nRisalita:\n• Spingi con braccia e petto\n• Estendi completamente\n• Mantieni la tensione\n\nVarianti:\n• Push-up sulle ginocchia (principiante)\n• Push-up inclinato (più facile)\n• Push-up declinato (più difficile)\n• Push-up con pausa (avanzato)\n\nPosso crearti un programma di push-up progressivo!`,
      confidence: 0.95
    };
  }
  
  if (lowerMessage.includes('resistenza') || lowerMessage.includes('migliorare la resistenza')) {
    return {
      message: `🏃‍♂️ MIGLIORARE LA RESISTENZA - GUIDA COMPLETA\n\nTRAINING CARDIOVASCOLARE:\n• Corsa: 3-4x/settimana, 20-45 min\n• Interval Training: 1:1 (30s veloce, 30s lento)\n• Fartlek: Variazione ritmo durante la corsa\n• Nuoto: 2-3x/settimana, 30-60 min\n• Ciclismo: 2-3x/settimana, 45-90 min\n\nTRAINING FUNZIONALE:\n• Burpees: 3 serie x 10-15 rip\n• Mountain Climbers: 3 serie x 20-30 rip\n• Jumping Jacks: 3 serie x 30-50 rip\n• High Knees: 3 serie x 30-60 sec\n• Plank Jacks: 3 serie x 15-25 rip\n\nPROGRESSIONE:\n• Settimana 1-2: 60% intensità\n• Settimana 3-4: 70% intensità\n• Settimana 5-6: 80% intensità\n• Settimana 7-8: 85% intensità\n\nNUTRIZIONE:\n• Carboidrati: 50-60% delle calorie\n• Proteine: 1.2-1.6g per kg peso\n• Idratazione: 35ml per kg peso\n• Pre-workout: Banana + caffè\n• Post-workout: Proteine + carboidrati\n\nVuoi un programma specifico per la tua resistenza?`,
      confidence: 0.95
    };
  }

  if (lowerMessage.includes('workout') && (lowerMessage.includes('oggi') || lowerMessage.includes('meglio'))) {
    return {
      message: `🎯 WORKOUT PERFETTO PER OGGI\n\nBasandomi sui tuoi obiettivi, ti consiglio:\n\n🔥 HIIT TOTAL BODY (30 min)\n• Riscaldamento: 5 min\n• Circuito 1: 4 esercizi x 3 round\n  - Burpees x 30s\n  - Mountain Climbers x 30s\n  - Jump Squats x 30s\n  - Plank x 30s\n• Circuito 2: 4 esercizi x 3 round\n  - Push-ups x 30s\n  - Lunges x 30s\n  - High Knees x 30s\n  - Russian Twists x 30s\n• Defaticamento: 5 min\n\n💪 FORZA UPPER BODY (45 min)\n• Riscaldamento: 5 min\n• Push-ups: 3x12-15\n• Pike Push-ups: 3x8-12\n• Tricep Dips: 3x10-15\n• Plank: 3x30-60s\n• Superman: 3x12-15\n• Cool-down: 5 min\n\n🏃‍♂️ CARDIO LISS (25 min)\n• Camminata veloce o corsa leggera\n• Mantieni 60-70% frequenza cardiaca\n• Respirazione costante\n\nQuale preferisci? Posso personalizzarlo per te!`,
      confidence: 0.9
    };
  }

  if (lowerMessage.includes('nutrizione') && (lowerMessage.includes('pre') || lowerMessage.includes('allenamento'))) {
    return {
      message: `🍌 NUTRIZIONE PRE-ALLENAMENTO - GUIDA COMPLETA\n\n⏰ TIMING:\n• 2-3 ore prima: Pasto completo\n• 30-60 min prima: Spuntino leggero\n• 15-30 min prima: Carboidrati rapidi\n\n🍎 SPUNTINI PRE-WORKOUT:\n• Banana + caffè (30 min prima)\n• Toast con miele (45 min prima)\n• Yogurt greco + frutti di bosco (1 ora prima)\n• Avena + latte (2 ore prima)\n\n💧 IDRATAZIONE:\n• 500ml acqua 2 ore prima\n• 250ml acqua 30 min prima\n• Sorsi durante l'allenamento\n\n🚫 DA EVITARE:\n• Cibi grassi (digestione lenta)\n• Fibre eccessive (gonfiore)\n• Alcol (disidratazione)\n• Cibi piccanti (reflusso)\n\n⚡ INTEGRATORI (opzionali):\n• Caffeina: 100-200mg\n• Beta-alanina: 2-3g\n• Creatina: 3-5g\n\nVuoi un piano nutrizionale personalizzato?`,
      confidence: 0.9
    };
  }

  if (lowerMessage.includes('raggiungere') && lowerMessage.includes('obiettivi')) {
    return {
      message: `🎯 COME RAGGIUNGERE I TUOI OBIETTIVI - STRATEGIA COMPLETA\n\n📊 STEP 1: DEFINISCI OBIETTIVI SMART\n• Specifici: Cosa vuoi ottenere?\n• Misurabili: Come misuri il progresso?\n• Raggiungibili: Sono realistici?\n• Rilevanti: Ti motivano davvero?\n• Temporali: Quando li vuoi raggiungere?\n\n📅 STEP 2: PIANIFICAZIONE\n• Obiettivi a lungo termine (6-12 mesi)\n• Obiettivi a medio termine (1-3 mesi)\n• Obiettivi a breve termine (1-4 settimane)\n• Azioni quotidiane concrete\n\n📈 STEP 3: TRACKING\n• Misura i progressi settimanalmente\n• Foto prima/dopo\n• Metriche (peso, misure, performance)\n• Diario allenamenti\n• App di tracking\n\n🧠 STEP 4: MINDSET\n• Visualizza il successo\n• Celebra piccole vittorie\n• Impara dagli errori\n• Mantieni costanza\n• Chiedi supporto quando serve\n\n💪 STEP 5: AZIONE\n• Inizia oggi, non domani\n• Fai il primo passo\n• Costruisci abitudini\n• Sii paziente ma persistente\n\nQuali sono i tuoi obiettivi specifici? Ti aiuto a creare un piano!`,
      confidence: 0.9
    };
  }

  if (lowerMessage.includes('programma') || lowerMessage.includes('piano')) {
    return {
      message: `📋 PROGRAMMA ALLENAMENTO PERSONALIZZATO\n\nPer principianti (3x/settimana):\n• LUN: Upper Body (petto, spalle, braccia)\n• MER: Lower Body (gambe, glutei)\n• VEN: Full Body + Cardio\n\nPer intermedi (4x/settimana):\n• LUN: Petto + Tricipiti\n• MAR: Gambe + Glutei\n• GIO: Schiena + Bicipiti\n• SAB: Spalle + Core\n\nPer avanzati (5x/settimana):\n• LUN: Petto + Tricipiti\n• MAR: Gambe + Glutei\n• MER: Schiena + Bicipiti\n• GIO: Spalle + Core\n• VEN: Full Body + HIIT\n\nDurata: 45-60 minuti per sessione\nRiposo: 1-2 minuti tra le serie\n\nVuoi che ti crei un programma specifico per i tuoi obiettivi?`,
      confidence: 0.9
    };
  }
  
  // Risposte specifiche per creare workout
  if (lowerMessage.includes('dove') && (lowerMessage.includes('creare') || lowerMessage.includes('workout') || lowerMessage.includes('allenamento'))) {
    return {
      message: "Per creare un allenamento, vai alla sezione Workouts. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!",
      confidence: 0.95
    };
  }
  
  if (lowerMessage.includes('come creo') || lowerMessage.includes('come creare')) {
    return {
      message: "Per creare un allenamento, vai alla sezione Workouts. Ti guido subito alla sezione giusta. Clicca il pulsante qui sotto per navigare direttamente!",
      confidence: 0.95
    };
  }
  
  return {
    message: `💪 FITNESS E ALLENAMENTI\n\nPosso aiutarti con:\n• Tecniche esercizi (squat, push-up, plank, etc.)\n• Programmi personalizzati per ogni livello\n• Consigli nutrizionali per il fitness\n• Obiettivi specifici (forza, resistenza, dimagrimento)\n• Attrezzature (casa, palestra, outdoor)\n\nEsempi di domande:\n• "Come si fa lo squat?"\n• "Programma per principianti"\n• "Esercizi per glutei"\n• "Workout HIIT"\n\nCosa ti interessa sapere?`,
    confidence: 0.8
  };
}

// Risposta per nutrizione
function generateNutritionResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  if (lowerMessage.includes('calorie')) {
    return {
      message: `🍎 CALCOLO CALORIE PERSONALIZZATO\n\nFormula base (Harris-Benedict):\n• Uomini: BMR = 88.362 + (13.397 × peso) + (4.799 × altezza) - (5.677 × età)\n• Donne: BMR = 447.593 + (9.247 × peso) + (3.098 × altezza) - (4.330 × età)\n\nFattori di attività:\n• Sedentario: BMR × 1.2\n• Leggero: BMR × 1.375\n• Moderato: BMR × 1.55\n• Intenso: BMR × 1.725\n• Molto intenso: BMR × 1.9\n\nPer dimagrire: -300/500 calorie\nPer massa: +300/500 calorie\n\nMacronutrienti:\n• Proteine: 1.6-2.2g per kg peso\n• Carboidrati: 45-65% delle calorie\n• Grassi: 20-35% delle calorie\n\nVuoi che calcoli le tue calorie specifiche?`,
      confidence: 0.9
    };
  }
  
  return {
    message: `🍎 NUTRIZIONE E ALIMENTAZIONE\n\nPosso aiutarti con:\n• Calcolo calorie personalizzato\n• Macronutrienti (proteine, carboidrati, grassi)\n• Ricette salutari per ogni obiettivo\n• Meal prep e organizzazione\n• Integratori e supplementi\n• Idratazione e timing\n\nEsempi di domande:\n• "Quante calorie devo mangiare?"\n• "Ricette per massa muscolare"\n• "Cosa mangiare pre-allenamento"\n• "Meal prep per la settimana"\n\nCosa ti interessa sapere?`,
    confidence: 0.8
  };
}

// Risposta per team Performance Prime
function generateTeamResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  if (lowerMessage.includes('mattia')) {
    return {
      message: `👨‍💼 MATTIA SILVESTRELLI - FONDATORE\n\nChi è Mattia:\n• Fondatore e CEO di Performance Prime\n• Esperto di fitness e performance sportive\n• Imprenditore nel settore wellness\n• Appassionato di innovazione tecnologica\n\nLa sua visione:\n• Rendere il fitness accessibile a tutti\n• Combinare tecnologia e benessere\n• Creare una community di appassionati\n• Sviluppare soluzioni personalizzate\n\nPerformance Prime:\n• Nata dalla passione per il fitness\n• Focus su risultati concreti\n• Approccio scientifico e pratico\n• Community di supporto\n\nVuoi sapere di più sulla nostra mission o sui prossimi sviluppi?`,
      confidence: 0.95
    };
  }
  
  return {
    message: `🏢 PERFORMANCE PRIME - IL NOSTRO TEAM\n\nLa nostra mission:\n• Rendere il fitness accessibile a tutti\n• Combinare tecnologia e benessere\n• Creare una community di supporto\n• Sviluppare soluzioni personalizzate\n\nIl nostro team:\n• Mattia Silvestrelli - Fondatore e CEO\n• Co-fondatore - [Nome da aggiungere]\n• Sviluppatori - Team tecnico specializzato\n• Esperti fitness - Consulenti e trainer\n\nI nostri valori:\n• Disciplina e costanza\n• Risultati concreti\n• Approccio scientifico\n• Supporto continuo\n\nVuoi sapere di più su di noi o sui nostri servizi?`,
    confidence: 0.9
  };
}

// Risposta per conoscenza generale
function generateGeneralKnowledgeResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  if (lowerMessage.includes('capitale') && lowerMessage.includes('francia')) {
    return {
      message: `🇫🇷 La capitale della Francia è Parigi!\n\nCuriosità su Parigi:\n• Popolazione: ~2.1 milioni\n• Soprannome: "Città della Luce"\n• Simbolo: Torre Eiffel\n• Fiume: Senna\n\nCollegamento fitness:\n• Parigi è famosa per la sua cultura del wellness\n• Molti parchi per correre (Bois de Boulogne)\n• Caffè e pasticcerie (attenzione alle calorie!)\n• Stile di vita attivo e salutare\n\nSe vuoi, posso consigliarti workout ispirati alla cultura francese o ricette salutari della cucina parigina!`,
      confidence: 0.95
    };
  }
  
  if (lowerMessage.includes('capitale') && lowerMessage.includes('giappone')) {
    return {
      message: `🇯🇵 La capitale del Giappone è Tokyo!\n\nCuriosità su Tokyo:\n• Popolazione: ~14 milioni\n• Tecnologia all'avanguardia\n• Cultura del rispetto e disciplina\n• Cibo sano e bilanciato\n\nCollegamento fitness:\n• Tokyo è una delle città più attive al mondo\n• Molti parchi per esercizi all'aperto\n• Cultura del benessere e longevità\n• Cucina giapponese molto salutare\n\nPosso consigliarti workout ispirati alla disciplina giapponese o ricette salutari della cucina nipponica!`,
      confidence: 0.95
    };
  }
  
  return {
    message: `🌍 CONOSCENZA GENERALE\n\nPosso rispondere a domande su:\n• Geografia (capitali, paesi, città)\n• Storia (eventi, personaggi, epoche)\n• Scienza (fisica, chimica, biologia)\n• Cultura (arte, musica, letteratura)\n• Tecnologia (innovazioni, trend)\n• Attualità (notizie, eventi recenti)\n\nE sempre con un collegamento al fitness!\n\nCosa ti interessa sapere?`,
    confidence: 0.8
  };
}

// Risposta per aiuto e supporto
function generateHelpResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  return {
    message: `🆘 AIUTO E SUPPORTO\n\nCome posso aiutarti:\n• Navigazione app - Ti guido in ogni sezione\n• Fitness - Consigli su esercizi e programmi\n• Nutrizione - Piani alimentari e ricette\n• Tecnologia - Risoluzione problemi tecnici\n• Account - Gestione profilo e impostazioni\n\nSezioni principali:\n• 📊 Dashboard - I tuoi progressi\n• 💪 Workouts - Allenamenti personalizzati\n• 🍎 Nutrition - Piani alimentari\n• 👤 Profile - Impostazioni personali\n\nNon riesco a trovare qualcosa?\nDimmi cosa stai cercando e ti guido passo passo!\n\nCosa ti serve?`,
    confidence: 0.9
  };
}

// Risposta per saluti
function generateGreetingResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  const greetings = [
    "Ciao! 👋 Sono PrimeBot, il tuo assistente AI personale di Performance Prime!",
    "Salve! 🚀 Benvenuto in Performance Prime! Sono qui per aiutarti!",
    "Buongiorno! ☀️ Pronto per una giornata di fitness e benessere?",
    "Buonasera! 🌙 Come posso aiutarti con i tuoi obiettivi fitness?"
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return {
    message: `${randomGreeting}\n\nCosa posso fare per te:\n• 🏋️‍♀️ Fitness - Esercizi, programmi, tecniche\n• 🍎 Nutrizione - Calorie, ricette, piani alimentari\n• 🧭 Navigazione - Ti guido in ogni sezione dell'app\n• 🌍 Conoscenza - Rispondo a qualsiasi domanda\n• 👥 Team - Info su Performance Prime e Mattia\n\nProva a chiedermi:\n• "Come si fa lo squat?"\n• "Quante calorie devo mangiare?"\n• "Mostrami la Dashboard"\n• "Chi è Mattia?"\n\nSono qui per te! 💪`,
    confidence: 0.95
  };
}

// Risposta generale intelligente
function generateGeneralResponse(message: string, lowerMessage: string): { message: string; confidence: number } {
  return {
    message: `🤔 Non sono sicuro di aver capito perfettamente la tua domanda.\n\nMa posso aiutarti con:\n• 🏋️‍♀️ Fitness - Esercizi, programmi, tecniche\n• 🍎 Nutrizione - Calorie, ricette, piani alimentari\n• 🧭 Navigazione - Ti guido nell'app\n• 🌍 Conoscenza - Rispondo a qualsiasi domanda\n• 👥 Team - Info su Performance Prime\n\nProva a riformulare la domanda o chiedi:\n• "Come posso creare un workout?"\n• "Mostrami la sezione nutrizione"\n• "Chi è il fondatore di Performance Prime?"\n• "Cosa significa HIIT?"\n\nSono qui per aiutarti! 💪`,
    confidence: 0.6
  };
}

// Analisi avanzata dell'intento - SISTEMA INTELLIGENTE
function analyzeAdvancedIntent(message: string, history: Message[]): any {
  const lowerMessage = (message || '').toString().toLowerCase().trim();
  
  // SISTEMA DI RICONOSCIMENTO INTELLIGENTE
  // Riconosce l'intento basandosi su combinazioni di parole e contesto
  
  // WORKOUT E ALLENAMENTI - Riconoscimento intelligente
  if (isWorkoutIntent(lowerMessage)) {
    return {
      category: 'WORKOUT',
      intent: 'workout_related',
      confidence: 0.9
    };
  }
  
  // NUTRIZIONE - Riconoscimento intelligente
  if (isNutritionIntent(lowerMessage)) {
    return {
      category: 'NUTRITION',
      intent: 'nutrition_related',
      confidence: 0.9
    };
  }
  
  // NAVIGAZIONE APP - Riconoscimento intelligente
  if (isNavigationIntent(lowerMessage)) {
    return {
      category: 'APP_NAVIGATION',
      intent: 'navigation_related',
      confidence: 0.9
    };
  }
  
  // TEAM INFO - Riconoscimento intelligente
  if (isTeamIntent(lowerMessage)) {
    return {
      category: 'TEAM_INFO',
      intent: 'team_related',
      confidence: 0.9
    };
  }
  
  // CONOSCENZA GENERALE - Riconoscimento intelligente
  if (isGeneralKnowledgeIntent(lowerMessage)) {
    return {
      category: 'GENERAL_KNOWLEDGE',
      intent: 'general_knowledge',
      confidence: 0.8
    };
  }
  
  // AIUTO E SUPPORTO - Riconoscimento intelligente
  if (isHelpIntent(lowerMessage)) {
    return {
      category: 'HELP',
      intent: 'help_related',
      confidence: 0.9
    };
  }
  
  return {
    category: 'GENERAL',
    intent: 'general_query',
    confidence: 0.5
  };
}

// FUNZIONI DI RICONOSCIMENTO INTELLIGENTE

// Riconosce intenti relativi a workout e allenamenti
function isWorkoutIntent(message: string): boolean {
  const workoutKeywords = [
    // Parole chiave principali
    'allenamento', 'workout', 'esercizio', 'esercizi', 'allenarsi', 'allenarmi',
    'creare', 'creo', 'fare', 'faccio', 'programmare', 'programmo',
    'squat', 'push up', 'flessioni', 'plank', 'burpees',
    'forza', 'resistenza', 'cardio', 'hiit', 'muscoli',
    'palestra', 'casa', 'outdoor', 'pesi', 'dumbbell',
    'serie', 'ripetizioni', 'rip', 'set', 'circuito',
    'riscaldamento', 'defaticamento', 'stretching',
    'massa', 'dimagrire', 'perdere peso', 'tonificare',
    'pettorali', 'bicipiti', 'tricipiti', 'spalle', 'schiena',
    'gambe', 'glutei', 'addominali', 'core', 'polpacci'
  ];
  
  const questionWords = ['come', 'dove', 'quando', 'quale', 'quali', 'perché'];
  const actionWords = ['creare', 'fare', 'iniziare', 'cominciare', 'programmare', 'organizzare'];
  
  // Controlla se contiene parole chiave workout
  const hasWorkoutKeywords = workoutKeywords.some(keyword => message.includes(keyword));
  
  // Controlla combinazioni di domande + azioni + workout
  const hasQuestionAction = questionWords.some(q => 
    actionWords.some(a => 
      message.includes(q) && message.includes(a) && 
      (message.includes('allenamento') || message.includes('workout') || message.includes('esercizio'))
    )
  );
  
  // Controlla frasi specifiche comuni
  const commonPhrases = [
    'come mi alleno', 'dove mi alleno', 'come faccio esercizi',
    'dove vado per allenarmi', 'come programmo allenamenti',
    'dove trovo esercizi', 'come creo workout', 'dove creo workout',
    'come faccio workout', 'dove faccio workout', 'come mi alleno',
    'dove mi alleno', 'come inizio ad allenarmi', 'dove inizio ad allenarmi'
  ];
  
  const hasCommonPhrases = commonPhrases.some(phrase => message.includes(phrase));
  
  return hasWorkoutKeywords || hasQuestionAction || hasCommonPhrases;
}

// Riconosce intenti relativi a nutrizione
function isNutritionIntent(message: string): boolean {
  const nutritionKeywords = [
    'nutrizione', 'alimentazione', 'dieta', 'cibo', 'mangiare',
    'calorie', 'proteine', 'carboidrati', 'grassi', 'macro',
    'ricetta', 'ricette', 'pasto', 'colazione', 'pranzo', 'cena',
    'snack', 'spuntino', 'idratazione', 'acqua', 'bevande',
    'vitamine', 'minerali', 'integratori', 'supplementi',
    'dimagrire', 'perdere peso', 'aumentare peso', 'massa muscolare',
    'metabolismo', 'digestione', 'intestino', 'stomaco'
  ];
  
  const questionWords = ['come', 'dove', 'quando', 'quale', 'quali', 'quanto'];
  const actionWords = ['mangiare', 'bere', 'cucinare', 'preparare', 'calcolare'];
  
  const hasNutritionKeywords = nutritionKeywords.some(keyword => message.includes(keyword));
  const hasQuestionAction = questionWords.some(q => 
    actionWords.some(a => 
      message.includes(q) && message.includes(a) && 
      (message.includes('nutrizione') || message.includes('dieta') || message.includes('cibo'))
    )
  );
  
  return hasNutritionKeywords || hasQuestionAction;
}

// Riconosce intenti di navigazione nell'app
function isNavigationIntent(message: string): boolean {
  const navigationKeywords = [
    'dove', 'come', 'trovare', 'andare', 'aprire', 'mostra', 'vai',
    'sezione', 'pagina', 'menu', 'navigazione', 'accedere', 'entrare'
  ];
  
  const appSections = [
    'dashboard', 'workouts', 'nutrizione', 'nutrition', 'profilo', 'profile',
    'impostazioni', 'settings', 'statistiche', 'progressi', 'analytics',
    'calendario', 'schedule', 'timer', 'cronometro'
  ];
  
  const hasNavigationKeywords = navigationKeywords.some(keyword => message.includes(keyword));
  const hasAppSections = appSections.some(section => message.includes(section));
  
  // Esclude domande sui workout che sono già coperte
  if (isWorkoutIntent(message)) return false;
  
  return hasNavigationKeywords && (hasAppSections || message.includes('app') || message.includes('sezione'));
}

// Riconosce intenti relativi al team
function isTeamIntent(message: string): boolean {
  const teamKeywords = [
    'mattia', 'fondatore', 'team', 'chi è', 'performance prime',
    'azienda', 'società', 'startup', 'imprenditore', 'ceo',
    'storia', 'mission', 'valori', 'chi ha creato', 'chi ha fatto'
  ];
  
  return teamKeywords.some(keyword => message.includes(keyword));
}

// Riconosce intenti di conoscenza generale
function isGeneralKnowledgeIntent(message: string): boolean {
  const generalKeywords = [
    'capitale', 'storia', 'quando', 'perché', 'cos\'è', 'dove si trova',
    'scienza', 'tecnologia', 'cultura', 'arte', 'musica', 'letteratura',
    'geografia', 'fisica', 'chimica', 'biologia', 'matematica'
  ];
  
  return generalKeywords.some(keyword => message.includes(keyword));
}

// Riconosce intenti di aiuto e supporto
function isHelpIntent(message: string): boolean {
  const helpKeywords = [
    'aiuto', 'problema', 'non riesco', 'errore', 'bug', 'come funziona',
    'non capisco', 'spiegami', 'tutorial', 'guida', 'istruzioni',
    'supporto', 'assistenza', 'difficoltà', 'bloccato', 'stuck'
  ];
  
  return helpKeywords.some(keyword => message.includes(keyword));
}

// Suggerimenti contestuali intelligenti
function generateContextualSuggestions(
  category: string,
  response: string,
  navigation: any
): string[] {
  const suggestions: Record<string, string[]> = {
    APP_NAVIGATION: [
      "Vuoi che ti mostri un tutorial completo?",
      "Posso guidarti passo passo",
      "Ti mostro altre funzionalità della sezione?"
    ],
    WORKOUT: [
      "Vuoi vedere esercizi simili?",
      "Posso crearti un programma completo",
      "Ti interessa la versione avanzata?",
      navigation ? `Vai a ${navigation.path} per iniziare` : null
    ].filter(Boolean),
    NUTRITION: [
      "Vuoi il calcolo personalizzato delle calorie?",
      "Posso suggerirti ricette correlate",
      "Ti creo un piano settimanale?"
    ],
    TEAM_INFO: [
      "Vuoi conoscere la nostra mission?",
      "Ti racconto la storia di Performance Prime?",
      "Posso presentarti gli altri membri del team"
    ],
    GENERAL_KNOWLEDGE: [
      "Posso approfondire questo argomento",
      "Vuoi informazioni correlate?",
      "Ti interessa sapere come questo si collega al fitness?"
    ],
    HELP: [
      "Posso guidarti passo passo",
      "Vuoi che contatti il supporto?",
      "Ti mostro soluzioni alternative?"
    ],
    GENERAL: [
      "Come posso aiutarti con il tuo fitness?",
      "Hai domande sull'app?",
      "Vuoi esplorare le funzionalità?"
    ]
  };
  
  return suggestions[category] || suggestions.GENERAL;
}

// Gestione fallback intelligente
function handleFallback(message: string): any {
  const intent = (message || '').toString().toLowerCase().trim();
  
  if (intent.includes('workout') || intent.includes('esercizio')) {
    return {
      message: "Per vedere tutti gli esercizi, vai nella sezione Workouts dal menu principale. Lì trovi video tutorial e puoi creare i tuoi allenamenti personalizzati.",
      suggestions: ["Vai a Workouts", "Mostrami esercizi base", "Crea workout"],
      navigation: { path: '/workouts' },
      confidence: 0.7
    };
  }
  
  return {
    message: "Sono qui per aiutarti! Posso guidarti nell'app, rispondere a domande su fitness e nutrizione, o parlare di qualsiasi argomento. Cosa ti interessa?",
    suggestions: ["Tour dell'app", "Domande fitness", "Inizia allenamento"],
    confidence: 0.5
  };
}

// Helper functions
function extractSpecificIntent(message: string, category: string): string {
  return `${(category || '').toString().toLowerCase()}_query`;
}

function calculateIntentConfidence(message: string, keywords: string[]): number {
  const safeMessage = (message || '').toString();
  const matches = keywords.filter(kw => safeMessage.includes(kw)).length;
  return Math.min(matches * 0.3, 1);
}

function calculateConfidence(analysis: any): number {
  return analysis.confidence || 0.7;
}

async function saveLearningData(chatID: string, request: any, response: any, analysis: any): Promise<void> {
  // Salva dati per machine learning futuro
  if (typeof window !== 'undefined') {
    const learningData = {
      sessionID: chatID,
      timestamp: new Date().toISOString(),
      input: request,
      output: response.message,
      analysis,
      success: true
    };
    
    const existing = localStorage.getItem('primebot_learning') || '[]';
    const data = JSON.parse(existing);
    data.push(learningData);
    
    // Mantieni solo ultimi 200 record
    if (data.length > 200) {
      data.shift();
    }
    
    localStorage.setItem('primebot_learning', JSON.stringify(data));
  }
}

function processVoiceflowResponse(data: any): any {
  // Processa la risposta (ora non più necessaria ma mantenuta per compatibilità)
  return {
    message: "Risposta generata localmente",
    confidence: 0.8
  };
}

// Funzioni legacy per compatibilità
export const vfPatchState = async (chatID: string, state: any) => {
  // Implementazione legacy per compatibilità
  return { success: true };
};

export const vfInteract = async (chatID: string, request: any) => {
  // Wrapper per la funzione interact
  return await interact(chatID, request);
};

export const parseVF = (data: any) => {
  // Parser per le risposte (ora non più necessario ma mantenuto per compatibilità)
  return {
    texts: [data.message || "Risposta generata localmente"],
    choices: data.suggestions || [],
    navigation: data.navigation || null
  };
};

// Esporta anche il context per uso in altri componenti
export { botContext };