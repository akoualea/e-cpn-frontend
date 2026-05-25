import React, { useState } from 'react';
import { api } from '../../contexts/AuthContext';
import { Calendar, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { notifyError, notifySuccess } from '../../utils/notifications';

export default function InitSuiviGrossesse({ patientId, onSuccess }) {
  const [ddr, setDdr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    if (!ddr) return notifyError("Veuillez choisir une date");
    setLoading(true);
    try {
      const res = await api.post('/doctor/init-suivi', { patient_id: patientId, ddr_date: ddr });
      notifySuccess(res.data.message);
      if (onSuccess) onSuccess(); 
    } catch (err) {
      notifyError(err.response?.data?.message || "Erreur de génération");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-3xl p-12 rounded-[5rem] border-4 border-dashed border-white/20 flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700">
      <div className="w-24 h-24 bg-[#00A651]/10 text-[#00A651] rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_30px_rgba(0,166,81,0.2)]">
        <Sparkles size={50} strokeWidth={2.5} />
      </div>
      
      <div className="max-w-2xl leading-tight">
        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-800 mb-4">
          Initialiser le <span className="text-[#00A651]">Suivi CPN</span>
        </h2>
        <p className="text-xl text-slate-600 font-bold italic opacity-80">Génération automatique du calendrier selon le protocole OMS.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl">
        <input 
          type="date" 
          className="flex-1 w-full p-6 bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-[2rem] text-[#00A651] font-black text-3xl outline-none focus:border-[#00A651] text-center shadow-xl cursor-pointer"
          onChange={(e) => setDdr(e.target.value)}
        />
        <button 
          onClick={handleInit} disabled={loading}
          className="h-20 px-12 bg-[#00A651] hover:bg-[#008541] text-white rounded-[2rem] font-black uppercase italic text-xl shadow-2xl flex items-center gap-4 transition-all active:scale-95 border-2 border-white/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Générer"}
        </button>
      </div>
    </div>
  );
}