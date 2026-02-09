import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';

const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="partner-theme partner-bg min-h-screen">
      <PartnerHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="partner-heading text-3xl font-bold mb-8" style={{ color: '#EEBA2B' }}>
          Termini e Condizioni di Utilizzo - PrimePro
        </h1>

        <p className="partner-muted-text mb-8">
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* SEZIONE 1 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>1. Definizioni</h2>
          <div className="partner-muted-text space-y-2">
            <p><strong>&quot;Piattaforma&quot;</strong>: il servizio PrimePro, accessibile tramite il sito web primepro.performanceprime.it e relative applicazioni.</p>
            <p><strong>&quot;Titolare&quot;</strong>: MASRL, con sede in Via Fiume Giallo 430, Roma, P.IVA 17774791002.</p>
            <p><strong>&quot;Professionista&quot;</strong>: l&apos;utente che si registra sulla Piattaforma per offrire i propri servizi professionali.</p>
            <p><strong>&quot;Cliente&quot;</strong>: l&apos;utente finale che usufruisce dei servizi offerti dal Professionista tramite la Piattaforma.</p>
            <p><strong>&quot;Servizi&quot;</strong>: le funzionalità offerte dalla Piattaforma ai Professionisti, incluse gestione appuntamenti, clienti, analytics e fatturazione.</p>
          </div>
        </section>

        {/* SEZIONE 2 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>2. Oggetto del Contratto</h2>
          <div className="partner-muted-text space-y-2">
            <p>2.1. I presenti Termini e Condizioni regolano l&apos;utilizzo della Piattaforma PrimePro da parte dei Professionisti.</p>
            <p>2.2. La registrazione alla Piattaforma comporta l&apos;accettazione integrale dei presenti Termini.</p>
            <p>2.3. Il Titolare si riserva il diritto di modificare i presenti Termini in qualsiasi momento, dandone comunicazione agli utenti registrati.</p>
          </div>
        </section>

        {/* SEZIONE 3 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>3. Registrazione e Requisiti</h2>
          <div className="partner-muted-text space-y-2">
            <p>3.1. Possono registrarsi alla Piattaforma esclusivamente i professionisti in possesso di regolare Partita IVA operanti nei settori: fitness, wellness, benessere, nutrizione, fisioterapia, mental coaching, osteopatia e affini.</p>
            <p>3.2. Il Professionista garantisce la veridicità dei dati forniti in fase di registrazione e si impegna a mantenerli aggiornati.</p>
            <p>3.3. Il Professionista dichiara di possedere le qualifiche, certificazioni e abilitazioni necessarie per l&apos;esercizio della propria attività professionale.</p>
            <p>3.4. Il Titolare si riserva il diritto di richiedere documentazione comprovante le qualifiche professionali e di rifiutare o sospendere l&apos;iscrizione in caso di mancata o inadeguata documentazione.</p>
          </div>
        </section>

        {/* SEZIONE 4 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>4. Periodo di Prova e Abbonamento</h2>
          <div className="partner-muted-text space-y-2">
            <p>4.1. <strong>Periodo di prova gratuito:</strong> La registrazione include un periodo di prova gratuito di 3 (tre) mesi con accesso completo a tutte le funzionalità della Piattaforma.</p>
            <p>4.2. <strong>Abbonamento:</strong> Al termine del periodo di prova, il servizio si rinnova automaticamente al costo di €50,00 (cinquanta euro) al mese, IVA inclusa ove applicabile.</p>
            <p>4.3. <strong>Fatturazione:</strong> L&apos;abbonamento viene fatturato mensilmente. Il pagamento è dovuto in anticipo per ciascun mese di servizio.</p>
            <p>4.4. <strong>Metodi di pagamento:</strong> Sono accettati pagamenti tramite Stripe, PayPal e carte di credito/debito dei principali circuiti.</p>
            <p>4.5. <strong>Commissioni:</strong> La Piattaforma non applica alcuna commissione sulle prenotazioni o transazioni tra Professionista e Cliente.</p>
          </div>
        </section>

        {/* SEZIONE 5 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>5. Diritto di Recesso</h2>
          <div className="partner-muted-text space-y-2">
            <p>5.1. Ai sensi del D.Lgs. 206/2005 (Codice del Consumo), il Professionista ha diritto di recedere dal contratto entro 14 (quattordici) giorni dalla sottoscrizione dell&apos;abbonamento, senza dover fornire alcuna motivazione.</p>
            <p>5.2. Per esercitare il diritto di recesso, il Professionista deve inviare comunicazione scritta a: primeassistenza@gmail.com</p>
            <p>5.3. In caso di recesso esercitato nei termini, il Titolare provvederà al rimborso integrale dell&apos;importo pagato entro 14 giorni dalla ricezione della comunicazione.</p>
            <p>5.4. Il diritto di recesso non si applica al periodo di prova gratuito.</p>
          </div>
        </section>

        {/* SEZIONE 6 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>6. Disdetta e Rinnovo</h2>
          <div className="partner-muted-text space-y-2">
            <p>6.1. L&apos;abbonamento si rinnova automaticamente alla scadenza di ciascun periodo mensile.</p>
            <p>6.2. Il Professionista può disdire l&apos;abbonamento in qualsiasi momento tramite le impostazioni del proprio account o contattando primeassistenza@gmail.com</p>
            <p>6.3. La disdetta ha effetto dalla fine del periodo di fatturazione in corso. Non sono previsti rimborsi per periodi parziali.</p>
            <p>6.4. Al termine dell&apos;abbonamento, l&apos;accesso alla Piattaforma sarà sospeso. I dati del Professionista saranno conservati per 30 giorni, dopodiché potranno essere cancellati.</p>
          </div>
        </section>

        {/* SEZIONE 7 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>7. Obblighi del Professionista</h2>
          <div className="partner-muted-text space-y-2">
            <p>7.1. Il Professionista si impegna a:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Utilizzare la Piattaforma in conformità alle leggi vigenti e ai presenti Termini</li>
              <li>Fornire servizi professionali di qualità ai propri Clienti</li>
              <li>Mantenere aggiornate le proprie informazioni professionali</li>
              <li>Rispettare gli appuntamenti presi tramite la Piattaforma</li>
              <li>Non utilizzare la Piattaforma per scopi illeciti o fraudolenti</li>
              <li>Mantenere riservate le credenziali di accesso</li>
            </ul>
            <p>7.2. Il Professionista è l&apos;unico responsabile dei servizi erogati ai propri Clienti e delle relative obbligazioni fiscali e previdenziali.</p>
          </div>
        </section>

        {/* SEZIONE 8 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>8. Responsabilità e Limitazioni</h2>
          <div className="partner-muted-text space-y-2">
            <p>8.1. La Piattaforma è un mero strumento tecnologico che facilita la gestione dell&apos;attività del Professionista. Il Titolare non è parte del rapporto contrattuale tra Professionista e Cliente.</p>
            <p>8.2. Il Titolare non è responsabile per:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>La qualità dei servizi erogati dal Professionista</li>
              <li>Eventuali danni derivanti dal rapporto tra Professionista e Cliente</li>
              <li>Interruzioni temporanee del servizio per manutenzione o cause di forza maggiore</li>
              <li>Perdita di dati causata da eventi al di fuori del proprio controllo</li>
            </ul>
            <p>8.3. La responsabilità del Titolare è in ogni caso limitata all&apos;importo dell&apos;abbonamento pagato dal Professionista nei 12 mesi precedenti l&apos;evento dannoso.</p>
          </div>
        </section>

        {/* SEZIONE 9 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>9. Sospensione e Risoluzione</h2>
          <div className="partner-muted-text space-y-2">
            <p>9.1. Il Titolare si riserva il diritto di sospendere o terminare l&apos;account del Professionista in caso di:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Violazione dei presenti Termini e Condizioni</li>
              <li>Mancato pagamento dell&apos;abbonamento</li>
              <li>Comportamento fraudolento o illecito</li>
              <li>Reclami ripetuti da parte dei Clienti</li>
              <li>Fornitura di informazioni false o fuorvianti</li>
            </ul>
            <p>9.2. In caso di sospensione per violazione, non è previsto alcun rimborso.</p>
          </div>
        </section>

        {/* SEZIONE 10 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>10. Proprietà Intellettuale</h2>
          <div className="partner-muted-text space-y-2">
            <p>10.1. Tutti i diritti di proprietà intellettuale relativi alla Piattaforma (marchi, loghi, software, design) sono di esclusiva proprietà del Titolare.</p>
            <p>10.2. Il Professionista mantiene la proprietà dei contenuti caricati sulla Piattaforma (foto, descrizioni, etc.) e concede al Titolare una licenza non esclusiva per l&apos;utilizzo ai fini del servizio.</p>
          </div>
        </section>

        {/* SEZIONE 11 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>11. Privacy e Trattamento Dati</h2>
          <div className="partner-muted-text space-y-2">
            <p>11.1. Il trattamento dei dati personali è disciplinato dalla Privacy Policy disponibile al link: <Link to="/partner/privacy" className="partner-accent-text hover:underline" style={{ color: '#EEBA2B' }}>Privacy Policy PrimePro</Link></p>
            <p>11.2. Il Professionista è titolare autonomo del trattamento dei dati dei propri Clienti e si impegna a rispettare la normativa GDPR.</p>
          </div>
        </section>

        {/* SEZIONE 12 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>12. Legge Applicabile e Foro Competente</h2>
          <div className="partner-muted-text space-y-2">
            <p>12.1. I presenti Termini sono regolati dalla legge italiana.</p>
            <p>12.2. Per qualsiasi controversia derivante dai presenti Termini sarà competente in via esclusiva il Foro di Roma, salvo diversa disposizione inderogabile di legge.</p>
          </div>
        </section>

        {/* SEZIONE 13 */}
        <section className="mb-8">
          <h2 className="partner-accent-text text-xl font-semibold mb-4" style={{ color: '#EEBA2B' }}>13. Contatti</h2>
          <div className="partner-muted-text space-y-2">
            <p>Per qualsiasi informazione o richiesta relativa ai presenti Termini:</p>
            <p><strong>MASRL</strong></p>
            <p>Via Fiume Giallo 430, Roma</p>
            <p>P.IVA: 17774791002</p>
            <p>Email: <a href="mailto:primeassistenza@gmail.com" className="hover:underline" style={{ color: '#EEBA2B' }}>primeassistenza@gmail.com</a></p>
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

export default TermsConditions;
