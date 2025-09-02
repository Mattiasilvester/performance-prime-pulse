import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
          <h1 className="text-2xl font-bold text-pp-gold mb-6">Informativa sulla Privacy per Performance Prime</h1>
          
          <div className="space-y-6 text-white">
            <p className="text-gray-300">
              <strong>Ultimo aggiornamento:</strong> 30 Luglio 2025
            </p>

            <p className="text-gray-300 leading-relaxed">
              Questa Informativa sulla Privacy descrive le nostre politiche e procedure sulla raccolta, l'uso e la divulgazione delle tue informazioni quando utilizzi il Servizio e ti informa sui tuoi diritti alla privacy e su come la legge ti protegge.
            </p>

            <p className="text-gray-300 leading-relaxed">
              Utilizziamo i tuoi Dati Personali per fornire e migliorare il Servizio. Utilizzando il Servizio, accetti la raccolta e l'uso delle informazioni in conformità con questa Informativa sulla Privacy.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Interpretazione e Definizioni</h2>
              
              <h3 className="text-lg font-medium text-pp-gold mb-2">Interpretazione</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Le parole di cui la lettera iniziale è maiuscola hanno significati definiti nelle seguenti condizioni. Le seguenti definizioni avranno lo stesso significato indipendentemente dal fatto che appaiano al singolare o al plurale.
              </p>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Definizioni</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                Ai fini di questa Informativa sulla Privacy:
              </p>
              
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Account</strong> significa un account univoco creato per te per accedere al nostro Servizio o parti del nostro Servizio.</li>
                <li><strong>Affiliata</strong> significa un'entità che controlla, è controllata da o è sotto controllo comune con una parte, dove "controllo" significa proprietà del 50% o più delle azioni, interessi di capitale o altri titoli aventi diritto di voto per l'elezione di direttori o altra autorità di gestione.</li>
                <li><strong>Applicazione</strong> si riferisce a Performance Prime, il programma software fornito dalla Società.</li>
                <li><strong>Società</strong> (denominata come "la Società", "Noi", "Ci" o "Nostro" in questo Accordo) si riferisce a MASRL, via fiume giallo 405.</li>
                <li><strong>Paese</strong> si riferisce a: Italia</li>
                <li><strong>Dispositivo</strong> significa qualsiasi dispositivo che può accedere al Servizio come un computer, un telefono cellulare o un tablet digitale.</li>
                <li><strong>Dati Personali</strong> sono qualsiasi informazione che si riferisce a un individuo identificato o identificabile.</li>
                <li><strong>Servizio</strong> si riferisce all'Applicazione.</li>
                <li><strong>Fornitore di Servizi</strong> significa qualsiasi persona fisica o giuridica che elabora i dati per conto della Società. Si riferisce a società o individui di terze parti impiegati dalla Società per facilitare il Servizio, per fornire il Servizio per conto della Società, per eseguire servizi relativi al Servizio o per assistere la Società nell'analizzare come viene utilizzato il Servizio.</li>
                <li><strong>Dati di Utilizzo</strong> si riferisce ai dati raccolti automaticamente, generati dall'uso del Servizio o dall'infrastruttura del Servizio stesso (ad esempio, la durata di una visita alla pagina).</li>
                <li><strong>Tu</strong> significa l'individuo che accede o utilizza il Servizio, o la società, o altra entità giuridica per conto della quale tale individuo accede o utilizza il Servizio, a seconda dei casi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Raccolta e Utilizzo dei tuoi Dati Personali</h2>
              
              <h3 className="text-lg font-medium text-pp-gold mb-2">Tipi di Dati Raccolti</h3>
              
              <h4 className="text-md font-medium text-pp-gold mb-2">Dati Personali</h4>
              <p className="text-gray-300 leading-relaxed mb-3">
                Durante l'utilizzo del nostro Servizio, potremmo chiederti di fornirci determinate informazioni personali identificabili che possono essere utilizzate per contattarti o identificarti. Le informazioni personali identificabili possono includere, ma non sono limitate a:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                <li>Indirizzo email</li>
                <li>Nome e cognome</li>
                <li>Dati di Utilizzo</li>
              </ul>

              <h4 className="text-md font-medium text-pp-gold mb-2">Dati di Utilizzo</h4>
              <p className="text-gray-300 leading-relaxed mb-3">
                I Dati di Utilizzo vengono raccolti automaticamente durante l'utilizzo del Servizio.
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                I Dati di Utilizzo possono includere informazioni come l'indirizzo del protocollo Internet del tuo Dispositivo (ad es. indirizzo IP), tipo di browser, versione del browser, le pagine del nostro Servizio che visiti, l'ora e la data della tua visita, il tempo trascorso su quelle pagine, identificatori univoci del dispositivo e altri dati diagnostici.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Quando accedi al Servizio tramite o attraverso un dispositivo mobile, potremmo raccogliere determinate informazioni automaticamente, incluse, ma non limitate a, il tipo di dispositivo mobile che utilizzi, l'ID univoco del tuo dispositivo mobile, l'indirizzo IP del tuo dispositivo mobile, il tuo sistema operativo mobile, il tipo di browser Internet mobile che utilizzi, identificatori univoci del dispositivo e altri dati diagnostici.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Potremmo anche raccogliere informazioni che il tuo browser invia ogni volta che visiti il nostro Servizio o quando accedi al Servizio tramite o attraverso un dispositivo mobile.
              </p>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Utilizzo dei tuoi Dati Personali</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                La Società può utilizzare i Dati Personali per i seguenti scopi:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Per fornire e mantenere il nostro Servizio</strong>, incluso per monitorare l'utilizzo del nostro Servizio.</li>
                <li><strong>Per gestire il tuo Account:</strong> per gestire la tua registrazione come utente del Servizio. I Dati Personali che fornisci possono darti accesso a diverse funzionalità del Servizio che sono disponibili per te come utente registrato.</li>
                <li><strong>Per l'esecuzione di un contratto:</strong> lo sviluppo, la conformità e l'impegno del contratto di acquisto per i prodotti, articoli o servizi che hai acquistato o di qualsiasi altro contratto con noi attraverso il Servizio.</li>
                <li><strong>Per contattarti:</strong> Per contattarti via email, telefonate, SMS o altre forme equivalenti di comunicazione elettronica, come le notifiche push di un'applicazione mobile riguardo aggiornamenti o comunicazioni informative relative alle funzionalità, prodotti o servizi contrattuali, inclusi gli aggiornamenti di sicurezza, quando necessario o ragionevole per la loro implementazione.</li>
                <li><strong>Per fornirti</strong> notizie, offerte speciali e informazioni generali su altri beni, servizi ed eventi che offriamo che sono simili a quelli che hai già acquistato o sui quali hai fatto richiesta a meno che tu non abbia scelto di non ricevere tali informazioni.</li>
                <li><strong>Per gestire le tue richieste:</strong> Per partecipare e gestire le tue richieste a noi.</li>
                <li><strong>Per trasferimenti aziendali:</strong> Potremmo utilizzare le tue informazioni per valutare o condurre una fusione, disinvestimento, ristrutturazione, riorganizzazione, dissoluzione o altra vendita o trasferimento di alcuni o tutti i nostri asset, sia come attività in corso che come parte di fallimento, liquidazione o procedimento simile, in cui i Dati Personali detenuti da noi sui nostri utenti del Servizio sono tra gli asset trasferiti.</li>
                <li><strong>Per altri scopi</strong>: Potremmo utilizzare le tue informazioni per altri scopi, come l'analisi dei dati, l'identificazione delle tendenze di utilizzo, la determinazione dell'efficacia delle nostre campagne promozionali e per valutare e migliorare il nostro Servizio, prodotti, servizi, marketing e la tua esperienza.</li>
              </ul>

              <p className="text-gray-300 leading-relaxed mb-3">
                Potremmo condividere le tue informazioni personali nelle seguenti situazioni:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Con i Fornitori di Servizi:</strong> Potremmo condividere le tue informazioni personali con i Fornitori di Servizi per monitorare e analizzare l'uso del nostro Servizio, per contattarti.</li>
                <li><strong>Per trasferimenti aziendali:</strong> Potremmo condividere o trasferire le tue informazioni personali in connessione con, o durante le trattative di, qualsiasi fusione, vendita di asset della Società, finanziamento o acquisizione di tutto o di una parte del nostro business a un'altra società.</li>
                <li><strong>Con le Affiliate:</strong> Potremmo condividere le tue informazioni con le nostre affiliate, nel qual caso richiederemo a quelle affiliate di onorare questa Informativa sulla Privacy. Le affiliate includono la nostra società madre e qualsiasi altra controllata, partner di joint venture o altre società che controlliamo o che sono sotto controllo comune con noi.</li>
                <li><strong>Con partner commerciali:</strong> Potremmo condividere le tue informazioni con i nostri partner commerciali per offrirti determinati prodotti, servizi o promozioni.</li>
                <li><strong>Con altri utenti:</strong> quando condividi informazioni personali o altrimenti interagisci nelle aree pubbliche con altri utenti, tali informazioni potrebbero essere visualizzate da tutti gli utenti e potrebbero essere distribuite pubblicamente all'esterno.</li>
                <li><strong>Con il tuo consenso</strong>: Potremmo divulgare le tue informazioni personali per qualsiasi altro scopo con il tuo consenso.</li>
              </ul>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Conservazione dei tuoi Dati Personali</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                La Società conserverà i tuoi Dati Personali solo per il tempo necessario agli scopi stabiliti in questa Informativa sulla Privacy. Conserveremo e utilizzeremo i tuoi Dati Personali nella misura necessaria per rispettare i nostri obblighi legali (ad esempio, se siamo tenuti a conservare i tuoi dati per rispettare le leggi applicabili), risolvere controversie e far rispettare i nostri accordi legali e le nostre politiche.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                La Società conserverà anche i Dati di Utilizzo per scopi di analisi interna. I Dati di Utilizzo sono generalmente conservati per un periodo di tempo più breve, tranne quando questi dati vengono utilizzati per rafforzare la sicurezza o per migliorare la funzionalità del nostro Servizio, o siamo legalmente obbligati a conservare questi dati per periodi di tempo più lunghi.
              </p>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Trasferimento dei tuoi Dati Personali</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Le tue informazioni, inclusi i Dati Personali, vengono elaborate negli uffici operativi della Società e in qualsiasi altro luogo dove si trovano le parti coinvolte nell'elaborazione. Significa che queste informazioni potrebbero essere trasferite a — e mantenute su — computer situati al di fuori del tuo stato, provincia, paese o altra giurisdizione governativa dove le leggi sulla protezione dei dati potrebbero differire da quelle della tua giurisdizione.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Il tuo consenso a questa Informativa sulla Privacy seguito dalla tua presentazione di tali informazioni rappresenta il tuo accordo a tale trasferimento.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                La Società adotterà tutti i passi ragionevolmente necessari per garantire che i tuoi dati siano trattati in modo sicuro e in conformità con questa Informativa sulla Privacy e nessun trasferimento dei tuoi Dati Personali avrà luogo a un'organizzazione o a un paese a meno che non ci siano controlli adeguati in atto inclusa la sicurezza dei tuoi dati e altre informazioni personali.
              </p>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Eliminare i tuoi Dati Personali</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Hai il diritto di eliminare o richiedere che ti assistiamo nell'eliminare i Dati Personali che abbiamo raccolto su di te.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Il nostro Servizio potrebbe darti la capacità di eliminare determinate informazioni su di te dall'interno del Servizio.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Potresti aggiornare, modificare o eliminare le tue informazioni in qualsiasi momento accedendo al tuo Account, se ne hai uno, e visitando la sezione delle impostazioni dell'account che ti permette di gestire le tue informazioni personali. Potresti anche contattarci per richiedere l'accesso a, correggere o eliminare qualsiasi informazione personale che ci hai fornito.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Tieni presente, tuttavia, che potremmo dover conservare determinate informazioni quando abbiamo un obbligo legale o una base legale per farlo.
              </p>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Divulgazione dei tuoi Dati Personali</h3>
              
              <h4 className="text-md font-medium text-pp-gold mb-2">Transazioni aziendali</h4>
              <p className="text-gray-300 leading-relaxed mb-4">
                Se la Società è coinvolta in una fusione, acquisizione o vendita di asset, i tuoi Dati Personali potrebbero essere trasferiti. Forniremo un preavviso prima che i tuoi Dati Personali vengano trasferiti e diventino soggetti a una diversa Informativa sulla Privacy.
              </p>

              <h4 className="text-md font-medium text-pp-gold mb-2">Forze dell'ordine</h4>
              <p className="text-gray-300 leading-relaxed mb-4">
                In determinate circostanze, la Società potrebbe essere tenuta a divulgare i tuoi Dati Personali se richiesto dalla legge o in risposta a richieste valide da parte di autorità pubbliche (ad es. un tribunale o un'agenzia governativa).
              </p>

              <h4 className="text-md font-medium text-pp-gold mb-2">Altri requisiti legali</h4>
              <p className="text-gray-300 leading-relaxed mb-3">
                La Società potrebbe divulgare i tuoi Dati Personali nella buona fede che tale azione sia necessaria per:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                <li>Rispettare un obbligo legale</li>
                <li>Proteggere e difendere i diritti o la proprietà della Società</li>
                <li>Prevenire o investigare possibili illeciti in connessione con il Servizio</li>
                <li>Proteggere la sicurezza personale degli Utenti del Servizio o del pubblico</li>
                <li>Proteggere dalla responsabilità legale</li>
              </ul>

              <h3 className="text-lg font-medium text-pp-gold mb-2">Sicurezza dei tuoi Dati Personali</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                La sicurezza dei tuoi Dati Personali è importante per noi, ma ricorda che nessun metodo di trasmissione su Internet, o metodo di archiviazione elettronica è sicuro al 100%. Mentre ci sforziamo di utilizzare mezzi commercialmente accettabili per proteggere i tuoi Dati Personali, non possiamo garantire la loro sicurezza assoluta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Privacy dei Minori</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Il nostro Servizio non si rivolge a nessuno di età inferiore ai 13 anni. Non raccogliamo consapevolmente informazioni personali identificabili da nessuno di età inferiore ai 13 anni. Se sei un genitore o un tutore e sei consapevole che tuo figlio ci ha fornito Dati Personali, contattaci. Se diventiamo consapevoli di aver raccolto Dati Personali da chiunque di età inferiore ai 13 anni senza verifica del consenso dei genitori, adottiamo misure per rimuovere tali informazioni dai nostri server.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Se dobbiamo fare affidamento sul consenso come base legale per l'elaborazione delle tue informazioni e il tuo paese richiede il consenso da un genitore, potremmo richiedere il consenso del tuo genitore prima di raccogliere e utilizzare tali informazioni.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Link ad Altri Siti Web</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Il nostro Servizio potrebbe contenere link ad altri siti web che non sono gestiti da noi. Se clicchi su un link di terze parti, sarai diretto al sito di quella terza parte. Ti consigliamo vivamente di rivedere l'Informativa sulla Privacy di ogni sito che visiti.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Non abbiamo alcun controllo e non ci assumiamo alcuna responsabilità per il contenuto, le politiche sulla privacy o le pratiche di qualsiasi sito o servizio di terze parti.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Modifiche a questa Informativa sulla Privacy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Potremmo aggiornare la nostra Informativa sulla Privacy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova Informativa sulla Privacy su questa pagina.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Ti faremo sapere via email e/o un avviso prominente sul nostro Servizio, prima che la modifica diventi effettiva e aggiorneremo la data "Ultimo aggiornamento" in cima a questa Informativa sulla Privacy.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Ti consigliamo di rivedere questa Informativa sulla Privacy periodicamente per eventuali modifiche. Le modifiche a questa Informativa sulla Privacy sono efficaci quando vengono pubblicate su questa pagina.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-pp-gold mb-3">Contattaci</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                Se hai domande su questa Informativa sulla Privacy, puoi contattarci:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                <li>Via email: primeassistenza@gmail.com</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 