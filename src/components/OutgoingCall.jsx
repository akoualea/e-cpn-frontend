import React, { useEffect } from 'react';
import { PhoneOff, User, Loader2 } from 'lucide-react';

export default function OutgoingCall({ targetName, onCancel }) {
  useEffect(() => {
    const audio = new Audio('/calling.mp3');
    audio.loop = true;
    audio.play().catch(() => {});
    return () => { audio.pause(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0a0a0a] flex items-center justify-center font-poppins text-white">
      <div className="text-center relative">
        <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10">
          <div className="w-36 h-36 mx-auto mb-10 relative">
            <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse scale-150 opacity-20" />
            <div className="w-full h-full bg-[#E46A4B] rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl">
              <User size={70} />
            </div>
          </div>
          
          <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Appel en cours...</h2>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-12">Connexion avec {targetName}</p>

          <div className="flex justify-center mb-24">
             <Loader2 size={32} className="animate-spin text-white/20" />
          </div>

          <button onClick={onCancel} className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-rose-700 hover:scale-110 transition-all border-4 border-white/20">
            <PhoneOff size={32} />
          </button>
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-70">Annuler</p>
        </div>
      </div>
    </div>
  );
}