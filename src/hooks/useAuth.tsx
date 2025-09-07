
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/services/emailService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; message: string }> => {
    console.log('=== SIGNUP DEBUG START ===');
    console.log('1. Input data:', { email, fullName });
    
    // Parse fullName into first_name and last_name
    let first_name = '';
    let last_name = '';
    
    if (fullName && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      first_name = nameParts[0] || '';
      last_name = nameParts.slice(1).join(' ') || '';
    }
    
    console.log('2. Parsed names:', { first_name, last_name });
    console.log('3. Supabase client:', {
      url: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey,
      keyLength: supabase.supabaseKey?.length
    });

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
      
      console.log('4. Signup payload:', JSON.stringify(signupData, null, 2));
      
      const { data, error } = await supabase.auth.signUp(signupData);
      
      console.log('5. Supabase response:', {
        hasData: !!data,
        hasError: !!error,
        errorDetails: error ? JSON.stringify(error, null, 2) : null,
        dataDetails: data ? JSON.stringify(data, null, 2) : null
      });
      
      if (error) {
        console.log('6. Error thrown:', error);
        console.log('=== SIGNUP DEBUG END ===');
        throw error;
      }
      
      // Verifica se l'utente è già confermato o se serve conferma email
      if (data.user && data.session) {
        // Utente confermato e sessione creata
        // Invia email di benvenuto (non bloccante)
        if (data.user) {
          sendWelcomeEmail(data.user).catch(error => {
            console.error('Errore invio email benvenuto:', error);
          });
        }
        console.log('7. Success with session');
        console.log('=== SIGNUP DEBUG END ===');
        return { success: true, message: 'Registrazione completata e accesso effettuato!' };
      } else if (data.user && !data.session) {
        // Utente creato ma serve conferma email
        // Invia email di benvenuto anche se serve conferma (non bloccante)
        if (data.user) {
          sendWelcomeEmail(data.user).catch(error => {
            console.error('Errore invio email benvenuto:', error);
          });
        }
        console.log('7. Success without session (email confirmation needed)');
        console.log('=== SIGNUP DEBUG END ===');
        return { success: true, message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' };
      } else {
        console.log('7. No user created');
        console.log('=== SIGNUP DEBUG END ===');
        return { success: false, message: 'Errore durante la registrazione' };
      }
    } catch (error) {
      console.log('8. Catch error:', error);
      console.log('=== SIGNUP DEBUG END ===');
      return { success: false, message: 'Errore imprevisto durante la registrazione' };
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
    } catch (error) {
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
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
