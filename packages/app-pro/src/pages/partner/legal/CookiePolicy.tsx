import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="partner-theme partner-bg min-h-screen">
      <PartnerHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="partner-heading text-3xl font-bold mb-8" style={{ color: '#EEBA2B' }}>
          Cookie Policy - PrimePro
        </h1>

        <p className="partner-muted-text mb-8">
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <p className="partner-muted-text mb-8">
          La presente Cookie Policy descrive cosa sono i cookie, quali tipologie utilizziamo sulla piattaforma PrimePro e come puoi gestire le tue preferenze.
        </p>

        {/* SEZIONE 1 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>1. Cosa sono i Cookie</h2>
          <div className="partner-muted-text space-y-2">
            <p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo (computer, tablet, smartphone) quando visiti un sito web. Servono a migliorare la tua esperienza di navigazione, ricordando le tue preferenze e abilitando determinate funzionalità.</p>
            <p>I cookie possono essere:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Cookie di prima parte:</strong> impostati direttamente da PrimePro</li>
              <li><strong>Cookie di terze parti:</strong> impostati da servizi esterni (es. Stripe, Google Analytics)</li>
              <li><strong>Cookie di sessione:</strong> eliminati alla chiusura del browser</li>
              <li><strong>Cookie persistenti:</strong> rimangono sul dispositivo per un periodo definito</li>
            </ul>
          </div>
        </section>

        {/* SEZIONE 2 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>2. Tipologie di Cookie Utilizzati</h2>
          <div className="partner-muted-text space-y-6">

            {/* Cookie Tecnici */}
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-3" style={{ color: '#EEBA2B' }}>2.1. Cookie Tecnici (Necessari)</h3>
              <p className="mb-3">Questi cookie sono essenziali per il funzionamento della piattaforma. Non possono essere disattivati.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3">Nome</th>
                      <th className="text-left py-2 px-3">Finalità</th>
                      <th className="text-left py-2 px-3">Durata</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">sb-*-auth-token</td>
                      <td className="py-2 px-3">Autenticazione Supabase</td>
                      <td className="py-2 px-3">Sessione / 1 anno</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">cookieConsent</td>
                      <td className="py-2 px-3">Memorizza le preferenze cookie</td>
                      <td className="py-2 px-3">1 anno</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">theme</td>
                      <td className="py-2 px-3">Preferenza tema (chiaro/scuro)</td>
                      <td className="py-2 px-3">1 anno</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookie Analytics */}
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-3" style={{ color: '#EEBA2B' }}>2.2. Cookie Analitici</h3>
              <p className="mb-3">Ci aiutano a capire come gli utenti interagiscono con la piattaforma, permettendoci di migliorare i nostri servizi.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3">Nome</th>
                      <th className="text-left py-2 px-3">Fornitore</th>
                      <th className="text-left py-2 px-3">Finalità</th>
                      <th className="text-left py-2 px-3">Durata</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">_ga</td>
                      <td className="py-2 px-3">Google Analytics</td>
                      <td className="py-2 px-3">Distingue gli utenti</td>
                      <td className="py-2 px-3">2 anni</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">_ga_*</td>
                      <td className="py-2 px-3">Google Analytics</td>
                      <td className="py-2 px-3">Mantiene lo stato della sessione</td>
                      <td className="py-2 px-3">2 anni</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookie Terze Parti */}
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-3" style={{ color: '#EEBA2B' }}>2.3. Cookie di Terze Parti (Pagamenti)</h3>
              <p className="mb-3">Utilizzati dai nostri fornitori di servizi di pagamento per garantire transazioni sicure.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3">Fornitore</th>
                      <th className="text-left py-2 px-3">Finalità</th>
                      <th className="text-left py-2 px-3">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">Stripe</td>
                      <td className="py-2 px-3">Elaborazione pagamenti, prevenzione frodi</td>
                      <td className="py-2 px-3"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Link</a></td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2 px-3">PayPal</td>
                      <td className="py-2 px-3">Elaborazione pagamenti</td>
                      <td className="py-2 px-3"><a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Link</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {/* SEZIONE 3 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>3. Come Gestire i Cookie</h2>
          <div className="partner-muted-text space-y-4">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#EEBA2B' }}>3.1. Tramite il nostro Banner</h3>
              <p>Al primo accesso alla piattaforma, ti verrà mostrato un banner che ti permette di accettare o personalizzare le tue preferenze sui cookie. Puoi modificare le tue scelte in qualsiasi momento cliccando su &quot;Cookie Policy&quot; o &quot;Impostazioni Cookie&quot; nel footer e poi su &quot;Modifica preferenze cookie&quot; qui sotto.</p>
              <p className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('cookieConsent');
                      window.location.reload();
                    } catch {
                      window.location.reload();
                    }
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#EEBA2B' }}
                >
                  Modifica preferenze cookie
                </button>
                {' — riapre il banner per cambiare le tue scelte.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#EEBA2B' }}>3.2. Tramite il Browser</h3>
              <p>Puoi gestire i cookie anche attraverso le impostazioni del tuo browser:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Safari</a></li>
                <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>Microsoft Edge</a></li>
              </ul>
            </div>
            <div className="rounded-lg p-4 mt-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <p className="text-sm">
                <strong>Nota:</strong> La disattivazione dei cookie tecnici potrebbe compromettere il funzionamento della piattaforma e impedirti di accedere ad alcune funzionalità.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE 4 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>4. Base Giuridica</h2>
          <div className="partner-muted-text space-y-2">
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Cookie tecnici:</strong> non richiedono consenso (legittimo interesse per il funzionamento del servizio)</li>
              <li><strong>Cookie analitici e di profilazione:</strong> richiedono il tuo consenso esplicito, che puoi fornire o negare tramite il banner</li>
            </ul>
          </div>
        </section>

        {/* SEZIONE 5 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>5. Aggiornamenti</h2>
          <div className="partner-muted-text space-y-2">
            <p>La presente Cookie Policy può essere aggiornata periodicamente. Ti invitiamo a consultare questa pagina regolarmente per rimanere informato su eventuali modifiche.</p>
          </div>
        </section>

        {/* SEZIONE 6 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>6. Contatti</h2>
          <div className="partner-muted-text space-y-2">
            <p>Per domande sulla presente Cookie Policy:</p>
            <div className="rounded-lg p-4 mt-2 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <p><strong>MASRL</strong></p>
              <p>Via Fiume Giallo 430, Roma</p>
              <p>P.IVA: 17774791002</p>
              <p>Email: <a href="mailto:primeassistenza@gmail.com" className="hover:underline" style={{ color: '#EEBA2B' }}>primeassistenza@gmail.com</a></p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-800 pt-8 mt-12">
          <p className="partner-muted-text text-sm">
            © {new Date().getFullYear()} MASRL - Tutti i diritti riservati.
          </p>
        </div>
      </div>
      <PartnerFooter />
    </div>
  );
};

export default CookiePolicy;
