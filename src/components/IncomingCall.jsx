import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, User, ShieldCheck } from 'lucide-react';

export default function IncomingCall({ callerName, onAccept, onDecline }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio('/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(() => console.log("Audio bloqué"));
    audioRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md flex items-center justify-center font-poppins p-4">
      <div className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[60px] p-12 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/40 relative overflow-hidden">
        
        {/* EFFETS VISUELS DE FOND */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10">
          <div className="relative w-32 h-32 mx-auto mb-10">
             <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
             <div className="relative w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <User size={60} className="text-white" />
             </div>
          </div>
          
          <div className="space-y-3 mb-12">
            <span className="bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Appel Entrant</span>
            <h2 className="text-3xl font-black text-gray-800 uppercase italic leading-tight tracking-tighter">
              {callerName}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-4">
              <ShieldCheck size={14} className="text-emerald-500" /> Consultation Sécurisée
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-8 px-4">
            <button onClick={onDecline} className="group flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-rose-600 group-hover:scale-110 transition-all">
                <PhoneOff size={28} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">Décliner</span>
            </button>

            <button onClick={onAccept} className="group flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:bg-emerald-600 group-hover:scale-110 transition-all animate-bounce-subtle">
                <Phone size={36} fill="currentColor" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Répondre</span>
            </button>
          </div>
        </div>
      </div>
      <style>{`.animate-bounce-subtle { animation: bounceSubtle 2s infinite; } @keyframes bounceSubtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
    </div>
  );
}