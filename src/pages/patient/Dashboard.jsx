import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, api } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, BookOpen, ClipboardList, Calendar,
  Video, Sun, Moon, LogOut, Bell, Menu, X, ChevronRight,
  Heart, Clock, TrendingUp, Calendar as CalendarIcon, Phone,
  AlertCircle, Activity, User, ChevronLeft, ShieldAlert, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';
import doctorImg from '../../assets/doctorPhoto.png';

// Composants
import ChatMaman from '../../components/ChatMaman';
import JournalGrossesse from '../../components/Patient/JournalGrossesse';
import MonPlanNaissance from '../../components/Patient/MonPlanNaissance';
import ChatCPN from '../../components/ChatCPN';
import IncomingCall from '../../components/IncomingCall';
import OutgoingCall from '../../components/OutgoingCall';
import Teleconsultation from '../../components/Teleconsultation';
import NotificationBell from '../../components/Patient/NotificationBell';
import DemandeUrgence from '../../components/Patient/DemandeUrgence';
import CarnetPatiente from '../CarnetPatiente';


export default function PatientDashboard() {
  const { signOut, profile, token } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showUrgence, setShowUrgence] = useState(false);
  const [term, setTerm] = useState("---");
  const [stats, setStats] = useState({
    epargne: 0,
    consultations: 0,
    prochainRDV: "Aucun",
    somme_estimee: 0 // Ajout de somme_estimee
  });

  // États pour la communication dynamique
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [showTele, setShowTele] = useState(false);
  const [activeLogId, setActiveLogId] = useState(null);
  const [amITheCaller, setAmITheCaller] = useState(false);
  const callTimeoutRef = useRef(null);

  // LOGIQUE DE VÉRIFICATION DE MÉDECIN
  const isDoctorAssigned = !!profile?.patient?.assigned_pro_id;

  // --- RÉCUPÉRATION DYNAMIQUE DES DONNÉES ---
