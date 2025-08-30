import React, { useState } from 'react';
import QRCodeComponent from '../components/QRCode';

const Landing = () => {
  const [showDetailed, setShowDetailed] = useState(false);

  const showDetailedInfo = () => {
    setShowDetailed(true);
    setTimeout(() => {
      document.getElementById('detailed-info')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const backToHero = () => {
    setShowDetailed(false);
    setTimeout(() => {
      document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const goToApp = () => {
    window.location.href = 'https://performance-prime-pulse.lovable.app/auth';
  };

  const submitWaitingList = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const motivation = (formData.get('motivation') as string) || '';
    
    alert(`Grazie ${name}! Ti abbiamo aggiunto alla waiting list. Ti contatteremo a ${email}.`);
    event.currentTarget.reset();
  };

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#000',
      color: '#fff',
      lineHeight: '1.6',
      margin: 0,
      padding: 0
    }}>
      {/* Hero Section */}
      {!showDetailed && (
        <section id="hero-section" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
          padding: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              marginBottom: '1.5rem'
            }}>
              Oltre ogni <span style={{ color: '#EEBA2B' }}>limite</span>
            </h1>
            <p style={{
              fontSize: 'clamp(1.2rem, 3vw, 2rem)',
              marginBottom: '2rem',
              color: '#ccc'
            }}>
              L'app che trasforma i tuoi dati in performance straordinarie
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={showDetailedInfo}
                style={{
                  background: '#EEBA2B',
                  color: '#000',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Scopri Performance Prime
              </button>
              <button 
                onClick={goToApp}
                style={{
                  background: 'transparent',
                  color: '#EEBA2B',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  border: '2px solid #EEBA2B',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Accedi
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Info Section */}
      {showDetailed && (
        <div id="detailed-info">
          {/* 1. Hero Fondatori */}
          <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '2rem',
                color: '#EEBA2B'
              }}>
                Creato da chi si allena davvero
              </h2>
              <p style={{
                fontSize: '1.3rem',
                textAlign: 'center',
                marginBottom: '4rem',
                color: '#ccc',
                maxWidth: '800px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Siamo due ragazzi italiani, atleti e appassionati di performance, tecnologia e risultati concreti. 
                Abbiamo costruito Performance Prime per chi si allena con serietà e vuole una guida evoluta.
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                marginTop: '3rem'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  border: '2px solid #EEBA2B',
                  borderRadius: '20px'
                }}>
                  <img 
                    src="/lovable-uploads/52bb3c82-1dba-4fc5-8b49-8d68a33b60da.png" 
                    alt="Mattia Silvestrelli" 
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '1.5rem',
                      border: '3px solid #EEBA2B'
                    }}
                  />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#EEBA2B' }}>
                    Mattia Silvestrelli
                  </h3>
                  <p style={{ color: '#ccc', fontSize: '1.1rem' }}>
                    Velocista della Nazionale Italiana, imprenditore, atleta e trainer.
                  </p>
                </div>
                
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  border: '2px solid #EEBA2B',
                  borderRadius: '20px'
                }}>
                  <img 
                    src="/lovable-uploads/7650d1e1-ca82-4075-b952-116b0bbb5cab.png" 
                    alt="Nicholas Capponi" 
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '1.5rem',
                      border: '3px solid #EEBA2B'
                    }}
                  />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#EEBA2B' }}>
                    Nicholas Capponi
                  </h3>
                  <p style={{ color: '#ccc', fontSize: '1.1rem' }}>
                    Esperto di fitness, tecnologia e routine efficaci. Mente dietro l'AI Coach.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Cosa puoi fare */}
          <section style={{ padding: '5rem 0', background: '#000' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '3rem',
                color: '#EEBA2B'
              }}>
                Tutto in un'unica app
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {[
                  { icon: '⚡', text: 'Crea un piano con AI o coach reali' },
                  { icon: '🧠', text: 'Traccia progressi, obiettivi e metriche' },
                  { icon: '🕒', text: 'Timer, cronologia e note allenamento' },
                  { icon: '📍', text: 'Trova palestre e professionisti vicino a te' },
                  { icon: '🏋️', text: 'Community: unisciti o crea il tuo gruppo' },
                  { icon: '📊', text: 'Analisi avanzata dei tuoi risultati' }
                ].map((feature, index) => (
                  <div key={index} style={{
                    textAlign: 'center',
                    padding: '2rem',
                    border: '1px solid #333',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{feature.text}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Per chi è pensata */}
          <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '3rem',
                color: '#EEBA2B'
              }}>
                È l'app perfetta per te se…
              </h2>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {[
                  'Sei un atleta, un amatore o un coach',
                  'Ti alleni costantemente e vuoi un boost',
                  'Usi già mille app e vuoi una sola definitiva',
                  'Vuoi una guida su misura, seria e professionale'
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 0',
                    fontSize: '1.3rem',
                    borderBottom: index < 3 ? '1px solid #333' : 'none'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Screenshot/Demo */}
          <section style={{ padding: '5rem 0', background: '#000' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '3rem',
                color: '#EEBA2B'
              }}>
                Dai un'occhiata all'interno
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem'
              }}>
                {[
                  { title: 'Piani AI', desc: 'Algoritmi avanzati creano il tuo piano perfetto' },
                  { title: 'Calendario e Timer', desc: 'Organizza e cronometra ogni allenamento' },
                  { title: 'Cronologia Workout', desc: 'Traccia ogni progresso nel tempo' },
                  { title: 'Community', desc: 'Connettiti con atleti come te' }
                ].map((item, index) => (
                  <div key={index} style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #333'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #1a1a1a, #333)',
                      padding: '3rem 1.5rem',
                      textAlign: 'center',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <h4 style={{ color: '#EEBA2B', fontSize: '1.3rem', marginBottom: '1rem' }}>
                        {item.title}
                      </h4>
                      <p style={{ color: '#ccc' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Waiting List */}
          <section style={{
            padding: '5rem 0',
            background: 'linear-gradient(135deg, #EEBA2B 0%, #f3cf67 100%)',
            color: '#000'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                🧲 Unisciti all'esclusiva waiting list
              </h2>
              <p style={{
                fontSize: '1.3rem',
                textAlign: 'center',
                marginBottom: '3rem',
                maxWidth: '800px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Vuoi essere tra i primi ad accedere alla versione completa di Performance Prime? Stiamo selezionando utenti motivati e pronti a cambiare il proprio modo di allenarsi.
              </p>
              
              <form onSubmit={submitWaitingList} style={{ maxWidth: '500px', margin: '0 auto' }}>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Nome" 
                  required 
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email" 
                  required 
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <textarea 
                  name="motivation"
                  placeholder="Cosa ti motiva? (opzionale)" 
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <span style={{ fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center' }}>
                    Solo chi si allena sul serio. I posti sono limitati.
                  </span>
                  <button type="submit" style={{
                    background: '#000',
                    color: '#fff',
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    Uniscimi alla lista d'attesa
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* 6. CTA Finale con QR */}
          <section style={{ padding: '5rem 0', background: '#000' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                textAlign: 'center',
                marginBottom: '3rem',
                color: '#EEBA2B'
              }}>
                Provala ora gratuitamente
              </h2>
              <div style={{
                display: 'flex',
                gap: '3rem',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <QRCodeComponent 
                  url={`${window.location.origin}/auth`}
                  size={200}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <button 
                      onClick={goToApp}
                      style={{
                        background: '#EEBA2B',
                        color: '#000',
                        padding: '1rem 2rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Scansiona e inizia ora
                    </button>
                    <button 
                      onClick={goToApp}
                      style={{
                        background: 'transparent',
                        color: '#EEBA2B',
                        padding: '1rem 2rem',
                        border: '2px solid #EEBA2B',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Accedi
                    </button>
                  </div>
                  <p style={{ color: '#ccc', fontStyle: 'italic', maxWidth: '300px' }}>
                    Scarica la beta gratuita: il tuo feedback ci aiuterà a costruire la versione definitiva.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer style={{
            padding: '3rem 0',
            background: '#1a1a1a',
            textAlign: 'center',
            borderTop: '1px solid #333'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
              <p style={{ fontSize: '1.3rem', color: '#EEBA2B', marginBottom: '1rem' }}>
                📧 performanceprime0@gmail.com
              </p>
              <p style={{ color: '#ccc', marginBottom: '2rem' }}>
                Hai domande? Scrivici, ti risponderemo noi direttamente.
              </p>
              <button 
                onClick={backToHero}
                style={{
                  background: 'transparent',
                  color: '#EEBA2B',
                  border: '2px solid #EEBA2B',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ← Torna all'inizio
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Landing;