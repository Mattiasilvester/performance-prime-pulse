/* eslint-disable react-refresh/only-export-components -- Auth context exports both hook and provider */
import { useState, useEffect, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface AuthContextType {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

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

    if (fullName?.trim()) {
      const nameParts = fullName.trim().split(' ');
      first_name = nameParts[0] || '';
      last_name = nameParts.slice(1).join(' ') || '';
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          data: {
            full_name: `${first_name} ${last_name}`.trim(),
            first_name,
            last_name,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        return { success: true, message: 'Registrazione completata e accesso effettuato!' };
      }
      if (data.user && !data.session) {
        return { success: true, message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' };
      }
      return { success: false, message: 'Errore durante la registrazione' };
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    } catch {
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      return !error;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
