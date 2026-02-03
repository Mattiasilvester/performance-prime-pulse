import { useEffect, useState } from 'react';
import { supabase } from '@pp/shared';

export default function TestConnection() {
  const [status, setStatus] = useState<Record<string, unknown>>({});
  
  useEffect(() => {
    async function test() {
      console.log('🧪 Test Connessione Database...');
      
      try {
        // Test 1: Connessione base
        console.log('Test 1: Connessione base...');
        const { data: test1, error: error1 } = await supabase.from('profiles').select('count').limit(1);
        
        // Test 2: Cerca super_admin
        console.log('Test 2: Cerco super_admin...');
        const { data: test2, error: error2 } = await supabase
          .from('profiles')
          .select('email, role')
          .eq('role', 'super_admin');
        
        // Test 3: Cerca tutti i profili
        console.log('Test 3: Cerco tutti i profili...');
        const { data: test3, error: error3 } = await supabase
          .from('profiles')
          .select('email, role')
          .limit(5);
        
        // Test 4: Cerca email specifica
        console.log('Test 4: Cerco email specifica...');
        const { data: test4, error: error4 } = await supabase
          .from('profiles')
          .select('email, role')
          .eq('email', 'mattiasilvester@gmail.com');
        
        setStatus({ 
          connection: test1 ? '✅' : '❌',
          connectionError: error1?.message,
          superAdmins: test2,
          superAdminsError: error2?.message,
          allProfiles: test3,
          allProfilesError: error3?.message,
          specificEmail: test4,
          specificEmailError: error4?.message,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Test completato:', status);
      } catch (error) {
        console.error('❌ Errore durante test:', error);
        setStatus({ 
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
          timestamp: new Date().toISOString()
        });
      }
    }
    test();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Connessione Database</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Risultati Test</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
        
        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Credenziali Test</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> mattiasilvester@gmail.com</p>
            <p><strong>Password:</strong> SuperAdmin2025!</p>
            <p><strong>Secret Key:</strong> PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME</p>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Variabili Ambiente</h2>
          <div className="space-y-2 text-sm">
            <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</p>
            <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
            <p><strong>VITE_ADMIN_SECRET_KEY:</strong> ❌ (rimossa per sicurezza - validazione tramite Edge Function)</p>
            <p><strong>VITE_ADMIN_EMAIL:</strong> {import.meta.env.VITE_ADMIN_EMAIL || 'Non impostata'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
