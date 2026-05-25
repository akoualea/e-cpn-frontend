import React, { useState } from 'react';
import { api } from '../../contexts/AuthContext';
// Importe tes notifications personnalisées ici
import { notifyError, notifySuccess } from '../../utils/notifications'; 

import { 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  Send, 
  MessageSquare, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DemandeUrgence({ patientId, doctorId, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ motif_urgence: '', description: '' });
  const motifs = [
    { id: 'Douleur', title: 'Douleurs / Contractions' },
    { id: 'Fievre', title: 'Fièvre / Paludisme' },
    { id: 'Saignement', title: 'Saignements' },
    { id: 'Autre', title: 'Autre inquiétude' },
  ];
 const handleFinish = async () => {
    if (loading) return;
    if (!formData.description.trim()) return toast.error("Décrivez votre état");
    
    setLoading(true);
    try {
      await api.post('/appointments/request', {
        patient_id: patientId,
        doctor_id: doctorId,
        reason: `${formData.motif_urgence} : ${formData.description}`
      });
      setStep(3);
      toast.success("Signal d'urgence transmis !");
  } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'envoi.";
      notifyError(msg); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md font-roboto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} 
        animate={{ scale: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-2xl w-full max-w-3xl rounded-[4rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white relative"
      >
        
        <button 
          onClick={onClose} 
          className="absolute top-10 right-10 p-5 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-3xl transition-all z-50 shadow-md"
        >
           <X size={25} strokeWidth={4} />
        </button>

        <div className="p-16">
          <AnimatePresence mode='wait'>
            
            {/* ÉTAPE 1: CHOIX DU MOTIF (TEXTES AGRANDIS) */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }}
                className="text-center"
              >
                <div className="inline-flex p-6 bg-rose-500 text-white rounded-[2.5rem] mb-8 shadow-2xl shadow-rose-200">
                    <AlertTriangle size={35} strokeWidth={3} />
                </div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">Alerte Médicale</h2>
                <p className="text-slate-500 text-2xl font-black uppercase tracking-[0.2em] mb-12">Signalez votre état immédiatement</p>
                
                <div className="grid grid-cols-1 gap-6">
                  {motifs.map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => { setFormData({...formData, motif_urgence: m.id}); setStep(2); }}
                      className="p-10 rounded-[3rem] bg-white border-4 border-slate-50 hover:border-rose-500 shadow-xl transition-all text-center group active:scale-95"
                    >
                      <span className="font-black text-slate-800 uppercase italic text-3xl tracking-tight group-hover:text-rose-500">{m.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2: DESCRIPTION (TEXTES AGRANDIS) */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              >
                <button 
                  onClick={() => setStep(1)} 
                  className="flex items-center gap-3 text-rose-500 font-black uppercase text-xl mb-10 hover:translate-x-[-8px] transition-transform"
                >
                  <ChevronLeft strokeWidth={4} size={30} /> Retour
                </button>
                
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">Décrivez l'urgence</h2>
                <p className="text-slate-500 text-2xl font-black uppercase tracking-widest mb-10">Votre gynécologue sera alerté</p>
                
                <div className="space-y-10">
                  <textarea 
                    autoFocus
                    placeholder="Décrivez vos symptômes..."
                    className="w-full p-12 bg-slate-50 border-4 border-transparent focus:border-rose-400 focus:bg-white rounded-[4rem] outline-none min-h-[150px] text-4xl font-bold text-slate-900 shadow-inner resize-none"
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  
                  <button 
                    onClick={handleFinish} 
                    disabled={loading}
                    className="w-full py-10 bg-rose-500 text-white rounded-[3rem] font-black uppercase text-4xl italic tracking-widest shadow-2xl shadow-rose-300 flex items-center justify-center gap-6 hover:bg-rose-600 active:scale-95 transition-all"
                  >
                    {loading ? "Transmission..." : <><Send size={20} fill="currentColor" /> Envoyer l'alerte</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3: CONFIRMATION (TEXTES AGRANDIS) */}
            {step === 3 && (
              <motion.div 
                key="step3" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                className="text-center py-10"
              >
                <div className="w-40 h-40 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-emerald-200">
                  <CheckCircle2 size={100} strokeWidth={3} />
                </div>
                <h2 className="text-7xl font-black uppercase italic tracking-tighter mb-6 text-emerald-600">Signal Reçu</h2>
                <p className="text-slate-700 text-3xl font-bold mb-16 max-w-xl mx-auto leading-relaxed">
                  L'équipe médicale a été prévenue. Restez calme et attendez une réponse.
                </p>
                <button
                  onClick={onClose} 
                  className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black uppercase text-2xl tracking-[0.5em] shadow-xl hover:bg-emerald-700 transition-all"
                >
                  Fermer l'espace urgence
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}