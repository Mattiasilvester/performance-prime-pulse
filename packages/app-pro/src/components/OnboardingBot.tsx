import React, { useState, useEffect } from 'react';
import { safeLocalStorage } from '@/utils/domHelpers';

interface OnboardingBotProps {
  userName?: string;
  onSendMessage?: (message: string) => void;
  onFocusChat?: () => void;
}

// Stili interni per la card intro PrimeBot
const introCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  backgroundColor: "#d9d9d9", // Sfondo grigio
  borderRadius: "16px",
  padding: "16px",
  gap: "12px",
  width: "100%",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  border: "1px solid #DAA520"
};

const iconStyle = { 
  fontSize: "28px",
  width: "40px",
  height: "40px",
  backgroundColor: "#DAA520",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#000"
};
const textStyle = { fontSize: "16px", color: "#000" };
const buttonsStyle: React.CSSProperties = { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" };
const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "5px 10px",
  cursor: "pointer",
  backgroundColor: "#d4a017",
  color: "white",
  fontWeight: 500,
  transition: "0.2s",
  fontSize: "13px"
};
const buttonHover = { backgroundColor: "#b88710" };

export const OnboardingBot: React.FC<OnboardingBotProps> = ({
  userName = 'Utente',
  onSendMessage,
  onFocusChat
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se l'utente ha già visto l'onboarding
    const checkOnboardingSeen = async () => {
      try {
        // Per ora usa localStorage come fallback
        const onboardingSeen = safeLocalStorage.getItem('pp_onboarding_seen');
        if (!onboardingSeen) {
          setIsVisible(true);
        }
      } catch (error) {
        console.warn('Errore controllo onboarding:', error);
        // Fallback: mostra sempre se c'è errore
        setIsVisible(true);
      }
    };

    checkOnboardingSeen();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full mb-6">
      <div style={introCardStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Avatar e contenuto */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
            <div style={iconStyle}>🤖</div>
            
            <div style={{ flex: 1 }}>
              <div style={{...textStyle, whiteSpace: "pre-wrap"}}>
                <strong>Ciao <span style={{ color: "#DAA520" }}>{userName}</span>! 👋</strong>{'\n\n'}Benvenuto in Performance Prime! Sono il tuo PrimeBot personale e ti guiderò attraverso l'app.{'\n\n'}🎯 COSA PUOI FARE:{'\n'}• 📊 Dashboard - Monitora i tuoi progressi{'\n'}• 💪 Allenamenti - Crea e gestisci workout{'\n'}• 📅 Appuntamenti - Prenota sessioni{'\n'}• 🤖 PrimeBot - Chiedi consigli personalizzati{'\n'}• 👤 Profilo - Gestisci il tuo account{'\n\n'}Vuoi che ti spieghi una sezione specifica o hai domande?
              </div>
              <div style={buttonsStyle}>
                <button 
                  style={buttonStyle} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHover.backgroundColor}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  onClick={() => {
                    alert(`Benvenuto in Performance Prime! 🚀
Questa è la tua app per organizzare e monitorare i tuoi allenamenti, tenere traccia dei progressi e ricevere consigli personalizzati da PrimeBot.

Con Performance Prime puoi:
• Creare allenamenti personalizzati 📅
• Monitorare peso, forza e cardio 📊
• Ricevere piani e consigli su misura 🤖

Vuoi un tour veloce?
- Allenamenti: pianifica e salva le tue sessioni
- PrimeBot: chiedi consigli, motivazione o supporto tecnico
- Calendario: gestisci le giornate di allenamento

Inizia subito e raggiungi i tuoi obiettivi! 💪`);
                    onSendMessage?.('Guida rapida');
                  }}>
                  📖 Guida rapida
                </button>

                <button 
                  style={buttonStyle} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHover.backgroundColor}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  onClick={() => {
                    alert(`Iniziare è semplice! 🏋️‍♂️
1️⃣ Vai nella sezione Allenamenti.
2️⃣ Clicca su "Crea allenamento di oggi".
3️⃣ Scegli il giorno sul calendario.
4️⃣ Aggiungi esercizi, ripetizioni e tempi di recupero.

Suggerimento: pianifica in anticipo le tue sessioni per restare costante e motivato.`);
                    onSendMessage?.('Come iniziare gli allenamenti');
                  }}>
                  🏋️‍♂️ Come iniziare gli allenamenti
                </button>

                <button 
                  style={buttonStyle} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHover.backgroundColor}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  onClick={() => {
                    onFocusChat?.();
                    setIsVisible(false);
                    safeLocalStorage.setItem('pp_onboarding_seen', 'true');
                  }}>
                  💬 Parla con PrimeBot
                </button>
              </div>
            </div>
          </div>
          
          {/* Pulsante chiudi */}
          <button
            onClick={() => {
              setIsVisible(false);
              safeLocalStorage.setItem('pp_onboarding_seen', 'true');
            }}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#fff",
              fontSize: "16px",
              padding: "4px",
              marginLeft: "12px"
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
