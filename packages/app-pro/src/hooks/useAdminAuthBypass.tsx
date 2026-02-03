import { useState, useEffect } from 'react'
import { supabase } from '@pp/shared'
import { AdminUser, AdminSession } from '@/types/admin.types'

// ADMIN_SECRET rimosso - validazione ora tramite Edge Function

export function useAdminAuthBypass() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyAdminSession()
  }, [])

  useEffect(() => {
    if (admin) {
      document.body.classList.add('admin-panel');
    } else {
      document.body.classList.remove('admin-panel');
    }
    
    return () => {
      document.body.classList.remove('admin-panel');
    };
  }, [admin])

  const verifyAdminSession = async () => {
    try {
      const sessionData = localStorage.getItem('admin_session')
      
      if (!sessionData) {
        setLoading(false)
        return
      }

      // Prova a parsare come JSON (nuovo formato)
      try {
        const parsedSession = JSON.parse(sessionData)
        
        if (parsedSession.role === 'super_admin') {
          console.log('✅ Sessione SuperAdmin trovata:', parsedSession);
          setAdmin({
            id: parsedSession.admin_id || parsedSession.id,
            email: parsedSession.email,
            name: parsedSession.full_name || 'Super Admin',
            role: 'super_admin',
            status: 'active',
            created_at: parsedSession.created_at || new Date().toISOString()
          })
          setLoading(false)
          return
        }
      } catch (parseError) {
        console.log('Sessione non in formato JSON, provo formato legacy...');
      }

      // Fallback: formato legacy con token
      const { data: sessionDataFromDB, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            first_name,
            last_name,
            role,
            created_at
          )
        `)
        .eq('token', sessionData)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !sessionDataFromDB) {
        localStorage.removeItem('admin_session')
        setLoading(false)
        return
      }

      if (sessionDataFromDB.profiles.role === 'super_admin') {
        setSession(sessionDataFromDB)
        setAdmin({
          id: sessionDataFromDB.profiles.id,
          email: sessionDataFromDB.profiles.email,
          name: `${sessionDataFromDB.profiles.first_name} ${sessionDataFromDB.profiles.last_name}`,
          role: 'super_admin',
          status: 'active',
          created_at: sessionDataFromDB.profiles.created_at || new Date().toISOString()
        })
      } else {
        localStorage.removeItem('admin_session')
      }
    } catch (error) {
      console.error('Error verifying admin session:', error)
      localStorage.removeItem('admin_session')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: { email: string; password: string; secretKey: string }) => {
    console.log('🔐 Tentativo login SuperAdmin:', credentials.email);
    
    try {
      // Step 1: Verifica secret key tramite Edge Function
      // Supabase richiede Authorization con anon key per accettare la chiamata
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        throw new Error('VITE_SUPABASE_ANON_KEY non configurata');
      }
      const validateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth-validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ secretKey: credentials.secretKey }),
        },
      );

      if (!validateResponse.ok) {
        throw new Error('Errore durante validazione secret key');
      }

      const { valid } = await validateResponse.json();
      
      if (!valid) {
        console.error('❌ Secret key non valida');
        throw new Error('Chiave segreta non valida');
      }

      // Step 2: Verifica email + password tramite Edge Function (Service Role bypassa RLS su profiles)
      // La query client su profiles fallisce senza sessione Auth per le policy RLS
      const loginResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        },
      );
      const loginResult = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok || !loginResult.valid || !loginResult.profile) {
        const msg = (loginResult as { error?: string }).error || 'Account non autorizzato';
        throw new Error(msg);
      }
      const profile = loginResult.profile as {
        id: string;
        email: string;
        role: string;
        first_name: string | null;
        last_name: string | null;
        created_at: string;
      };
      console.log('✅ SuperAdmin verificato:', profile.email);

      const sessionData = {
        admin_id: profile.id,
        email: profile.email,
        role: profile.role,
        logged_at: new Date().toISOString()
      };
      
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      setAdmin({
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Super Admin',
        role: 'super_admin',
        status: 'active',
        created_at: profile.created_at || new Date().toISOString()
      });

      // Audit log su login rimosso da client: RLS su admin_audit_logs richiede auth,
      // il bypass non ha sessione Supabase → 401. Se serve, fare insert da Edge Function.
      return { success: true };

    } catch (error: unknown) {
      console.error('❌ Login fallito:', error);
      
      // Emergency bypass rimosso per sicurezza
      // La validazione secret key deve sempre passare tramite Edge Function
      throw error;
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session')
      
      if (sessionToken) {
        // Rimuovi sessione dal database
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('token', sessionToken)
      }
      
      localStorage.removeItem('admin_session')
      setAdmin(null)
      setSession(null)
    } catch (error) {
      console.error('Admin logout error:', error)
    }
  }

  const isAuthorized = admin?.role === 'super_admin'

  return {
    admin,
    session,
    loading,
    isAuthorized,
    login,
    logout,
    verifyAdminSession
  }
}

// Helper per ottenere IP client
async function fetchClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}