const fetchDashboardData = useCallback(async () => {
  try {
    const res = await api.get('/me');
    const patientData = res.data.patient;
    const pregData = patientData?.pregnancy_infos?.[0];

    // 1. Calcul du terme (SA)
    if (pregData?.ddr_date) {
      const weeks = Math.floor((new Date() - new Date(pregData.ddr_date)) / (1000 * 60 * 60 * 24 * 7));
      setTerm(`${weeks} SA`);
    }

    // 2. Récupération dynamique du prochain RDV via ton protocole Laravel
    const nxtRdvRes = await api.get(`/patients/${profile?.id}/next-cpn`);
    
    let prochainRDVText = "Aucun";
    if (nxtRdvRes.data.exists) {
      prochainRDVText = new Date(nxtRdvRes.data.date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
         year: 'numeric' // <--- On ajoute l'année ici
      });
    }

    // 3. Récupération du compte des consultations
    const countRes = await api.get(`/patients/${profile?.id}/consultations/count`);

    // 4. Mise à jour de l'état global
    setStats({
      epargne: patientData?.epargne_actuelle || 0,
      somme_estimee: patientData?.somme_estimee || 0,
      consultations: `${countRes.data.count}/8`, // Basé sur ton protocole de 8 CPN
      prochainRDV: prochainRDVText, 
    });

  } catch (e) {
    console.error("Erreur Dashboard:", e);
  } finally {
    setLoading(false);
  }
}, [profile?.id]);

  // --- CONFIG ET TEMPS RÉEL ---
  useEffect(() => {

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    fetchDashboardData();

    if (profile?.id) {
      const callChannel = supabase.channel(`p_signals_${profile.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telecom_signals', filter: `receiver_id=eq.${profile.id}` },
          (payload) => {
            const signal = payload.new;
            if (signal.type === 'request' && !showTele) { setIncomingCall(signal); setAmITheCaller(false); }
            if (signal.type === 'accept_handshake') {
              clearTimeout(callTimeoutRef.current);
              setIsCalling(false);
              setActiveLogId(signal.data.logId);
              setShowTele(true);
            }
            if (['cancel', 'hangup', 'declined'].includes(signal.type)) { setIncomingCall(null); setIsCalling(false); setShowTele(false); }
          }).subscribe();

      const emergencyChannel = supabase.channel(`emergency_resp_${profile.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${profile.id}`
        }, (payload) => {
          // Si le médecin passe l'urgence de 'pending' à 'in_progress'
          if (payload.new.type === 'Urgence' && payload.new.status === 'in_progress') {
            toast.custom((t) => (
              <div className="bg-rose-600 text-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce">
                <Bell size={40} />
                <div>
                  <p className="font-black uppercase">ALERTE MÉDICALE</p>
                  <p>Le médecin vous attend pour traiter votre urgence !</p>
                </div>
              </div>
            ), { duration: 10000 });

            // Rediriger ou ouvrir la messagerie automatiquement
            setActiveTab('messagerie');
          }
        }).subscribe();

      return () => {
        supabase.removeChannel(callChannel);
        supabase.removeChannel(emergencyChannel);
      };
    }
  }, [profile, fetchDashboardData, token]);

  const handleStartCall = async () => {
    if (!isDoctorAssigned)
      return toast.error("Aucun médecin assigné.");

    const logId = Date.now().toString();

    setIsCalling(true);
    setAmITheCaller(true);
    setActiveLogId(logId);

    await supabase.from('telecom_signals').insert({
      sender_id: profile.id,
      receiver_id: profile.patient.assigned_pro_id,
      type: 'request',
      data: {
        logId,
        callerName: `Mme ${profile.nom}`
      }
    });
  };

  const docInfo = profile?.patient?.assigned_pro?.profile;
  const doctorPhoto = docInfo?.photo_url || doctorImg;

  // Filtrage dynamique de la navigation
  const navigationItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={34} />, label: 'Tableau de bord', menuLabel: 'Dashboard' },
    { id: 'journal', icon: <BookOpen size={34} />, label: 'Journal de grossesse', menuLabel: 'Journal' },
    { id: 'plan', icon: <ClipboardList size={34} />, label: 'Plan de naissance', menuLabel: 'Plan' },
    { id: 'rendezvous', icon: <Calendar size={34} />, label: 'Rendez-vous', menuLabel: 'Rendez-vous' },
    { id: 'messagerie', icon: <MessageSquare size={34} />, label: 'Messagerie', menuLabel: 'Messagerie' },
  ].filter(item => isDoctorAssigned || item.id === 'dashboard');

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin"></div></div>;


  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    await supabase.from('telecom_signals').insert({
      sender_id: profile.id,
      receiver_id: incomingCall.sender_id,
      type: 'accept_handshake',
      data: {
        logId: incomingCall.data?.logId
      }
    });

    setActiveLogId(incomingCall.data?.logId);
    setIncomingCall(null);
    setShowTele(true);
    setAmITheCaller(false);
  };



  return (
    <div className={`min-h-screen relative font-sans ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F8F9FA]'}`}>

      <div className="fixed inset-0 z-0">
<div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: `url('/ta_nouvelle_image.jpg')` }}></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:w-[210px] bg-white border-r border-gray-100 shadow-2xl`}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-10">
            <div className="flex flex-col gap-6 mb-12 relative">
              <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-0 right-0 p-2"><X size={32} /></button>
              <div className="relative w-80 h-80">
                <img src={profile?.photo_url || logo} className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div>
                <h2 className="font-black text-gray-800 text-5xl leading-tight mb-2">Mme {profile?.nom}</h2>
                <p className="text-2xl text-[#00A651] font-black uppercase"></p>
              </div>
            </div>

            <nav className="space-y-6">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-5 px-6 py-7 rounded-[30px] transition-all duration-300 ${activeTab === item.id
                    ? 'bg-[#00A651]/10 text-[#00A651] border-r-[10px] border-[#00A651] shadow-md scale-105'
                    : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-[18px] leading-none font-black whitespace-nowrap">{item.menuLabel}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-10">
            <button onClick={signOut} className="flex items-center gap-4 text-gray-400 hover:text-red-500 font-black text-4xl">
              <LogOut size={28} /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 lg:ml-[280px] min-h-screen p-8 lg:p-12">
        <header className="flex items-center justify-between mb-12 w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-4 bg-white/80 rounded-2xl">
              <Menu size={32} />
            </button>

            {isDoctorAssigned ? (
              <button onClick={() => setShowUrgence(true)} className="bg-[#FF3B5C] text-white px-10 py-4 rounded-2xl font-black text-4xl flex items-center gap-3 shadow-xl animate-pulse">
                <AlertCircle size={28} /> Urgence
              </button>
            ) : (
              <div className="bg-slate-100 text-slate-400 px-8 py-4 rounded-2xl font-black text-sm uppercase italic flex items-center gap-3 border border-slate-200">
                <ShieldAlert size={24} /> Suivi non activé
              </div>
            )}

            <button
              onClick={handleStartCall}
              className={`p-4 rounded-2xl shadow-xl ${isDoctorAssigned ? 'bg-[#00D084] text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              <Video size={28} />
            </button>
          </div>

          {/* Ici on pousse la cloche vers la droite */}
          <div className="ml-auto flex items-center gap-4">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
              <NotificationBell />
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-4 text-gray-400">
              <Moon size={28} />
            </button>
          </div>
        </header>
{activeTab === 'dashboard' && (<div className="space-y-10">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
    {[
      {
        label: 'Épargne / Budget',
        val: (
          <div className="flex flex-col gap-3">
            {/* ÉPARGNE ACTUELLE (VERT) */}
            <span className="text-[#00A651] text-xl lg:text-3xl font-black leading-none">
              {Number(stats.epargne).toLocaleString()} F
            </span>

            {/* BARRE DE PROGRESSION */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min((stats.epargne / stats.somme_estimee) * 100 || 0, 100)}%` }}
              />
            </div>

            {/* BUDGET TOTAL (ROSE ET GROS) */}
            <span className="text-[#FF3B82] text-lg lg:text-2xl font-black leading-none tracking-tight">
              But: {Number(stats.somme_estimee).toLocaleString()} F
            </span>
          </div>
        ),
        icon: <TrendingUp size={24} />,
        col: 'bg-emerald-500'
      },
      { label: 'Semaines', val: term, icon: <Clock size={24} />, col: 'bg-blue-500' },
      { label: 'Consultations', val: stats.consultations, icon: <Activity size={24} />, col: 'bg-orange-500' },
      { 
        label: 'Prochain RDV', 
        val: stats.prochainRDV === "Aucun" ? "Aucun" : (
          <span className="text-[#FF3B82] text-2xl lg:text-5xl font-black italic leading-none tracking-tighter">
            {stats.prochainRDV}
          </span>
        ), 
        icon: <CalendarIcon size={24} />, 
        col: 'bg-rose-500' 
      },
    ].map((s, i) => (
      <div key={i} className="bg-white p-5 lg:p-10 rounded-[25px] lg:rounded-[40px] shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all border border-gray-50">
        {/* Icône en haut à droite */}
        <div className={`absolute top-4 right-4 lg:top-8 lg:right-8 p-2 lg:p-4 rounded-xl lg:rounded-[25px] text-white ${s.col} shadow-lg shadow-inherit/20 z-10`}>
          {s.icon}
        </div>
        
        {/* pr-20 pour forcer le texte à s'arrêter avant l'icône */}
        <div className="pr-16 lg:pr-24 text-left relative z-0">
          <p className="text-gray-400 font-black text-2xl lg:text-2xl uppercase mb-2 lg:mb-4 tracking-wider">
            {s.label}
          </p>
          {/* Si val est un objet (JSX), on l'affiche, sinon on affiche le texte standard */}
          {typeof s.val === 'object' ? (
            s.val
          ) : (
            <p className="text-xl lg:text-4xl font-black text-gray-800 tracking-tight leading-tight">
              {s.val}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>

  {isDoctorAssigned ? (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="bg-white p-12 rounded-[50px] shadow-sm flex flex-col md:flex-row items-center gap-10 text-left">
        <div className="relative w-32 h-32 flex-shrink-0">
          <img src={doctorPhoto} className="w-full h-full rounded-[35px] object-cover border-4 border-gray-50" alt="Doctor" />
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-2">Votre medecin référent</p>
          <h3 className="text-6xl font-black text-gray-800 tracking-tight">Dr. {docInfo?.nom || "Non assigné"}</h3>
        </div>
        <div className="flex gap-6">
          <button onClick={() => setActiveTab('messagerie')} className="bg-[#FF3B82] text-white px-10 py-5 rounded-[30px] font-black text-5xl shadow-2xl shadow-rose-100">Message</button>
          <button onClick={handleStartCall} className="border-4 border-gray-100 text-gray-700 px-10 py-5 rounded-[30px] font-black text-5xl">Appeler</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Journal', icon: <BookOpen size={54} />, col: 'text-blue-500', tab: 'journal' },
          { label: 'Plan', icon: <ClipboardList size={54} />, col: 'text-purple-500', tab: 'plan' },
          { label: 'RDV', icon: <Calendar size={64} />, col: 'text-orange-500', tab: 'rendezvous' },
          { label: 'Messages', icon: <MessageSquare size={54} />, col: 'text-emerald-500', tab: 'messagerie' },
        ].map((a, i) => (
          <button key={i} onClick={() => setActiveTab(a.tab)} className="bg-white/40 backdrop-blur-sm p-10 lg:p-12 rounded-[40px] border border-gray-100 flex flex-col items-center justify-center gap-7 min-h-[170px] transition-all hover:translate-y-[-8px]">
            <div className={`p-6 rounded-[30px] bg-gray-50 ${a.col}`}>{a.icon}</div>
            <span className="font-black text-gray-800 text-3xl lg:text-4xl leading-none text-center">{a.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  ) : (
    <div className="p-20 bg-white/60 backdrop-blur-md rounded-[50px] border-4 border-dashed border-slate-200 text-center">
      <p className="text-4xl font-black uppercase text-slate-400 italic">
        L'administration n'a pas encore assigné de médecin à votre dossier.<br />
        Veuillez patienter pour débloquer votre suivi médical.
      </p>
    </div>
  )}
</div>)}
        <div className="mt-10 text-left">
          {isDoctorAssigned && (
            <>
             {activeTab === 'journal' && profile?.id && (
  <JournalGrossesse 
    patientId={profile.id} 
    onClose={() => setActiveTab('dashboard')} 
  />
)}
              {activeTab === 'plan' && profile?.id && <MonPlanNaissance patientId={profile.id} onClose={() => setActiveTab('dashboard')} />}
              {/* CONTENU DE L'ONGLET RENDEZ-VOUS / CARNET */}
              {activeTab === 'rendezvous' && (
                <div className="space-y-10 font-roboto">
                  {/* Vérification si le suivi est activé (si la patiente a des infos de grossesse) */}
                  {(profile?.patient || stats.consultations >= 0) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-10"
                    >
                      {/* LE CARNET NUMÉRIQUE VERSION PATIENTE */}
                      <div className="bg-white/40 backdrop-blur-xl p-2 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-white/60">
                        <CarnetPatiente
                          patientId={profile?.id}
                          isDoctorView={false} // ✅ TRÈS IMPORTANT : Cache les boutons "Démarrer" du médecin
                          onBack={() => setActiveTab('dashboard')}  
                        />
                      </div>

                      {/* Bloc d'urgence (toujours utile à avoir sous le carnet) */}
                      <div className="p-10 bg-[#FF7096]/10 backdrop-blur-md rounded-[3rem] border border-[#FF7096]/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                        <div className="text-left">
                          <h3 className="text-4xl font-black text-[#FF7096] uppercase italic">Un problème imprévu ?</h3>
                          <p className="text-slate-500 uppercase text-[12px] tracking-widest mt-1 font-bold">Signalez votre état pour une prise en charge immédiate</p>
                        </div>
                       <button
  onClick={() => setShowUrgence(true)}
  className="px-10 py-5 bg-[#FF3B5C] text-white rounded-xl font-black uppercase italic shadow-xl hover:scale-105 transition-all flex items-center gap-4 text-xl"
>
  <AlertCircle size={24} /> Signaler une Urgence
</button>
                      </div>
                    </motion.div>
                  ) : (
                    /* ÉCRAN D'ATTENTE SI LE CARNET N'EST PAS ENCORE CRÉÉ */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/40 backdrop-blur-xl p-20 rounded-[4rem] border-4 border-dashed border-[#FF7096]/20 text-center space-y-8 shadow-2xl"
                    >
                      <div className="w-32 h-32 bg-[#FF7096]/10 text-[#FF7096] rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Stethoscope size={64} />
                      </div>
                      <div className="max-w-2xl mx-auto text-left md:text-center">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-4 leading-none">
                          INITIALISATION DU <span className="text-[#FF7096]">CARNET</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold italic">
                          Mme <span className="text-slate-900">{profile?.nom}</span>, votre carnet de santé numérique sera activé par votre médecin lors de votre <span className="text-[#FF7096]">Première Consultation Prénatale (CPN 1)</span>.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-3 bg-[#FF7096]/10 px-8 py-3 rounded-full border border-[#FF7096]/20">
                        <div className="w-2 h-2 bg-[#FF7096] rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-[#FF7096] tracking-[0.2em]">En attente de validation médicale</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {activeTab === 'messagerie' && (

                <div className="h-screen flex items-center justify-center">
                  <div className="h-[600px] w-[600px] overflow-hidden">
                    <ChatCPN

                      currentUser={profile}
                      targetId={profile?.patient?.assigned_pro_id}
                      targetName={docInfo ? `Dr. ${docInfo.nom}` : "Mon Gynécologue"}
                      onVideoClick={handleStartCall}
                      onBack={() => setActiveTab('dashboard')}
                    />

                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AnimatePresence mode="wait">
        {isCalling && <OutgoingCall onCancel={() => setIsCalling(false)} targetName={docInfo?.nom} />}
        {incomingCall && (
          <IncomingCall
            onAccept={acceptIncomingCall}
            onDecline={() => setIncomingCall(null)}
            callerName={incomingCall.data?.callerName}
          />
        )}
        {showTele && <Teleconsultation currentUser={profile} isCaller={amITheCaller} logId={activeLogId} targetId={profile?.patient?.assigned_pro_id} doctorName={docInfo?.nom} onClose={() => setShowTele(false)} />}
        {isDoctorAssigned && showUrgence && <DemandeUrgence patientId={profile?.id} doctorId={profile?.patient?.assigned_pro_id} onClose={() => setShowUrgence(false)} />}
      </AnimatePresence>

      <ChatMaman profile={profile} />
    </div>
  );
}

function StatCard({ label, val, icon, col }) {
  return (
    <div className="bg-white p-5 lg:p-10 rounded-[25px] lg:rounded-[40px] shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all border border-gray-50">
      <div className={`absolute top-4 right-4 lg:top-8 lg:right-8 p-2 lg:p-4 rounded-xl lg:rounded-[25px] text-white ${col} shadow-lg shadow-inherit/20`}>{icon}</div>
      <div className="pr-12 lg:pr-0 text-left">
        <p className="text-gray-400 font-black text-sm lg:text-xl uppercase mb-1 lg:mb-4 tracking-wider">{label}</p>
        {/* Afficher la fraction seulement pour le nombre de consultations */}
        <p className="text-xl lg:text-4xl font-black text-gray-800 tracking-tight break-words">
          {label === 'Consultations' ? val : val}
        </p>
      </div>
    </div>
  );
}
