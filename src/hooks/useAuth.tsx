
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('Auth hook initializing...');
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN get initial session (only once)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id || 'no user', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Session error:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('SignUp error:', error);
        return { success: false, message: error.message };
      }
      
      console.log('SignUp success:', data);
      
      // Verifica se l'utente è già confermato o se serve conferma email
      if (data.user && data.session) {
        // Utente confermato e sessione creata
        return { success: true, message: 'Registrazione completata e accesso effettuato!' };
      } else if (data.user && !data.session) {
        // Utente creato ma serve conferma email
        return { success: true, message: 'Registrazione completata! Controlla la tua email per confermare l\'account.' };
      } else {
        return { success: false, message: 'Errore durante la registrazione' };
      }
    } catch (error) {
      console.error('SignUp exception:', error);
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
        console.error('SignIn error:', error);
        return false;
      }
      
      console.log('SignIn success:', data);
      return true;
    } catch (error) {
      console.error('SignIn exception:', error);
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('SignOut error:', error);
        return false;
      }
      
      console.log('SignOut success');
      return true;
    } catch (error) {
      console.error('SignOut exception:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
