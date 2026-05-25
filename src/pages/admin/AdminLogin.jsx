import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'; // Ajout Eye/EyeOff
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

// On garde tes images de fond pour l'Admin
const images = ['/adminlogin3.jpg', '/adminlogin5.jpg', '/adminlogin7.jpg'];

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [showPassword, setShowPassword] = useState(false); // État pour l'affichage du mot de passe
  
  const auth = useAuth();
  const navigate = useNavigate();

  // Animation du diaporama de fond
  useEffect(() => {
    const timer = setInterval(() => setCurrentImg((prev) => (prev + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await auth.login(email, password);
      const userProfile = result?.profile;

      if (!userProfile || !userProfile.role) {
        await auth.signOut(); 
        toast.error("Profil utilisateur non trouvé ou rôle manquant.");
        return;
      }

      const role = userProfile.role.toUpperCase();

      if (role !== 'ADMIN') {
        await auth.signOut(); 
        toast.error("Accès réservé au Directeur");
        return;
      }

      toast.success('Connexion Direction réussie');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Identifiants incorrects ou erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
      
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.img 
            key={images[currentImg]} 
            src={images[currentImg]} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.6 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 1.5 }} 
            className="w-full h-full object-cover" 
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 w-full lg:w-[75%] h-full flex items-center justify-center p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl bg-white/10 backdrop-blur-3xl rounded-[5rem] p-16 lg:p-24 shadow-2xl border border-white/20"
        >
          
          <div className="flex flex-col items-center mb-16">
            <div className="flex items-center gap-8 mb-4 cursor-pointer">
              <img src={logo} alt="Logo" className="w-64 lg:w-80 h-auto object-contain" />
              <span className="text-7xl lg:text-8xl font-black uppercase italic text-[#ff5a8d] tracking-tighter">BÉNIN</span>
            </div>
            <div className="flex items-center gap-3 bg-emerald-500/20 px-8 py-3 rounded-full border border-emerald-500/50 mt-4">
               <ShieldCheck className="text-emerald-400" size={30} />
               <span className="text-xl font-black text-emerald-400 uppercase tracking-[0.3em]">Portail Direction</span>
            </div>
          </div>

          <div className="text-center mb-20">
            <h1 className="text-7xl lg:text-8xl font-black text-white uppercase italic tracking-tight underline decoration-emerald-500 decoration-8 underline-offset-8">
              ADMIN LOGIN
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-12 max-w-3xl mx-auto">
            <div className="space-y-6">
              <label className="text-3xl font-black text-white uppercase italic ml-8 tracking-wide">Email Directeur</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border-2 border-white/10 p-10 rounded-full text-4xl font-bold outline-none focus:bg-white focus:text-black focus:border-emerald-500 transition-all text-center shadow-inner text-white"
                placeholder="---" 
                required
              />
            </div>

            <div className="space-y-6">
              <label className="text-3xl font-black text-white uppercase italic ml-8 tracking-wide">Code Secret</label>
              <div className="relative"> {/* Conteneur relatif pour positionner l'oeil */}
                <input 
                  type={showPassword ? "text" : "password"} // Type dynamique
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border-2 border-white/10 p-10 rounded-full text-4xl font-bold outline-none focus:bg-white focus:text-black focus:border-emerald-500 transition-all text-center shadow-inner text-white"
                  placeholder="••••••••" 
                  required
                />
                {/* Bouton de l'oeil */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={44} /> : <Eye size={44} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-full font-black text-3xl uppercase tracking-widest shadow-2xl shadow-emerald-900/50 active:scale-95 transition-all flex items-center justify-center gap-3 mt-13"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={48} />
              ) : (
                <>ACCÉDER AU BUREAU <ArrowRight size={48}/></>
              )}
            </button>
          </form>

          <div className="mt-20 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-2xl font-black text-white/30 hover:text-white uppercase italic tracking-widest transition-colors"
            >
              ← Retour au portail public
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}