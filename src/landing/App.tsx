import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './styles/landing.css';

function LandingApp() {
  console.log('🚀 Landing App loaded!');
  
  return (
    <BrowserRouter>
      <div className="landing-app">
        <Routes>
          {/* Homepage - Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Autenticazione */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          
          {/* Pagine legali */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default LandingApp; 