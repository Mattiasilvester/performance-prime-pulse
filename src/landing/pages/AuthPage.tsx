import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Controlla se utente già autenticato
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!supabase) {
        console.warn('Supabase not available, skipping session check');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Utente già loggato → Vai all'MVP Dashboard
        redirectToMVPDashboard();
      }
    };
    checkExistingSession();
  }, []);

  const redirectToMVPDashboard = () => {
    // IMPORTANTE: Redirect alla dashboard MVP deployata, NON quella in sviluppo
    const mvpDashboardUrl = 'https://performanceprime.it/app';
    console.log('✅ Login successful, redirecting to MVP Dashboard:', mvpDashboardUrl);
    window.location.href = mvpDashboardUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // MOCK AUTH PER TEST UI - TEMPORANEO
    console.log('🔄 Mock auth per test UI');
    
    // Simula validazione
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError('Le password non coincidono');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('La password deve essere di almeno 6 caratteri');
        setLoading(false);
        return;
      }
    }

    // Simula login/registrazione riuscita
    setTimeout(() => {
      console.log('✅ Mock auth successful');
      redirectToMVPDashboard();
    }, 1000);

    // CODICE SUPABASE ORIGINALE (COMMENTATO)
    /*
    if (!supabase) {
      setError('Servizio di autenticazione non disponibile');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        // Validazione registrazione
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Le password non coincidono');
        }
        if (formData.password.length < 6) {
          throw new Error('La password deve essere di almeno 6 caratteri');
        }

        // Registrazione
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          console.log('✅ Registration successful');
          redirectToMVPDashboard();
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          console.log('✅ Login successful');
          redirectToMVPDashboard();
        }
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
    */
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Performance Prime</h1>
          <p>{mode === 'login' ? 'Accedi al tuo account' : 'Crea il tuo account'}</p>
        </div>

        {/* Toggle Login/Register */}
        <div className="auth-toggle">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Accedi
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Registrati
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="Nome"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Cognome"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {mode === 'register' && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Conferma Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Caricamento...' : (mode === 'login' ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        {/* Back to Landing */}
        <div className="auth-footer">
          <button onClick={() => navigate('/')} className="back-button">
            ← Torna alla home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 