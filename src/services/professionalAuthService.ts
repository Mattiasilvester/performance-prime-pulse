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
  // Registra nuovo professionista
  async register(data: ProfessionalRegistrationData) {
    // 1. Crea account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'professional',
          first_name: data.first_name,
          last_name: data.last_name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Errore nella creazione account');

    // 2. Crea record in tabella professionals
    // Nota: alcuni campi sono obbligatori nella tabella ma non nel form
    // Usiamo valori placeholder che il professionista completerà dopo
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .insert({
        user_id: authData.user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        category: data.category,
        zona: data.city,
        bio: data.bio || null,
        company_name: data.company_name || `${data.first_name} ${data.last_name}`, // Se non fornito, usa nome completo
        titolo_studio: data.titolo_studio || null,
        specializzazioni: data.certificazioni || [], // Usa specializzazioni per certificazioni
        // Se categoria è "altro", aggiungi la categoria custom al bio
        // (oppure potresti creare un campo dedicato categoria_custom nel database)
        approval_status: 'approved', // Approvato automaticamente
        approved_at: new Date().toISOString(),
        attivo: true,
        is_partner: false, // Diventa partner dopo pagamento
        modalita: data.modalita || 'entrambi',
        prezzo_seduta: data.prezzo_seduta ?? null,
        prezzo_fascia: data.prezzo_fascia || '€€',
        rating: 0,
        reviews_count: 0,
        // Campi obbligatori che non abbiamo nel form (valori placeholder)
        // Il professionista completerà questi dati nel profilo
        birth_date: '1990-01-01', // Placeholder, da aggiornare
        birth_place: data.city,
        vat_number: 'PENDING', // Placeholder, da aggiornare
        vat_address: 'Da completare', // Placeholder, da aggiornare
        vat_postal_code: '00000', // Placeholder, da aggiornare
        vat_city: data.city,
        // Campi password custom (mantenuti per retrocompatibilità, non più usati)
        password_hash: 'supabase_auth', // Placeholder, non più usato
        password_salt: 'supabase_auth' // Placeholder, non più usato
      })
      .select()
      .single();

    if (profError) {
      // Se fallisce, elimina l'utente auth creato
      console.error('Errore creazione profilo:', profError);
      // Nota: Non possiamo eliminare l'utente auth direttamente dal client
      // Dovrebbe essere gestito lato server o con una funzione edge
      throw profError;
    }

    return { user: authData.user, professional };
  },

  // Login professionista
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verifica che sia un professionista
    const { data: professional } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

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

