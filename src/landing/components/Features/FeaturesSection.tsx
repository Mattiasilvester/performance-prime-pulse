import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Crea un piano con AI o coach reali',
      description: 'Piani personalizzati con intelligenza artificiale'
    },
    {
      icon: '🧠',
      title: 'Traccia progressi, obiettivi e metriche',
      description: 'Monitora ogni aspetto della tua performance'
    },
    {
      icon: '⏱️',
      title: 'Timer, cronologia e note allenamento',
      description: 'Tutto quello che serve per il tuo workout'
    },
    {
      icon: '📍',
      title: 'Trova palestre e professionisti vicino a te',
      description: 'Network di esperti a portata di mano'
    },
    {
      icon: '👥',
      title: 'Community: unisciti o crea il tuo gruppo',
      description: 'Allena insieme ad altri appassionati'
    },
    {
      icon: '📊',
      title: 'Analisi avanzata dei tuoi risultati',
      description: 'Insights dettagliati sulle tue performance'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <h2 className="features-title">Tutto in un'unica app</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 