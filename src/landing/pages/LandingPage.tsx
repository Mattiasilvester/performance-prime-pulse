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
      {/* Hero Section */}
      <HeroSection onCTAClick={handleCTAClick} />
      
      {/* Features Section */}
      <FeaturesSection onCTAClick={handleCTAClick} />
      
      {/* Call to Action Section */}
      <CTASection onCTAClick={handleCTAClick} />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage; 