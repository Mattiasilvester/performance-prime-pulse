import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/Hero/HeroSection';
import FeaturesSection from '../components/Features/FeaturesSection';
import CTASection from '../components/CTA/CTASection';
import Footer from '../components/Footer/Footer';
import '../styles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleCTAClick = () => {
    // Vai alla pagina di autenticazione
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      {/* Banner Beta - SOLO nella landing */}
      <div className="w-full bg-[#EEBA2B] text-black text-center py-3 font-semibold">
        <div className="container mx-auto px-4">
          🚀 BETA GRATUITA - Accesso Early Adopters • Limitato fino a Novembre 2025
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