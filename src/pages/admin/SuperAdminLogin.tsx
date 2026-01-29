import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthBypass as useAdminAuth } from '@/hooks/useAdminAuthBypass'
import { toast } from 'sonner'
import { AdminCredentials } from '@/types/admin.types'

// SuperAdmin Login Page Loaded

export default function SuperAdminLogin() {
  const [credentials, setCredentials] = useState<AdminCredentials>({ 
    email: '', 
    password: '', 
    secretKey: '' 
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAdminAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(credentials)
      toast.success('Accesso autorizzato')
      navigate('/nexus-prime-control/dashboard')
    } catch (error: unknown) {
      console.error('Admin login error:', error)
      toast.error((error as Error)?.message || 'Accesso negato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg w-96 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nexus Control</h1>
          <p className="text-gray-400">Super Admin Access</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Secret Key"
              value={credentials.secretKey}
              onChange={(e) => setCredentials({...credentials, secretKey: e.target.value})}
              className="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verificando...' : 'Accedi'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Accesso riservato a Super Admin autorizzati
          </p>
        </div>
      </div>
    </div>
  )
}
