import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { AdminUser, AdminSession } from '@/types/admin.types'

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
      // Step 1: Verifica secret key
      const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET_KEY
      console.log('🔑 Verifica secret key...', { provided: credentials.secretKey, expected: ADMIN_SECRET });
      
      if (credentials.secretKey !== ADMIN_SECRET) {
        console.error('❌ Secret key non valida');
        throw new Error('Chiave segreta non valida');
      }
      
      // Step 2: Query diretta con logging
      console.log('📊 Cerco profilo per:', credentials.email);
      
      try {
        // 🔍 DEBUG DETTAGLIATO - Test diretto del tuo account
        console.log('🔍 DEBUG LOGIN - Cercando:', credentials.email);
        
        const { data: testProfile, error: testError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', credentials.email)
          .single();
          
        console.log('🔍 Profile test result:', { testProfile, testError });
        
        // TEST GENERALE - conta tutti i profili
        const { count: totalProfiles, error: countError } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        console.log('🔍 Total profiles count:', { totalProfiles, countError });
        
        // TEST - primi 5 profili per vedere struttura
        const { data: sampleProfiles, error: sampleError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .limit(5);
          
        console.log('🔍 Sample profiles:', { sampleProfiles, sampleError });
        
        // Controlla struttura tabella
        if (sampleProfiles && sampleProfiles[0]) {
          console.log('📋 Colonne tabella profiles:', Object.keys(sampleProfiles[0]));
        }
        
        // Usa una query SELECT base senza RLS
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email, role, first_name, last_name, created_at')
          .eq('email', credentials.email);
        
        console.log('Query result:', { profiles, error });
        
        if (error) {
          console.error('Database error:', error);
          throw new Error(`Errore database: ${error.message}`);
        }
        
        const profile = profiles?.[0];
        
        if (!profile) {
          // FALLBACK - Se il profilo non esiste, crealo automaticamente
          console.log('👤 Account non trovato, creo automaticamente...');
          
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from('profiles')
            .insert({
              email: credentials.email,
              full_name: 'Super Admin',
              role: 'super_admin',
              is_active: true,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          console.log('👤 Account creato:', { newProfile, createError });
          
          if (createError) {
            console.error('❌ Errore creazione account:', createError);
            throw new Error(`Errore creazione account: ${createError.message}`);
          }
          
          // Usa il nuovo profilo creato
          const finalProfile = newProfile;
          
          if (finalProfile.role !== 'super_admin') {
            console.error('Ruolo non autorizzato:', finalProfile.role);
            throw new Error('Account non autorizzato');
          }
          
          // Step 3: Verifica password (usando una password hardcoded per il bypass)
          const ADMIN_PASSWORD = 'SuperAdmin2025!'
          if (credentials.password !== ADMIN_PASSWORD) {
            console.error('❌ Password non valida');
            throw new Error('Password non valida');
          }
          
          // Step 4: Login semplificato (bypass password per test)
          console.log('✅ SuperAdmin verificato (nuovo account):', finalProfile);
          
          // Step 5: Crea sessione semplificata
          const sessionData = {
            admin_id: finalProfile.id,
            email: finalProfile.email,
            role: finalProfile.role,
            logged_at: new Date().toISOString()
          };
          
          localStorage.setItem('admin_session', JSON.stringify(sessionData));
          setAdmin({
            id: finalProfile.id,
            email: finalProfile.email,
            name: finalProfile.full_name || 'Super Admin',
            role: 'super_admin',
            status: 'active',
            created_at: finalProfile.created_at || new Date().toISOString()
          });
          
          return { success: true };
        }
        
        if (profile.role !== 'super_admin') {
          console.error('Ruolo non autorizzato:', profile.role);
          throw new Error('Account non autorizzato');
        }
        
        // Step 3: Verifica password (usando una password hardcoded per il bypass)
        const ADMIN_PASSWORD = 'SuperAdmin2025!'
        if (credentials.password !== ADMIN_PASSWORD) {
          console.error('❌ Password non valida');
          throw new Error('Password non valida');
        }
        
        // Step 4: Login semplificato (bypass password per test)
        console.log('✅ SuperAdmin verificato:', profile);
        
        // Step 5: Crea sessione semplificata
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
        
        // Step 6: Log audit (opzionale, può fallire)
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
        
        // EMERGENCY BYPASS - Solo per test
        console.log('🚨 ATTIVAZIONE EMERGENCY BYPASS');
        
        // BYPASS temporaneo - Login senza database
        if (credentials.email === 'mattiasilvester@gmail.com' && 
            credentials.password === 'SuperAdmin2025!' &&
            credentials.secretKey === ADMIN_SECRET) {
          
          console.log('🔓 BYPASS LOGIN - Accesso diretto');
          
          const HARDCODED_ADMIN = {
            id: 'admin-bypass-001',
            email: 'mattiasilvester@gmail.com',
            role: 'super_admin',
            full_name: 'Super Admin'
          };
          
          const adminSession = {
            admin_id: HARDCODED_ADMIN.id,
            email: HARDCODED_ADMIN.email,
            role: HARDCODED_ADMIN.role,
            logged_at: new Date().toISOString()
          };
          
          localStorage.setItem('admin_session', JSON.stringify(adminSession));
          setAdmin({
            id: HARDCODED_ADMIN.id,
            email: HARDCODED_ADMIN.email,
            name: HARDCODED_ADMIN.full_name,
            role: 'super_admin',
            status: 'active',
            created_at: new Date().toISOString()
          });
          
          console.log('✅ EMERGENCY BYPASS ACTIVATED');
          return { success: true };
        }
        
        throw error;
      }
      
    } catch (error: any) {
      console.error('❌ Login fallito:', error);
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
