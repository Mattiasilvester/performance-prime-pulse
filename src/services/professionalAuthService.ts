import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  category: 'pt' | 'nutrizionista' | 'fisioterapista' | 'mental_coach' | 'osteopata' | 'altro';
  city: string;
  bio?: string;
  company_name?: string;
  titolo_studio?: string;
  certificazioni?: string[];
  customCategory?: string;
  modalita?: 'online' | 'presenza' | 'entrambi';
  prezzo_seduta?: number | null;
  prezzo_fascia?: '€' | '€€' | '€€€';
}

export const professionalAuthService = {
  // Registra nuovo professionista.
  // Il record in professionals viene creato dal trigger su auth.users (handle_new_professional_signup),
  // così funziona anche con "Confirm email" attiva (dopo signUp non c'è sessione → niente 403).
  async register(data: ProfessionalRegistrationData) {
    const emailLower = data.email.toLowerCase();
    const companyName = data.company_name || `${data.first_name} ${data.last_name}`;

    // 1. Crea account in Supabase Auth con TUTTI i dati professional in options.data
    // (il trigger handle_new_professional_signup li usa per inserire in public.professionals)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'professional',
          first_name: data.first_name,
          last_name: data.last_name,
          email: emailLower,
          phone: data.phone,
          category: data.category,
          city: data.city,
          bio: data.bio ?? null,
          company_name: companyName,
          titolo_studio: data.titolo_studio ?? null,
          certificazioni: data.certificazioni ?? [],
          modalita: data.modalita ?? 'entrambi',
          prezzo_seduta: data.prezzo_seduta ?? null,
          prezzo_fascia: data.prezzo_fascia ?? '€€',
          birth_date: '1990-01-01',
          birth_place: data.city,
          vat_number: 'PENDING',
          vat_address: 'Da completare',
          vat_postal_code: '00000',
          vat_city: data.city,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Errore nella creazione account');

    // 2. Record professional creato dal trigger; se c'è sessione (conferma email disattiva) lo recuperiamo
    let professional: Record<string, unknown> | null = null;
    if (authData.session) {
      const { data: profRow } = await supabase
        .from('professionals')
        .select()
        .eq('user_id', authData.user.id)
        .maybeSingle();
      professional = profRow ?? null;
    }

    return {
      user: authData.user,
      professional,
      requiresEmailConfirmation: !authData.session,
    };
  },

  // Login professionista
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verifica che sia un professionista (.maybeSingle evita 406 se record non ancora creato dal trigger)
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profError) throw profError;
    if (!professional) {
      throw new Error('Account non trovato come professionista');
    }

    return { user: data.user, professional };
  },

  // Verifica se email già esistente
  async checkEmailExists(email: string): Promise<boolean> {
    const { data } = await supabase
      .from('professionals')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    return !!data;
  }
};

