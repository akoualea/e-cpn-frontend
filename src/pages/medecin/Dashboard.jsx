import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, api } from '../../contexts/AuthContext'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Users, LogOut, Loader2, Search, Calendar, ChevronRight, 
  Stethoscope, Bell, HeartPulse, ShieldCheck,
  ArrowLeft, BookOpen, ClipboardList, MessageSquare,
  Video, Menu, X, Moon, Sun, AlertCircle, 
  TrendingUp, Clock, Activity, ShieldAlert, LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';

import logo from '../../assets/logo.png';

// COMPOSANTS
import JournalGrossesse from '../../components/Patient/JournalGrossesse';
import MonPlanNaissance from '../../components/Patient/MonPlanNaissance';
import ChatCPN from '../../components/ChatCPN'; 
import InitSuiviGrossesse from '../../components/medecin/InitSuiviGrossesse';
import CarnetPatiente from '../CarnetPatiente'; 
import Teleconsultation from '../../components/Teleconsultation';
import IncomingCall from '../../components/IncomingCall';
import OutgoingCall from '../../components/OutgoingCall';
import AppointmentManager from '../../components/medecin/AppointmentManager';
import FicheConsultation from '../../components/medecin/FicheConsultation';


export default function MedecinDashboard() {
  const { profile, signOut, token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('patients'); 
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientView, setPatientView] = useState('journal');
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [showFiche, setShowFiche] = useState(false);
  const [currentApt, setCurrentApt] = useState(null);
  const [showTele, setShowTele] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false); 
  const [activeLogId, setActiveLogId] = useState(null);
  const [urgenciesCount, setUrgenciesCount] = useState(0);
  const [amITheCaller, setAmITheCaller] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cpnStats, setCpnStats] = useState({ done: 0, remaining: 0 });

  
// --- RÉCUPÉRATION DONNÉES DANS MEDECIN DASHBOARD ---
const fetchStatus = useCallback(async () => {
  if (!token || !profile?.id) return;
  
  
  try {
    // 1. Vérification du statut (une seule fois ou périodique)
    const resMe = await api.get('/me');
    const verified = resMe.data?.medical_pro?.is_verified || false;
    setIsVerified(verified);
    
    if (verified) {
      // 2. Récupérer la liste fraîche des patients
      const resPats = await api.get('/doctor/my-patients');
      const freshPatients = resPats.data || [];
      setPatients(freshPatients);

      // 3. SYNCHRONISATION intelligente : 
      // On utilise une mise à jour fonctionnelle pour éviter de dépendre de l'objet selectedPatient
      if (selectedPatient?.id) {
        const updated = freshPatients.find(p => p.id === selectedPatient.id);
        if (updated) {
          // On ne met à jour que si les données sont différentes pour éviter les re-rendus inutiles
          setSelectedPatient(updated);
        }
      }

const cpnRes = await api.get('/medecin/stats/cpn-par-jour');
setCpnStats({
    done: cpnRes.data.done || 0,
    remaining: cpnRes.data.remaining || 0
});
      // 4. Compteur d'urgences (via Supabase)
      const { count } = await supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', profile.id)
        .eq('type', 'Urgence')
        .eq('status', 'pending');
        
      setUrgenciesCount(count || 0);
    }
  } catch (err) {
    console.error("Erreur fetchStatus:", err);
  } finally {
    setLoading(false);
  }
}, [token, profile?.id, selectedPatient?.id]);
     
          const handleConsultationSuccess = () => {
          setRefreshKey(prev => prev + 1); // Change la clé pour forcer le carnet à se recharger
          fetchStatus(); // Met à jour les compteurs (urgences, etc.)
          toast.success("Dossier patient mis à jour !");
        };
 useEffect(() => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  fetchStatus();
 
}, [token]);
  // --- LOGIQUE APPEL & TEMPS RÉEL (POUR QUE ÇA SONNE) ---
  useEffect(() => {
    if (!profile?.id) return;
    
    // Canal d'écoute pour les appels entrants (Signaux)
    const signalsChannel = supabase.channel(`doc_sig_${profile.id}`).on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'telecom_signals', filter: `receiver_id=eq.${profile.id}` 
    }, (payload) => {
        const signal = payload.new;
        
        // 1. Réception d'un appel (fait apparaître IncomingCall avec sonnerie)
        if (signal.type === 'request' && !showTele) {
            setIncomingCall(signal);
        }
        
        // 2. La patiente a accepté notre appel
        if (signal.type === 'accept_handshake') {
            setIsCalling(false);
            setActiveLogId(signal.data.logId);
            setShowTele(true);
        }

        // 3. Annulation
        if (['cancel', 'hangup', 'declined'].includes(signal.type)) { 
            setIncomingCall(null); 
            setIsCalling(false)
            setShowTele(false); 
        }
    }).subscribe();
  

                    const emergencyChannel = supabase.channel(`urgent_sync_${profile.id}`)
                .on('postgres_changes', { 
                  event: '*', // <--- Écoute TOUT (Insert, Update, Delete)
                  schema: 'public', 
                  table: 'appointments', 
                  filter: `doctor_id=eq.${profile.id}` 
                }, () => {
                  // Recalcule le chiffre de la cloche dès qu'un statut change
                  fetchStatus(); 
                })
                .subscribe();

    return () => { 
         supabase.removeChannel(signalsChannel); 
         supabase.removeChannel(emergencyChannel); 
      };
  }, [profile, fetchStatus]);
 
  // ACTION : Décrocher l'appel
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    // SIGNAL : On dit à la patiente qu'on a décroché
    await supabase.from('telecom_signals').insert({
      sender_id: profile.id,
      receiver_id: incomingCall.sender_id,
      type: 'accept_handshake',
      data: { logId: incomingCall.data.logId }
    });

    const caller = patients.find(p => p.id === incomingCall.sender_id);
    setSelectedPatient(caller || { id: incomingCall.sender_id, nom: "Patiente" });
    setActiveLogId(incomingCall.data.logId);
    setAmITheCaller(false);
    setIncomingCall(null);
    setShowTele(true);
  };

  // ACTION : Lancer un appel
  

