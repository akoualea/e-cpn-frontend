import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit3, Check, X, Loader2, Plus, Clock, ChevronLeft, Settings, Baby, Languages, Sparkles, Mic, Square, MicOff, Globe, AlertTriangle } from 'lucide-react';
import { notifyError, notifySuccess } from '../../utils/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { transcribeAudio } from '../../lib/aiService';
import { api } from '../../contexts/AuthContext';

const translations = {
  fr: {
    journalTitle: "Mes soucis de santé",
    settingsTitle: "Paramètres",
    subtitle: "SUIVI DE GROSSESSE",
    config: "CONFIGURATION",
    noNotes: "AUCUN SOUVENIR...",
    labelTitle: "OBJET",
    labelNote: "NOTE DÉTAILLÉE",
    btnSave: "ENREGISTRER",
    btnSaving: "SAUVEGARDE...",
    placeholderTitle: "Ex: Premier coup...",
    placeholderNote: "Comment vous sentez-vous ?",
    // Paramètres
    settingLang: "Langue de l'interface",
    settingMic: "Saisie vocale (micro)",
    settingMicOn: "Activé",
    settingMicOff: "Désactivé",
    settingDelete: "Supprimer toutes les notes",
    settingDeleteBtn: "TOUT SUPPRIMER",
    settingDeleteConfirm: "Êtes-vous sûre de vouloir supprimer TOUTES vos notes ? Cette action est irréversible.",
    settingDeleteSuccess: "Toutes les notes ont été supprimées.",
  },
  en: {
    journalTitle: "Health Concerns",
    settingsTitle: "Settings",
    subtitle: "PREGNANCY TRACKER",
    config: "CONFIGURATION",
    noNotes: "NO MEMORIES...",
    labelTitle: "SUBJECT",
    labelNote: "DETAILED NOTE",
    btnSave: "SAVE",
    btnSaving: "SAVING...",
    placeholderTitle: "Ex: First kick...",
    placeholderNote: "How are you feeling?",
    settingLang: "Interface language",
    settingMic: "Voice input (microphone)",
    settingMicOn: "Enabled",
    settingMicOff: "Disabled",
    settingDelete: "Delete all notes",
    settingDeleteBtn: "DELETE ALL",
    settingDeleteConfirm: "Are you sure you want to delete ALL your notes? This action is irreversible.",
    settingDeleteSuccess: "All notes have been deleted.",
  },
  fon: {
    journalTitle: "Xójlá Nyì tɔ̀n",
    settingsTitle: "Lěe è nɔ bǔ tɔn gbɔn",
    subtitle: "XÒ MƐ SÍN NǓ",
    config: "LĚE NǓ YÌ GBƆN",
    noNotes: "NǓÐÉ ÐÒ FÍNƐ́ Ǎ...",
    labelTitle: "XÓ KLÉWUN",
    labelNote: "XÓ GÀNGÀN",
    btnSave: "SƆ́ HƐ̀N",
    btnSaving: "SÍSƆ́ ÐÒ YÌYÌ...",
    placeholderTitle: "Nǔ e ɖò ayi mɛ é...",
    placeholderNote: "Nɛ̌ nǔ ka nɔ wà we gbɔn ?",
    settingLang: "Gbè e è nɔ zán é",
    settingMic: "Gbè gbigbɔ (mikɔ)",
    settingMicOn: "Ðò bɔ wɛ",
    settingMicOff: "Kú",
    settingDelete: "Sɔ́ xójlá lɛ bǐ kpò",
    settingDeleteBtn: "SƆ́ BǏ KPÒ",
    settingDeleteConfirm: "Ðò ayi tɔn mɛ a ɖò xójlá lɛ bǐ sísɔ́ kpò wɛ à ?",
    settingDeleteSuccess: "Xójlá lɛ bǐ sɔ́ kpò.",
  }
};

const LANG_LABELS = { fr: '🇫🇷 Français', en: '🇬🇧 English', fon: '🇧🇯 Fon' };

