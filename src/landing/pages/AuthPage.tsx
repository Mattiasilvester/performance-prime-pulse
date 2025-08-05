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
      {/* Background Animation */}
      <div className="auth-background">
        <div className="auth-shapes">
          <div className="auth-shape auth-shape-1"></div>
          <div className="auth-shape auth-shape-2"></div>
        </div>
      </div>
      
      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-logo">DD</div>
          <h1 className="auth-brand-title">Performance Prime</h1>
        </div>
        
        <div className="auth-header">
          <h2 className="auth-title">
            {mode === 'login' ? 'Bentornato!' : 'Crea il tuo account'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Accedi alla tua dashboard personalizzata' 
              : 'Inizia il tuo percorso verso la performance'
            }
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div className="auth-toggle">
          <button
            className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            <span className="toggle-icon">🔐</span>
            <span>Accedi</span>
          </button>
          <button
            className={`toggle-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            <span className="toggle-icon">🚀</span>
            <span>Registrati</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Nome"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Cognome"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </>
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="form-input"
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="form-input"
          />
          
          {mode === 'register' && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Conferma Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          )}
          
          <button 
            type="submit" 
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Caricamento...</span>
              </>
            ) : (
              <>
                <span className="submit-icon">
                  {mode === 'login' ? '🔐' : '🚀'}
                </span>
                <span>{mode === 'login' ? 'Accedi' : 'Registrati'}</span>
              </>
            )}
          </button>
        </form>

        {/* Auth Footer */}
        <div className="auth-footer">
          <button 
            onClick={() => navigate('/')} 
            className="back-button"
          >
            ← Torna alla landing page
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 