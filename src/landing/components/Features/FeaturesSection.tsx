import React from 'react';
import { supabase } from '../../../integrations/supabase/client';

interface FeaturesSectionProps {
  onCTAClick?: () => void;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onCTAClick }) => {
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
    <section className="features-section">
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
              className="feature-card"
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
        
        {/* Waiting List Section */}
        <div className="waiting-list-section">
          <h3 className="waiting-list-title">Iscriviti alla Waiting List</h3>
          <p className="waiting-list-description">
            Sii tra i primi a provare Performance Prime quando sarà disponibile
          </p>
          <form className="waiting-list-form" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            
            try {
              // Salva email nella waiting list di Supabase
              const { data, error } = await supabase
                .from('waiting_list')
                .insert([
                  {
                    email: email,
                    status: 'pending',
                    source: 'landing_page',
                    notes: `Iscrizione automatica dalla landing page - ${new Date().toLocaleString('it-IT')}`
                  }
                ])
                .select();
              
              if (error) {
                console.error('Errore salvataggio email:', error);
                alert('Errore nell\'iscrizione. Riprova più tardi.');
                return;
              }
              
              console.log('Email salvata con successo:', data);
              alert(`Grazie! Ti abbiamo aggiunto alla waiting list. Ti contatteremo a ${email}.`);
              
              // Reset sicuro del form
              if (e.currentTarget) {
                e.currentTarget.reset();
              }
            } catch (error) {
              console.error('Errore salvataggio email:', error);
              alert('Errore nell\'iscrizione. Riprova più tardi.');
            }
          }}>
            <div className="waiting-list-input-group">
              <input 
                type="email" 
                name="email" 
                placeholder="La tua email" 
                required
                className="waiting-list-input"
              />
              <button type="submit" className="waiting-list-button">
                Iscriviti
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 