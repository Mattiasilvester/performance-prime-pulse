import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  category: 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata';
  bio: string | null;
  foto_url: string | null;
  specializzazioni: string[] | null;
  zona: string | null;
  modalita: 'online' | 'presenza' | 'entrambi';
  prezzo_fascia: '€' | '€€' | '€€€';
  prezzo_seduta?: number | null;
  rating: number;
  reviews_count: number;
  is_partner?: boolean;
  services?: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface ProfessionalsFilters {
  category?: string;
  zona?: string;
  modalita?: string;
  prezzo_fascia?: string;
  search?: string;
}

export interface UserOnboardingData {
  obiettivo?: 'massa' | 'dimagrire' | 'resistenza' | 'tonificare';
  livello_esperienza?: 'principiante' | 'intermedio' | 'avanzato';
  ha_limitazioni?: boolean;
  limitazioni_fisiche?: string;
  consigli_nutrizionali?: boolean;
  eta?: number;
  peso?: number;
  altezza?: number;
}

export interface ProfessionalWithMatch extends Professional {
  matchScore: number;
}

// ============================================
// FETCH PROFESSIONISTI
// ============================================

export async function getProfessionals(filters?: ProfessionalsFilters): Promise<Professional[]> {
  try {
    let query = supabase
      .from('professionals')
      .select(`
        id, 
        first_name, 
        last_name, 
        category, 
        bio, 
        foto_url, 
        specializzazioni, 
        zona, 
        modalita, 
        prezzo_fascia, 
        prezzo_seduta,
        rating, 
        reviews_count,
        is_partner,
        services:professional_services(id, name, price)
      `)
      .eq('attivo', true);

    // Applica filtri
    if (filters?.category && filters.category !== 'tutti') {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.zona && filters.zona !== '') {
      query = query.ilike('zona', `%${filters.zona}%`);
    }
    
    if (filters?.modalita && filters.modalita !== 'tutti') {
      query = query.eq('modalita', filters.modalita);
    }
    
    if (filters?.prezzo_fascia && filters.prezzo_fascia !== 'tutti') {
      query = query.eq('prezzo_fascia', filters.prezzo_fascia);
    }

    // Ricerca per nome
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim().toLowerCase();
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query
      .order('is_partner', { ascending: false })
      .order('rating', { ascending: false })
      .order('reviews_count', { ascending: false });

    if (error) {
      console.error('Errore fetch professionisti:', error);
      throw error;
    }

    // Mappa i dati per normalizzare i servizi (filtra solo quelli attivi e normalizza array)
    if (data) {
      interface ServiceShape { id: string; name: string; price: number }
      return data.map((prof: Record<string, unknown> & { services?: unknown }) => {
        let services: ServiceShape[] = [];
        if (prof.services) {
          if (Array.isArray(prof.services)) {
            services = (prof.services as ServiceShape[]).filter((s): s is ServiceShape => !!(s?.id && s?.name && s?.price !== undefined));
          } else {
            const single = prof.services as ServiceShape;
            if (single?.id && single?.name && single?.price !== undefined) {
              services = [single];
            }
          }
        }
        return {
          ...prof,
          services,
        } as Professional;
      });
    }

    return [];
  } catch (error) {
    console.error('Errore getProfessionals:', error);
    return [];
  }
}

// ============================================
// FETCH SINGOLO PROFESSIONISTA
// ============================================

export async function getProfessionalById(id: string): Promise<Professional | null> {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select(`
        id, 
        first_name, 
        last_name, 
        category, 
        bio, 
        foto_url, 
        specializzazioni, 
        zona, 
        modalita, 
        prezzo_fascia, 
        prezzo_seduta,
        rating, 
        reviews_count,
        is_partner,
        services:professional_services(id, name, price)
      `)
      .eq('id', id)
      .eq('attivo', true)
      .single();

    if (error) {
      console.error('Errore fetch professionista:', error);
      return null;
    }

    // Normalizza services come in getProfessionals
    if (data) {
      let services: { id: string; name: string; price: number }[] = [];
      interface ServiceShape { id: string; name: string; price: number }
      if (data.services) {
        if (Array.isArray(data.services)) {
          services = (data.services as ServiceShape[]).filter((s): s is ServiceShape => !!(s?.id && s?.name && s?.price !== undefined));
        } else {
          const serviceObj = data.services as ServiceShape;
          if (serviceObj?.id && serviceObj?.name && serviceObj?.price !== undefined) {
            services = [serviceObj];
          }
        }
      }
      
      return {
        ...data,
        services: services
      };
    }

    return null;
  } catch (error) {
    console.error('Errore getProfessionalById:', error);
    return null;
  }
}

