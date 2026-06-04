import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Sun, Moon, LogOut,
  LayoutDashboard, UserCheck, Link2, Settings,
  ThumbsUp, ThumbsDown, User, ShieldCheck, Users, Activity, Clock, ShieldAlert, Menu, X
} from 'lucide-react';
import { notifySuccess, notifyError } from '../../utils/notifications'; 
import logo from '../../assets/logo.png';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

export default function AdminDashboard() {
  const { signOut, profile, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Ajouté pour le responsive
  
  const [isProcessing, setIsProcessing] = useState(false); 
  const [processingAction, setProcessingAction] = useState({ id: null, type: null });
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  const [data, setData] = useState({
    pendingPros: [],
    verifiedPros: [],
    patients: [],
    stats: { totalPatients: 0, activePros: 0, pendingPros: 0, linkedPatients: 0 }
  });

  const [selectedPatientToAssign, setSelectedPatientToAssign] = useState('');
  const [selectedProForAssignment, setSelectedProForAssignment] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintConfig, setMaintConfig] = useState({ message: '' });

  const fetchData = useCallback(async (showSilent = false) => {
    if (!showSilent) setLoading(true);
    try {
      const [pendingRes, verifiedRes, patientsRes] = await Promise.all([
        api.get('/medical-pros/pending'),
        api.get('/medical-pros/verified'),
        api.get('/patients')
      ]);

      setData({
        pendingPros: pendingRes.data,
        verifiedPros: verifiedRes.data,
        patients: patientsRes.data,
        stats: {
          totalPatients: patientsRes.data.length,
          activePros: verifiedRes.data.length,
          pendingPros: pendingRes.data.length,
          linkedPatients: patientsRes.data.filter(p => p.assigned_pro_id).length
        }
      });
      
      const { data: settings } = await supabase.from('site_settings').select('*').eq('key', 'maintenance_mode').single();
      if (settings) {
        setMaintenanceMode(settings.value);
        setMaintConfig({ message: settings.message || '' });
      }
    } catch (err) {
      notifyError("Erreur de synchronisation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const proChannel = supabase.channel('admin-pro-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'medical_pros' }, () => fetchData(true)).subscribe();
    return () => { supabase.removeChannel(proChannel); };
  }, [fetchData]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      setIsLoggingOut(false);
      notifyError("Erreur lors de la déconnexion");
    }
  };

  const handleToggleMaintenance = async () => {
    setIsProcessing(true);
    try {
      const newValue = !maintenanceMode;
      const { data, error } = await supabase.from('site_settings').upsert({ key: 'maintenance_mode', value: newValue, message: maintConfig.message }, { onConflict: 'key' }).select();
      if (error) throw error;
      setMaintenanceMode(newValue);
      notifySuccess(newValue ? "SYSTÈME VERROUILLÉ" : "SYSTÈME RÉOUVERT");
    } catch (err) {
      notifyError("Erreur de maintenance");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProValidation = async (proId, action) => {
    setProcessingAction({ id: proId, type: action }); 
    try {
      await api.post(`/medical-pros/${proId}/validate`, { action });
      notifySuccess(action === 'approve' ? 'Praticien validé !' : 'Dossier rejeté.');
      fetchData(true);
    } catch (err) {
      notifyError("Erreur lors de la validation.");
    } finally {
      setProcessingAction({ id: null, type: null });
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatientToAssign || !selectedProForAssignment) return notifyError("Sélection incomplète.");
    setIsProcessing(true);
    try {
      await api.post('/medical-pros/assign-patient', { patient_id: selectedPatientToAssign, pro_id: selectedProForAssignment });
      notifySuccess('Liaison établie !');
      setSelectedPatientToAssign(''); setSelectedProForAssignment('');
      fetchData(true);
    } catch (err) {
      notifyError("Erreur d'attribution.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-roboto">
      <Loader2 className="w-12 h-12 md:w-20 md:h-20 text-[#FFD700] animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen relative font-roboto transition-colors duration-500 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F8F9FA] text-slate-900'}`}>
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img src="/dash_med1.png" alt="Background" className="w-full h-full object-cover opacity-60 blur-[5px]" />
        <div className={`absolute inset-0 ${darkMode ? 'bg-gray-900/80' : 'bg-transparent'}`} />
      </div>

      {/* BOUTON MENU MOBILE */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-6 right-6 z-[60] p-4 bg-[#FFD700] text-gray-900 rounded-2xl shadow-2xl"
      >
        {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
      </button>

      {/* SIDEBAR - Responsive */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] border-r shadow-2xl z-50 transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full py-8 lg:py-12 px-6 lg:px-8">
          <div className="mb-10 lg:mb-16 flex flex-col items-center text-center">
            <div className="relative w-24 h-24 lg:w-40 lg:h-40 mb-4 lg:mb-6">
              <img src={profile?.photo_url || "https://i.pinimg.com/1200x/c1/ec/32/c1ec32afdd5a626ac74930723d52dbc0.jpg"} className="w-full h-full rounded-[30px] lg:rounded-[40px] object-cover border-4 border-[#FFD700] shadow-2xl" alt="Admin" />
            </div>
            <h2 className={`font-black text-xl lg:text-3xl uppercase tracking-tighter leading-none ${darkMode ? 'text-white' : 'text-gray-800'}`}>DIR. {profile?.nom}</h2>
            <p className="text-sm lg:text-2xl font-black text-[#FFD700] uppercase tracking-[0.2em] mt-2 lg:mt-3 italic">Direction Générale</p>
          </div>

          <nav className="space-y-4 lg:space-y-6">
            <NavItem id="dashboard" icon={<LayoutDashboard size={28} />} label="Dashboard" active={activeTab} onClick={(id) => {setActiveTab(id); setIsMobileMenuOpen(false)}} darkMode={darkMode} />
            <NavItem id="verifications" icon={<UserCheck size={28} />} label="Vérifier" active={activeTab} onClick={(id) => {setActiveTab(id); setIsMobileMenuOpen(false)}} darkMode={darkMode} />
            <NavItem id="liaisons" icon={<Link2 size={28} />} label="Liaisons" active={activeTab} onClick={(id) => {setActiveTab(id); setIsMobileMenuOpen(false)}} darkMode={darkMode} />
            <NavItem id="maintenance" icon={<Settings size={28} />} label="Maintenance" active={activeTab} onClick={(id) => {setActiveTab(id); setIsMobileMenuOpen(false)}} darkMode={darkMode} />
          </nav>

          <button 
            disabled={isLoggingOut}
            onClick={handleSignOut} 
            className="mt-auto flex items-center justify-center gap-4 text-gray-400 hover:text-red-500 font-black text-xl lg:text-4xl p-4 lg:p-6 transition-all"
          >
            {isLoggingOut ? <Loader2 className="animate-spin" size={30} /> : <><LogOut size={28} /> QUITTER</>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - Responsive margins and padding */}
      <main className="relative z-10 ml-0 lg:ml-[280px] min-h-screen p-6 md:p-12 lg:p-16">
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 lg:mb-20 gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-10">
            <img src={logo} className="w-32 h-32 lg:w-48 lg:h-48 object-contain" alt="Logo" />
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none text-center md:text-left ${darkMode ? 'text-white' : 'text-gray-800'}`}>{activeTab}</h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-4 lg:p-6 rounded-2xl lg:rounded-[30px] shadow-xl transition-all ${darkMode ? 'bg-gray-700 text-[#FFD700]' : 'bg-white text-gray-400 hover:text-[#FFD700]'}`}>
            {darkMode ? <Sun size={32} /> : <Moon size={32} />}
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
                <StatCard label="Patientes" val={data.stats.totalPatients} icon={<Users size={32}/>} col="bg-[#FF3B82]" darkMode={darkMode} />
                <StatCard label="Médecins" val={data.stats.activePros} icon={<Activity size={32}/>} col="bg-[#00A651]" darkMode={darkMode} />
                <StatCard label="Attente" val={data.stats.pendingPros} icon={<Clock size={32}/>} col="bg-[#FFD700]" darkMode={darkMode} />
                <StatCard label="Suivis" val={data.stats.linkedPatients} icon={<Link2 size={32}/>} col="bg-[#2979FF]" darkMode={darkMode} />
              </div>
            )}

            {activeTab === 'verifications' && (
              <div className="space-y-6 lg:space-y-10">
                <h3 className={`text-3xl lg:text-5xl font-black uppercase italic mb-8 lg:mb-12 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dossiers Médicaux</h3>
                {data.pendingPros.length === 0 ? (
                  <div className={`${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur-md p-12 lg:p-24 rounded-[40px] lg:rounded-[60px] border-4 border-dashed border-gray-500/20 text-center`}>
                    <p className="text-xl lg:text-4xl font-black text-gray-400 uppercase italic">Aucune demande en attente</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:gap-8">
                    {data.pendingPros.map(pro => (
                      <div key={pro.id} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-6 lg:p-10 rounded-[30px] lg:rounded-[50px] shadow-sm flex flex-col xl:flex-row items-center gap-6 lg:gap-10 border ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                        <div className="flex items-center gap-6 lg:gap-10 flex-1 w-full">
                          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-2xl lg:rounded-[30px] flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                             {pro.photo_url ? <img src={pro.photo_url} className="w-full h-full object-cover"/> : <User size={40} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm lg:text-xl font-black text-[#FFD700] uppercase tracking-widest mb-1 italic truncate">{pro.medical_pro?.specialite || 'PRATICIEN'}</p>
                            <h4 className="text-xl lg:text-4xl font-black tracking-tight truncate">Dr. {pro.nom} {pro.prenom}</h4>
                            <p className="text-xs lg:text-lg font-bold text-gray-400 mt-1 uppercase italic">Matricule: {pro.medical_pro?.matricule || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-center xl:justify-end gap-4 w-full xl:w-auto">
                          <a href="https://ordremedecinsbenin.bj/" target="_blank" rel="noopener noreferrer" className="flex-1 xl:flex-none bg-blue-500 text-white px-6 lg:px-8 py-4 lg:py-5 rounded-2xl lg:rounded-[30px] font-black text-sm lg:text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <Link2 size={20} /> VÉRIFIER
                          </a>
                          <button 
                            disabled={processingAction.id === pro.id}
                            onClick={() => handleProValidation(pro.id, 'approve')} 
                            className="flex-1 xl:flex-none bg-green-600 text-white px-6 lg:px-8 py-4 lg:py-5 rounded-2xl lg:rounded-xl font-bold text-sm lg:text-xl flex items-center justify-center gap-2"
                          >
                            {processingAction.id === pro.id && processingAction.type === 'approve' ? <Loader2 className="animate-spin" size={20}/> : "VALIDER"}
                          </button>
                          <button 
                            disabled={processingAction.id === pro.id}
                            onClick={() => handleProValidation(pro.id, 'reject')}
                            className="flex-1 xl:flex-none bg-red-600 text-white px-6 lg:px-8 py-4 lg:py-5 rounded-2xl lg:rounded-xl font-bold text-sm lg:text-xl flex items-center justify-center gap-2"
                          >
                            {processingAction.id === pro.id && processingAction.type === 'reject' ? <Loader2 className="animate-spin" size={20}/> : "REJETER"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'liaisons' && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 lg:p-16 rounded-[40px] lg:rounded-[60px] shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                <h3 className={`text-3xl lg:text-6xl font-black tracking-tight mb-8 lg:mb-14 italic uppercase leading-none ${darkMode ? 'text-white' : 'text-gray-800'}`}>Attribuer un Praticien</h3>
                <div className="max-w-4xl space-y-8 lg:space-y-12">
                  <select value={selectedPatientToAssign} onChange={(e) => setSelectedPatientToAssign(e.target.value)} className={`w-full p-6 lg:p-10 rounded-2xl lg:rounded-[40px] border-none text-xl lg:text-3xl font-black outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-800'}`}>
                    <option value="">-- CHOISIR PATIENTE --</option>
                    {data.patients.filter(p => !p.assigned_pro_id).map(p => <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom}</option>)}
                  </select>
                  <select value={selectedProForAssignment} onChange={(e) => setSelectedProForAssignment(e.target.value)} className={`w-full p-6 lg:p-10 rounded-2xl lg:rounded-[40px] border-none text-xl lg:text-3xl font-black outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-800'}`}>
                    <option value="">-- CHOISIR MÉDECIN --</option>
                    {data.verifiedPros.map(d => <option key={d.id} value={d.id}>DR. {d.nom.toUpperCase()} ({d.medical_pro?.specialite})</option>)}
                  </select>
                  <button onClick={handleAssignPatient} disabled={isProcessing} className="w-full py-6 lg:py-10 bg-[#2979FF] text-white rounded-2xl lg:rounded-[45px] font-black text-xl lg:text-4xl uppercase italic shadow-2xl flex items-center justify-center">
                    {isProcessing ? <Loader2 className="animate-spin" size={32}/> : "ÉTABLIR LA LIAISON"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 lg:p-16 rounded-[40px] lg:rounded-[60px] shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 mb-10 lg:mb-16">
                   <ShieldAlert size={48} className={maintenanceMode ? "text-red-500" : "text-green-500"} />
                   <h3 className={`text-3xl lg:text-6xl font-black italic uppercase text-center sm:text-left ${darkMode ? 'text-white' : 'text-gray-800'}`}>Contrôle Système</h3>
                </div>
                <div className="max-w-4xl space-y-10 lg:space-y-16">
                   <textarea value={maintConfig.message} onChange={(e) => setMaintConfig({...maintConfig, message: e.target.value})} className={`w-full p-8 lg:p-12 rounded-[30px] lg:rounded-[50px] text-lg lg:text-3xl font-black min-h-[200px] lg:min-h-[300px] resize-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-800'}`} placeholder="Message d'alerte..." />
                   <button onClick={handleToggleMaintenance} disabled={isProcessing} className={`w-full py-6 lg:py-10 rounded-2xl lg:rounded-[45px] font-black text-xl lg:text-4xl uppercase shadow-2xl flex items-center justify-center border-b-[2px] ${maintenanceMode ? 'bg-emerald-500 border-emerald-800' : 'bg-red-500 border-red-800'} text-white`}>
                      {isProcessing ? <Loader2 className="animate-spin" size={32}/> : (maintenanceMode ? "RÉACTIVER LE SYSTÈME" : "ACTIVER LA MAINTENANCE")}
                    </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ id, icon, label, active, onClick, darkMode }) {
  const isActive = active === id;
  return (
    <button onClick={() => onClick(id)} className={`w-full flex items-center gap-4 lg:gap-8 px-6 lg:px-10 py-4 lg:py-8 rounded-2xl lg:rounded-[35px] transition-all duration-300 ${isActive ? 'bg-[#FFD700]/10 text-[#FFD700] border-r-[8px] lg:border-r-[15px] border-[#FFD700] shadow-md scale-105' : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-50'}`}>
      <div className={isActive ? "scale-110" : ""}>{icon}</div>
      <span className="text-lg lg:text-4xl font-black uppercase italic tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ label, val, icon, col, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-sm p-6 lg:p-12 rounded-[30px] lg:rounded-[50px] shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all border ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
      <div className={`absolute top-4 right-4 lg:top-10 lg:right-10 p-3 lg:p-5 rounded-xl lg:rounded-[25px] text-white ${col} shadow-lg z-10`}>{icon}</div>
      <div className="pr-12 lg:pr-20 text-left relative z-0">
        <p className="text-gray-400 font-black text-xs lg:text-2xl uppercase mb-2 lg:mb-6">{label}</p>
        <p className={`text-4xl lg:text-7xl font-black leading-none ${darkMode ? 'text-white' : 'text-gray-800'}`}>{val}</p>
      </div>
    </div>
  );
}
