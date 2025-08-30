import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Import componenti
import LandingPage from '@/landing/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check sessione attuale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen per cambi auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* ROUTE PUBBLICHE */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={
            session ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/auth/register" element={
            session ? <Navigate to="/dashboard" /> : <RegisterPage />
          } />
          
          {/* ROUTE PROTETTE */}
          <Route path="/dashboard" element={
            <ProtectedRoute session={session}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
