import React from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface FeaturesSectionProps {
  onCTAClick?: () => void;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onCTAClick }) => {
  const featuresRef = useScrollAnimation();
  
  const features = [
    {
      icon: '⚡',
      title: 'Crea un piano con AI o coach reali',
      description: 'Piani personalizzati con intelligenza artificiale',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)'
    },
    {
      icon: '🧠',
      title: 'Traccia progressi, obiettivi e metriche',
      description: 'Monitora ogni aspetto della tua performance',
      gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)'
    },
    {
      icon: '⏱️',
      title: 'Timer, cronologia e note allenamento',
      description: 'Tutto quello che serve per il tuo workout',
      gradient: 'linear-gradient(135deg, #A8E6CF, #7FCDCD)'
    },
    {
      icon: '📍',
      title: 'Trova palestre e professionisti vicino a te',
      description: 'Network di esperti a portata di mano',
      gradient: 'linear-gradient(135deg, #FFD93D, #FF6B6B)'
    },
    {
      icon: '👥',
      title: 'Community: unisciti o crea il tuo gruppo',
      description: 'Allena insieme ad altri appassionati',
      gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)'
    },
    {
      icon: '📊',
      title: 'Analisi avanzata dei tuoi risultati',
      description: 'Insights dettagliati sulle tue performance',
      gradient: 'linear-gradient(135deg, #FD79A8, #FDCB6E)'
    }
  ];

  return (
    <section className="features-section" style={{ backgroundColor: '#1a1a1a' }} ref={featuresRef}>
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">
            <span className="title-prefix">Tutto in un'unica</span>
            <span className="title-main">app</span>
          </h2>
          <p className="features-subtitle">
            Scopri come Performance Prime trasforma il tuo allenamento in risultati straordinari
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card animate-on-scroll"
              style={{ '--card-delay': `${index * 0.1}s` } as React.CSSProperties}
            >
              <div className="feature-icon-container" style={{ background: feature.gradient }}>
                <span className="feature-icon">{feature.icon}</span>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
          
          {/* Nuova card allenamenti */}
          <div 
            className="feature-card animate-on-scroll"
            style={{ '--card-delay': '0.7s' } as React.CSSProperties}
          >
            <div className="feature-icon-container" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' }}>
              <span className="feature-icon">🏋️‍♂️</span>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Scegli il tuo tipo di allenamento</h3>
              <p className="feature-description">Ibrido, Forze speciali, Militari, Pesistica e molto altro...</p>
            </div>
            <div className="feature-hover-effect"></div>
          </div>
        </div>
        
        <div className="features-cta">
          <p className="features-cta-text">
            Pronto a trasformare la tua performance?
          </p>
          <div className="features-cta-buttons">
            <button 
              className="cta-button secondary"
              onClick={onCTAClick}
            >
              🚀 Inizia Ora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 