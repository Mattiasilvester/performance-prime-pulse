import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="partner-theme partner-bg min-h-screen">
      <PartnerHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="partner-heading text-3xl font-bold mb-8" style={{ color: '#EEBA2B' }}>
          Informativa sulla Privacy - PrimePro
        </h1>

        <p className="partner-muted-text mb-8">
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <p className="partner-muted-text mb-8">
          La presente Informativa sulla Privacy descrive come MASRL (&quot;noi&quot;, &quot;nostro&quot; o &quot;Titolare&quot;) raccoglie, utilizza e protegge i dati personali degli utenti della piattaforma PrimePro, in conformità al Regolamento (UE) 2016/679 (GDPR) e al D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.
        </p>

        {/* SEZIONE 1 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>1. Titolare del Trattamento</h2>
          <div className="partner-muted-text space-y-2">
            <p>Il Titolare del trattamento dei dati personali è:</p>
            <div className="rounded-lg p-4 mt-2 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <p><strong>MASRL</strong></p>
              <p>Via Fiume Giallo 430, Roma</p>
              <p>P.IVA: 17774791002</p>
              <p>Email: <a href="mailto:primeassistenza@gmail.com" className="hover:underline" style={{ color: '#EEBA2B' }}>primeassistenza@gmail.com</a></p>
            </div>
          </div>
        </section>

        {/* SEZIONE 2 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>2. Dati Personali Raccolti</h2>
          <div className="partner-muted-text space-y-6">
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-2" style={{ color: '#EEBA2B' }}>2.1. Dati forniti direttamente dall&apos;utente:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Dati identificativi:</strong> nome, cognome, codice fiscale</li>
                <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo</li>
                <li><strong>Dati professionali:</strong> partita IVA, ragione sociale, qualifiche, certificazioni, specializzazioni</li>
                <li><strong>Dati di fatturazione:</strong> coordinate bancarie, dati per la fatturazione</li>
                <li><strong>Contenuti:</strong> foto profilo, descrizione professionale, servizi offerti</li>
              </ul>
            </div>
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-2" style={{ color: '#EEBA2B' }}>2.2. Dati raccolti automaticamente:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, pagine visitate</li>
                <li><strong>Dati di utilizzo:</strong> funzionalità utilizzate, frequenza di accesso, interazioni con la piattaforma</li>
                <li><strong>Cookie e tecnologie simili:</strong> come descritto nella Cookie Policy</li>
              </ul>
            </div>
            <div className="rounded-lg p-4 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <h3 className="font-semibold mb-2" style={{ color: '#EEBA2B' }}>2.3. Dati dei Clienti del Professionista:</h3>
              <p>La piattaforma consente ai Professionisti di gestire i dati dei propri clienti (nome, contatti, storico appuntamenti). Per questi dati, il <strong>Professionista è Titolare autonomo del trattamento</strong> e MASRL agisce come Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR.</p>
            </div>
          </div>
        </section>

        {/* SEZIONE 3 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>3. Finalità e Base Giuridica del Trattamento</h2>
          <div className="partner-muted-text space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#EEBA2B]/30">
                    <th className="text-left py-3 px-4" style={{ color: '#EEBA2B' }}>Finalità</th>
                    <th className="text-left py-3 px-4" style={{ color: '#EEBA2B' }}>Base Giuridica</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Registrazione e gestione account</td>
                    <td className="py-3 px-4">Esecuzione del contratto (Art. 6.1.b GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Erogazione dei servizi della piattaforma</td>
                    <td className="py-3 px-4">Esecuzione del contratto (Art. 6.1.b GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Gestione pagamenti e fatturazione</td>
                    <td className="py-3 px-4">Esecuzione del contratto e obbligo legale (Art. 6.1.b e 6.1.c GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Assistenza clienti</td>
                    <td className="py-3 px-4">Esecuzione del contratto (Art. 6.1.b GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Comunicazioni di servizio</td>
                    <td className="py-3 px-4">Esecuzione del contratto (Art. 6.1.b GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Invio newsletter e comunicazioni promozionali</td>
                    <td className="py-3 px-4">Consenso (Art. 6.1.a GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Miglioramento dei servizi e analytics</td>
                    <td className="py-3 px-4">Legittimo interesse (Art. 6.1.f GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Adempimento obblighi fiscali e legali</td>
                    <td className="py-3 px-4">Obbligo legale (Art. 6.1.c GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Prevenzione frodi e sicurezza</td>
                    <td className="py-3 px-4">Legittimo interesse (Art. 6.1.f GDPR)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SEZIONE 4 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>4. Destinatari dei Dati</h2>
          <div className="partner-muted-text space-y-2">
            <p>I dati personali potranno essere comunicati a:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Fornitori di servizi tecnici:</strong> hosting (Vercel), database (Supabase), servizi cloud</li>
              <li><strong>Fornitori di servizi di pagamento:</strong> Stripe, PayPal per l&apos;elaborazione dei pagamenti</li>
              <li><strong>Fornitori di servizi email:</strong> per l&apos;invio di comunicazioni transazionali e promozionali</li>
              <li><strong>Consulenti e professionisti:</strong> commercialisti, avvocati, per adempimenti fiscali e legali</li>
              <li><strong>Autorità pubbliche:</strong> quando richiesto dalla legge</li>
            </ul>
            <p className="mt-4">Tutti i fornitori sono stati selezionati per garantire adeguate misure di sicurezza e sono nominati Responsabili del trattamento ai sensi dell&apos;art. 28 GDPR, ove applicabile.</p>
          </div>
        </section>

        {/* SEZIONE 5 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>5. Trasferimento Dati Extra-UE</h2>
          <div className="partner-muted-text space-y-2">
            <p>Alcuni dei nostri fornitori di servizi (es. Vercel, Supabase, Stripe) potrebbero trattare i dati in paesi al di fuori dell&apos;Unione Europea, in particolare negli Stati Uniti.</p>
            <p>In tali casi, il trasferimento avviene sulla base di:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Decisioni di adeguatezza della Commissione Europea (es. EU-US Data Privacy Framework)</li>
              <li>Clausole Contrattuali Standard approvate dalla Commissione Europea</li>
              <li>Altre garanzie appropriate previste dal GDPR</li>
            </ul>
          </div>
        </section>

        {/* SEZIONE 6 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>6. Periodo di Conservazione</h2>
          <div className="partner-muted-text space-y-2">
            <p>I dati personali saranno conservati per il tempo necessario alle finalità per cui sono stati raccolti:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Dati account:</strong> per tutta la durata del rapporto contrattuale e per 10 anni dalla cessazione (obblighi fiscali)</li>
              <li><strong>Dati di fatturazione:</strong> 10 anni (obblighi fiscali ex art. 2220 c.c.)</li>
              <li><strong>Dati di navigazione:</strong> 24 mesi</li>
              <li><strong>Consenso marketing:</strong> fino alla revoca del consenso</li>
              <li><strong>Dati per contenziosi:</strong> per il tempo necessario alla tutela dei diritti in giudizio</li>
            </ul>
          </div>
        </section>

        {/* SEZIONE 7 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>7. Diritti dell&apos;Interessato</h2>
          <div className="partner-muted-text space-y-2">
            <p>Ai sensi degli artt. 15-22 del GDPR, l&apos;utente ha diritto di:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Accesso:</strong> ottenere conferma dell&apos;esistenza di un trattamento e accedere ai propri dati</li>
              <li><strong>Rettifica:</strong> ottenere la correzione dei dati inesatti o l&apos;integrazione di quelli incompleti</li>
              <li><strong>Cancellazione (&quot;diritto all&apos;oblio&quot;):</strong> ottenere la cancellazione dei dati, nei casi previsti dalla legge</li>
              <li><strong>Limitazione:</strong> ottenere la limitazione del trattamento, nei casi previsti dalla legge</li>
              <li><strong>Portabilità:</strong> ricevere i dati in formato strutturato e trasferirli ad altro titolare</li>
              <li><strong>Opposizione:</strong> opporsi al trattamento basato sul legittimo interesse</li>
              <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento basato sul consenso prestato prima della revoca</li>
            </ul>
            <p className="mt-4">Per esercitare i propri diritti, l&apos;utente può contattare il Titolare all&apos;indirizzo: <a href="mailto:primeassistenza@gmail.com" className="hover:underline" style={{ color: '#EEBA2B' }}>primeassistenza@gmail.com</a></p>
            <p className="mt-2">L&apos;utente ha inoltre diritto di proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#EEBA2B' }}>www.garanteprivacy.it</a>).</p>
          </div>
        </section>

        {/* SEZIONE 8 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>8. Sicurezza dei Dati</h2>
          <div className="partner-muted-text space-y-2">
            <p>Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali, tra cui:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Crittografia dei dati in transito (HTTPS/TLS)</li>
              <li>Crittografia dei dati sensibili a riposo</li>
              <li>Controlli di accesso basati su ruoli</li>
              <li>Monitoraggio e logging degli accessi</li>
              <li>Backup regolari e procedure di disaster recovery</li>
              <li>Formazione del personale sulla sicurezza dei dati</li>
            </ul>
          </div>
        </section>

        {/* SEZIONE 9 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>9. Cookie</h2>
          <div className="partner-muted-text space-y-2">
            <p>La piattaforma utilizza cookie e tecnologie simili. Per informazioni dettagliate, si prega di consultare la nostra <Link to="/partner/cookies" className="hover:underline" style={{ color: '#EEBA2B' }}>Cookie Policy</Link>.</p>
          </div>
        </section>

        {/* SEZIONE 10 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>10. Modifiche alla Privacy Policy</h2>
          <div className="partner-muted-text space-y-2">
            <p>Il Titolare si riserva il diritto di modificare la presente Privacy Policy in qualsiasi momento. Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.</p>
            <p>In caso di modifiche sostanziali, ne daremo comunicazione tramite email o avviso sulla piattaforma.</p>
          </div>
        </section>

        {/* SEZIONE 11 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>11. Contatti</h2>
          <div className="partner-muted-text space-y-2">
            <p>Per qualsiasi domanda o richiesta relativa alla presente Privacy Policy o al trattamento dei dati personali:</p>
            <div className="rounded-lg p-4 mt-2 border border-[#EEBA2B]/30 bg-gray-900 text-gray-300">
              <p><strong>MASRL</strong></p>
              <p>Via Fiume Giallo 430, Roma</p>
              <p>P.IVA: 17774791002</p>
              <p>Email: <a href="mailto:primeassistenza@gmail.com" className="hover:underline" style={{ color: '#EEBA2B' }}>primeassistenza@gmail.com</a></p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="partner-divider border-t pt-8 mt-12">
          <p className="partner-muted-text text-sm">
            © {new Date().getFullYear()} MASRL - Tutti i diritti riservati.
          </p>
        </div>
      </div>
      <PartnerFooter />
    </div>
  );
};

export default PrivacyPolicy;
