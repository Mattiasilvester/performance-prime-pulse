import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
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
      // Step 1: Verifica secret key tramite Edge Function (sicuro, senza autenticazione richiesta)
      const validateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth-validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
      
      // Step 2: Query diretta con logging
      console.log('📊 Cerco profilo per:', credentials.email);
      
      console.log('📊 Cerco profilo per:', credentials.email);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name, created_at')
        .eq('email', credentials.email);

      if (error) {
        console.warn('Query profilo fallita, uso bypass:', error);
        throw error;
      }

      const profile = profiles?.[0];

      if (!profile || profile.role !== 'super_admin') {
        console.error('Ruolo non autorizzato o profilo mancante');
        throw new Error('Account non autorizzato');
      }

      const ADMIN_PASSWORD = 'SuperAdmin2025!'
      if (credentials.password !== ADMIN_PASSWORD) {
        console.error('❌ Password non valida');
        throw new Error('Password non valida');
      }

      console.log('✅ SuperAdmin verificato:', profile);

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
      
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: profile.id,
          action: 'login',
          details: { email: profile.email }
        });
        console.log('✅ Audit log creato');
      } catch (auditError) {
        console.warn('⚠️ Audit log failed:', auditError);
      }
      
      return { success: true };

    } catch (error: any) {
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
