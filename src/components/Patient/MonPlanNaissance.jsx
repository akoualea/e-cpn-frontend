import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyError, notifySuccess } from '../../utils/notifications';
import {
  Truck, Users, Droplets, Wallet, Save, Edit3, X,
  Heart, Baby, Stethoscope, ShieldAlert, Plus, Loader2,
  Euro, AlertCircle, ArrowRight, ArrowLeft, Target
} from 'lucide-react';
export default function MonPlanNaissance({ patientId, onClose, isDoctorView = false }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCategory, setDepositCategory] = useState('epargne_trousseau_mere');
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState({
    lieu_prevu: '', transport_type: '',
    accompagnateur_nom: '', accompagnateur_contact: '', decisionnaire: '',
    donneur_nom: '', donneur_contact: '',
    prix_trousseau_mere: 0, prix_trousseau_bebe: 0, prix_examens: 0, prix_imprevus: 0, prix_cesarienne: 0,
    epargne_trousseau_mere: 0, epargne_trousseau_bebe: 0, epargne_examens: 0, epargne_imprevus: 0, epargne_cesarienne: 0,
    epargne_actuelle: 0, somme_estimee: 0
  });
  const categories = [
    { key: 'trousseau_mere', label: 'Trousseau Maman', icon: <Heart size={30} /> },
    { key: 'trousseau_bebe', label: 'Trousseau Bébé', icon: <Baby size={30} /> },
    { key: 'examens', label: 'Examens & Suivi', icon: <Stethoscope size={30} /> },
    { key: 'imprevus', label: 'Fonds Imprévus', icon: <ShieldAlert size={30} /> },
    { key: 'cesarienne', label: 'Césarienne', icon: <Plus size={30} /> },
  ];
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`https://e-cpn-backend-production.up.railway.app/api/patients/${patientId}/plan`);
      if (res.data) setPlan(res.data);
    } catch (e) { notifyError("Données inaccessibles"); }
    finally { setLoading(false); }
  }, [patientId]);
  useEffect(() => { if (patientId) fetchData(); }, [fetchData]);
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSend = {
        lieu_prevu: plan.lieu_prevu || '',
        transport_type: plan.transport_type || '',
        accompagnateur_nom: plan.accompagnateur_nom || '',
        accompagnateur_contact: plan.accompagnateur_contact || '',
        decisionnaire: plan.decisionnaire || '',
        donneur_nom: plan.donneur_nom || '',
        donneur_contact: plan.donneur_contact || '',
        prix_trousseau_mere: Number(plan.prix_trousseau_mere) || 0,
        prix_trousseau_bebe: Number(plan.prix_trousseau_bebe) || 0,
        prix_examens: Number(plan.prix_examens) || 0,
        prix_imprevus: Number(plan.prix_imprevus) || 0,
        prix_cesarienne: Number(plan.prix_cesarienne) || 0,
      };
      const res = await axios.post(`https://e-cpn-backend-production.up.railway.app/api/patients/${patientId}/plan/update`, dataToSend);
      setPlan(res.data);
      notifySuccess("Plan de naissance mis à jour !");
      setIsEditing(false);
    } catch (error) {
        notifyError("Échec de l'enregistrement.");
    } finally { setIsSaving(false); }
  };
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return notifyError("Montant invalide.");
    setIsDepositing(true);
    try {
      await axios.post(`https://e-cpn-backend-production.up.railway.app/api/patients/${patientId}/plan/deposit`, {
        category: depositCategory,
        amount: parseFloat(depositAmount)
      });
      setPlan(prev => ({
        ...prev,
        epargne_actuelle: Number(prev.epargne_actuelle) + Number(depositAmount),
        [depositCategory]: Number(prev[depositCategory] || 0) + Number(depositAmount)
      }));
      notifySuccess("Dépôt effectué !");
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (error) { notifyError("Erreur lors du dépôt."); }
    finally { setIsDepositing(false); }
  };
  const nmRaised = "bg-[#f0f3f7] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff]";
  const nmInset = "bg-[#f0f3f7] shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff]";
  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-emerald-500" size={80} />
    </div>
  );
  return (
    // Suppression du bg-slate-50 et du min-h-screen ici
    <div className="flex justify-center items-center w-full font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1400px] bg-[#f0f3f7] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border-8 border-white"
      >
        {/* --- SIDEBAR GAUCHE --- */}
        <div className="lg:w-[35%] bg-white p-10 md:p-14 flex flex-col justify-between items-start border-r-4 border-slate-100 shadow-inner">
          <div className="w-full text-left">
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-6">
              Plan de <br/> Naissance
            </h2>
            <div className="flex items-center gap-4">
               <div className={`h-4 w-20 rounded-full transition-all ${step === 1 ? 'bg-emerald-500 shadow-lg shadow-emerald-200':'bg-slate-200'}`} />
               <div className={`h-4 w-20 rounded-full transition-all ${step === 2 ? 'bg-emerald-500 shadow-lg shadow-emerald-200':'bg-slate-200'}`} />
            </div>
            <p className="text-3xl font-black text-slate-400 uppercase mt-8 tracking-widest italic">ÉTAPE {step} SUR 2</p>
          </div>
          <div className="w-full my-12">
             <div className={`p-12 rounded-[4rem] ${nmRaised} text-center border-4 border-white`}>
                 <p className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-4">Total Épargné</p>
                 <h3 className="text-6xl md:text-8xl font-black text-emerald-600 tracking-tighter">
                    {Number(plan.epargne_actuelle).toLocaleString()} <span className="text-4xl">F</span>
                 </h3>
                 <div className={`w-full h-10 rounded-full mt-10 p-2 ${nmInset} overflow-hidden`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (plan.epargne_actuelle/plan.somme_estimee)*100)}%` }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-lg"
                    />
                 </div>
              </div>
          </div>
          <div className="w-full space-y-6">
             {!isDoctorView && (
              <button
                disabled={isSaving}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`flex items-center justify-center gap-6 w-full py-8 rounded-[2.5rem] font-black text-3xl uppercase shadow-2xl transition-all
                  ${isEditing ? 'bg-emerald-600 text-white scale-105' : 'bg-white text-slate-700 border-4 border-slate-100 hover:bg-slate-50'}`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={40}/> : (isEditing ? <Save size={40}/> : <Edit3 size={40}/>)}
                <span>{isSaving ? 'Envoi...' : (isEditing ? 'Confirmer' : 'Modifier')}</span>
              </button>
            )}
            <button onClick={onClose} className="py-6 text-slate-400 font-black text-2xl uppercase italic hover:text-red-500 transition-colors w-full">
              Fermer le plan
            </button>
          </div>
        </div>
        {/* --- CONTENU DROIT --- */}
        <div className="lg:w-[65%] p-8 md:p-16 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col gap-10"
              >
                <section className="text-left">
                  <SectionHeader icon={<Truck size={40}/>} title="Logistique de Naissance" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                      <InputItem label="Lieu prévu" value={plan.lieu_prevu} editing={isEditing} onChange={(v)=>setPlan({...plan, lieu_prevu:v})} />
                      <InputItem label="Transport" value={plan.transport_type} editing={isEditing} onChange={(v)=>setPlan({...plan, transport_type:v})} />
                      <InputItem label="Accompagnateur" value={plan.accompagnateur_nom} editing={isEditing} onChange={(v)=>setPlan({...plan, accompagnateur_nom:v})} />
                      <InputItem label="Contact Accomp." value={plan.accompagnateur_contact} editing={isEditing} onChange={(v)=>setPlan({...plan, accompagnateur_contact:v})} />
                      <InputItem label="Décisionnaire" value={plan.decisionnaire} editing={isEditing} onChange={(v)=>setPlan({...plan, decisionnaire:v})} />
                      <InputItem label="Donneur Sang" value={plan.donneur_nom} editing={isEditing} onChange={(v)=>setPlan({...plan, donneur_nom:v})} />
                      <InputItem label="Contact Donneur" value={plan.donneur_contact} editing={isEditing} onChange={(v)=>setPlan({...plan, donneur_contact:v})} />
                  </div>
                </section>
                <button
                  onClick={() => setStep(2)}
                  className="mt-auto flex items-center justify-center gap-6 w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black text-3xl uppercase tracking-widest shadow-2xl hover:bg-black transition-all"
                >
                  Suivant : Budget <ArrowRight size={40} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col gap-8 text-left"
              >
                <button onClick={() => setStep(1)} className="flex items-center gap-4 text-slate-500 font-black uppercase text-2xl tracking-widest hover:text-emerald-600 mb-6 w-fit transition-colors">
                  <ArrowLeft size={32} /> Retour Logistique
                </button>
                <div className={`w-full p-10 rounded-[3.5rem] ${nmRaised} border-4 border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-8 bg-emerald-50/10`}>
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                            <Target size={45} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-emerald-600 uppercase tracking-widest leading-none">Budget Global Estimé</p>
                            <h4 className="text-7xl md:text-9xl font-black text-slate-800 tracking-tighter mt-4">{Number(plan.somme_estimee).toLocaleString()} F</h4>
                        </div>
                    </div>
                    {!isDoctorView && (
                        <button onClick={() => setShowDepositModal(true)} className="bg-emerald-600 text-white px-10 py-6 rounded-[2rem] font-black text-2xl uppercase shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-4">
                            <Euro size={30} /> Épargner
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                    {categories.map((cat) => (
                        <BudgetCardGrid
                            key={cat.key}
                            category={cat}
                            plan={plan}
                            isEditing={isEditing}
                            setPlan={setPlan}
                            nmRaised={nmRaised}
                            nmInset={nmInset}
                        />
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* --- MODAL DÉPÔT --- */}
        <AnimatePresence>
          {showDepositModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-xl">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-3xl p-14 rounded-[4rem] bg-[#f0f3f7] ${nmRaised} border-8 border-white`}
              >
                 <h3 className="text-5xl font-black text-slate-800 uppercase mb-12 text-center italic tracking-tighter">Ajouter à l'épargne</h3>
                 <div className="space-y-12 text-left">
                    <div>
                        <p className="text-2xl font-black text-slate-400 uppercase ml-4 mb-4">Catégorie</p>
                        <select
                            value={depositCategory}
                            onChange={(e)=>setDepositCategory(e.target.value)}
                            className={`w-full p-8 bg-[#f0f3f7] ${nmInset} rounded-[2.5rem] font-black text-3xl outline-none text-slate-700 border-none`}
                        >
                          {categories.map(cat => <option key={cat.key} value={`epargne_${cat.key}`}>{cat.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-400 uppercase ml-4 mb-4">Montant du dépôt (F)</p>
                        <input
                           type="number" autoFocus placeholder="0" value={depositAmount}
                           onChange={(e)=>setDepositAmount(e.target.value)}
                           className={`w-full p-12 bg-[#f0f3f7] ${nmInset} rounded-[3.5rem] font-black text-[100px] text-emerald-600 outline-none text-center leading-none border-none`}
                        />
                    </div>
                    <div className="flex gap-8 pt-8">
                        <button onClick={()=>setShowDepositModal(false)} className="flex-1 py-8 text-3xl font-black text-slate-400 uppercase hover:text-red-500 transition-colors">ANNULER</button>
                        <button disabled={isDepositing} onClick={handleDeposit} className="flex-[2] py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-3xl uppercase shadow-2xl flex items-center justify-center gap-6 hover:bg-emerald-700 active:scale-95 transition-all">
                          {isDepositing ? <Loader2 className="animate-spin" size={40} /> : "CONFIRMER LE DÉPÔT"}
                        </button>
                    </div>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
// --- SOUS-COMPOSANTS ---
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-6 pb-6 border-b-8 border-slate-100/50">
      <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white shadow-xl text-emerald-600 flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-5xl md:text-6xl font-black text-slate-800 uppercase tracking-tighter leading-none">{title}</h3>
    </div>
  );
}
function InputItem({ label, value, editing, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden text-left">
      <p className="text-2xl font-black text-slate-400 uppercase tracking-widest ml-4">{label}</p>
      {editing ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          className={`w-full p-8 rounded-[2rem] bg-[#f0f3f7] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] outline-none text-3xl font-black text-slate-800 focus:ring-4 ring-emerald-300 transition-all`}
        />
      ) : (
        <div className="p-8 rounded-[2rem] bg-white shadow-lg border-2 border-slate-50 text-4xl font-black text-slate-800 truncate leading-none">
          {value && value !== "" ? value : "---"}
        </div>
      )}
    </div>
  );
}
function BudgetCardGrid({ category, plan, isEditing, setPlan, nmRaised, nmInset }) {
  const current = Number(plan[`epargne_${category.key}`] || 0);
  const target = Number(plan[`prix_${category.key}`] || 0);
  const progress = target > 0 ? (current / target) * 100 : 0;
  return (
    <div className={`p-10 rounded-[3.5rem] ${nmRaised} border-4 border-white flex flex-col gap-8 overflow-hidden`}>
      <div className="flex items-center gap-6 overflow-hidden">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${nmInset} text-emerald-600 flex-shrink-0`}>
              {category.icon}
          </div>
          <h4 className="text-3xl font-black text-slate-500 uppercase leading-none truncate">{category.label}</h4>
      </div>
      <div className="mt-2 text-left">
         <div className="flex justify-between items-end mb-6">
            <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">{current.toLocaleString()} F</span>
            {isEditing ? (
                <input
                    type="number"
                    value={target}
                    onChange={(e)=>setPlan({...plan, [`prix_${category.key}`]: e.target.value})}
                    className={`w-48 p-4 rounded-xl text-4xl font-black text-emerald-600 outline-none ${nmInset} text-right border-none`}
                />
            ) : (
                <span className="text-2xl font-black text-emerald-600 uppercase italic">But : {target.toLocaleString()} F</span>
            )}
         </div>
         <div className={`w-full h-8 rounded-full ${nmInset} overflow-hidden p-1.5`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-lg"
            />
         </div>
      </div>
    </div>
  );
}