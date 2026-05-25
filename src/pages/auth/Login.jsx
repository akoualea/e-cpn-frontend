import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'; // Ajout de ArrowLeft
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { notifyError, notifySuccess, notifyInfo } from '../../utils/notifications';
import logo from '../../assets/logo.png';

const BACKGROUND_IMAGE = '/medecinC.png';

export default function Login() {
  const { login, loginWithGoogle, signOut, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleCustomGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const data = await loginWithGoogle(tokenResponse.access_token);
        if (data.status === 'SUCCESS') {
          notifySuccess("Authentification Google réussie !");
        } else if (data.status === 'NEW_USER') {
          localStorage.setItem('temp_google_user', JSON.stringify(data.google_data));
          notifyInfo("Nouveau compte : veuillez compléter votre profil.");
          navigate('/register?social=true');
        }
      } catch (error) {
        notifyError("Erreur d'authentification Google.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => notifyError("L'accès Google a été interrompu.")
  });

  useEffect(() => {
    if (!authLoading && user && profile) {
      const role = profile.role?.toUpperCase();
      if (role === 'ADMIN') { signOut(); notifyError("Accès refusé."); return; }
      const path = role === 'PRO' ? '/medecin/dashboard' : '/patient/dashboard';
      navigate(path);
    }
  }, [user, profile, authLoading, navigate, signOut]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    if (!email) {
      setEmailError("L'adresse e-mail est requise.");
      setLoading(false);
      return;
    }

    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    try {
      const res = await login(email, password);
      if (res?.success) notifySuccess("Identification réussie.");
    } catch (error) {
      let errorMessage = "Identifiants incorrects";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;

        if (errorMessage.toLowerCase().includes("password")) {
          setPasswordError(errorMessage);
        } else if (errorMessage.toLowerCase().includes("email")) {
          setEmailError(errorMessage);
        } else {
          notifyError(errorMessage);
          return;
        }

      } else {
        notifyError(errorMessage);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    
    <div className="h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img src={BACKGROUND_IMAGE} className="w-full h-full object-cover opacity-80" alt="Bénin" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
      </div>

     

      {/* CONTENEUR CENTRÉ */}
      
     
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 lg:p-12 text-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-[95%] md:w-full max-w-5xl max-h-[95vh] bg-white/20 backdrop-blur-3xl rounded-3xl md:rounded-[4rem] p-6 md:p-12 lg:p-16 shadow-2xl border border-white/30 overflow-y-auto no-scrollbar"
        >

       <button
  type="button"
  onClick={() => navigate('/')}
  className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 text-white/50 hover:text-white transition-all group z-50"
>
  {/* Le cercle avec l'effet de verre (le design de register) */}
  <div className="p-2 md:p-3 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10 shadow-xl backdrop-blur-md">
    <ArrowLeft className="w-5 h-5 md:w-8 md:h-8" strokeWidth={3} />
  </div>

  {/* Le texte discret à côté */}
  <span className="font-black text-xs md:text-sm uppercase tracking-widest italic hidden md:block">
    Accueil
  </span>
</button>
          {/* LOGO ADAPTATIF */}
          <div className="flex flex-col items-center mb-8 md:mb-12">
            <div className="flex items-center gap-4 md:gap-8 mb-4">
              <img src={logo} alt="Logo" className="w-36 md:w-64 lg:w-72 h-auto object-contain" />
              <span className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic text-[#ff5a8d] tracking-tighter">BÉNIN</span>
            </div>
          </div>

          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tight underline decoration-[#00a669] decoration-4 md:decoration-8 underline-offset-4">
              Identification
            </h1>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <form onSubmit={handleLogin} className="space-y-6 md:space-y-8 w-full">
              {/* EMAIL */}
              <div className="space-y-3 text-left">
                <label className="text-lg md:text-2xl font-black text-white uppercase italic ml-6 tracking-widest opacity-90">
                  E-mail
                </label>
                <input
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white/70 border-none p-5 md:p-7 rounded-full text-xl md:text-3xl font-bold outline-none focus:bg-white transition-all text-center shadow-2xl ${emailError ? 'ring-4 ring-red-500' : ''}`}
                  placeholder="votre@email.com" 
                  required
                />
                {emailError && <p className="text-red-400 font-bold text-lg md:text-2xl mt-2 ml-6 italic tracking-tight"> {emailError}</p>}
              </div>

              {/* MOT DE PASSE */}
              <div className="space-y-3 text-left">
                <label className="text-lg md:text-2xl font-black text-white uppercase italic ml-6 tracking-widest opacity-90">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-white/70 border-none p-5 md:p-7 rounded-full text-xl md:text-3xl font-bold outline-none focus:bg-white transition-all text-center shadow-2xl ${passwordError ? 'ring-4 ring-red-500' : ''}`}
                    placeholder="••••••••" 
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 text-slate-700 hover:text-black transition-colors">
                    {showPassword ? <EyeOff className="w-8 h-8 md:w-10 md:h-10" /> : <Eye className="w-8 h-8 md:w-10 md:h-10" />}
                  </button>
                </div>
                {passwordError && <p className="text-red-400 font-bold text-lg md:text-2xl mt-2 ml-6 italic tracking-tight"> {passwordError}</p>}
              </div>

              {/* BOUTON CONNEXION */}
              <button
                disabled={loading}
                className="w-full bg-[#00a669]  text-white p-5 md:p-8 rounded-full font-black text-2xl md:text-4xl uppercase tracking-[0.1em] shadow-[0_20px_50px_rgba(0,166,105,0.3)] active:scale-95 transition-all flex items-center justify-center g-emerald-900 mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>SE CONNECTER</span>
                    <ArrowRight className="w-8 h-8 md:w-12 md:h-12" />
                  </>
                )}
              </button>
            </form>

            {/* SECTION SOCIALE */}
            <div className="mt-10 md:mt-14 flex flex-col items-center gap-6 w-full">
              <div className="relative w-full flex items-center justify-center">
                <span className="relative px-8 bg-transparent text-lg md:text-2xl font-black text-white uppercase opacity-60 italic tracking-widest">
                  Ou via
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCustomGoogleLogin()}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 p-5 md:p-8 rounded-full font-black text-xl md:text-3xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center -slate-300"
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
                  alt="Google"
                  className="w-8 h-8 md:w-12 md:h-12"
                />
                <span>Continuer avec Google</span>
              </button>

              {/* INSCRIPTION */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-white/80 text-xl md:text-3xl font-medium italic tracking-wide">
                  Pas encore de compte ?
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="text-2xl md:text-4xl font-black text-[#ff5a8d] hover:text-white hover:scale-110 italic underline underline-offset-8 transition-all"
                >
                  S'inscrire gratuitement
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}