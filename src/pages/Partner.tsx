import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';
import { PartnerInterfaceSection } from '@/components/partner/PartnerInterfaceSection';
import { ArrowRight, Check, Calendar, Users, Clock, Target, FileText, Zap, Gift, Heart, Sparkles, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Partner() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="partner-theme partner-bg min-h-screen">
      <PartnerHeader />
      
      <main className="pt-16">
        {/* 1. HERO SECTION */}
        <section 
          className="partner-hero-bg relative min-h-[85vh] flex items-center justify-center overflow-hidden"
          style={{ background: '#001f3f' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.08) 0%, transparent 50%)`
            }} />
          </div>

          {/* Content */}
          <div 
            className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center"
            style={{
              color: 'transparent',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(18, 33, 69, 1) 48%, rgba(255, 255, 255, 1) 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text'
            }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="partner-badge inline-flex items-center gap-2 rounded-full px-6 py-3 mb-6"
            >
              <span className="text-sm font-semibold">6 mesi di prova gratuita</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold partner-heading mb-6 leading-tight"
              style={{ color: 'var(--partner-primary-foreground)' }}
            >
              Meno caos, più clienti giusti,{' '}
              <span className="partner-heading-accent">più tempo</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl partner-muted-text mb-8 max-w-3xl mx-auto"
              style={{ color: 'var(--partner-primary-foreground)' }}
            >
              Performance Prime è il software per professionisti fitness e wellness:
              gestione clienti, agenda interattiva e acquisizione contatti qualificati.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/partner/registrazione">
                <Button
                  size="lg"
                  className="partner-btn-primary font-bold text-base sm:text-lg px-8 py-6 rounded-full"
                >
                  Inizia la prova gratuita
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToFeatures}
                className="partner-btn-secondary font-semibold px-8 py-6 rounded-full"
              >
                Scopri le funzionalità
              </Button>
            </motion.div>
          </div>
        </section>

        {/* 2. PROBLEMA ATTUALE DEL PROFESSIONISTA */}
        <section className="partner-section-muted py-20">
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="partner-heading text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12"
            >
              Il problema che conosci bene
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Gestione clienti frammentata',
                  description: 'Dati sparsi su più piattaforme, nessuna visione d\'insieme del percorso del cliente.'
                },
                {
                  title: 'Messaggi sparsi su WhatsApp',
                  description: 'Conversazioni perse, informazioni importanti difficili da ritrovare, tempo sprecato a cercare.'
                },
                {
                  title: 'Appuntamenti non centralizzati',
                  description: 'Calendari multipli, sovrapposizioni, dimenticanze. Il caos organizzativo quotidiano.'
                },
                {
                  title: 'Tempo perso in attività non produttive',
                  description: 'Troppo tempo dedicato alla gestione invece che al valore per i clienti.'
                }
              ].map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="partner-card rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold partner-accent-text mb-3">
                    {problem.title}
                  </h3>
                  <p className="partner-muted-text">
                    {problem.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. SOLUZIONE PERFORMANCE PRIME */}
        <section id="features" className="partner-section-bg py-20">
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="partner-heading text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4"
            >
              La soluzione:
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl partner-muted-text text-center mb-12 max-w-3xl mx-auto"
            >
              Tutto quello che ti serve per gestire i tuoi clienti in un unico posto
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: 'Agenda interattiva per appuntamenti',
                  description: 'Calendario centralizzato, prenotazioni automatiche, gestione orari semplice e intuitiva.'
                },
                {
                  icon: Users,
                  title: 'Gestione appuntamenti centralizzata',
                  description: 'Tutti i tuoi clienti in un\'unica dashboard. Storico completo, note, obiettivi e progressi.'
                },
                {
                  icon: Zap,
                  title: 'Reminder automatici per i clienti',
                  description: 'Notifiche automatiche per appuntamenti, allenamenti e scadenze. Meno chiamate, più efficienza.'
                },
                {
                  icon: FileText,
                  title: 'Storico cliente sempre disponibile',
                  description: 'Accesso immediato a tutto il percorso del cliente: allenamenti, note, obiettivi raggiunti.'
                },
                {
                  icon: Target,
                  title: 'Gestione progetto per singolo utente',
                  description: 'Crea percorsi personalizzati, definisci obiettivi, traccia progressi. Ogni cliente ha il suo piano.'
                },
                {
                  icon: Clock,
                  title: 'Tempo risparmiato ogni settimana',
                  description: 'Automatizza le attività ripetitive e concentrati su ciò che conta: i tuoi clienti.'
                }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="partner-card rounded-2xl p-6"
                  >
                    <div className="partner-icon-wrapper w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="partner-icon w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold partner-foreground-text mb-3">
                      {feature.title}
                    </h3>
                    <p className="partner-muted-text">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3.5. L'INTERFACCIA */}
        <PartnerInterfaceSection />

        {/* 4. NUOVI CONTATTI E MATCHING */}
        <section className="partner-section-muted py-20">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="partner-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Nuovi contatti e matching intelligente
              </h2>
              <p className="text-xl partner-muted-text max-w-3xl mx-auto">
                Ricevi contatti da utenti già attivi su Performance Prime, già interessati ai tuoi servizi
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="partner-card rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold partner-accent-text mb-4">
                  Contatti da utenti già attivi
                </h3>
                <p className="partner-muted-text mb-4">
                  Gli utenti di Performance Prime sono già motivati e attivi. Non devi convincerli a muoversi, sono già pronti.
                </p>
                <ul className="space-y-3">
                  {[
                    'Utenti già registrati e attivi',
                    'Interesse dimostrato verso il fitness',
                    'Obiettivi chiari e definiti',
                    'Maggiore probabilità di conversione'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="partner-check w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span className="partner-muted-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="partner-card rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold partner-accent-text mb-4">
                  Matching basato su obiettivi ed esigenze
                </h3>
                <p className="partner-muted-text mb-4">
                  Il sistema di matching connette automaticamente utenti e professionisti in base a obiettivi, zona e specializzazione.
                </p>
                <ul className="space-y-3">
                  {[
                    'Matching automatico intelligente',
                    'Contatti realmente in target',
                    'Filtri per zona e specializzazione',
                    'Più continuità, meno perdite di tempo'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="partner-check w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span className="partner-muted-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. BENEFICI CHIAVE */}
        <section 
          className="partner-hero-bg relative py-20 overflow-hidden"
          style={{ background: '#001f3f' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.08) 0%, transparent 50%)`
            }} />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-block partner-accent-text text-sm font-bold uppercase mb-4">
                I BENEFICI
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Risultati concreti per il tuo lavoro
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Performance Prime non è solo un software: è un alleato per lavorare meglio.
              </p>
            </motion.div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Clock,
                  metric: '5+',
                  label: 'ore risparmiate',
                  description: 'ogni settimana',
                  subDescription: 'Meno tempo in gestione, più tempo per i clienti'
                },
                {
                  icon: Heart,
                  metric: '-70%',
                  label: 'stress gestionale',
                  description: 'Tutto organizzato, niente più confusione'
                },
                {
                  icon: Sparkles,
                  metric: '100%',
                  label: 'clienti ordinati',
                  description: 'Clienti informati e consapevoli del percorso'
                },
                {
                  icon: Award,
                  metric: '24/7',
                  label: 'disponibilità',
                  description: 'Immagine strutturata e affidabile'
                }
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-[rgba(20,30,55,0.55)] backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:shadow-[0_12px_36px_-14px_rgba(0,0,0,0.65)] transition-all duration-300"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-[var(--partner-accent)] flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Metric */}
                    <div className="text-5xl font-bold text-white mb-2">
                      {benefit.metric}
                    </div>

                    {/* Label */}
                    <div className="text-sm font-medium partner-accent-text mb-3">
                      {benefit.label}
                    </div>

                    {/* Description */}
                    <div className="text-sm text-gray-300 space-y-1">
                      {benefit.subDescription ? (
                        <>
                          <div>{benefit.description}</div>
                          <div>{benefit.subDescription}</div>
                        </>
                      ) : (
                        <div>{benefit.description}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. PRICING - HERO SECTION */}
        <section className="partner-section-bg py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-block partner-accent-text text-sm font-bold uppercase mb-4">
                INIZIA GRATIS
              </div>
              <h2 className="partner-heading text-3xl sm:text-4xl font-bold mb-4">
                6 mesi di prova gratuita
              </h2>
              <p className="text-lg partner-muted-text">
                Nessun rischio, nessun vincolo. Prova tutto e decidi dopo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 sm:p-10 relative shadow-lg border border-gray-200"
            >
              {/* Tag Offerta lancio */}
              <div className="absolute top-0 right-0 flex items-center gap-1.5 partner-btn-primary text-white text-xs font-semibold px-4 py-2 rounded-bl-2xl">
                <Gift className="w-3 h-3" />
                Offerta lancio
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side - Pricing */}
                <div className="space-y-4 md:pr-8 md:border-r md:border-gray-200">
                  <div>
                    <div className="flex items-baseline mb-3">
                      <div className="text-5xl sm:text-6xl font-bold partner-foreground-text leading-none">
                        €0
                      </div>
                      <div className="text-base partner-muted-text leading-none ml-2 -mt-5">
                        /6 mesi
                      </div>
                    </div>
                    <p className="text-lg partner-foreground-text mb-4">
                      Accesso completo senza limitazioni
                    </p>
                  </div>

                  <div className="space-y-3 mb-12">
                    {[
                      'Nessuna carta richiesta',
                      'Nessun vincolo di rinnovo',
                      'Tu decidi se continuare'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="partner-check w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm partner-foreground-text">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/partner/registrazione" className="block mt-6">
                    <Button
                      size="default"
                      className="partner-btn-primary font-semibold text-lg px-8 py-4 rounded-full w-full"
                    >
                      Inizia la prova gratuita
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>

                  {/* Divider mobile only */}
                  <div className="block md:hidden border-t border-gray-200 my-8" />
                </div>

                {/* Right Side - Features */}
                <div className="md:pl-8">
                  <h3 className="text-lg font-bold partner-foreground-text mb-4">
                    Tutto incluso:
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Accesso completo a tutte le funzionalità',
                      'Agenda interattiva con prenotazioni online',
                      'Gestione clienti illimitata',
                      'Reminder automatici via email',
                      'Storico e percorsi cliente',
                      'Sistema di matching per nuovi contatti',
                      'Supporto dedicato'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="partner-check w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm partner-foreground-text">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 7. CTA FINALE */}
        <section className="partner-section-muted py-20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.15) 0%, transparent 70%)`
            }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="partner-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
            >
              Pronto a trasformare la gestione dei tuoi clienti?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl partner-muted-text mb-8"
            >
              Registrati come professionista e inizia subito. Decidi dopo 6 mesi se continuare.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/partner/registrazione">
                <Button
                  size="lg"
                  className="partner-btn-primary font-bold text-lg px-8 py-6 rounded-full"
                >
                  Registrati come professionista
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <PartnerFooter />
    </div>
  );
}
