import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@pp/shared'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) throw error

      // Success
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      
      // Gestione errori user-friendly
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          setError('Email già registrata. Prova ad accedere.')
        } else if (error.message.includes('password')) {
          setError('La password deve essere di almeno 6 caratteri.')
        } else if (error.message.includes('email')) {
          setError('Email non valida.')
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
            Unisciti a Performance Prime
          </h2>
          <p className="mt-2 text-center text-gray-400">
            Crea il tuo account gratuito
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded border border-red-500/20">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none transition-colors"
                placeholder="Nome"
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none transition-colors"
                placeholder="Cognome"
                disabled={loading}
              />
            </div>
          </div>
          
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
            {loading ? 'Registrazione...' : 'Registrati Gratis'}
          </button>
        </form>
        
        <p className="text-center text-gray-400">
          Hai già un account?{' '}
          <Link to="/auth/login" className="text-yellow-500 hover:underline">
            Accedi
          </Link>
        </p>
        
        <Link to="/" className="block text-center text-gray-500 hover:text-gray-400">
          ← Torna alla home
        </Link>
      </div>
    </div>
  )
}
