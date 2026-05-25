import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext'; 
import { 
  CheckCircle2, Calendar, Clock, Eye, X, Activity, 
  Loader2, Stethoscope, FileText, ChevronRight, ChevronLeft,
  Baby, Download // ✅ IMPORTATION AJOUTÉE ICI
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// --- HELPER : Formatage de date ---
const formatSafeDate = (dateStr) => {
  if (!dateStr) return "--/--/----";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "--/--/----" : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- COMPOSANT DATA BOX TRANSPARENT ---
function TransparentDataBox({ label, value, color, small = false }) {
  return (
    <div className="p-5 bg-white/60 rounded-[2rem] border border-white/80 shadow-sm flex flex-col items-start text-left transition-transform hover:scale-105">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p 
        className={`font-black uppercase italic leading-none ${small ? 'text-lg' : 'text-3xl'}`}
        style={{ color: color }}
      >
        {value || '--'}
      </p>
    </div>
  );
}

export default function CarnetPatiente({ patientId, isDoctorView, onStartConsultation, onBack }) {
  const [suivi, setSuivi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCpn, setSelectedCpn] = useState(null);

  useEffect(() => {
    const fetchSuivi = async () => {
      try {
        const res = await api.get(`/patient/mon-suivi?patient_id=${patientId}`);
        
        // ✅ LOGIQUE ANTI-DOUBLONS : On ne garde qu'un seul exemplaire par numéro de CPN
        const data = res.data || [];
        const uniqueSuivi = Array.from(new Map(data.map(item => [item.cpn_number, item])).values());
        
        // On trie par numéro de CPN de 1 à 8
        setSuivi(uniqueSuivi.sort((a, b) => a.cpn_number - b.cpn_number));
      } catch (err) { 
        console.error("Erreur chargement carnet:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchSuivi();
  }, [patientId]);
const handleDownloadPDF = (cpnId) => {
    // Utilise l'URL de ton instance API définie au début du fichier
    window.open(`${api.defaults.baseURL}/consultations/${cpnId}/pdf`, '_blank');
};
  const completedCount = Array.isArray(suivi) ? suivi.filter(c => c.status === 'completed').length : 0;

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-[#00A651]" size={50} />
      <p className="text-[#00A651] font-black uppercase text-xs tracking-widest">Chargement du carnet...</p>
    </div>
  );

  return (
    <div className="space-y-12 font-roboto animate-in fade-in duration-1000">
      
      {/* HEADER */}
<div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-10">
  <div className="text-left leading-none flex items-center gap-4">
    {onBack && (
      <button onClick={onBack} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all active:scale-90">
        <ChevronLeft size={32} strokeWidth={3} className="text-[#00A651]" />
      </button>
    )}
    <div>
      <h2 className="text-5xl font-black italic tracking-tighter text-[#00A651] uppercase drop-shadow-lg">
          Mon Carnet <span className="text-[#FF7096]">Numérique</span>
      </h2>
      <p className="text-[10px] font-black text-[#00A651] uppercase italic tracking-[0.3em] mt-3 opacity-70">Suivi 8 CPN • Protocole OMS</p>
    </div>
  </div>

        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl min-w-[280px]">
           <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Progression</span>
              <span className="text-3xl font-black text-[#FF7096] leading-none">{completedCount}<span className="text-slate-400">/8</span></span>
           </div>
           <div className="flex gap-1.5 h-2.5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className={`flex-1 rounded-full transition-all duration-1000 ${i <= completedCount ? 'bg-[#FF7096] shadow-[0_0_15px_#FF7096]' : 'bg-black/10'}`} />
              ))}
           </div>
        </div>
      </div>

      {/* GRILLE DES CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {suivi.map((cpn, idx) => (
          <motion.div 
            key={`cpn-${cpn.id}-${cpn.cpn_number}`} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.08 }}
            className="group relative p-8 bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-xl hover:shadow-2xl transition-all"
          >
            <span className="absolute -bottom-2 -right-2 text-8xl font-black italic text-[#FF7096]/5 pointer-events-none select-none">{cpn.cpn_number}</span>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div className={`p-4 rounded-2xl ${cpn.status === 'completed' ? 'bg-[#FF7096] text-white shadow-xl shadow-pink-200' : 'bg-white/50 text-slate-400 border border-white'}`}>
                       <Calendar size={24} strokeWidth={2.5} />
                    </div>
                    {cpn.status === 'completed' && <CheckCircle2 className="text-[#FF7096] animate-pulse" size={24} />}
                </div>

                <div className="text-left space-y-1 mb-8">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${cpn.status === 'completed' ? 'text-[#FF7096]' : 'text-slate-400'}`}>CPN n°{cpn.cpn_number}</p>
                    <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${cpn.status === 'completed' ? 'text-slate-800' : 'text-[#00A651]'}`}>
                        {cpn.status === 'completed' ? 'Validé' : 'À Venir'}
                    </h4>
                </div>

                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white flex items-center justify-between mb-10 shadow-inner">
                    <div className="flex items-center gap-3">
                        <Clock size={16} className="text-[#FF7096]" />
               <span className="text-4xl font-black text-slate-900 uppercase tracking-tight">
                  {formatSafeDate(cpn.scheduled_at || cpn.date_theorique)}
               </span>
                    </div>
                    {cpn.file_url && <FileText size={16} className="text-[#FF7096] animate-bounce" />}
                </div>

                {cpn.status === 'completed' ? (
                    <button onClick={() => setSelectedCpn(cpn)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-[#FF7096] transition-all">
                      Consulter l'acte
                    </button>
                ) : (
                  isDoctorView && (
                    <button onClick={() => onStartConsultation(cpn)} className="w-full py-4 bg-[#00A651] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-[#008541] hover:scale-105 transition-all flex items-center justify-center gap-2">
                      <Stethoscope size={16} /> Démarrer
                    </button>
                  )
                )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* MODAL RAPPORT ROSE & TRANSPARENT */}
      <AnimatePresence>
        {selectedCpn && (
          <div className="fixed inset-0 z-[70000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white/70 backdrop-blur-2xl w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/50"
            >
               <div className="p-8 border-b border-white/20 flex justify-between items-center bg-white/30">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-10 bg-[#FF7096] rounded-full" />
                     <h3 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">
                        Rapport <span className="text-[#FF7096]">CPN {selectedCpn.cpn_number}</span>
                     </h3>
                  </div>
                  <button onClick={() => setSelectedCpn(null)} className="p-3 bg-white/80 rounded-2xl text-slate-400 hover:text-[#FF7096] shadow-sm transition-all hover:rotate-90">
                     <X size={24} strokeWidth={3} />
                  </button>
               </div>

               <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-2 gap-5">
                    <TransparentDataBox label="Poids" value={`${selectedCpn.poids} KG`} color="#3b82f6" />
                    <TransparentDataBox label="Tension" value={selectedCpn.tension_arterielle} color="#00A651" />
                    <TransparentDataBox label="Hauteur Utérine" value={`${selectedCpn.hauteur_uterine} CM`} color="#6366f1" />
                    <TransparentDataBox label="Cœur Bébé (BCF)" value={selectedCpn.bcf} color="#FF7096" />
                  </div>

                  {selectedCpn.cpn_number === 1 && (
                    <div className="p-6 bg-blue-50/40 rounded-[2.5rem] border border-blue-200/50 grid grid-cols-2 gap-4">
                      <TransparentDataBox label="Groupe Sanguin" value={selectedCpn.gs_rh} color="#1d4ed8" small />
                      <TransparentDataBox label="Électrophorèse" value={selectedCpn.electrophorese_hb} color="#1d4ed8" small />
                      <TransparentDataBox label="Gestité (G)" value={selectedCpn.gestite_g} color="#475569" small />
                      <TransparentDataBox label="Parité (P)" value={selectedCpn.parite_p} color="#475569" small />
                    </div>
                  )}

                  {selectedCpn.cpn_number >= 6 && (
                    <div className="p-8 bg-[#FF7096]/10 rounded-[3rem] border border-[#FF7096]/20 grid grid-cols-2 gap-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Baby size={80} className="text-[#FF7096]" />
                      </div>
                      <TransparentDataBox label="Présentation" value={selectedCpn.presentation_foetus} color="#FF7096" small />
                      <TransparentDataBox label="Bassin" value={selectedCpn.bassin} color="#FF7096" small />
                      <TransparentDataBox label="Position Col" value={selectedCpn.col_position} color="#FF7096" small />
                      <TransparentDataBox label="Ouverture Col" value={selectedCpn.col_ouverture} color="#FF7096" small />
                    </div>
                  )}

                  {selectedCpn.file_url && (
                    <div className="p-6 bg-white/40 rounded-[2.5rem] border border-white/60 flex flex-col items-center gap-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Examen complémentaire</p>
                      <div className="w-full h-32 bg-slate-200/50 rounded-3xl overflow-hidden flex items-center justify-center border border-dashed border-slate-300">
                         {selectedCpn.file_url.match(/\.(jpeg|jpg|png)$/i) ? (
                            <img src={selectedCpn.file_url} className="w-full h-full object-cover rounded-2xl" alt="Examen" />
                         ) : (
                            <FileText size={40} className="text-[#FF7096]" />
                         )}
                      </div>
                      <a href={selectedCpn.file_url} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white/80 text-[#FF7096] rounded-full text-[10px] font-black uppercase shadow-sm hover:bg-[#FF7096] hover:text-white transition-all">
                         Voir le document
                      </a>
                    </div>
                  )}

                  <div className="p-8 bg-white/60 rounded-[2.5rem] border border-white shadow-inner">
                    <p className="text-[10px] font-black text-[#FF7096] uppercase tracking-widest mb-3 italic">Observations du Praticien</p>
                    <p className="text-slate-600 font-bold italic whitespace-pre-line leading-relaxed">
                      {selectedCpn.observations || "Dossier en excellente progression."}
                    </p>
                  </div>

               <button
   onClick={() => handleDownloadPDF(selectedCpn.id)} 
   className="w-full py-5 bg-[#FF7096] text-white rounded-[3rem] font-black uppercase tracking-widest hover:bg-[#ff5a87] transition-all shadow-xl flex items-center justify-center gap-4"
>
   {/* Icône un peu plus grande pour équilibrer les deux lignes */}
   <Download size={20} />


      <span className="text-[9px] opacity-90">Télécharger le Rapport</span>
    
  
</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}