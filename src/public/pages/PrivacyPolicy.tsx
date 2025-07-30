import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pp-gold mb-4">🔒 Privacy Policy</h1>
          <p className="text-xl text-gray-300">Performance Prime - Informativa sulla Privacy</p>
        </div>

        {/* Meta Info */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border-l-4 border-pp-gold">
          <p className="mb-2"><strong>📅 Ultimo aggiornamento:</strong> 30 luglio 2025</p>
          <p className="mb-2"><strong>🏢 Titolare del trattamento:</strong> MASRL – via Fiume Giallo 405, Roma, Italia</p>
          <p className="mb-2"><strong>📧 Email di contatto:</strong> <a href="mailto:primeassistenza@gmail.com" className="text-pp-gold hover:underline">primeassistenza@gmail.com</a></p>
          <p className="mb-0"><strong>🌐 Sito web:</strong> <a href="https://performanceprime.it" className="text-pp-gold hover:underline">performanceprime.it</a></p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">1. Finalità e Base Giuridica del Trattamento</h2>
            <p className="mb-4">Raccogliamo e trattiamo i tuoi dati personali per le seguenti finalità:</p>
            
            <h3 className="text-xl font-medium text-white mb-3">1.1 Esecuzione del Contratto</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Creazione e gestione del tuo account utente</li>
              <li>Fornitura dei servizi di allenamento e coaching</li>
              <li>Gestione degli abbonamenti e pagamenti</li>
              <li>Pianificazione e monitoraggio dei tuoi allenamenti</li>
              <li>Comunicazioni relative al servizio</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">1.2 Consenso Esplicito</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Invio di newsletter e comunicazioni marketing</li>
              <li>Analisi dei dati per migliorare i servizi</li>
              <li>Utilizzo di cookie per personalizzazione</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">1.3 Legittimo Interesse</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Prevenzione di frodi e abusi</li>
              <li>Analisi statistiche anonime</li>
              <li>Miglioramento della sicurezza del servizio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">2. Categorie di Dati Trattati</h2>
            
            <h3 className="text-xl font-medium text-white mb-3">2.1 Dati di Identificazione Personale</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Numero di telefono (opzionale)</li>
              <li>Data di nascita</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">2.2 Dati di Utilizzo</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Storico degli allenamenti</li>
              <li>Preferenze di allenamento</li>
              <li>Obiettivi fitness</li>
              <li>Metriche di performance</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">2.3 Dati Tecnici</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Indirizzo IP</li>
              <li>Dati di navigazione</li>
              <li>Informazioni sul dispositivo</li>
              <li>Cookie e tecnologie simili</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">3. Modalità di Raccolta dei Dati</h2>
            <p className="mb-4">I tuoi dati personali vengono raccolti attraverso:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Registrazione diretta:</strong> Quando crei un account</li>
              <li><strong>Utilizzo dell'app:</strong> Durante l'uso dei servizi</li>
              <li><strong>Comunicazioni:</strong> Email e chat di supporto</li>
              <li><strong>Cookie:</strong> Tecnologie di tracciamento automatico</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">4. Conservazione dei Dati</h2>
            <p className="mb-4">I tuoi dati vengono conservati per i seguenti periodi:</p>
            
            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
              <h3 className="text-lg font-medium text-yellow-400 mb-3">📋 Periodi di Conservazione</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dati account:</strong> Fino alla cancellazione dell'account</li>
                <li><strong>Dati di utilizzo:</strong> 3 anni dall'ultimo accesso</li>
                <li><strong>Dati di fatturazione:</strong> 10 anni (obbligo fiscale)</li>
                <li><strong>Log di sicurezza:</strong> 12 mesi</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">5. Diritti dell'Interessato</h2>
            <p className="mb-4">Hai il diritto di:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Accesso:</strong> Ottenere copia dei tuoi dati</li>
              <li><strong>Rettifica:</strong> Correggere dati inesatti</li>
              <li><strong>Cancellazione:</strong> Eliminare i tuoi dati ("diritto all'oblio")</li>
              <li><strong>Portabilità:</strong> Ricevere i tuoi dati in formato strutturato</li>
              <li><strong>Limitazione:</strong> Limitare il trattamento in determinate circostanze</li>
              <li><strong>Opposizione:</strong> Opporti al trattamento per finalità di marketing</li>
              <li><strong>Revoca del consenso:</strong> Ritirare il consenso in qualsiasi momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">6. Trasferimenti di Dati</h2>
            <p className="mb-4">I tuoi dati possono essere trasferiti a:</p>
            
            <h3 className="text-xl font-medium text-white mb-3">6.1 Fornitori di Servizi</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Supabase:</strong> Hosting e database (UE)</li>
              <li><strong>Stripe:</strong> Processamento pagamenti (UE/USA)</li>
              <li><strong>Google Analytics:</strong> Analisi statistiche (UE/USA)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">6.2 Autorità Pubbliche</h3>
            <p>Quando richiesto dalla legge o per proteggere i nostri diritti legali.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">7. Sicurezza dei Dati</h2>
            <p className="mb-4">Implementiamo misure di sicurezza appropriate:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Crittografia SSL/TLS per tutte le comunicazioni</li>
              <li>Autenticazione a due fattori</li>
              <li>Backup regolari e sicuri</li>
              <li>Controllo degli accessi</li>
              <li>Monitoraggio continuo della sicurezza</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">8. Cookie e Tecnologie Simili</h2>
            <p className="mb-4">Utilizziamo cookie per:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cookie tecnici:</strong> Funzionamento dell'app</li>
              <li><strong>Cookie analitici:</strong> Statistiche di utilizzo</li>
              <li><strong>Cookie di marketing:</strong> Pubblicità personalizzata</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">9. Minori</h2>
            <p>I nostri servizi non sono destinati a minori di 16 anni. Non raccogliamo consapevolmente dati personali di minori di 16 anni.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-pp-gold mb-4 border-b border-gray-700 pb-2">10. Modifiche alla Privacy Policy</h2>
            <p className="mb-4">Ci riserviamo il diritto di modificare questa Privacy Policy. Le modifiche saranno comunicate tramite:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Notifica nell'app</li>
              <li>Email agli utenti registrati</li>
              <li>Pubblicazione sul sito web</li>
            </ul>
          </section>

          {/* Contact Section */}
          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded">
            <h3 className="text-lg font-medium text-blue-400 mb-4">📞 Contattaci</h3>
            <p className="mb-4">Per esercitare i tuoi diritti o per qualsiasi domanda sulla privacy:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:primeassistenza@gmail.com" className="text-pp-gold hover:underline">primeassistenza@gmail.com</a></li>
              <li><strong>Indirizzo:</strong> MASRL – via Fiume Giallo 405, Roma, Italia</li>
              <li><strong>Orari:</strong> Lun-Ven 9:00-18:00</li>
            </ul>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12 pt-8 border-t border-gray-700">
          <button 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-pp-gold to-yellow-500 text-black px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            ← Torna all'App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 