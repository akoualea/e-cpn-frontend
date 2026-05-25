import React, { useState } from 'react';
import { api } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Save, X, Activity, Baby, Beaker, ClipboardCheck, 
  Stethoscope, UploadCloud, Loader2, Eye, FileText, 
  ChevronRight, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyError, notifySuccess } from '../../utils/notifications';

export default function FicheConsultation({ patient, cpnNumber, currentSA, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: patient.id,
    cpn_number: cpnNumber,
    poids: '', tension_arterielle: '', hauteur_uterine: '', bcf: '', observations: '',
    ddr: '', dpa: '', gs_rh: '', electrophorese_hb: '', 
    gestite_g: '', parite_p: '', vivants_v: '',
    oedemes: false, tpi_paludisme: false, fer_acide_folique: false,
    resultat_bandelette: '', test_osullivan: '',
    presentation_foetus: 'Céphalique', bassin: 'Normal', 
    col_position: 'Postérieur', col_consistance: 'Ferme', col_ouverture: 'Fermé',
    pronostic: 'VOIE BASSE', lieu_accouchement_prevu: '', file_url: null
  });

  const isCPN1 = cpnNumber === 1;
  const isTerme = cpnNumber >= 6;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `medical_docs/${patient.id}/cpn${cpnNumber}_${Date.now()}`;
      const { error } = await supabase.storage.from('medical_docs').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('medical_docs').getPublicUrl(filePath);
      setFormData(prev => ({...prev, file_url: data.publicUrl}));
      notifySuccess("Document d'examen chargé !");
    } catch (err) { 
        console.error(err);
        notifyError("Erreur lors de l'upload"); 
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!formData.poids || !formData.tension_arterielle) return notifyError("Poids et Tension requis");
    setLoading(true);
    try {
      await api.post('/doctor/save-consultation', formData);
      notifySuccess(`Acte CPN n°${cpnNumber} enregistré !`);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) { notifyError("Erreur lors de la sauvegarde"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-end bg-slate-900/40 backdrop-blur-md p-4">
      <motion.div 
        initial={{ x: '100%', opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white/20 w-full max-w-4xl h-full shadow-2xl flex flex-col rounded-[4rem] overflow-hidden border-[10px] border-white"
      >
        {/* HEADER */}
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-3 h-14 bg-[#FF7096] rounded-full" />
            <div>
              <p className="font-black uppercase text-3xl tracking-[0.2em] text-[#FF7096] mb-1">Saisie Médicale • CPN {cpnNumber}</p>
              <h2 className="text-4xl font-black italic tracking-tighter text-slate-800 uppercase">
                Mme {patient?.nom} {patient?.prenom}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-5 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-[#FF7096] transition-all shadow-md">
            <X size={40} strokeWidth={4}/>
          </button>
        </div>

        <div className="p-12 space-y-12 flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
          
          {/* SECTION 1: CONSTANTES (LÀ OÙ ON SAISIT LES CHIFFRES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <GlassInput label="Poids Maternel" unit="KG" placeholder="00.0"  onChange={(v) => setFormData({...formData, poids: v})} />
             <GlassInput label="Tension Artérielle" unit="mmHg" placeholder="12/08"  onChange={(v) => setFormData({...formData, tension_arterielle: v})} />
             <GlassInput label="Hauteur Utérine" unit="CM" placeholder="00" onChange={(v) => setFormData({...formData, hauteur_uterine: v})} />
             <GlassInput label="Cœur Bébé (BCF)" placeholder="Normal"  onChange={(v) => setFormData({...formData, bcf: v})} />
          </div>

          {/* SECTION 2: BILAN INITIAL (SI CPN 1) */}
          {isCPN1 && (
            <div className="p-10 bg-blue-100/50 rounded-[4rem] border-4 border-white grid grid-cols-2 gap-8 shadow-inner">
                <h4 className="col-span-full font-black text-blue-600 uppercase italic tracking-widest text-lg mb-4">Bilan Obstétrical Initial</h4>
                <GlassInput label="Groupe Sanguin" placeholder="A+" onChange={(v) => setFormData({...formData, gs_rh: v})} />
                <GlassInput label="Electrophorèse Hb" placeholder="AA" onChange={(v) => setFormData({...formData, electrophorese_hb: v})} />
                <GlassInput label="Gestité (G)" placeholder="G" onChange={(v) => setFormData({...formData, gestite_g: v})} />
                <GlassInput label="Parité (P)" placeholder="P" onChange={(v) => setFormData({...formData, parite_p: v})} />
            </div>
          )}

          {/* SECTION 3: EXAMEN DU TERME */}
          {isTerme && (
            <div className="p-10 bg-[#FF7096]/5 rounded-[4rem] border-4 border-white grid grid-cols-2 gap-8 shadow-inner">
                <h4 className="col-span-full font-black text-[#FF7096] uppercase italic tracking-widest text-lg mb-4">Évaluation fin de grossesse</h4>
                <GlassSelect label="Présentation" options={['Céphalique', 'Siège', 'Transversal']} onChange={(v) => setFormData({...formData, presentation_foetus: v})} />
                <GlassSelect label="Bassin" options={['Normal', 'Rétréci', 'Limite']} onChange={(v) => setFormData({...formData, bassin: v})} />
                <GlassSelect label="Position du Col" options={['Postérieur', 'Intermédiaire', 'Antérieur']} onChange={(v) => setFormData({...formData, col_position: v})} />
                <GlassSelect label="Ouverture du Col" options={['Fermé', 'Amorcé', '1 doigt', 'Plus']} onChange={(v) => setFormData({...formData, col_ouverture: v})} />
            </div>
          )}

          {/* SECTION 4: UPLOAD */}
          <div className="p-10 bg-white rounded-[4rem] border-4 border-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl text-[#FF7096] shadow-inner">
                  
                </div>
                <div>
                    <p className="font-black uppercase text-2xl text-slate-700">Pièces jointes</p>
                    <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest leading-tight">Échographie ou Examens bio</p>
                </div>
             </div>
             <label className="cursor-pointer px-10 py-5 bg-[#FF7096] text-white rounded-3xl font-black text-2xl uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl">
                {formData.file_url ? "Modifier le document" : "Joindre un document"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
             </label>
          </div>

          {/* CONCLUSIONS (TEXTAREA GÉANT) */}
          <div className="space-y-4">
             <label className="text-2xl font-black text-[#FF7096] uppercase tracking-widest ml-4 italic">Observations & Conclusions</label>
             <textarea 
               className="w-full p-10 bg-white border-4 border-white rounded-[4rem] font-bold text-3xl text-slate-900 outline-none focus:border-[#FF7096] shadow-2xl min-h-[250px] placeholder:text-slate-200"
               placeholder="Saisissez vos observations médicales ici..."
               onChange={(e) => setFormData({...formData, observations: e.target.value})}
             />
          </div>
        </div>

        {/* BOUTON VALIDER */}
        <div className="p-10 bg-white border-t-4 border-slate-50 shrink-0">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-10 bg-[#FF7096] text-white rounded-[3.5rem] font-black uppercase text-2xl tracking-widest shadow-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={40} /> : (
              <>
                <Save size={35} />
                Valider l'Acte Médical
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- COMPOSANTS DE SAISIE AVEC TEXTE GÉANT ---

// --- À MODIFIER TOUT EN BAS DU FICHIER FICHECONSULTATION ---

function GlassInput({ label, unit, placeholder, icon, onChange }) {
  return (
    <div className="flex flex-col text-left gap-2 group">
      {/* Label légèrement plus grand et plus sombre */}
      <label className="text-[12px] font-black uppercase text-slate-500 ml-6 tracking-widest group-focus-within:text-[#FF7096] transition-colors">
        {label} {unit && <span className="text-[#FF7096]/60">({unit})</span>}
      </label>
      <div className="relative">
        <input 
          // CHANGEMENT ICI : text-5xl (très gros) et font-black (très épais)
          className="w-full p-8 pl-10 bg-white/60 border border-white rounded-[2.5rem] text-5xl font-black text-slate-900 outline-none focus:bg-white transition-all shadow-sm placeholder:text-slate-200" 
          placeholder={placeholder} 
          onChange={(e) => onChange(e.target.value)} 
        />
        {icon && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[#FF7096]/30 scale-150">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ET POUR LE TEXTAREA DANS LE CORPS DU FICHIER ---
// Cherche la balise <textarea> et remplace ses classes par celles-ci :
<textarea 
  className="w-full p-10 bg-white/60 border border-white rounded-[3rem] font-black text-4xl text-slate-900 outline-none focus:ring-4 focus:ring-[#FF7096]/10 shadow-inner min-h-[200px] placeholder:text-slate-200"
  placeholder="Saisissez vos observations médicales ici..."
  onChange={(e) => setFormData({...formData, observations: e.target.value})}
/>

function GlassSelect({ label, options, onChange }) {
  return (
    <div className="flex flex-col text-left gap-4">
      <label className="text-base font-black uppercase text-slate-500 ml-6 tracking-widest">
        {label}
      </label>
      <select 
        className="w-full p-8 px-10 bg-white border-4 border-transparent focus:border-[#FF7096] rounded-[2.5rem] text-3xl font-black text-slate-900 outline-none transition-all shadow-xl appearance-none"
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}