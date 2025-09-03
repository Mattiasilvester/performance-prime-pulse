import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';

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
        // Validazione per registrazione
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

        // Registrazione Supabase
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName
            }
          }
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }


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


      }

      setLoading(false);
      navigate('/dashboard', { replace: true });
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