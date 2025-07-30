import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeComponent from '../components/QRCode';
import { config, isDevelopment } from '../../shared/config/environments';

interface LandingProps {
  devMode?: boolean;
}

const Landing: React.FC<LandingProps> = ({ devMode = false }) => {
  const navigate = useNavigate();
  const [showDetailed, setShowDetailed] = useState(false);

  const showDetailedInfo = () => {
    setShowDetailed(true);
  };

  const backToHero = () => {
    setShowDetailed(false);
  };

  const goToApp = () => {
    if (devMode) {
      console.log('🛠️ Dev Mode: Navigating to dashboard');
      navigate('/dev/dashboard');
      return;
    }

    // Determina l'URL corretto in base all'hostname
    let mvpUrl;
    
    if (window.location.hostname === 'performanceprime.it') {
      // Se siamo sulla landing page di produzione, punta all'MVP su Lovable
      mvpUrl = 'https://performance-prime-pulse.lovable.app/auth';
      console.log(`🌐 Rilevato performanceprime.it - Punto all'MVP Lovable`);
    } else if (window.location.hostname === 'performance-prime-pulse.lovable.app') {
      // Se siamo già sull'MVP, vai direttamente al login
      mvpUrl = '/auth';
      console.log(`🌐 Rilevato performance-prime-pulse.lovable.app - Vai al login`);
    } else {
      // Altrimenti usa la configurazione normale
      mvpUrl = config.MVP_URL;
    }
    
    console.log(`🚀 Ambiente: ${isDevelopment ? 'Sviluppo' : 'Produzione'}`);
    console.log(`📱 Aprendo MVP Login: ${mvpUrl}`);
    console.log(`🎯 Destinazione: Pagina di Login dell'MVP`);
    console.log(`🔧 Hostname corrente: ${window.location.hostname}`);
    console.log(`🔍 DEBUG - Bottone "Scansiona e inizia ora" cliccato!`);
    console.log(`🌐 URL di destinazione: ${mvpUrl}`);
    console.log(`🖥️ Ambiente corrente: ${window.location.hostname}`);
    console.log(`📱 Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Se l'URL è relativo, usa navigate invece di window.open
      if (mvpUrl.startsWith('/')) {
        console.log('🔄 Navigazione interna a:', mvpUrl);
        navigate(mvpUrl);
        return;
      }
      
      const newWindow = window.open(mvpUrl, '_blank');
      if (newWindow) {
        console.log('✅ Finestra MVP Login aperta con successo');
        
        // Debug avanzato: controlla dopo 2 secondi se la finestra è sulla URL corretta
        setTimeout(() => {
          try {
            console.log('🔍 Verifica URL finale finestra MVP...');
            if (newWindow.location.href.includes('/auth') || newWindow.location.href.includes('/login')) {
              console.log('✅ MVP Login caricato correttamente');
            } else {
              console.log('⚠️ MVP potrebbe non essere sulla pagina login');
              console.log('🔍 URL finale:', newWindow.location.href);
            }
          } catch (e) {
            console.log('🔒 Cross-origin, ma finestra MVP aperta');
          }
        }, 2000);
      } else {
        console.error('❌ Impossibile aprire la finestra - potrebbe essere bloccata dal popup blocker');
        console.log('🔄 Fallback: naviga nella stessa finestra');
        window.location.href = mvpUrl;
      }
    } catch (error) {
      console.error('❌ Errore durante l\'apertura della finestra:', error);
      console.log('🔄 Fallback: naviga nella stessa finestra');
      window.location.href = mvpUrl;
    }
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
    }} className={devMode ? 'landing-page dev-mode' : 'landing-page'}>
      {devMode && (
        <div className="dev-mode-banner">
          🛠️ MODALITÀ SVILUPPO - Testing & Build
        </div>
      )}
      
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
            {/* Logo e Brand */}
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #EEBA2B 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
                letterSpacing: '-0.02em'
              }}>
                PERFORMANCE PRIME
              </h1>
              <p style={{
                fontSize: '1.5rem',
                color: '#EEBA2B',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Oltre ogni limite
              </p>
              <p style={{
                fontSize: '1.1rem',
                color: '#ccc',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                La tua app di fitness intelligente che ti accompagna verso il successo
              </p>
            </div>

            {/* QR Code e CTA */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2rem',
              marginTop: '3rem'
            }}>
              <div style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(238, 186, 43, 0.3)'
              }}>
                <QRCodeComponent />
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={goToApp}
                  style={{
                    background: 'linear-gradient(135deg, #EEBA2B 0%, #FFD700 100%)',
                    color: '#000',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '50px',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(238, 186, 43, 0.4)',
                    marginBottom: '1rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(238, 186, 43, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(238, 186, 43, 0.4)';
                  }}
                >
                  {devMode ? '🛠️ Vai alla Dashboard' : '🚀 Scansiona e inizia ora'}
                </button>
                
                <div style={{ marginTop: '1rem' }}>
                  <a
                    href={devMode ? '/dev/dashboard' : (window.location.hostname === 'performanceprime.it'
                      ? 'https://performance-prime-pulse.lovable.app/auth'
                      : config.MVP_URL)}
                    target={devMode ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    style={{
                      color: '#EEBA2B',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {devMode ? 'Accesso diretto Dashboard →' : 'Oppure clicca qui per accedere direttamente →'}
                  </a>
                  
                  {!devMode && (
                    <a
                      href={window.location.hostname === 'performanceprime.it'
                        ? 'https://performance-prime-pulse.lovable.app/auth'
                        : config.MVP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#ccc',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '400'
                      }}
                    >
                      🆕 Nuovo utente? Registrati qui →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Info aggiuntive */}
            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>🏋️</div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#EEBA2B',
                  marginBottom: '0.5rem'
                }}>Workout Personalizzati</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#ccc',
                  maxWidth: '200px'
                }}>Allenamenti su misura per i tuoi obiettivi</p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>🤖</div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#EEBA2B',
                  marginBottom: '0.5rem'
                }}>AI Coach</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#ccc',
                  maxWidth: '200px'
                }}>Assistente intelligente per il tuo progresso</p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>📊</div>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#EEBA2B',
                  marginBottom: '0.5rem'
                }}>Tracking Avanzato</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#ccc',
                  maxWidth: '200px'
                }}>Monitora i tuoi progressi in tempo reale</p>
              </div>
            </div>

            {/* CTA per saperne di più */}
            <div style={{
              marginTop: '3rem',
              textAlign: 'center'
            }}>
              <button
                onClick={showDetailedInfo}
                style={{
                  background: 'transparent',
                  color: '#EEBA2B',
                  border: '2px solid #EEBA2B',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#EEBA2B';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#EEBA2B';
                }}
              >
                Scopri di più →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sezione dettagliata */}
      {showDetailed && (
        <section style={{
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Header con back button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '3rem'
            }}>
              <button
                onClick={backToHero}
                style={{
                  background: 'transparent',
                  color: '#EEBA2B',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  marginRight: '1rem'
                }}
              >
                ← Torna alla home
              </button>
              <h2 style={{
                fontSize: '2.5rem',
                color: '#EEBA2B',
                margin: 0
              }}>
                Scopri Performance Prime
              </h2>
            </div>

            {/* Contenuto dettagliato */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem'
            }}>
              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>🏋️ Workout Personalizzati</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Allenamenti su misura creati in base ai tuoi obiettivi, livello di fitness e preferenze. 
                  Ogni sessione è ottimizzata per massimizzare i risultati.
                </p>
              </div>

              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>🤖 AI Coach Intelligente</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Il tuo assistente personale che analizza i tuoi progressi, fornisce consigli personalizzati 
                  e adatta i workout in tempo reale.
                </p>
              </div>

              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>📊 Tracking Avanzato</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Monitora ogni aspetto del tuo fitness: peso, misure, performance, 
                  e visualizza i tuoi progressi con grafici dettagliati.
                </p>
              </div>

              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>⏱️ Timer Intelligente</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Timer personalizzabile per ogni esercizio, con pause automatiche 
                  e suggerimenti vocali per mantenere il ritmo perfetto.
                </p>
              </div>

              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>📅 Pianificazione</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Organizza i tuoi allenamenti, pianifica sessioni con professionisti 
                  e mantieni il controllo del tuo programma fitness.
                </p>
              </div>

              <div style={{
                background: 'rgba(238, 186, 43, 0.1)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(238, 186, 43, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#EEBA2B',
                  marginBottom: '1rem'
                }}>📝 Note e Obiettivi</h3>
                <p style={{
                  color: '#ccc',
                  lineHeight: '1.6'
                }}>
                  Registra i tuoi pensieri, imposta obiettivi specifici e 
                  celebra ogni traguardo raggiunto nel tuo percorso.
                </p>
              </div>
            </div>

            {/* CTA finale */}
            <div style={{
              textAlign: 'center',
              marginTop: '3rem',
              padding: '2rem',
              background: 'rgba(238, 186, 43, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(238, 186, 43, 0.3)'
            }}>
              <h3 style={{
                fontSize: '2rem',
                color: '#EEBA2B',
                marginBottom: '1rem'
              }}>
                Pronto a trasformare il tuo fitness?
              </h3>
              <p style={{
                fontSize: '1.1rem',
                color: '#ccc',
                marginBottom: '2rem'
              }}>
                Unisciti a Performance Prime e inizia il tuo percorso verso il successo
              </p>
              <button
                onClick={goToApp}
                style={{
                  background: 'linear-gradient(135deg, #EEBA2B 0%, #FFD700 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '1.2rem 2.5rem',
                  borderRadius: '50px',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(238, 186, 43, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(238, 186, 43, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(238, 186, 43, 0.4)';
                }}
              >
                Inizia Ora →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        background: '#1a1a1a',
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid #333'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h4 style={{
              color: '#EEBA2B',
              marginBottom: '1rem'
            }}>Performance Prime</h4>
            <p style={{
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              La tua app di fitness intelligente per raggiungere ogni obiettivo
            </p>
          </div>
          
          <div>
            <h4 style={{
              color: '#EEBA2B',
              marginBottom: '1rem'
            }}>Funzionalità</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              <li style={{ marginBottom: '0.5rem' }}>🏋️ Workout Personalizzati</li>
              <li style={{ marginBottom: '0.5rem' }}>🤖 AI Coach</li>
              <li style={{ marginBottom: '0.5rem' }}>📊 Tracking Avanzato</li>
              <li style={{ marginBottom: '0.5rem' }}>⏱️ Timer Intelligente</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{
              color: '#EEBA2B',
              marginBottom: '1rem'
            }}>Supporto</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/privacy-policy" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/terms-of-service" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Termini di Servizio
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #333',
          paddingTop: '1rem',
          color: '#999',
          fontSize: '0.8rem'
        }}>
          © 2024 Performance Prime. Tutti i diritti riservati.
        </div>
      </footer>
    </div>
  );
};

export default Landing;