// ============================================
// CALCOLO MATCH SCORE
// ============================================

export function calculateMatchScore(
  professional: Professional, 
  userOnboarding: UserOnboardingData
): number {
  let score = 0;
  
  // === OBIETTIVO (30 punti max) ===
  const obiettivo = userOnboarding?.obiettivo;
  const specializzazioni = professional.specializzazioni || [];
  
  if (obiettivo === 'massa') {
    if (professional.category === 'pt') score += 20;
    if (professional.category === 'nutrizionista') score += 15;
    if (specializzazioni.some(s => s.toLowerCase().includes('massa') || s.toLowerCase().includes('bodybuilding'))) {
      score += 10;
    }
  }
  
  if (obiettivo === 'dimagrire') {
    if (professional.category === 'pt') score += 15;
    if (professional.category === 'nutrizionista') score += 20;
    if (specializzazioni.some(s => s.toLowerCase().includes('dimagrimento') || s.toLowerCase().includes('perdita peso'))) {
      score += 10;
    }
  }
  
  if (obiettivo === 'resistenza') {
    if (professional.category === 'pt') score += 25;
    if (specializzazioni.some(s => s.toLowerCase().includes('endurance') || s.toLowerCase().includes('resistenza') || s.toLowerCase().includes('hiit'))) {
      score += 5;
    }
  }
  
  if (obiettivo === 'tonificare') {
    if (professional.category === 'pt') score += 20;
    if (professional.category === 'nutrizionista') score += 10;
    if (specializzazioni.some(s => s.toLowerCase().includes('tonificazione') || s.toLowerCase().includes('functional'))) {
      score += 10;
    }
  }

  // === LIMITAZIONI FISICHE (25 punti max) ===
  if (userOnboarding?.ha_limitazioni) {
    if (professional.category === 'fisioterapista') score += 25;
    if (professional.category === 'osteopata') score += 20;
    if (specializzazioni.some(s => s.toLowerCase().includes('riabilitazione') || s.toLowerCase().includes('postura'))) {
      score += 5;
    }
  }

  // === CONSIGLI NUTRIZIONALI (20 punti max) ===
  if (userOnboarding?.consigli_nutrizionali) {
    if (professional.category === 'nutrizionista') score += 20;
  }

  // === RATING (15 punti max) ===
  const ratingScore = (professional.rating / 5) * 15;
  score += ratingScore;

  // === REVIEWS (10 punti max) ===
  const reviewsScore = Math.min((professional.reviews_count / 100) * 10, 10);
  score += reviewsScore;

  // Normalizza a 100
  return Math.min(Math.round(score), 100);
}

// ============================================
// MATCH RAPIDO (basato su onboarding)
// ============================================

export async function getMatchedProfessionals(
  userOnboarding: UserOnboardingData
): Promise<ProfessionalWithMatch[]> {
  try {
    const professionals = await getProfessionals();
    
    const withScores = professionals.map(professional => ({
      ...professional,
      matchScore: calculateMatchScore(professional, userOnboarding)
    }));

    // Ordina per match score (decrescente)
    return withScores.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Errore getMatchedProfessionals:', error);
    return [];
  }
}

// ============================================
// CATEGORIE E HELPER
// ============================================

export const PROFESSIONAL_CATEGORIES = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'pt', label: 'Personal Trainer' },
  { value: 'nutrizionista', label: 'Nutrizionista' },
  { value: 'fisioterapista', label: 'Fisioterapista' },
  { value: 'mental_coach', label: 'Mental Coach' },
  { value: 'osteopata', label: 'Osteopata' },
];

export const MODALITA_OPTIONS = [
  { value: 'tutti', label: 'Tutte' },
  { value: 'online', label: 'Online' },
  { value: 'presenza', label: 'In presenza' },
  { value: 'entrambi', label: 'Entrambi' },
];

export const PREZZO_OPTIONS = [
  { value: 'tutti', label: 'Tutti' },
  { value: '€', label: '€ (Economico)' },
  { value: '€€', label: '€€ (Medio)' },
  { value: '€€€', label: '€€€ (Premium)' },
];

export function getCategoryLabel(category: string): string {
  const found = PROFESSIONAL_CATEGORIES.find(c => c.value === category);
  return found?.label || category;
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'pt': return '💪';
    case 'nutrizionista': return '🥗';
    case 'fisioterapista': return '🏥';
    case 'mental_coach': return '🧠';
    case 'osteopata': return '🦴';
    default: return '👤';
  }
}

