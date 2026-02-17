import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Calendar as CalendarIcon,
  Clock,
  ClipboardList,
  Bell,
  UserCheck,
  FolderKanban,
  Zap,
  UserPlus,
  Sparkles,
  Check,
  ArrowRight,
  ChevronUp,
  Star,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  X,
} from 'lucide-react';
import { supabase } from '@pp/shared';

function CalendarXIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" /><path d="m15 14 3 3" /><path d="m18 14-3 3" />
    </svg>
  );
}

export default function PartnerLandingPage() {
  const [screenshotTab, setScreenshotTab] = useState<'dashboard' | 'clienti'>('dashboard');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Modal feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowBackToTop(maxScroll > 0 && window.scrollY > maxScroll * 0.5);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFeedbackModal(false);
    };
    if (showFeedbackModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showFeedbackModal]);

  const handleSubmitFeedback = async () => {
    if (!feedbackName || !feedbackCategory || feedbackRating === 0 || !feedbackComment) return;
    setFeedbackSubmitting(true);
    try {
      const { error } = await supabase
        .from('landing_feedbacks')
        .insert({
          name: feedbackName.trim(),
          category: feedbackCategory,
          rating: feedbackRating,
          comment: feedbackComment.trim(),
          is_approved: false,
          source: 'landing_page',
        });
      if (error) throw error;
      setFeedbackSent(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSent(false);
        setFeedbackName('');
        setFeedbackCategory('');
        setFeedbackRating(0);
        setFeedbackComment('');
      }, 3000);
    } catch (err) {
      console.error('Feedback error:', err);
      alert('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const scrollToProblema = () => {
    document.getElementById('problema')?.scrollIntoView({ behavior: 'smooth' });
  };

  const problemCards = [
    { title: 'Clienti frammentati', description: 'Contatti sparsi tra WhatsApp, fogli, app diverse. Nessuna visione d\'insieme del percorso del cliente.', Icon: Users },
    { title: 'WhatsApp come gestionale', description: 'Conferme, cancellazioni, promemoria: tutto manuale. Conversazioni perse, tempo sprecato a cercare.', Icon: MessageSquare },
    { title: 'Appuntamenti nel caos', description: 'Calendari multipli, sovrapposizioni, dimenticanze, no-show. Il caos organizzativo quotidiano.', Icon: CalendarXIcon },
    { title: 'Tempo perso in burocrazia', description: 'Troppe ore spese in organizzazione invece che con i clienti. La gestione divora la tua giornata.', Icon: Clock },
  ];

  const solutionFeatures = [
    { title: 'Agenda Smart', description: 'Gestisci disponibilità e appuntamenti. I clienti prenotano solo quando sei libero.', Icon: CalendarIcon },
    { title: 'Gestione Appuntamenti', description: 'Prenotazioni automatiche, conferme e promemoria. Tutto in un unico posto.', Icon: ClipboardList },
    { title: 'Reminder Automatici', description: 'Notifiche e promemoria per te e i clienti. Meno dimenticanze, più efficienza.', Icon: Bell },
    { title: 'Storico Cliente', description: 'Profilo completo con storico sessioni, note e progressi. Sempre a portata di click.', Icon: UserCheck },
    { title: 'Gestione Progetti', description: 'Percorsi personalizzati per ogni cliente. Obiettivi, scadenze e follow-up.', Icon: FolderKanban },
    { title: 'Tempo Risparmiato', description: 'Meno burocrazia, più focus sui clienti. Automatizza le attività ripetitive.', Icon: Zap },
  ];

  const benefits = [
    { value: '10+', label: 'Ore risparmiate a settimana', desc: 'Meno burocrazia, più tempo per i tuoi clienti' },
    { value: '-70%', label: 'Stress organizzativo', desc: 'Tutto automatizzato e sotto controllo' },
    { value: '100%', label: 'Clienti ordinati', desc: 'Storico, contatti e progressi sempre a portata' },
    { value: '24/7', label: 'Prenotazioni attive', desc: 'I clienti prenotano anche quando dormi' },
  ];

  const pricingFeatures = [
    'Agenda e gestione disponibilità',
    'Prenotazioni automatiche',
    'Gestione clienti illimitata',
    'Analytics e report',
    'Pagamenti integrati (Stripe/PayPal)',
    'Profilo su Prime Pro Finder',
    'Supporto dedicato',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ========== 1. NAVBAR ========== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1 font-bold text-xl">
            <span className="text-gray-900">Prime</span>
            <span className="text-[#EEBA2B]">Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 transition hidden sm:block"
            >
              Feedback
            </button>
            <Link to="/partner/login" className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 transition">
              Accedi
            </Link>
            <Link to="/partner/registrazione" className="px-5 py-2.5 text-sm font-semibold bg-[#EEBA2B] text-black rounded-lg hover:bg-[#d4a826] transition shadow-sm">
              Inizia Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== 2. HERO ========== */}
      <section className="bg-white relative overflow-hidden py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#1E3A5F]/20 bg-[#EBF2FF] text-[#1E3A5F] px-4 py-1.5 text-sm font-medium mb-6"
          >
            3 mesi di prova gratuita
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
          >
            Il gestionale <span className="text-[#EEBA2B]">smart</span> che lavora per te.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-3"
          >
            Tu pensi ai tuoi clienti, <span className="text-[#EEBA2B] font-semibold">PrimePro</span> fa il resto.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base text-gray-400 max-w-xl mx-auto mb-10"
          >
            Agenda, prenotazioni, clienti, analytics e pagamenti, tutto in un'unica piattaforma.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/partner/registrazione"
              className="inline-flex items-center justify-center gap-2 bg-[#EEBA2B] text-black font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#d4a826] shadow-lg shadow-[#EEBA2B]/25 transition-all hover:shadow-xl hover:shadow-[#EEBA2B]/30 hover:-translate-y-0.5"
            >
              Inizia la prova gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={scrollToProblema}
              className="text-gray-500 hover:text-gray-900 underline underline-offset-4 transition"
            >
              Scopri le funzionalità ↓
            </button>
          </motion.div>
        </div>
      </section>

      {/* ========== 3. IL PROBLEMA CHE CONOSCI BENE ========== */}
      <section id="problema" className="bg-[#F8F9FA] py-16 md:py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-3"
          >
            Il problema che conosci bene
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-500 text-center mb-12 max-w-2xl mx-auto"
          >
            Se sei un professionista del fitness, almeno uno di questi problemi ti suona familiare.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {problemCards.map(({ title, description, Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <div className="bg-[#EEBA2B]/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#EEBA2B]" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 4. LA SOLUZIONE ========== */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            La soluzione: tutto in un unico posto
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutionFeatures.map(({ title, description, Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#EEBA2B]/40 transition-all duration-300"
              >
                <div className="bg-[#EEBA2B]/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#EEBA2B]" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 5. L'INTERFACCIA — Screenshot ========== */}
      <section className="bg-[#F8F9FA] py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-3"
          >
            Un'interfaccia pensata per te
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-500 text-center mb-10"
          >
            Pulita, intuitiva e progettata per semplificarti la vita.
          </motion.p>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setScreenshotTab('dashboard')}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  screenshotTab === 'dashboard' ? 'bg-[#EEBA2B] text-black' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                type="button"
                onClick={() => setScreenshotTab('clienti')}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  screenshotTab === 'clienti' ? 'bg-[#EEBA2B] text-black' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                👥 Gestione Clienti
              </button>
            </div>
            <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden bg-white">
              <AnimatePresence mode="wait">
                {screenshotTab === 'dashboard' ? (
                  <motion.img
                    key="dashboard"
                    src="/images/dashboard-overview.png"
                    alt="Screenshot dashboard PrimePro: overview con KPI e prossimi appuntamenti"
                    loading="lazy"
                    className="w-full h-auto block"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <motion.img
                    key="clienti"
                    src="/images/dashboard-clienti.png"
                    alt="Screenshot pagina Clienti PrimePro: rubrica e gestione clienti"
                    loading="lazy"
                    className="w-full h-auto block"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. NUOVI CONTATTI E MATCHING ========== */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            Non solo gestione: nuovi clienti per te
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm"
            >
              <div className="bg-[#EBF2FF] p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-[#1E3A5F]" />
              </div>
              <h3 className="text-gray-900 font-semibold text-xl mb-3">Contatti da utenti attivi</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Gli utenti di Performance Prime cercano professionisti nella tua zona. Il tuo profilo su Prime Pro Finder li porta direttamente da te.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm"
            >
              <div className="bg-[#EEBA2B]/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#EEBA2B]" />
              </div>
              <h3 className="text-gray-900 font-semibold text-xl mb-3">Matching intelligente</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Il nostro algoritmo suggerisce il tuo profilo ai clienti più compatibili con le tue specializzazioni e la tua zona.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== 7. I BENEFICI ========== */}
      <section className="bg-[#F8F9FA] py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            I risultati parlano chiaro
          </motion.h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(({ value, label, desc }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center"
              >
                <p className="text-4xl font-bold text-[#EEBA2B] mb-2">{value}</p>
                <p className="text-gray-900 font-semibold text-sm mb-1">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 8. PRICING ========== */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-10"
          >
            Inizia gratis, senza impegno
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white border-2 border-[#EEBA2B] rounded-2xl p-8 shadow-lg shadow-[#EEBA2B]/10 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#EEBA2B] text-black text-xs font-bold px-3 py-1 rounded-full">
                OFFERTA LANCIO
              </span>
            </div>
            <div className="text-center mb-6 pt-2">
              <span className="text-5xl font-bold text-gray-900">€0</span>
              <span className="text-gray-500 text-lg ml-1">/3 mesi</span>
              <p className="text-gray-400 text-sm mt-1">poi €50/mese</p>
            </div>
            <h3 className="text-gray-900 font-semibold mb-4">Tutto incluso</h3>
            <ul className="space-y-3 mb-8">
              {pricingFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/partner/registrazione"
              className="block w-full text-center bg-[#EEBA2B] text-black font-semibold py-4 rounded-xl hover:bg-[#d4a826] transition"
            >
              Inizia la prova gratuita
              <ArrowRight className="w-5 h-5 inline-block ml-1 align-middle" />
            </Link>
            <p className="mt-4 text-sm text-gray-400 text-center">
              <span className="text-emerald-500 font-semibold">✓</span> Nessuna carta richiesta · <span className="text-emerald-500 font-semibold">✓</span> Cancella quando vuoi
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========== FEEDBACK PROFESSIONISTI ========== */}
      <section id="feedback" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 text-center mb-2"
          >
            Cosa dicono i professionisti
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-gray-500 text-center mb-10"
          >
            I feedback di chi usa PrimePro ogni giorno
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10">
            {[
              { quote: 'Finalmente un gestionale pensato per chi lavora nel fitness. L\'agenda smart mi ha fatto risparmiare ore ogni settimana.', name: 'Marco R.', category: 'Personal Trainer' },
              { quote: 'I miei clienti adorano il sistema di prenotazione. Professionale e semplice, esattamente quello che cercavo.', name: 'Laura M.', category: 'Nutrizionista' },
              { quote: 'Il report per il commercialista è una manna dal cielo. Prima perdevo mezza giornata, ora un click e ho tutto.', name: 'Andrea S.', category: 'Fisioterapista' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-[#EEBA2B]/30 transition-all duration-200"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((_) => (
                    <Star key={_} className="w-4 h-4 text-[#EEBA2B] fill-[#EEBA2B]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mt-3">&ldquo;{item.quote}&rdquo;</p>
                <div className="h-px bg-gray-100 my-4" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-emerald-600 text-xs">Verificato</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="inline-flex items-center justify-center gap-2 border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B] hover:text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              <MessageSquarePlus className="w-5 h-5" />
              Hai provato PrimePro? Lascia il tuo feedback
            </button>
          </div>
        </div>
      </section>

      {/* ========== CTA FINALE ========== */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pronto a provare PrimePro?
            </h2>
            <p className="text-gray-500 mb-8">
              Unisciti ai professionisti che hanno scelto il nostro gestionale.
            </p>
            <Link
              to="/partner/registrazione"
              className="inline-flex items-center justify-center gap-2 bg-[#EEBA2B] text-black font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#d4a826] shadow-lg shadow-[#EEBA2B]/25 transition"
            >
              Registrati
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== 10. FOOTER ========== */}
      <footer className="bg-[#F8F9FA] border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 font-bold text-lg">
              <span className="text-gray-900">Prime</span>
              <span className="text-[#EEBA2B]">Pro</span>
            </Link>
            <p className="text-gray-500 text-sm mt-2">
              La piattaforma per professionisti del fitness in Italia
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold text-sm mb-2">Link</p>
            <ul className="space-y-2">
              <li>
                <Link to="/partner/privacy" className="text-gray-500 hover:text-[#EEBA2B] text-sm transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/partner/terms" className="text-gray-500 hover:text-[#EEBA2B] text-sm transition">
                  Termini e Condizioni
                </Link>
              </li>
              <li>
                <Link to="/partner/cookies" className="text-gray-500 hover:text-[#EEBA2B] text-sm transition">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 text-sm">
              © 2026 Performance Prime. Tutti i diritti riservati.
            </p>
            <p className="text-gray-400 text-sm mt-1">Email: primeassistenza@gmail.com</p>
            <p className="text-gray-400 text-sm mt-0.5">P.IVA: 17774791002</p>
          </div>
        </div>
      </footer>

      {/* Modal Feedback */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Chiudi"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowFeedbackModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
              {feedbackSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Grazie per il tuo feedback!</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Il tuo commento sarà visibile sulla pagina dopo la nostra verifica.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 pr-8">Lascia il tuo feedback</h3>
                  <p className="text-sm text-gray-500 mt-1">La tua opinione ci aiuta a migliorare PrimePro</p>
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      placeholder="Il tuo nome (es. Marco R.)"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent outline-none transition-all"
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">La tua professione *</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent outline-none transition-all"
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                    >
                      <option value="">Seleziona...</option>
                      <option value="Personal Trainer" className="text-gray-900 bg-white">Personal Trainer</option>
                      <option value="Nutrizionista" className="text-gray-900 bg-white">Nutrizionista</option>
                      <option value="Fisioterapista" className="text-gray-900 bg-white">Fisioterapista</option>
                      <option value="Mental Coach" className="text-gray-900 bg-white">Mental Coach</option>
                      <option value="Osteopata" className="text-gray-900 bg-white">Osteopata</option>
                      <option value="Altro" className="text-gray-900 bg-white">Altro</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valutazione *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]/50"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFeedbackRating(star)}
                        >
                          <Star
                            className={`w-7 h-7 cursor-pointer transition-colors ${
                              star <= (hoverRating || feedbackRating) ? 'text-[#EEBA2B] fill-[#EEBA2B]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Il tuo feedback *</label>
                    <textarea
                      placeholder="Cosa ti piace di PrimePro? Cosa possiamo migliorare?"
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#EEBA2B] focus:border-transparent outline-none resize-none transition-all"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{feedbackComment.length}/500</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackName || !feedbackCategory || feedbackRating === 0 || !feedbackComment || feedbackSubmitting}
                    className="w-full mt-5 bg-[#EEBA2B] hover:bg-[#d4a826] text-black font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {feedbackSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Invia Feedback
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Il tuo feedback potrà essere pubblicato in forma anonima sulla landing page dopo verifica.
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label="Torna su"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:border-[#EEBA2B]/50 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#EEBA2B]/30"
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
