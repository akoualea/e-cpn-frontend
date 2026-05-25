import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { api } from '../../contexts/AuthContext';
import { 
  Calendar, Video, Play, AlertCircle, CheckCircle2, 
  Clock, Activity, Lock, User, XCircle, Info, Trash2, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// =========================================================
// --- NOTIFICATIONS GÉANTES ---
// =========================================================

const notifyError = (message) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-2xl w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex border-l-[15px] border-rose-500 font-roboto`}>
      <div className="flex-1 p-12">
        <div className="flex items-center gap-8">
          <XCircle className="h-20 w-20 text-rose-500 shrink-0" />
          <div className="text-left">
            <p className="text-2xl font-black text-rose-600 uppercase tracking-widest">ERREUR</p>
            <p className="mt-3 text-3xl font-black text-gray-800 leading-tight">{message}</p>
          </div>
        </div>
      </div>
    </div>
  ), { duration: 5000 });
};

const notifySuccess = (message) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-2xl w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex border-l-[15px] border-emerald-500 font-roboto`}>
      <div className="flex-1 p-12">
        <div className="flex items-center gap-8">
          <CheckCircle2 className="h-20 w-20 text-emerald-500 shrink-0" />
          <div className="text-left">
            <p className="text-2xl font-black text-emerald-600 uppercase tracking-widest">SUCCÈS</p>
            <p className="mt-3 text-3xl font-black text-gray-800 leading-tight">{message}</p>
          </div>
        </div>
      </div>
    </div>
  ), { duration: 4000 });
};