const handleStartCall = async (patientToCall = selectedPatient) => {
  if (!patientToCall) return;

  const logId = Date.now().toString();

  setSelectedPatient(patientToCall);
  setIsCalling(true);
  setAmITheCaller(true);
  setActiveLogId(logId);

  await supabase.from('telecom_signals').insert({
    sender_id: profile.id,
    receiver_id: patientToCall.id,
    type: 'request',
    data: { 
      logId, 
      callerName: `Dr. ${profile.nom}` 
    }
  });
};


 // 1. SI LE DASHBOARD CHARGE ENCORE
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-roboto">
      <Loader2 className="animate-spin text-[#00A651]" size={50} />
    </div>
  );

  // 2. BLOCAGE : SI LE MÉDECIN N'EST PAS VÉRIFIÉ PAR L'ADMIN
  if (!isVerified) {
    return (
      <div className="h-screen w-full relative flex items-center justify-center font-roboto overflow-hidden">
        {/* Background avec flou */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/dashmedecin3.png')" }}></div>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 p-12 bg-white/10 backdrop-blur-2xl rounded-[60px] border border-white/20 shadow-2xl max-w-2xl text-center"
        >
          <div className="w-32 h-32 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
             <Clock size={64} className="text-[#FFD700] animate-pulse" />
          </div>
          
          <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-6 leading-none">
            Validation <span className="text-[#FFD700]">en cours</span>
          </h2>
          
          <p className="text-2xl text-gray-200 font-bold italic mb-10 leading-relaxed">
            Mme / M. {profile?.nom}, votre profil de praticien est en attente de vérification par la Direction de l'Hôpital. 
            <br/><br/>
            Un e-mail vous sera envoyé dès que votre accès sera activé par l'administrateur.
          </p>

          <button 
            onClick={signOut}
            className="px-12 py-5 bg-rose-500 text-white rounded-[30px] font-black text-2xl uppercase italic shadow-2xl hover:bg-rose-600 transition-all flex items-center gap-4 mx-auto"
          >
            <LogOut size={28} /> Quitter la session
          </button>
        </motion.div>
      </div>
    );
  }

  // 3. SI VÉRIFIÉ, ON CONTINUE VERS LE DASHBOARD NORMAL
  const filteredPatients = patients.filter(p => `${p.nom} ${p.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`min-h-screen relative font-roboto overflow-x-hidden ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F8F9FA] text-slate-900'}`}>
        <style dangerouslySetInnerHTML={{ __html: `
        .dark .text-slate-900, .dark .text-black, .dark .text-gray-800, .dark .text-slate-800 { color: #f8fafc !important; }
        .dark .bg-white { background-color: rgba(30, 41, 59, 0.8) !important; color: white !important; border-color: rgba(255,255,255,0.1) !important; }
        .dark .border-slate-100, .dark .border-gray-100 { border-color: rgba(255,255,255,0.05) !important; }
        .dark input { background-color: #0f172a !important; color: white !important; }
      ` }} />

      {/* IMAGE DE FOND */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('/dashmedecin3.png')" }}></div>
        <div className="absolute inset-0 backdrop-blur-[1px]"></div>
      </div>

      {/* OVERLAY MOBILE (POUR FERMER LE MENU) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" 
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} md:w-[280px] lg:w-[210px] bg-white border-r shadow-2xl overflow-y-auto no-scrollbar`}>
        <div className="p-10 flex flex-col h-full">
           <div className="flex flex-col gap-6 mb-16">
                <div className="flex justify-between items-center">
                    <div className="relative w-80 h-80">
                      <img src={profile?.photo_url || logo} className="w-full h-full object-contain" alt="Logo" />
                     </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-3 text-slate-400"><X size={32}/></button>
                </div>
                <div>
     <h2 className="font-black text-slate-900 text-6xl italic tracking-tighter leading-none mb-8">Dr. {profile?.nom}</h2>
                   <p className="text-4xl text-[#00A651] font-black uppercase italic mt-2"></p>
                </div>
           </div>
          <nav className="space-y-4"> 
            {[
              { id: 'patients', icon: <LayoutDashboard size={32} />, label: 'Tableau de bord' },
              { id: 'planning', icon: <Calendar size={32} />, label: 'Mes Rendez-vous' },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedPatient(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-6 px-9 py-11 rounded-[2rem] transition-all ${activeTab === item.id && !selectedPatient ? 'bg-[#E8F5E9] text-[#00A651] border-r-[8px] border-[#00A651] shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                {item.icon} <span className="text-4xl font-bold italic">{item.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={signOut} className="mt-auto flex items-center gap-4 text-slate-400 font-black text-3xl uppercase italic hover:text-rose-500 transition-all"><LogOut size={32} /> Déconnexion</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
    <main className="relative z-10 md:ml-[280px] lg:ml-[280px] min-h-screen p-4 md:p-10">
        
        {/* HEADER - RENDU BLANC (ESPACE PRATICIEN) */}
       <header className="flex items-center justify-between mb-6 md:mb-10 bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-white">
     <div className="flex items-center gap-2 md:gap-4">
      <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600 shadow-sm">
        <Menu size={24} />
      </button>
      
      {selectedPatient ? (
        <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 bg-slate-50 px-4 md:px-8 py-2 md:py-4 rounded-xl hover:bg-emerald-50 border border-slate-100">
          <ArrowLeft size={20} className="text-[#00A651]" strokeWidth={3} />
          <span className="font-black uppercase italic text-sm md:text-lg">Retour</span>
        </button>
      ) : (
        <h1 className="font-black uppercase italic tracking-tighter text-lg md:text-3xl leading-none">
          <span className="text-[#FF7096] block md:inline">Espace</span> <span className="text-[#00A651]">Praticien</span>
        </h1>
      )}
    </div>

    <div className="flex items-center gap-2 md:gap-4">
      {/* Bouton d'alerte optimisé pour mobile */}
      <div className="px-3 md:px-8 py-2 md:py-4 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl border border-rose-100 flex items-center gap-2">
        <Bell size={20} className={urgenciesCount > 0 ? "animate-bounce" : ""} />
        <span className="font-black text-sm md:text-xl italic uppercase">
          {urgenciesCount} <span className="hidden md:inline">Alerte(s)</span>
        </span>
      </div>
      <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-50 rounded-xl text-slate-400">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
</header>

        <AnimatePresence mode="wait">
          {selectedPatient ? (
            <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              
              {/* BANDEAU PATIENTE (SANS BACKGROUND GRIS) */}
              <div className="flex flex-col xl:flex-row items-center justify-between gap-8 text-left">
                <div className="flex items-center gap-8">
                  <div className="w-32h-32 bg-[#00A651] text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white">{selectedPatient.nom?.[0]}</div>
                  <div>
                    <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Mme {selectedPatient.nom}</h2>
                    <p className="text-white font-black uppercase text-3xl mt-3 italic leading-none">Dossier Obstétrical Actif</p>
                  </div>
                </div>
                <div className="flex gap-4">
       
                    <button onClick={handleStartCall} className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-[#00A651] transition-all active:scale-95"><Video size={36} /></button>
                </div>
              </div>

             
              {/* TABS (STYLE MAMAN) - Ajout de l'onglet Suivi */}
<div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
  {[
    { id: 'journal', label: 'Journal', icon: <BookOpen size={34}/> }, 
    { id: 'plan', label: 'Plan Naissance', icon: <ClipboardList size={34}/> }, 
    { id: 'suivi', label: 'Suivi CPN', icon: <Calendar size={34}/> }, // <-- NOUVEL ONGLET
    { id: 'chat', label: 'Messagerie', icon: <MessageSquare size={34}/> }
  ].map(tab => (
    <button 
      key={tab.id} 
      onClick={() => setPatientView(tab.id)} 
      className={`px-12 py-6 rounded-2xl font-black uppercase text-2xl tracking-widest flex items-center gap-4 transition-all duration-300 ${
        patientView === tab.id 
        ? 'bg-[#00A651] text-white border-r-[8px] border-[#00A651] shadow-md scale-105' 
        : 'bg-white text-slate-400 border border-slate-100 shadow-sm'
      }`}
    >
      {tab.icon} {tab.label}
    </button>
  ))}
          </div>
          {/* CONTENU DU DOSSIER PATIENT (SANS SCROLLBAR) */}
          <div className="mt-10 text-left">
              
              {/* 1. Onglet JOURNAL */}
              {patientView === 'journal' && (
    <JournalGrossesse patientId={selectedPatient.id} isDoctorView={true} onClose={() => setSelectedPatient(null)} />
)}

              {/* 2. Onglet PLAN DE NAISSANCE */}
              {patientView === 'plan' && (
    <MonPlanNaissance patientId={selectedPatient.id} isDoctorView={true} onClose={() => setSelectedPatient(null)} />
)}

              {/* 3. Onglet SUIVI CPN (Protocole & Carnet) */}
           {/* Dans MedecinDashboard.jsx */}
             

           {patientView === 'suivi' && (
  <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* 1. FORMULAIRE DDR (Apparaît si pas de suivi actif) */}
      <AnimatePresence>
          { !selectedPatient?.suivi_active && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <InitSuiviGrossesse 
                patientId={selectedPatient.id} 
               onSuccess={async () => {
              // 1. On attend que les nouvelles données soient chargées
              await fetchStatus(); 
      
                // 2. On affiche ta notification géante
              notifySuccess("Protocole des 8 CPN généré avec succès !");
      
                // 3. Optionnel : un petit rafraîchissement global pour être sûr
                // que selectedPatient est bien mis à jour partout
              window.location.reload(); 
  }} 
/>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 2. LE CARNET PATIENTE (Affichage dynamique) */}
      <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/20 shadow-2xl">
        <CarnetPatiente 
          key={refreshKey} // ✅ Force le rechargement du carnet après validation
          patientId={selectedPatient.id} 
          isDoctorView={true} 
          onStartConsultation={(cpn) => {
            setCurrentApt(cpn);
            setShowFiche(true);
           
          }} 
           onBack={() => setSelectedPatient(null)} 
        />
      </div>
  </div>
)}

              {/* 4. Onglet MESSAGERIE */}
              {patientView === 'chat' && (
                  
  <div className="h-screen flex items-center justify-center">
  <div className="h-[600px] w-[600px] overflow-hidden">
    <ChatCPN 
      currentUser={profile} 
      targetId={selectedPatient.id} 
      targetName={selectedPatient.nom} 
      onVideoClick={handleStartCall}
      onBack={() => setSelectedPatient(null)} 
    />
  </div>
</div>    
              )}

          </div>

            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              {activeTab === 'patients' && (
                <>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                              <StatCard 
                                label="Patientes" 
                                val={patients.length} 
                                icon={<Users />} // Enlevez le size={50} ici, il est géré dans le composant maintenant
                                col="bg-blue-600" 
                              />
                              <StatCard 
                                label="Urgences" 
                                val={urgenciesCount} 
                                icon={<HeartPulse />} 
                                col="bg-rose-600 animate-pulse" 
                              />
                                    <StatCard 
                                  label="RDV Classiques" 
                                  val={`${cpnStats.done} / ${cpnStats.remaining}`} 
                                  icon={<Activity />} 
                                  col="bg-[#00A651]" 
                                />
                                </div>

                  {/* BASE PATIENTS - RENDU BLANC PUR */}
                  <div className="bg-white/50 backdrop-blur-xl p-12 rounded-[4rem] border border-white/40 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                        <h3 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Base Patients</h3>
                        <div className="relative w-full md:w-[600px]"> {/* J'ai élargi un peu le conteneur */}
    {/* Icône agrandie (size 32) et mieux positionnée */}
    <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400" size={30} />
    
    <input 
        type="text" 
        placeholder="RECHERCHER UN NOM..." 
        className="w-full pl-28 pr-12 py-9 bg-slate-50 border-none rounded-[4rem] font-black text-3xl outline-none shadow-inner text-slate-900 placeholder:text-slate-200 transition-all focus:bg-white focus:ring-4 focus:ring-[#00A651]/10" 
        onChange={(e) => setSearchTerm(e.target.value)} 
    />
</div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {filteredPatients.map(p => (
                                              <div 
                    key={p.id} 
                    onClick={() => { setSelectedPatient(p); setPatientView('journal'); }} 
                    className="group p-4 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-50 hover:border-[#00A651] transition-all flex items-center justify-between shadow-sm cursor-pointer hover:shadow-xl"
                  >
                      <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                          {/* Avatar réduit sur mobile */}
                          <div className="shrink-0 w-12 h-12 md:w-20 md:h-20 bg-emerald-50 rounded-xl md:rounded-[2rem] flex items-center justify-center font-black text-[#00A651] text-xl md:text-4xl border border-emerald-100">
                            {p.nom?.[0]}
                          </div>
                          
                          <div className="text-left leading-none min-w-0">
                              {/* Texte qui s'adapte et ne déborde pas */}
                              <p className="font-black uppercase text-lg md:text-4xl italic tracking-tighter text-slate-800 truncate">
                                {p.nom} {p.prenom}
                              </p>
                              <p className="text-[10px] md:text-2xl font-black text-slate-400 uppercase mt-1 md:mt-4 tracking-widest italic">
                                Ouvrir le dossier
                              </p>
                          </div>
                      </div>
                      
                  <div className="shrink-0 p-3 md:p-6 bg-slate-50 text-[#00A651] rounded-xl group-hover:bg-[#00A651] group-hover:text-white transition-all">
                        <ChevronRight size={20} className="md:w-8 md:h-8" strokeWidth={4} />
                      </div>
                  </div>
                       ))}
                    </div>
                  </div>
                </>
              )}
              
                 {activeTab === 'planning' && (
                    <AppointmentManager 
                      doctorId={profile.id} 
                      onRefreshStats={fetchStatus} // <--- AJOUTE CECI pour lier la cloche à l'action
                      onCall={(p) => handleStartCall(p)} 
                    />
                  )}
            </motion.div>
          )}
        </AnimatePresence>
        
      </main>
        
      {/* MODALS D'APPEL AVEC SONNERIE */}
      <AnimatePresence>
        {showFiche && selectedPatient && <FicheConsultation patient={selectedPatient} cpnNumber={currentApt?.cpn_number || 1} currentSA={24} onClose={() => setShowFiche(false)}  onSaveSuccess={handleConsultationSuccess}/>}
        
        {/* LORSQUE LE MÉDECIN APPELLE : OutgoingCall */}
        {isCalling && <OutgoingCall targetName={selectedPatient?.nom || "Patiente"} onCancel={() => setIsCalling(false)} />}
        
        {/* LORSQUE LA PATIENTE APPELLE : IncomingCall avec ringtone.mp3 */}
        {incomingCall && (
            <IncomingCall 
                callerName={incomingCall.data?.callerName} 
                onAccept={acceptIncomingCall} 
                onDecline={() => setIncomingCall(null)} 
            />
        )}
        
        {/* LA SESSION VIDÉO RÉELLE */}
        {showTele && selectedPatient && (
            <Teleconsultation 
                currentUser={profile} 
                targetId={selectedPatient.id} 
                doctorName={profile.nom} 
                isCaller={amITheCaller} 
                
                logId={activeLogId} 
                onClose={() => { setShowTele(false); }} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}

   function StatCard({ label, val, icon, col }) {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-xl relative overflow-hidden border border-white/50 transition-all hover:translate-y-[-5px]">
      
      <div className={`absolute top-4 right-4 md:top-8 md:right-8 p-3 md:p-6 rounded-2xl md:rounded-[2rem] text-white ${col} shadow-lg flex items-center justify-center`}>
        {React.cloneElement(icon, { 
          size: window.innerWidth < 768 ? 24 : 48, 
          strokeWidth: 2.5 
        })}
      </div>

      <div className="text-left pt-2 md:pt-4 leading-none">
        <p className="text-slate-900 font-black text-xs md:text-2xl uppercase mb-4 md:mb-10 tracking-widest opacity-80 max-w-[70%]">
          {label}
        </p>
        <p className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter italic">
          {val}
        </p>
      </div>
    </div>
  );
}
