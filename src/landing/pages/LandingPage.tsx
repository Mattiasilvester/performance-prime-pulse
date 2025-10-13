import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/Hero/HeroSection';
import FeaturesSection from '../components/Features/FeaturesSection';
import CTASection from '../components/CTA/CTASection';
import Footer from '../components/Footer/Footer';
import '../styles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  // FIX SCROLL - Forza scroll abilitato
  useEffect(() => {
    // Rimuovi eventuali restrizioni di scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    
    // Rimuovi classe admin-panel se presente
    document.body.classList.remove('admin-panel');
    document.documentElement.classList.remove('admin-panel');
    
    // Forza scroll su tutti i container principali
    const containers = document.querySelectorAll('.landing-page, .hero-section, .features-section, .cta-section, .footer');
    containers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.style.overflow = 'visible';
        container.style.height = 'auto';
      }
    });

    // NUCLEAR OPTION - Rimuovi TUTTI gli overflow hidden
    document.querySelectorAll('*').forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      if (computedStyle.overflow === 'hidden') {
        (el as HTMLElement).style.overflow = 'visible';
      }
    });

    console.log('Landing page scroll fix applied - version:', new Date().toISOString());
  }, []);

  const handleCTAClick = () => {
    // Vai alla pagina di autenticazione
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      {/* Banner Beta - SOLO nella landing */}
      <div className="w-full bg-[#EEBA2B] text-black text-center py-3 font-semibold">
        <div className="container mx-auto px-4">
          🚀 BETA GRATUITA - Accesso Early Adopters • Limitato fino a Febbraio 2026
        </div>
      </div>
      
      {/* Hero Section */}
      <HeroSection onCTAClick={handleCTAClick} />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Call to Action Section */}
      <CTASection onCTAClick={handleCTAClick} />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage; 