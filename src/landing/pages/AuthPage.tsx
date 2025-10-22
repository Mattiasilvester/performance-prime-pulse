import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Controlla se utente già autenticato
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        // Errore controllo sessione
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // Reindirizza alla pagina di registrazione principale
        setLoading(false);
        navigate('/auth/register', { replace: true });
        return;
      } else {
        // Login Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setLoading(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'autenticazione');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Social Login Handlers
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      setError('Errore durante il login con Google');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      setError('Errore durante il login con Apple');
      setLoading(false);
    }
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
          {/* Indicatore giallo che si muove */}
          <div 
            className="toggle-indicator"
            style={{
              transform: `translateX(${mode === 'login' ? '0px' : '50%'})`
            }}
          ></div>
          
          <button
            className="toggle-btn"
            onClick={() => setMode('login')}
          >
            <span className="toggle-icon">🔐</span>
            <span>Accedi</span>
          </button>
          <button
            className="toggle-btn"
            onClick={() => setMode('register')}
          >
            <span className="toggle-icon">🚀</span>
            <span>Registrati</span>
          </button>
        </div>

        {/* Social Login */}
        <div style={{ margin: '24px 0' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '20px 0',
            color: '#9CA3AF',
            fontSize: '14px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #374151, transparent)' }}></div>
            <span style={{ padding: '0 16px', background: '#1F2937' }}>oppure</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #374151, transparent)' }}></div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: '1px solid #374151',
                borderRadius: '8px',
                background: '#1F2937',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.borderColor = '#4285F4';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1F2937';
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </button>
            
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: '1px solid #374151',
                borderRadius: '8px',
                background: '#1F2937',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.borderColor = '#007AFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1F2937';
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continua con Apple
            </button>
          </div>
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
