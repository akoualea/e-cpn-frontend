import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Check, Loader2, Calendar, AlertCircle, X } from 'lucide-react';
import { api, useAuth } from '../../contexts/AuthContext'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const isFetching = useRef(false);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token || isFetching.current) return;

    isFetching.current = true;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("Session expirée ou non autorisée");
      }
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10 secondes pour l'urgence
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async () => {
    setIsMarkingRead(true);
    try {
      await api.post('/notifications/read');
      setNotifications([]);
      setIsOpen(false);
    } catch (err) {
      console.error("Erreur markAsRead:", err);
    } finally {
      setIsMarkingRead(false);
    }
  };

  return (
    <div className="relative z-[1000] font-roboto">
      {/* BOUTON CLOCHE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 md:p-5 bg-white/20 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-white/40 hover:bg-white/40 transition-all relative group flex items-center justify-center"
      >
        <Bell 
          size={30} 
          className={notifications.length > 0 ? "text-rose-500 animate-bounce" : "text-slate-700"}
          strokeWidth={2.5}
        />
        
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-7 h-7 md:w-8 md:h-8 bg-rose-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-[12px] md:text-[14px] text-white font-black">{notifications.length}</span>
          </span>
        )}
      </button>

      {/* MENU DÉROULANT XL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed left-2 right-2 top-24 w-auto max-w-none bg-white/95 backdrop-blur-2xl rounded-[1.25rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white overflow-hidden text-left md:absolute md:left-auto md:right-0 md:top-auto md:mt-6 md:w-[500px] md:rounded-[3.5rem]"
          >
            {/* HEADER DU MENU */}
            <div className="max-w-full overflow-hidden p-3 md:p-8 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center gap-2 md:gap-4 text-left">
              <div className="min-w-0 text-left">
                <h4 className="font-black uppercase text-[10px] md:text-2xl tracking-tight md:tracking-tighter text-emerald-800 italic leading-none truncate">Centre d'Alertes</h4>
                <p className="text-[11px] md:text-[14px] font-black text-emerald-800/60 uppercase tracking-[0.12em] md:tracking-[0.2em] mt-2 italic">Votre suivi santé en temps réel</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="shrink-0 p-2 md:p-3 bg-white rounded-2xl shadow-sm hover:text-rose-500 transition-colors border border-slate-50">
                <X size={22} strokeWidth={3} />
              </button>
            </div>
            
            {/* LISTE DES MESSAGES */}
            <div className="max-h-[60vh] md:max-h-[550px] overflow-x-hidden overflow-y-auto no-scrollbar bg-white">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  // Détection du type pour la couleur rose (Urgence)
                  const isUrgent = n.data?.type === 'urgence' || n.data?.title?.toLowerCase().includes('urgence');
                  
                  return (
                    <div key={n.id} className="w-full max-w-full overflow-hidden p-3 md:p-8 border-b border-gray-100 hover:bg-slate-50/50 transition-all group text-left">
                      <div className="grid max-w-full grid-cols-[32px_minmax(0,1fr)] gap-2 md:flex md:gap-6 items-start">
                        {/* ICÔNE DYNAMIQUE */}
                        <div className={`w-8 h-8 md:w-auto md:h-auto p-1.5 md:p-5 rounded-xl md:rounded-3xl shrink-0 shadow-sm flex items-center justify-center ${isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isUrgent ? <AlertCircle size={22} strokeWidth={2.5} /> : <Calendar size={22} strokeWidth={2.5} />}
                        </div>
                        
                        <div className="min-w-0 flex-1 font-roboto text-left">
                            <p className={`max-w-full text-[15px] md:text-[22px] font-black uppercase italic tracking-tight mb-1.5 md:mb-2 leading-snug md:leading-none break-words [overflow-wrap:anywhere] ${isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
                                {n.data?.title || "Notification"}
                            </p>
                            <p className="max-w-full text-[12px] md:text-[18px] text-slate-600 font-bold leading-snug md:leading-relaxed mb-2 md:mb-4 break-words [overflow-wrap:anywhere]">
                                {n.data?.message}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
                                <span className={`text-[8px] md:text-[11px] font-black uppercase tracking-normal md:tracking-widest px-1.5 md:px-4 py-1 md:py-2 rounded-full ${isUrgent ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                    {isUrgent ? 'ACTION MÉDICALE' : 'SUIVI RÉGULIER'}
                                </span>
                                <span className="hidden md:inline text-[13px] text-slate-400 font-black italic">
                                    {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-14 md:p-24 text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-inner">
                    <CheckCircle2 size={54} strokeWidth={3} className="opacity-30" />
                  </div>
                  <p className="text-base md:text-xl font-black uppercase tracking-widest text-slate-400 italic">Tout est à jour maman</p>
                </div>
              )}
            </div>

            {/* ACTIONS FINALES */}
            <div className="p-2 md:p-8 bg-slate-50/80 border-t border-gray-100">
                {notifications.length > 0 && (
                  <button 
                    onClick={markAsRead}
                    disabled={isMarkingRead}
                    className="w-full px-3 py-4 md:py-6 bg-emerald-600 text-white font-black uppercase text-[11px] md:text-[15px] tracking-[0.04em] md:tracking-[0.2em] leading-tight rounded-[1rem] md:rounded-[2.5rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-4"
                  >
                    {isMarkingRead ? <Loader2 className="shrink-0 animate-spin" size={22}/> : <Check className="shrink-0" size={22} strokeWidth={4} />}
                    <span className="min-w-0 text-center">Tout marquer comme lu</span>
                  </button>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
