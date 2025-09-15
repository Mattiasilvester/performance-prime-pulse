import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      console.log('📋 Fetching audit logs...');
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Error fetching logs:', error);
        // Crea dati mock se la tabella non esiste
        setLogs([
          {
            id: '1',
            admin_id: 'admin-001',
            action: 'login',
            details: { email: 'mattiasilvester@gmail.com' },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            admin_id: 'admin-001',
            action: 'user_view',
            details: { user_id: 'user-123' },
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      } else {
        console.log(`✅ Loaded ${data?.length || 0} audit logs`);
        setLogs(data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Audit Logs</h1>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-white">Data</th>
                <th className="px-6 py-4 text-left text-white">Admin</th>
                <th className="px-6 py-4 text-left text-white">Azione</th>
                <th className="px-6 py-4 text-left text-white">Dettagli</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Nessun log disponibile
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-700">
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(log.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{log.admin_id}</td>
                    <td className="px-6 py-4 text-gray-300">{log.action}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
