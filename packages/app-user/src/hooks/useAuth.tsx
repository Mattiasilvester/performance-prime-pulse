/* eslint-disable react-refresh/only-export-components -- Auth context exports both hook and provider */
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/services/emailService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ success: false, message: 'Not implemented' }),
  signIn: async () => false,
  signOut: async () => false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN get initial session (only once)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.warn('Session error (non-critical):', error?.message);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error: unknown) => {
      if (mounted) {
        const msg = error instanceof Error ? error.message : 'Session check failed';
        console.warn('Session check failed (non-critical)', msg);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; message: string }> => {
    let first_name = '';
    let last_name = '';
    if (fullName && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      first_name = nameParts[0] || '';
      last_name = nameParts.slice(1).join(' ') || '';
    }

    try {
      const signupData = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: `${first_name} ${last_name}`,
            first_name,
            last_name,
          }
        }
      };
      const { data, error } = await supabase.auth.signUp(signupData);
      if (error) throw error;
      
      // Verifica se l'utente è già confermato o se serve conferma email
      if (data.user && data.session) {
        // Utente confermato e sessione creata
        // Invia email di benvenuto (non bloccante)
        if (data.user && data.user.email) {
          sendWelcomeEmail({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata
          }).catch((error: unknown) => {
            console.error('Errore invio email benvenuto:', error instanceof Error ? error.message : error);
          });
        }
        return { success: true, message: 'Registrazione completata e accesso effettuato!' };
      } else if (data.user && !data.session) {
        // Utente creato ma serve conferma email
        // Invia email di benvenuto anche se serve conferma (non bloccante)
        if (data.user && data.user.email) {
          sendWelcomeEmail({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata
          }).catch((error: unknown) => {
            console.error('Errore invio email benvenuto:', error instanceof Error ? error.message : error);
          });
        }
        return { success: true, message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' };
      } else {
        return { success: false, message: 'Errore durante la registrazione' };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      if (message.includes('User already registered')) {
        return { 
          success: false, 
          message: 'Un account con questa email esiste già. Prova a fare login o usa un\'email diversa.' 
        };
      }
      
      if (message.includes('Invalid email')) {
        return { 
          success: false, 
          message: 'Email non valida. Controlla che l\'email sia scritta correttamente.' 
        };
      }
      
      return { 
        success: false, 
        message: message || 'Errore durante la registrazione. Riprova più tardi.' 
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.warn('signIn error:', error instanceof Error ? error.message : error);
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.warn('signOut error:', error instanceof Error ? error.message : error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
