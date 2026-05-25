import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion'; // AJOUTÉ : Import de motion
import { Construction, Loader2, Clock } from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/Dashboard';
import MedecinDashboard from './pages/medecin/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword'; 
import logo from './assets/logo.png';

// --- PAGE MAINTENANCE (LOOK GÉANT & MODERNE) ---
const MaintenancePage = ({ settings }) => (
  <div className="h-screen w-full relative flex items-center justify-center font-roboto overflow-hidden bg-slate-900">
    
    {/* Background flou */}
    <div className="absolute inset-0 z-0">
      <img 
        src="/dash_med1.png" 
        alt="Background" 
        className="w-full h-full object-cover opacity-30 blur-[8px]" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900" />
    </div>

    {/* Conteneur Glassmorphism */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative z-10 w-[90%] max-w-4xl p-10 md:p-20 bg-white/10 backdrop-blur-2xl rounded-[60px] border border-white/20 shadow-2xl text-center"
    >
      <div className="relative inline-block mb-12">
        <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-3xl opacity-30 animate-pulse" />
        <Construction size={120} className="relative text-[#FFD700] animate-bounce" strokeWidth={1.5} />
      </div>

      <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter mb-8 leading-none">
        Système en <br/>
        <span className="text-[#FFD700]">Maintenance</span>
      </h1>

      <div className="bg-black/20 backdrop-blur-md p-8 rounded-[40px] border border-white/10 mb-12">
        <p className="text-xl md:text-3xl font-bold text-gray-200 italic leading-tight">
          "{settings?.message || "Mise à jour en cours..."}"
        </p>
      </div>

      <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-white/5 px-10 py-5 rounded-full border border-white/10">
        <div className="flex items-center gap-4">
           <Clock className="text-[#FFD700]" size={28} />
           <span className="text-lg font-black text-gray-400 uppercase tracking-widest">Retour estimé :</span>
        </div>
        <span className="text-2xl md:text-4xl font-black text-white italic">
          {settings?.estimated_end || "Bientôt"}
        </span>
      </div>

      <div className="mt-16 flex items-center justify-center gap-4 opacity-40">
        <img src={logo} className="w-10 h-10 object-contain" alt="Logo" />
        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">e-CPN Bénin</span>
      </div>
    </motion.div>
  </div>
);

// --- PROTECTED ROUTE CORRIGÉE ---
const ProtectedRoute = ({ children, allowedRole, siteSettings }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-[#FFD700]" size={64} />
      </div>
    );
  }

  const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';

  // BLOQUER SI MAINTENANCE (Sauf Admin)
  if (siteSettings?.value && !isAdmin) {
    return <MaintenancePage settings={siteSettings} />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && profile.role?.toUpperCase() !== allowedRole.toUpperCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { profile } = useAuth();
  const [siteSettings, setSiteSettings] = useState({ value: false, message: '', estimated_end: '' });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*').eq('key', 'maintenance_mode').maybeSingle();
        if (data) setSiteSettings({ value: data.value, message: data.message, estimated_end: data.estimated_end });
      } catch (err) { console.error(err); } 
      finally { setLoadingSettings(false); }
    };
    fetchSettings();

    const channel = supabase.channel('site-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
        if (payload.new.key === 'maintenance_mode') {
          setSiteSettings({ 
            value: payload.new.value, 
            message: payload.new.message, 
            estimated_end: payload.new.estimated_end 
          });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loadingSettings) return null;

  const isAdmin = profile?.role?.toUpperCase() === 'ADMIN';

  return (
    <BrowserRouter>
   <Toaster 
  position="top-right" 
  containerStyle={{
    zIndex: 100000, // On met 100 000 pour être sûr de passer devant le modal (30 000)
  }}
/>
      <Routes>
        <Route path="/" element={siteSettings.value && !isAdmin ? <MaintenancePage settings={siteSettings} /> : <Home />} />
        <Route path="/login" element={siteSettings.value && !isAdmin ? <MaintenancePage settings={siteSettings} /> : <Login />} />
        <Route path="/register" element={siteSettings.value && !isAdmin ? <MaintenancePage settings={siteSettings} /> : <Register />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/patient/dashboard" element={
          <ProtectedRoute allowedRole="PATIENT" siteSettings={siteSettings}><PatientDashboard /></ProtectedRoute>
        } />
        
        <Route path="/medecin/dashboard" element={
          <ProtectedRoute allowedRole="PRO" siteSettings={siteSettings}><MedecinDashboard /></ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="ADMIN" siteSettings={{ value: false }}><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}