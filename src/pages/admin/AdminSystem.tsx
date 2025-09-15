import { Server, Database, Shield, Zap } from 'lucide-react';

export default function AdminSystem() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl">
          <Server className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Server Status</h3>
          <p className="text-green-400">● Online</p>
          <p className="text-gray-400 mt-2">Uptime: 99.9%</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <Database className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Database</h3>
          <p className="text-green-400">● Connesso</p>
          <p className="text-gray-400 mt-2">PostgreSQL 15.1</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <Shield className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sicurezza</h3>
          <p className="text-green-400">● Attiva</p>
          <p className="text-gray-400 mt-2">RLS Enabled</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <Zap className="w-8 h-8 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Performance</h3>
          <p className="text-green-400">● Ottimale</p>
          <p className="text-gray-400 mt-2">Latenza: 45ms</p>
        </div>
      </div>
    </div>
  );
}