export default function AppointmentManager({ doctorId, onCall, onRefreshStats }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('en_cours');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    const init = async () => {
      if (doctorId) {
        setLoading(true);
        await fetchAllData();
        setLoading(false);
      }
    };
    init();
  }, [doctorId]);

  useEffect(() => {
    const channel = supabase
      .channel(`list_realtime_${doctorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${doctorId}` }, 
        () => {
            fetchAllData();
            if (onRefreshStats) onRefreshStats();
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [doctorId, onRefreshStats]);

  const fetchAllData = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, profiles!patient_id (id, nom, prenom, photo_url)`)
        .eq('doctor_id', doctorId);

      if (error) {
        const { data: rawData } = await supabase.from('appointments').select('*').eq('doctor_id', doctorId);
        setAppointments(rawData || []);
      } else {
        const sorted = (data || []).sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
        setAppointments(sorted);
      }
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, newStatus, isUrgence = false, patientId = null) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    try {
      await supabase.from('appointments').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (isUrgence && newStatus === 'in_progress' && patientId) {
        api.post('/consultations/repondre-urgence', {
          appointment_id: id, patient_id: patientId,
          message: "ALERTE : Le médecin a validé votre urgence et vous attend maintenant."
        });
        notifySuccess("Patiente convoquée !");
      } else if (newStatus === 'completed') {
        notifySuccess("Dossier clôturé avec succès.");
      }
      if (onRefreshStats) onRefreshStats();
    } catch (err) { 
        notifyError("Erreur lors de la mise à jour.");
        fetchAllData(); 
    }
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    if (!id) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm({ show: false, id: null });
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      notifySuccess("Archive supprimée définitivement.");
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      notifyError("Erreur lors de la suppression.");
      fetchAllData();
    }
  };

  const countUrgences = appointments.filter(a => a.type === 'Urgence' && a.status === 'pending').length;
  const countClassic = appointments.filter(a => a.type !== 'Urgence' && a.status !== 'completed').length;
  const countDone = appointments.filter(a => a.status === 'completed').length;

  const displayed = appointments.filter(a => activeTab === 'en_cours' ? a.status !== 'completed' : a.status === 'completed');

  if (loading) return <div className="p-20 text-center font-black opacity-30 text-4xl tracking-widest uppercase">Liaison base de données...</div>;

  return (
    <div className="w-full space-y-16 font-roboto text-left relative">
      
      {/* MODAL SUPPRESSION (HAUTEUR RÉDUITE) */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ show: false, id: null })}
              className="absolute inset-0 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white border-8 border-white rounded-[2rem] p-16 shadow-2xl text-center"
            >
              <div className="w-32 h-32 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Trash2 size={64} strokeWidth={3} />
              </div>
              <h3 className="text-6xl font-black text-slate-900 uppercase italic leading-tight mb-6">Supprimer ?</h3>
              <p className="text-3xl text-slate-600 font-bold mb-12 leading-relaxed italic">Cette action est définitive.</p>
              <div className="flex flex-col gap-6">
                <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase italic text-2xl shadow-2xl shadow-rose-200">Confirmer</button>
                <button onClick={() => setDeleteConfirm({ show: false, id: null })} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xl">Annuler</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STATS HEADERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <StatMiniCard title="RDV CLASSIQUES" value={countClassic} icon={<Calendar />} color="bg-blue-600" />
        <StatMiniCard title="URGENCES ACTIVES" value={countUrgences} icon={<AlertCircle />} color={countUrgences > 0 ? "bg-rose-600 animate-pulse" : "bg-slate-500"} />
        <StatMiniCard title="DOSSIERS CLÔTURÉS" value={countDone} icon={<CheckCircle2 />} color="bg-[#00A651]" />
      </div>

      {/* TABS SELECTION (HAUTEUR RÉDUITE ET MOINS BOMBÉ) */}
      <div className="flex gap-6 px-4">
        <button 
          onClick={() => setActiveTab('en_cours')} 
          className={`flex-1 px-16 py-10 rounded-2xl font-black uppercase text-2xl flex items-center justify-center gap-6 transition-all shadow-xl ${activeTab === 'en_cours' ? 'bg-[#00A651] text-white' : 'bg-white text-slate-400'}`}
        >
         
          <span>File d'attente</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('termines')} 
          className={`flex-1 px-16 py-10 rounded-2xl font-black uppercase text-2xl flex items-center justify-center gap-6 transition-all shadow-xl ${activeTab === 'termines' ? 'bg-[#00A651] text-white' : 'bg-white text-slate-400'}`}
        >
       
          <span>Archives</span>
        </button>
      </div>

      {/* GRID CARTES (MOINS BOMBÉ) */}
      <div className={`grid gap-10 ${activeTab === 'termines' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
        <AnimatePresence mode="popLayout">
          {displayed.map((apt) => {
            const isUrgence = apt.type === 'Urgence';
            const isArchive = apt.status === 'completed';

            return (
              <motion.div 
                key={apt.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`relative bg-white shadow-2xl flex flex-col gap-10 border-l-[20px] transition-all
                  ${isArchive ? 'p-10 rounded-3xl border-l-emerald-500' : 'p-12 rounded-[2.5rem] border-l-blue-500'}
                  ${isUrgence && !isArchive ? 'border-l-rose-500 shadow-rose-100' : ''}
                `}
              >
                {/* HEADER CARD */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-6">
      {/* L'icône de l'heure a été retirée d'ici */}
      <div className="text-left space-y-2">
          <h4 className={`font-black text-slate-900 uppercase italic leading-none ${isArchive ? 'text-3xl' : 'text-4xl tracking-tighter'}`}>
            {isUrgence ? "URGENCE" : "RDV CPN"}
          </h4>
          <p className={`font-black text-slate-500 uppercase italic flex items-center gap-3 ${isArchive ? 'text-xl' : 'text-2xl'}`}>
             <User size={28} strokeWidth={3} className="text-[#00A651]"/> {apt.profiles?.nom} {apt.profiles?.prenom}
          </p>
      </div>
  </div>
  {/* L'icône AlertCircle a été retirée d'ici */}
</div>
                  
              
                {/* MOTIF SECTION */}
                <div className={`bg-slate-50 border-4 border-white text-left shadow-inner ${isArchive ? 'p-8 rounded-2xl' : 'p-10 rounded-3xl'}`}>
                    <p className="text-2xl font-black text-[#FF7096] uppercase tracking-widest mb-4 italic">Motif de consultation</p>
                    <p className={`font-bold text-slate-800 italic leading-tight ${isArchive ? 'text-2xl' : 'text-4xl'}`}>
                        "{apt.reason || 'Suivi standard'}"
                    </p>
                </div>

                {/* ACTIONS (HAUTEUR RÉDUITE DE MOITIÉ : py-5 au lieu de py-10) */}
                <div className="flex gap-5 w-full mt-auto">
                  {apt.status === 'pending' && isUrgence ? (
                      <button onClick={() => updateStatus(apt.id, 'in_progress', true, apt.patient_id)} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase italic text-3xl shadow-2xl animate-pulse flex items-center justify-center gap-6">
                         CONVOQUER
                      </button>
                  ) : isArchive ? (
                      <div className="flex gap-5 w-full">
                         <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase text-2xl flex items-center justify-center gap-4 border-4 border-white shadow-inner italic">
                           Archivé
                         </div>
                         <button onClick={() => setDeleteConfirm({ show: true, id: apt.id })} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border-4 border-white shadow-xl">
                            <Trash2 size={40} strokeWidth={3} />
                         </button>
                      </div>
                  ) : (
                      <>
                        <button onClick={() => onCall(apt.profiles || {id: apt.patient_id}, apt)} className="flex-[2] py-5 bg-[#00A651] text-white rounded-2xl font-black uppercase text-4xl italic shadow-2xl tracking-tighter">OUVRIR</button>
                        <button onClick={() => updateStatus(apt.id, 'completed')} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xl flex flex-col items-center justify-center gap-2 hover:bg-black transition-all">
                             <span>CLÔTURER</span>
                        </button>
                      </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatMiniCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-8 md:p-12 lg:p-14 rounded-3xl shadow-2xl border-8 border-white flex items-center justify-between transition-all hover:scale-105">
            <div className="text-left leading-none min-w-0">
                <p className="text-xl md:text-2xl lg:text-3xl font-black uppercase text-slate-500 mb-6 italic tracking-tighter">
                    {title}
                </p>
                <h3 className="text-6xl md:text-8xl lg:text-9xl font-black italic text-slate-900 tracking-tighter">
                    {value}
                </h3>
            </div>
            <div className={`p-8 md:p-10 lg:p-12 rounded-2xl text-white ${color} shadow-2xl shrink-0`}>
                {React.cloneElement(icon, { 
                    className: "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20", 
                    strokeWidth: 4 
                })}
            </div>
        </div>
    );
}