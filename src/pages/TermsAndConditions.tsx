import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-6 -mt-2 -ml-2">
          <button
            onClick={handleBack}
            className="flex items-center text-pp-gold hover:bg-pp-gold/10 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
        </div>

        <div className="bg-black border-2 border-pp-gold rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-pp-gold mb-6">Termini e Condizioni</h1>
          
          <div className="space-y-6 text-white">
            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">1. Accettazione dei Termini</h2>
              <p className="text-gray-300 leading-relaxed">
                Utilizzando l'applicazione Performance Prime Pulse, accetti di essere vincolato da questi Termini e Condizioni. 
                Se non accetti questi termini, non utilizzare l'applicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">2. Descrizione del Servizio</h2>
              <p className="text-gray-300 leading-relaxed">
                Performance Prime Pulse è un'applicazione per il fitness e il benessere che offre:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Tracking degli allenamenti e progressi</li>
                <li>Pianificazione di workout personalizzati</li>
                <li>Assistenza AI per il coaching</li>
                <li>Gestione di appuntamenti con professionisti</li>
                <li>Note personali e obiettivi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">3. Account Utente</h2>
              <p className="text-gray-300 leading-relaxed">
                Per utilizzare l'applicazione, devi creare un account. Sei responsabile di:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Mantenere la sicurezza delle tue credenziali</li>
                <li>Non condividere il tuo account con altri</li>
                <li>Fornire informazioni accurate e aggiornate</li>
                <li>Notificare immediatamente eventuali usi non autorizzati</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">4. Uso Accettabile</h2>
              <p className="text-gray-300 leading-relaxed">
                Ti impegni a utilizzare l'applicazione solo per scopi legittimi e in conformità con questi termini. 
                È vietato:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Utilizzare l'app per attività illegali</li>
                <li>Violare diritti di proprietà intellettuale</li>
                <li>Interferire con il funzionamento dell'app</li>
                <li>Raccogliere dati di altri utenti senza autorizzazione</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">5. Privacy e Dati</h2>
              <p className="text-gray-300 leading-relaxed">
                La raccolta e l'utilizzo dei tuoi dati personali sono regolati dalla nostra 
                <span 
                  className="text-pp-gold cursor-pointer hover:underline"
                  onClick={() => navigate('/privacy-policy')}
                >
                  {" "}Informativa sulla Privacy
                </span>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">6. Limitazioni di Responsabilità</h2>
              <p className="text-gray-300 leading-relaxed">
                Performance Prime Pulse non si assume responsabilità per:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Lesioni personali durante l'utilizzo dei consigli dell'app</li>
                <li>Perdita di dati o interruzioni del servizio</li>
                <li>Danni indiretti o consequenziali</li>
                <li>Azioni di terze parti o professionisti esterni</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">7. Modifiche ai Termini</h2>
              <p className="text-gray-300 leading-relaxed">
                Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
                Le modifiche saranno comunicate tramite l'applicazione o email. 
                L'uso continuato dell'app dopo le modifiche costituisce accettazione dei nuovi termini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">8. Contatti</h2>
              <p className="text-gray-300 leading-relaxed">
                Per domande sui Termini e Condizioni, contattaci all'indirizzo: 
                <span className="text-pp-gold"> primeassistenza@gmail.com</span>
              </p>
            </section>

            <div className="border-t border-gray-600 pt-6 mt-8">
              <p className="text-sm text-gray-400">
                <strong>Data ultimo aggiornamento:</strong> 2 Agosto 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 