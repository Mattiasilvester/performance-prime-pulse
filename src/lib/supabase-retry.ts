import { supabase } from '@/integrations/supabase/client';

// Utility per retry automatico delle chiamate Supabase in caso di errori CORS
export async function supabaseRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      console.warn(`🔄 Tentativo ${i + 1}/${maxRetries} fallito:`, error.message);
      
      // Se errore CORS, retry
      if (
        error.message?.includes('CORS') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch')
      ) {
        if (i < maxRetries - 1) {
          const waitTime = delay * (i + 1);
          console.log(`⏳ Attendo ${waitTime}ms prima del retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Se non è un errore CORS o abbiamo raggiunto max retries, rilancia
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// Wrapper specifico per operazioni Supabase comuni
export const supabaseWithRetry = {
  async getUser() {
    return supabaseRetry(async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data;
    });
  },

  async getSession() {
    return supabaseRetry(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data;
    });
  },

  async signUp(email: string, password: string, options?: any) {
    return supabaseRetry(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      if (error) throw error;
      return data;
    });
  },

  async signIn(email: string, password: string) {
    return supabaseRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    });
  },

  async signOut() {
    return supabaseRetry(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    });
  },

  async from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            return supabaseRetry(async () => {
              const { data, error } = await supabase
                .from(table)
                .select(columns)
                .eq(column, value)
                .single();
              if (error) throw error;
              return { data, error: null };
            });
          }
        })
      }),
      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            return supabaseRetry(async () => {
              const { data, error } = await supabase
                .from(table)
                .insert(values)
                .select()
                .single();
              if (error) throw error;
              return { data, error: null };
            });
          }
        })
      })
    };
  }
};
