import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { api } from '../../contexts/AuthContext';
import { notifyError, notifySuccess } from '../../utils/notifications';
import logo from '../../assets/logo.png';

const BACKGROUND_IMAGE = '/medecinC.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // On récupère les infos cachées dans le lien de l'email
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return notifyError("Les mots de passe ne correspondent pas.");
    }

    setLoading(true);
    try {
      // APPEL À LARAVEL POUR CHANGER LE MOT DE PASSE
      await api.post('/password/reset', {
        token,
        email,
        password,
        password_confirmation: confirmPassword
      });

      notifySuccess("Votre nouveau mot de passe est activé !");
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      notifyError("Le lien a expiré ou est invalide. Veuillez recommencer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-900 text-left">
      <div className="absolute inset-0 z-0">
        <img src={BACKGROUND_IMAGE} className="w-full h-full object-cover opacity-80" alt="Bénin" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full lg:w-[70%] h-full flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl bg-white/20 backdrop-blur-3xl rounded-[5rem] p-16 lg:p-24 shadow-2xl border border-white/30">
          
          <div className="flex flex-col items-center mb-16">
            <img src={logo} alt="Logo" className="w-48 lg:w-64 h-auto" />
            <span className="text-5xl font-black uppercase italic text-white mt-4 tracking-tighter text-center">SÉCURISATION COMPTE</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 max-w-2xl mx-auto">
            <div className="space-y-4">
              <label className="text-2xl font-black text-white uppercase italic ml-8 tracking-wide">Nouveau mot de passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/60 border-none p-8 rounded-full text-3xl font-bold outline-none text-center shadow-inner"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600">
                  {showPassword ? <EyeOff size={32} /> : <Eye size={32} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-2xl font-black text-white uppercase italic ml-8 tracking-wide">Confirmez le code</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/60 border-none p-8 rounded-full text-3xl font-bold outline-none text-center shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>

            <button disabled={loading} className="w-full bg-[#ff5a8d] hover:bg-[#ff7096] text-white p-10 rounded-full font-black text-3xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-6">
              {loading ? <Loader2 className="animate-spin" size={40} /> : <>ACTIVER MON ACCÈS <ShieldCheck size={32}/></>}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}