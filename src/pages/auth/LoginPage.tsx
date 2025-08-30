import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Success
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      
      // Gestione errori user-friendly
      if (error instanceof Error) {
        if (error.message.includes('Invalid login')) {
          setError('Email o password non corretti')
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setError('Problema di connessione. Riprova più tardi.')
        } else if (error.message.includes('rate limit')) {
          setError('Troppi tentativi. Riprova tra qualche minuto.')
        } else {
          setError(error.message)
        }
      } else {
        setError('Si è verificato un errore. Riprova.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-900 rounded-lg">
        <div>
          <h2 className="text-3xl font-bold text-yellow-500 text-center">
            Bentornato in Performance Prime
          </h2>
          <p className="mt-2 text-center text-gray-400">
            Accedi al tuo account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded border border-red-500/20">
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none transition-colors"
              placeholder="Email"
              disabled={loading}
            />
          </div>
          
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none transition-colors"
              placeholder="Password"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        
        <p className="text-center text-gray-400">
          Non hai un account?{' '}
          <Link to="/auth/register" className="text-yellow-500 hover:underline">
            Registrati gratis
          </Link>
        </p>
        
        <Link to="/" className="block text-center text-gray-500 hover:text-gray-400">
          ← Torna alla home
        </Link>
      </div>
    </div>
  )
}
