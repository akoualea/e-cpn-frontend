import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Mic, Square, Video, Loader2, Smile, Paperclip, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ChatCPN({ currentUser, targetId, targetName, onVideoClick,onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef(null);
  const recorderRef = useRef(null);

  const COLOR_PINK = "#FF7096"; 
  const BRIGHT_BLUE = "#4F46E5"; 
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetName || 'doctor')}`;

  useEffect(() => {
    if (!targetId || !currentUser?.id) return;
    const fetchMsgs = async () => {
      try {
        const { data } = await supabase.from('messages').select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        setMessages(data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchMsgs();

    const channel = supabase.channel(`chat_${targetId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new;
        if ((m.sender_id === currentUser.id && m.receiver_id === targetId) || (m.sender_id === targetId && m.receiver_id === currentUser.id)) {
          setMessages(prev => [...prev, m]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [targetId, currentUser.id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (txt) => {
    if (!txt || !txt.trim()) return;
    const msgContent = txt.trim();
    setInput('');
    try {
      await supabase.from('messages').insert({
        id: crypto.randomUUID(), sender_id: currentUser.id, receiver_id: targetId, contenu: msgContent
      });
    } catch (err) { toast.error("Erreur d'envoi"); }
  };

  const toggleRecording = async () => {
    if (isRecording) { recorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = async () => {
        const file = `chat/${Date.now()}.webm`;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await supabase.storage.from('chat-audios').upload(file, blob);
        const { data } = supabase.storage.from('chat-audios').getPublicUrl(file);
        await supabase.from('messages').insert({
          id: crypto.randomUUID(), sender_id: currentUser.id, receiver_id: targetId,
          contenu: "🎤 Message Vocal", audio_url: data.publicUrl
        });
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start(); recorderRef.current = rec; setIsRecording(true);
    } catch { toast.error("Microphone requis"); }
  };

  if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin" style={{color: COLOR_PINK}} size={60} /></div>;

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-100">
      
      {/* HEADER XL */}
      <header className="px-8 py-6 flex justify-between items-center flex-shrink-0 relative shadow-lg" style={{ backgroundColor: COLOR_PINK }}>
        {onBack && (
  <button onClick={onBack} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all active:scale-90">
    <ArrowLeft size={32} strokeWidth={3} />
  </button>
)}
        <div className="flex items-center gap-6 text-white">
          <div className="w-16 h-16 rounded-full bg-white/30 p-1 border border-white/50 shadow-inner">
            <img
              src={avatarUrl}
              onError={(e) => { e.currentTarget.src = '/doctorPhoto.png'; }}
              className="w-full h-full rounded-full bg-white object-cover"
              alt="Avatar"
            />
          </div>
          <div className="text-left">
            <h4 className="text-3xl font-black tracking-tighter uppercase italic">{targetName || "Dr. Akoua"}</h4>
            <p className="text-3xl font-bold opacity-90">Consultant en ligne</p>
          </div>
        </div>
        <button onClick={onVideoClick} className="p-4 text-white hover:bg-white/20 rounded-2xl transition-all active:scale-90">
          <Video size={45} strokeWidth={2.5} />
        </button>
      </header>

      {/* ZONE MESSAGES - LIMITÉE À 50% DE LARGEUR */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-10 space-y-10 no-scrollbar bg-[#F8FAFC]">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser.id;
          return (
            <div key={m.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              
              <div 
                className={`px-8 py-6 rounded-[2.5rem] shadow-md relative break-words ${
                  isMe 
                  ? 'bg-[#E9EDF1] text-slate-900 rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
                /* LE CHANGEMENT EST ICI : max-w-[50%] */
                style={{ 
                    wordBreak: 'break-word', 
                    maxWidth: '50%',
                    minWidth: '150px' 
                }}
              >
                {m.audio_url ? (
                  <audio src={m.audio_url} controls className="h-12 w-full max-w-full" />
                ) : (
                  <p className="text-[24px] font-normal leading-tight tracking-tight whitespace-pre-wrap">
                    {m.contenu}
                  </p>
                )}
                <span className="block text-xs mt-3 opacity-40 text-right font-black uppercase tracking-widest italic">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      {/* FOOTER - ZONE DE SAISIE */}
      <footer className="p-8 bg-white border-t border-slate-50">
        <div 
          className="rounded-[2.5rem] border-[3px] p-6 transition-all flex flex-col gap-5 shadow-2xl bg-white"
          style={{ borderColor: COLOR_PINK }}
        >
          {isRecording ? (
            <div className="flex items-center justify-between px-8 py-5 bg-red-50 rounded-2xl">
               <span className="text-red-500 font-black text-2xl animate-pulse tracking-widest uppercase">ENREGISTREMENT...</span>
               <button onClick={toggleRecording} className="text-red-500 hover:scale-110 transition-transform"><Square size={40} fill="currentColor"/></button>
            </div>
          ) : (
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message ici..."
              className="w-full bg-transparent outline-none text-slate-800 text-2xl font-normal resize-none h-16 px-2 pt-1 placeholder:text-slate-300 no-scrollbar"
              onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }}}
            />
          )}

          <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-10">
                <button className="text-slate-400 hover:text-pink-400 transition-colors"><Smile size={35} /></button>
                <button className="text-slate-400 hover:text-indigo-400 transition-colors"><Paperclip size={35} /></button>
                <button 
                    type="button" 
                    onClick={toggleRecording} 
                    className={`transition-all hover:scale-125 ${isRecording ? 'text-red-500' : 'text-pink-500 hover:text-emerald-500'}`}
                >
                    <Mic size={40} strokeWidth={2.5} />
                </button>
             </div>

             <button 
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="px-14 py-4 rounded-3xl text-white font-black text-2xl shadow-xl transition-all active:scale-95 disabled:opacity-20 uppercase tracking-widest flex items-center gap-3"
                style={{ backgroundColor: input.trim() ? BRIGHT_BLUE : '#cbd5e1' }}
             >
                <Send size={24} />
                Envoyer
             </button>
          </div>
        </div>
       
      </footer>
    </div>
  );
}
