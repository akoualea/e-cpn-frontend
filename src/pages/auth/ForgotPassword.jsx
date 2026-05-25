import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Mail, Send } from 'lucide-react';
import { api } from '../../contexts/AuthContext';
import { notifyError, notifySuccess } from '../../utils/notifications';
import logo from '../../assets/logo.png';

const BACKGROUND_IMAGE = '/medecinC.png'; 

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // APPEL À TON BACKEND LARAVEL
      const response = await api.post('/password/email', { email });
      notifySuccess("Si ce compte existe, un lien de sécurisation a été envoyé à votre adresse email.");
      
      // On redirige vers le login après 3 secondes
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      notifyError("Une erreur est survenue. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-900 text-left">
      
      {/* 1. IMAGE DE FOND (Identique Login) */}
      <div className="absolute inset-0 z-0">
        <img src={BACKGROUND_IMAGE} className="w-full h-full object-cover opacity-80" alt="Bénin" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* 2. CONTENEUR GLASSMORPHISM */}
      <div className="relative z-10 w-full lg:w-[70%] h-full flex items-center justify-center p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl bg-white/20 backdrop-blur-3xl rounded-[5rem] p-16 lg:p-24 shadow-2xl border border-white/30"
        >
          
          {/* HEADER */}
          <div className="flex flex-col items-center mb-16">
            <div className="flex items-center gap-8 mb-4 cursor-pointer" onClick={() => navigate('/login')}>
              <img src={logo} alt="Logo" className="w-48 lg:w-64 h-auto object-contain" />
              <span className="text-6xl lg:text-7xl font-black uppercase italic text-[#ff5a8d] tracking-tighter leading-none mt-2">BÉNIN</span>
            </div>
          </div>

          {/* TITRE */}
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tight underline decoration-[#00a669] decoration-8 underline-offset-8">
              RÉCUPÉRATION
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm mt-6">
              Entrez votre email pour sécuriser votre accès
            </p>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit} className="space-y-12 max-w-2xl mx-auto">
            <div className="space-y-4 text-left">
              <label className="text-2xl font-black text-white uppercase italic ml-8 tracking-wide flex items-center gap-3">
                <Mail size={24} className="text-[#00a669]" /> Votre Email
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/60 border-none p-10 rounded-full text-3xl font-bold outline-none focus:bg-white transition-all text-center shadow-inner"
                placeholder="---" 
                required
              />
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-[#00a669] hover:bg-[#00cc81] text-white p-10 rounded-full font-black text-3xl uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-6"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={40} />
              ) : (
                <>ENVOYER LE LIEN <Send size={32}/></>
              )}
            </button>

            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-white/40 hover:text-white font-black uppercase italic text-xl tracking-widest transition-colors flex items-center justify-center gap-4"
            >
              <ArrowLeft size={24} /> Retour à la connexion
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );  
}