import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Heart, Baby, Stethoscope, Shield, Calendar, 
  Video, MessageCircle, Wallet, BookOpen, Bell, Clock,
  Users, TrendingUp, Smartphone, Globe, Lock, CheckCircle,
  Star,  ChevronRight, ChevronLeft, Play, Download, Phone, Mail, MapPin,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';
import logo from '../assets/logo.png';
import ChatMaman from '../components/ChatMaman';

// COMPOSANT DE COMPTAGE GÉANT
function Counter({ end, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime;
    let animationFrame;
    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) animationFrame = requestAnimationFrame(updateCount);
      else setCount(end);
    };
    animationFrame = requestAnimationFrame(updateCount);
    return () => animationFrame && cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// --- CARROUSEL TÉMOIGNAGE XXL ---
function TestimonialCarousel({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);

  const next = () => { setDirection(1); setCurrentIndex((prev) => (prev + 1) % testimonials.length); };
  const prev = () => { setDirection(-1); setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length); };

  useEffect(() => {
    if (!isHovering) intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, isHovering]);

  const t = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-[95%] mx-auto" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <div className="overflow-hidden rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white border-8 border-white">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentIndex} custom={direction}
            variants={{ enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }) }}
            transition={{ duration: 0.6, ease: "anticipate" }} initial="enter" animate="center" exit="exit"
            className="bg-slate-900 p-16 md:p-32 flex flex-col lg:flex-row items-center gap-20"
          >
            <div className="w-64 h-64 md:w-[450px] md:h-[450px] rounded-[4rem] overflow-hidden border-[15px] border-white/10 shadow-3xl shrink-0 rotate-3">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center lg:text-left text-white space-y-12">
                <div className="flex justify-center lg:justify-start gap-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={60} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-4xl md:text-7xl font-black italic leading-[1.1]">"{t.text}"</p>
                <div>
                   <h4 className="text-6xl md:text-8xl font-[1000] tracking-tighter uppercase text-[#FF7096]">{t.name}</h4>
                   <p className="text-3xl md:text-5xl text-[#059669] font-black mt-4 uppercase tracking-widest">{t.role}</p>
                </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* FLÈCHES GÉANTES */}
      <button onClick={prev} className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 z-50 bg-white text-slate-900 p-5 md:p-6 rounded-full shadow-3xl hover:scale-110 transition-all"><ChevronLeft size={34}/></button>
      <button onClick={next} className="absolute -right-6 md:-right-8 top-1/2 -translate-y-1/2 z-50 bg-white text-slate-900 p-5 md:p-6 rounded-full shadow-3xl hover:scale-110 transition-all"><ChevronRight size={34}/></button>
    </div>
  );
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: 500, label: 'Naissances suivies', image: '/naissance-bebe.jpg', suffix: '+', color: '#FF7096' },
    { value: 120, label: 'Professionnels', image: '/medecin1.jpg', suffix: '+', color: '#059669' },
    { value: 98, label: 'Satisfaction', image: '/patiente13.jpg', suffix: '%', color: '#FF7096' },
    { value: 24, label: 'Support urgence', image: '/support-urgence.jpg', suffix: '/7', color: '#059669' }
  ];

  const testimonials = [
    { name: "Dr. ADJOVI Marc", role: "Gynécologue", text: "Cette plateforme a révolutionné mon suivi de grossesse. Un gain de temps exceptionnel.", image: '/t7.png' },
    { name: "Mme DOSSOU Fatima", role: "Patiente, 32 SA", text: "Je me sens enfin sereine et accompagnée à chaque instant. Merci e-CPN.", image: '/t4.png' },
    { name: "Sage-femme KOUASSI", role: "Maternité CNHU", text: "L'alerte urgence m'a permis de prendre en charge rapidement une patiente.", image: '/t8.png' },
    { name: "Mme HOUNTON Sarah", role: "Patiente, 28 SA", text: "Je retrouve mes rendez-vous, mes conseils et mes messages dans un seul espace. C'est simple et rassurant.", image: '/t3.png' },
    { name: "Dr. GBAGUIDI Hervé", role: "Obstétricien", text: "Le suivi numérique facilite la communication avec les patientes et nous aide à agir plus vite.", image: '/t5.png' },
    { name: "Mme TCHIBOZO Aline", role: "Nouvelle maman", text: "Pendant toute ma grossesse, j'ai gardé le contact avec mon équipe médicale sans me sentir seule.", image: '/t6.png' }
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-[#059669] selection:text-white overflow-x-hidden">
      
      {/* --- NAVIGATION XXL --- */}
<motion.nav 
  className={`fixed top-0 left-0 w-full z-[200] transition-all duration-500 ${scrollY > 50 ? 'bg-white shadow-[0_20px_80px_rgba(0,0,0,0.15)] py-6' : 'bg-white/90 backdrop-blur-xl py-12'}`}
>
  <div className="max-w-[95%] mx-auto flex items-center justify-between">
    <div onClick={() => navigate('/')} className="flex items-center gap-8 cursor-pointer group">
      <img src={logo} alt="Logo" className="w-24 h-24 md:w-36 md:h-36 object-contain drop-shadow-2xl" />
      <div className="flex flex-col">
         <span className="text-5xl md:text-7xl font-[1000] text-slate-900 tracking-tighter leading-none">CPN-BÉNIN</span>
         <span className="text-xl md:text-2xl font-black text-[#059669] tracking-[.3em] uppercase opacity-70">Ministère de la Santé</span>
      </div>
    </div>

    {/* NAVIGATION DESKTOP */}
    <div className="hidden lg:flex items-center gap-16 font-[1000] uppercase text-3xl tracking-tighter">
       <a href="#features" className="text-slate-400 hover:text-slate-950 transition-colors">Fonctionnalités</a>
       <a href="#testimonials" className="text-slate-400 hover:text-slate-950 transition-colors">Témoignages</a>
       <div className="flex gap-8 items-center pl-10 border-l-4 border-slate-100">
          <button onClick={() => navigate('/login')} className="px-15 py-7 border-3 border-slate-950 rounded-[2.5rem] text-slate-750 hover:bg-slate-950 hover:text-white transition-all shadow-xl font-normal">Connexion</button>
          <button onClick={() => navigate('/register')} className="px-12 py-7 bg-[#FF7096] text-white rounded-[2.5rem] shadow-2xl hover:scale-105 hover:bg-[#ff5a87] transition-all font-normal">S'inscrire</button>
       </div>
    </div>
    
    {/* BOUTON HAMBURGER MOBILE */}
    <button className="lg:hidden p-6 bg-slate-100 rounded-3xl z-[201]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
       {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
    </button>
  </div>

  {/* MENU MOBILE DÉROULANT */}
  <AnimatePresence>
    {isMenuOpen && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="lg:hidden bg-white w-full border-t border-slate-100 p-12 flex flex-col gap-10 text-center absolute top-full left-0 shadow-2xl"
      >
        <a href="#features" className="text-4xl font-black uppercase text-slate-900" onClick={() => setIsMenuOpen(false)}>Fonctionnalités</a>
        <a href="#testimonials" className="text-4xl font-black uppercase text-slate-900" onClick={() => setIsMenuOpen(false)}>Témoignages</a>
        <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="text-4xl font-black uppercase text-slate-500 py-6">Connexion</button>
        <button onClick={() => { navigate('/register'); setIsMenuOpen(false); }} className="w-full py-8 bg-[#FF7096] text-white rounded-[2rem] text-4xl font-black uppercase">S'inscrire</button>
      </motion.div>
    )}
  </AnimatePresence>
</motion.nav>
      {/* --- HERO SECTION MONSTRUEUSE --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-48 pb-24 bg-[#0F172A]">
        <div className="absolute inset-0 z-0">
          <img src="/accueil.png" className="w-full h-full object-cover opacity-30 scale-110" alt="Hero"/>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#0F172A]" />
        </div>

        <div className="relative z-10 w-full px-12 text-center max-w-[1800px] mx-auto">
            {/* BADGE XXL */}
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center bg-white/10 backdrop-blur-3xl p-4 md:p-6 rounded-full mb-20 border-4 border-white/20">
                <span className="bg-[#059669] text-white px-12 py-4 rounded-full text-3xl md:text-5xl font-[1000] uppercase shadow-2xl animate-pulse">NOUVEAU</span>
                <span className="text-white font-black px-12 text-3xl md:text-5xl tracking-tight">Plateforme Officielle au Bénin 🇧🇯</span>
            </motion.div>

 <motion.h1
  initial={{ opacity: 0, x: -100, scale: 0.7 }}
  animate={{ opacity: 1, x: 0, scale: 0.7 }}
  transition={{ duration: 1, delay: 0.3 }}
  className="text-[02vw] md:text-[08vw] font-[500] text-white leading-[0.9] tracking-tighter uppercase mb-16"
>
    Votre Grossesse <br/><span className="text-[#FF7096]">En Toute Sérénité</span>
</motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-4xl md:text-7xl text-slate-300 font-light italic mb-20 max-w-7xl mx-auto leading-tight"
            >
               "L'accompagnement numérique d'excellence pour chaque future maman."
            </motion.p>

          <div className="flex flex-col md:flex-row justify-center gap-12 scale-[0.600]">
  <button 
    onClick={() => navigate('/register')} 
    className="group px-20 py-10 bg-[#FF7096] text-white rounded-[3.5rem] font-[1000] text-5xl shadow-[0_40px_80px_rgba(255,112,150,0.4)] hover:scale-110 hover:bg-[#ff5a87] transition-all flex items-center justify-center gap-6"
  >
    C'EST PARTI ! <ArrowRight size={70}/>
  </button>

  <button className="px-20 py-10 bg-white/5 border-4 border-white text-white rounded-[3.5rem] font-[1000] text-5xl hover:bg-white hover:text-slate-900 transition-all shadow-2xl backdrop-blur-lg">
    VOIR DÉMO
  </button>
</div>
        </div>
      </section>

      {/* --- STATS SECTION "DALLES GÉANTES" --- */}
      <section className="py-40 bg-white relative z-10 border-b-8 border-slate-50">
        <div className="w-[95%] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-16">
           {stats.map((s, i) => (
             <motion.div key={i} whileHover={{ scale: 1.05 }} className="p-20 rounded-[5rem] bg-slate-50 border-4 border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.06)] text-center flex flex-col items-center group transition-all">
                <div className="w-56 h-56 rounded-[3rem] overflow-hidden mb-12 border-8 shadow-3xl transition-transform group-hover:-rotate-6" style={{borderColor: s.color}}>
                   <img src={s.image} className="w-full h-full object-cover" alt={s.label}/>
                </div>
                <h3 className="text-[10rem] md:text-[13rem] font-[1000] leading-none mb-8 tracking-tighter" style={{color: s.color}}>
                  <Counter end={s.value} suffix={s.suffix} />
                </h3>
                <p className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tight opacity-80">{s.label}</p>
             </motion.div>
           ))}
        </div>
      </section>
{/* --- SECTION FONCTIONNALITÉS AVEC ANIMATIONS CROISÉES XXL --- */}
<section id="features" className="py-32 md:py-64 bg-[#F1F5F9] overflow-hidden">
  <div className="max-w-[1700px] mx-auto px-6">
    
    {/* En-tête (Animation d'apparition simple) */}
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-48"
    >
       <h2 className="text-3xl md:text-[10rem] font-[1000] text-slate-900 tracking-tighter uppercase leading-[0.85]">
         VOTRE GROSSESSE <span className="text-[#FF7096]">TRANSFORMÉE</span>
       </h2>
    </motion.div>

    <div className="space-y-64">
      
      {/* 01 - MESSAGERIE DIRECTE */}
      <div className="flex flex-col xl:flex-row items-center gap-24">
        
        {/* IMAGE : Vient de la DROITE (x: 200) */}
        <motion.div 
          initial={{ opacity: 0, x: 200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 w-full bg-[#E2E8F0] p-6 md:p-12 rounded-[4rem] shadow-sm border border-slate-200"
        >
           <div className="overflow-hidden rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] bg-white">
              <img src="/capture-messagerie.png" className="w-full h-auto object-cover" alt="Messagerie" />
           </div>
        </motion.div>

        {/* TEXTE : Vient de la GAUCHE (x: -200) */}
        <motion.div 
          initial={{ opacity: 0, x: -200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 space-y-12"
        >
           <span className="inline-block bg-[#FF7096] text-white px-10 py-4 rounded-full text-3xl md:text-4xl font-[1000] uppercase tracking-widest italic shadow-xl">
              NIVEAU 01 — RÉACTIVITÉ
           </span>
           <h3 className="text-7xl md:text-[7.5rem] font-[1000] text-slate-900 leading-[0.8] tracking-tighter uppercase">
             MESSAGE <span className="text-[#FF7096]">DIRECT</span>
           </h3>
           <div className="border-l-[20px] border-[#FF7096] pl-12">
              <p className="text-4xl md:text-[3.2rem] text-slate-600 font-[1000] leading-[1.2] tracking-tight">
                Posez vos questions à tout moment et recevez des réponses instantanées de professionnels qualifiés.
              </p>
           </div>
        </motion.div>
      </div>

      {/* 02 - JOURNAL DE GROSSESSE */}
      <div className="flex flex-col xl:flex-row-reverse items-center gap-24">
        
        {/* IMAGE : Vient de la DROITE (x: 200) */}
        <motion.div 
          initial={{ opacity: 0, x: 200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 w-full bg-[#E2E8F0] p-6 md:p-12 rounded-[4rem] shadow-sm border border-slate-200"
        >
           <div className="overflow-hidden rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] bg-white">
              <img src="/capture-journal.png" className="w-full h-auto object-cover" alt="Journal" />
           </div>
        </motion.div>

        {/* TEXTE : Vient de la GAUCHE (x: -200) */}
        <motion.div 
          initial={{ opacity: 0, x: -200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 space-y-12"
        >
           <span className="inline-block bg-[#059669] text-white px-10 py-4 rounded-full text-3xl md:text-4xl font-[1000] uppercase tracking-widest italic shadow-xl">
              NIVEAU 02 — INTIMITÉ
           </span>
           <h3 className="text-7xl md:text-[7.5rem] font-[1000] text-slate-900 leading-[0.8] tracking-tighter uppercase">
             JOURNAL <span className="text-[#059669]">INTACT</span>
           </h3>
           <div className="border-l-[20px] border-[#059669] pl-12">
              <p className="text-4xl md:text-[3.2rem] text-slate-600 font-[1000] leading-[1.2] tracking-tight">
                Notez vos émotions et vos symptômes. Un carnet de bord numérique pour mieux comprendre votre santé.
              </p>
           </div>
        </motion.div>
      </div>

      {/* 03 - TABLEAU DE BORD */}
      <div className="flex flex-col xl:flex-row items-center gap-24">
        
        {/* IMAGE : Vient de la DROITE (x: 200) */}
        <motion.div 
          initial={{ opacity: 0, x: 200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 w-full bg-[#E2E8F0] p-6 md:p-12 rounded-[4rem] shadow-sm border border-slate-200"
        >
           <div className="overflow-hidden rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] bg-white">
              <img src="/capture-tableau-bord.png" className="w-full h-auto object-cover" alt="Dashboard" />
           </div>
        </motion.div>

        {/* TEXTE : Vient de la GAUCHE (x: -200) */}
        <motion.div 
          initial={{ opacity: 0, x: -200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 space-y-12"
        >
           <span className="inline-block bg-[#FF7096] text-white px-10 py-4 rounded-full text-3xl md:text-4xl font-[1000] uppercase tracking-widest italic shadow-xl">
              NIVEAU 03 — CONTRÔLE
           </span>
           <h3 className="text-7xl md:text-[7.5rem] font-[1000] text-slate-900 leading-[0.8] tracking-tighter uppercase">
             VISION <span className="text-[#FF7096]">360°</span>
           </h3>
           <div className="border-l-[20px] border-[#FF7096] pl-12">
              <p className="text-4xl md:text-[3.2rem] text-slate-600 font-[1000] leading-[1.2] tracking-tight">
                Suivez votre budget d'épargne et vos rendez-vous depuis une interface unique et centralisée.
              </p>
           </div>
        </motion.div>
      </div>

      {/* 04 - CARNET CPN */}
      <div className="flex flex-col xl:flex-row-reverse items-center gap-24">
        
        {/* IMAGE : Vient de la DROITE (x: 200) */}
        <motion.div 
          initial={{ opacity: 0, x: 200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 w-full bg-[#E2E8F0] p-6 md:p-12 rounded-[4rem] shadow-sm border border-slate-200"
        >
           <div className="overflow-hidden rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] bg-white">
              <img src="/capture-carnet.png" className="w-full h-auto object-cover" alt="Carnet" />
           </div>
        </motion.div>

        {/* TEXTE : Vient de la GAUCHE (x: -200) */}
        <motion.div 
          initial={{ opacity: 0, x: -200 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="xl:w-1/2 space-y-12"
        >
           <span className="inline-block bg-[#059669] text-white px-10 py-4 rounded-full text-3xl md:text-4xl font-[1000] uppercase tracking-widest italic shadow-xl">
              NIVEAU 04 — SÉCURITÉ
           </span>
           <h3 className="text-7xl md:text-[7.5rem] font-[1000] text-slate-900 leading-[0.8] tracking-tighter uppercase">
             SUIVI <span className="text-[#059669]">NUMÉRIQUE</span>
           </h3>
           <div className="border-l-[20px] border-[#059669] pl-12">
              <p className="text-4xl md:text-[3.2rem] text-slate-600 font-[1000] leading-[1.2] tracking-tight">
                Le carnet CPN numérique conforme aux normes O.M.S. finit les pertes de papiers.
              </p>
           </div>
        </motion.div>
      </div>

    </div>
  </div>
</section>



      {/* --- TÉMOIGNAGES (TES ANIMATIONS GÉANTES) --- */}
      <section id="testimonials" className="py-40 bg-white">
          <div className="text-center mb-40">
             <h2 className="text-[8rem] font-[1000] text-slate-700 leading-none tracking-tighter uppercase">AVIS CLIENTES</h2>
             <p className="text-3xl md:text-5xl text-[#059669] font-[1000] uppercase italic tracking-[.1em] mt-10">Plus de 1000 mamans nous font confiance</p>
          </div>
          <TestimonialCarousel testimonials={testimonials} />
      </section>

      {/* --- FOOTER MONUMENTAL --- */}
      <footer className="bg-slate-950 py-48 text-white">
         <div className="w-[80%] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-40 border-b-4 border-white/10 pb-40 mb-20">
            <div className="space-y-16">
               <div className="flex items-center gap-10">
                  <img src={logo} className="w-48 filter brightness-200 drop-shadow-3xl"/> 
                  <span className="text-5xl md:text-8xl font-[1000] tracking-tighter uppercase">e-CPN</span>
               </div>
               <p className="text-4xl md:text-5xl text-slate-400 font-black leading-[1.1] italic">Le standard d'or du suivi prénatal digital au Bénin.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
               <div className="space-y-10 text-center md:text-left">
                  <h4 className="text-4xl font-black text-[#FF7096] uppercase tracking-widest mb-16">Besoin d'aide ?</h4>
                  <div className="space-y-10 text-4xl md:text-5xl font-black text-white hover:text-[#059669] transition-colors flex items-center gap-6 justify-center md:justify-start">
                     <Mail size={40}/> info@iwajutech.com
                  </div>
                  <div className="space-y-10 text-4xl md:text-5xl font-black text-white hover:text-[#FF7096] transition-colors flex items-center gap-6 justify-center md:justify-start">
                     <Phone size={40}/> +229 01 63 39 99 96
                  </div>
               </div>
<div className="flex justify-center md:justify-start"> {/* Ce div empêche l'étirement */}
 
</div>
            </div>
         </div>
         <p className="text-center text-4xl md:text-4xl font-black text-slate-600 italic tracking-[.5em] uppercase">Made in Bénin  2026</p>
      </footer>
      
      <ChatMaman />
    </div>
  );
}