export default function JournalGrossesse({ patientId, onClose, isDoctorView = false }) {
  const [lang, setLang] = useState('fr');
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [titre, setTitre] = useState('');
  const [newNote, setNewNote] = useState('');
  const [fetching, setFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('journal');

  // Paramètres
const [micEnabled, setMicEnabled] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const t = translations[lang] || translations.fr;

  useEffect(() => { if (patientId) fetchNotes(); }, [patientId]);

  const fetchNotes = async () => {
    try {
      setFetching(true);
      const res = await api.get(`/patients/${patientId}/journals`);
      setNotes(res.data || []);
    } catch (err) {
      notifyError(err.response?.status === 401 ? "Acces non autorise au journal de cette patiente." : "Erreur de chargement");
    } finally { setFetching(false); }
  };

  const startRecording = async () => {
    if (!micEnabled) return notifyError("Le micro est désactivé dans les paramètres.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], "note.wav", { type: 'audio/wav' });
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioFile);
          if (text) {
            setNewNote(prev => (prev && prev !== "undefined") ? prev + " " + text : text);
            notifySuccess("Vocal transcrit !");
          }
        } catch (err) { notifyError("Erreur transcription"); } finally { setIsTranscribing(false); }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { notifyError("Micro non autorisé"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre || !newNote) return notifyError("Remplissez les champs");
    setIsSaving(true);
    try {
      const payload = { titre, note: newNote, patient_id: patientId };
      if (editingId) {
        await api.put(`/journals/${editingId}`, payload);
        setNotes(prev => prev.map(n => n.id === editingId ? { ...n, titre, note: newNote } : n));
      } else {
        const res = await api.post('/journals', payload);
        const newEntry = res.data || { id: Date.now(), titre, note: newNote, created_at: new Date().toISOString() };
        setNotes(prev => [newEntry, ...prev]);
      }
      resetForm();
      notifySuccess("Enregistré !");
    } catch (error) { notifyError("Erreur sauvegarde"); } finally { setIsSaving(false); }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/journals/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      notifySuccess("Supprimé");
    } catch (error) { notifyError("Erreur suppression"); }
  };

  // Suppression de TOUTES les notes
  const deleteAllNotes = async () => {
    setIsDeletingAll(true);
    try {
      await Promise.all(notes.map(n => api.delete(`/journals/${n.id}`)));
      setNotes([]);
      setShowDeleteConfirm(false);
      notifySuccess(t.settingDeleteSuccess);
    } catch (error) {
      notifyError("Erreur lors de la suppression.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const resetForm = () => { setTitre(''); setNewNote(''); setEditingId(null); setShowForm(false); };

  if (fetching) return (
    <div className="h-full w-full flex items-center justify-center bg-[#FDF0F0]">
      <Loader2 className="animate-spin text-emerald-600" size={50} />
    </div>
  );

  return (
    <div className="h-[92vh] md:h-[85vh] w-full max-w-[1200px] mx-auto font-sans font-black bg-[#FDF0F0] overflow-hidden rounded-[3rem] shadow-2xl relative flex flex-col border-8 border-white">

      {/* HEADER */}
      <header className="p-8 md:p-12 flex justify-between items-center bg-white/40 backdrop-blur-xl border-b-4 border-white/40">
        <div className="text-left">
          <h1 className="text-3xl md:text-6xl font-black text-[#059669] uppercase italic leading-none">
            {view === 'journal' ? t.journalTitle : t.settingsTitle}
          </h1>
          <p className="text-xl md:text-2xl font-black text-pink-500 uppercase tracking-widest mt-2">
            {view === 'journal' ? t.subtitle : t.config}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setView(view === 'journal' ? 'settings' : 'journal')}
            className="w-16 h-16 md:w-20 md:h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-white"
          >
            <Settings size={40} />
          </button>
          {/* CROIX ROUGE — ferme la modale */}
          <button
            onClick={onClose}
            className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center text-red-500 shadow-md hover:bg-red-50 transition-colors"
          >
            <X size={40} strokeWidth={4} />
          </button>
        </div>
      </header>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16 no-scrollbar">
        <AnimatePresence mode="wait">

          {/* ── VUE JOURNAL ── */}
          {view === 'journal' && (
            !showForm ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                {notes.length === 0
                  ? <div className="py-20 text-center text-slate-400 text-5xl font-black italic uppercase">{t.noNotes}</div>
                  : notes.map(n => (
                    <div key={n.id} className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl border-4 border-white">
                      <div className="flex justify-between mb-8 font-black">
                        <span className="text-rose-400 text-2xl md:text-3xl flex items-center gap-3">
                          <Clock size={35} /> {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        {!isDoctorView && (
                          <div className="flex gap-6">
                            <button onClick={() => { setEditingId(n.id); setTitre(n.titre); setNewNote(n.note); setShowForm(true); }} className="text-blue-500 hover:scale-110">
                              <Edit3 size={45} />
                            </button>
                            <button onClick={() => deleteNote(n.id)} className="text-red-500 hover:scale-110">
                              <Trash2 size={45} />
                            </button>
                          </div>
                        )}
                      </div>
                      <h4 className="text-3xl md:text-6xl font-black uppercase text-slate-800 mb-6 leading-tight">{n.titre}</h4>
                      <p className="text-2xl md:text-4xl font-bold italic text-slate-500 leading-relaxed">{n.note}</p>
                    </div>
                  ))
                }
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-10 text-left font-black">
                  <div>
                    <label className="text-2xl md:text-3xl uppercase ml-4 mb-4 block text-slate-400">{t.labelTitle}</label>
                    <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full p-10 rounded-[3rem] shadow-xl font-black text-3xl md:text-5xl border-8 border-emerald-50 outline-none focus:border-emerald-300" placeholder={t.placeholderTitle} />
                  </div>
                  <div className="relative">
                    <label className="text-2xl md:text-3xl uppercase ml-4 mb-4 block text-slate-400">{t.labelNote}</label>
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full min-h-[150px] resize-y p-10 rounded-[3rem] shadow-xl font-black text-2xl md:text-4xl border-8 border-emerald-50 outline-none focus:border-emerald-300" placeholder={t.placeholderNote} />
                    {/* BOUTON MICRO — masqué si micro désactivé */}
                    {micEnabled && (
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`absolute bottom-10 right-10 w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-pink-500'} text-white`}
                      >
                        {isTranscribing ? <Loader2 className="animate-spin" size={60} /> : isRecording ? <Square size={60} fill="white" /> : <Mic size={70} />}
                      </button>
                    )}
                  </div>
                  <button onClick={handleSubmit} disabled={isSaving || isTranscribing} className="w-full py-5 bg-[#059669] text-white rounded-[1.5rem] font-black text-2xl md:text-4xl uppercase shadow-2xl flex items-center justify-center gap-6 hover:bg-emerald-500 active:scale-75 transition-all">
                    {isSaving ? <Loader2 className="animate-spin" size={40} /> : <Check size={30} strokeWidth={2} />}
                    {isSaving ? t.btnSaving : t.btnSave}
                  </button>
                </div>
              </motion.div>
            )
          )}

          {/* ── VUE PARAMÈTRES ── */}
          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-10">

              {/* 1. LANGUE */}
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-white">
                <div className="flex items-center gap-4 mb-8">
                  <Globe size={40} className="text-emerald-600" />
                  <h2 className="text-2xl md:text-4xl font-black text-slate-700 uppercase">{t.settingLang}</h2>
                </div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(LANG_LABELS).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={`px-8 py-5 rounded-[2rem] text-xl md:text-2xl font-black uppercase transition-all border-4 ${lang === code ? 'bg-emerald-600 text-white border-emerald-600 scale-105' : 'bg-slate-100 text-slate-600 border-transparent hover:border-emerald-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. MICRO */}
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {micEnabled ? <Mic size={40} className="text-pink-500" /> : <MicOff size={40} className="text-slate-400" />}
                    <h2 className="text-2xl md:text-4xl font-black text-slate-700 uppercase">{t.settingMic}</h2>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`relative w-28 h-14 rounded-full transition-all duration-300 ${micEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-2 w-10 h-10 bg-white rounded-full shadow-md transition-all duration-300 ${micEnabled ? 'left-16' : 'left-2'}`} />
                  </button>
                </div>
                <p className={`mt-4 text-xl font-bold ml-1 ${micEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {micEnabled ? t.settingMicOn : t.settingMicOff}
                </p>
              </div>

              {/* 3. SUPPRIMER TOUTES LES NOTES */}
              {!isDoctorView && (
                <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-red-100">
                  <div className="flex items-center gap-4 mb-8">
                    <AlertTriangle size={40} className="text-red-500" />
                    <h2 className="text-2xl md:text-4xl font-black text-slate-700 uppercase">{t.settingDelete}</h2>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={notes.length === 0}
                      className="w-full py-6 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2rem] font-black text-2xl md:text-3xl uppercase shadow-xl transition-all active:scale-95"
                    >
                      {t.settingDeleteBtn}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-xl md:text-2xl font-bold text-red-600 bg-red-50 p-6 rounded-[2rem]">
                        ⚠️ {t.settingDeleteConfirm}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={deleteAllNotes}
                          disabled={isDeletingAll}
                          className="flex-1 py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl md:text-2xl uppercase shadow-xl flex items-center justify-center gap-3 hover:bg-red-700 transition-all"
                        >
                          {isDeletingAll ? <Loader2 className="animate-spin" size={30} /> : <Trash2 size={30} />}
                          {t.settingDeleteBtn}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-6 bg-slate-200 text-slate-700 rounded-[2rem] font-black text-xl md:text-2xl uppercase shadow-xl hover:bg-slate-300 transition-all"
                        >
                          <X size={30} className="inline mr-2" /> Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* BOUTON + (ajouter une note) */}
      {view === 'journal' && !isDoctorView && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 w-28 h-28 md:w-40 md:h-40 bg-[#059669] text-white rounded-[3rem] shadow-2xl flex items-center justify-center border-[12px] border-[#FDF0F0] z-50"
        >
          <Plus size={80} strokeWidth={6} />
        </button>
      )}
    </div>
  );
}
