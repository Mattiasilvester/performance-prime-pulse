// Tipi per piani nutrizionali generati da PrimeBot

export interface NutritionFood {
  nome: string;
  quantita: string;
  calorie?: number;
  proteine?: number;
  carboidrati?: number;
  grassi?: number;
  note?: string;
}

export interface NutritionMeal {
  nome: string;
  orario?: string;
  alimenti: NutritionFood[];
  calorie_totali?: number;
  note?: string;
}

export interface NutritionDay {
  giorno: string;
  pasti: NutritionMeal[];
  calorie_totali?: number;
  note?: string;
}

export interface StructuredNutritionPlan {
  nome: string;
  descrizione: string;
  obiettivo: string;
  calorie_giornaliere: number;
  macronutrienti?: {
    proteine_percentuale: number;
    carboidrati_percentuale: number;
    grassi_percentuale: number;
  };
  allergie_considerate: string[];
  giorni: NutritionDay[];
  consigli_generali?: string[];
  note_finali?: string;
}

export interface NutritionPlanRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  goal?: string;
  calorie_giornaliere?: number;
  allergie_considerate: string[];
  contenuto: StructuredNutritionPlan;
  note?: string;
  created_at: string;
  updated_at: string;
}
