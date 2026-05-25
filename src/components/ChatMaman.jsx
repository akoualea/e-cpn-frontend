import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ShieldCheck, MessageCircleHeart, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAI } from '../lib/aiService';

export default function ChatMaman({ profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isDashboard = !!profile;
  const accent = isDashboard ? '#FF7096' : '#00A651';
  const accentDark = isDashboard ? '#E94F83' : '#008F46';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMsg = isDashboard
        ? `Bonjour Mme ${profile?.nom}. Je suis votre assistant technique e-CPN. Comment puis-je vous aider dans l'utilisation de vos outils ?`
        : "Bienvenue sur e-CPN Benin. Je suis l'assistant d'information. Je peux vous renseigner sur la dematerialisation du carnet, le suivi budgetaire ou les modalites d'inscription. Que souhaitez-vous savoir ?";

      setMessages([{ role: 'ai', content: initialMsg }]);
    }
    scrollToBottom();
  }, [isOpen, isDashboard, profile, messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const context = isDashboard ? 'dashboard_user' : 'public_neutral';
      const response = await askAI(userMsg, profile, context);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Desole, je ne peux pas repondre pour le moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] font-roboto pointer-events-none text-left">
      <div className="pointer-events-auto flex flex-col items-end">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsOpen(true)}
              aria-label="Ouvrir l'assistant"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] shadow-[0_20px_60px_rgba(15,23,42,0.28)] flex items-center justify-center border-[6px] border-white transition-all text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})` }}
            >
              {isDashboard ? (
                <MessageCircleHeart className="w-10 h-10 sm:w-12 sm:h-12" />
              ) : (
                <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 70, scale: 0.96 }}
            className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[680px] md:w-[760px] max-h-[88vh] h-[min(760px,88vh)] bg-white rounded-[2rem] shadow-[0_32px_90px_rgba(15,23,42,0.32)] flex flex-col overflow-hidden border border-white/80 relative"
          >
            <div
              className="px-6 py-5 sm:px-8 sm:py-7 flex justify-between items-center shrink-0 text-white"
              style={{ background: `linear-gradient(135deg, ${accentDark}, ${accent})` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                  <Sparkles size={28} strokeWidth={2.6} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-3xl sm:text-4xl text-white uppercase italic leading-none tracking-tight truncate">
                    Assistant E-CPN
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 font-black tracking-[0.22em] mt-2 uppercase truncate">
                    Plateforme Numerique Benin
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer l'assistant"
                className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all shrink-0"
              >
                <X size={26} strokeWidth={3.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 space-y-5 bg-[#F8FAFC]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'} items-end gap-3`}>
                  {msg.role === 'ai' && (
                    <div
                      className="hidden sm:flex w-9 h-9 rounded-2xl items-center justify-center text-white shrink-0 shadow-md"
                      style={{ backgroundColor: accent }}
                    >
                      <Sparkles size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[86%] px-5 py-4 sm:px-6 sm:py-5 rounded-[1.75rem] text-[15px] sm:text-[17px] font-bold leading-relaxed shadow-sm ${
                      msg.role === 'ai'
                        ? 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                        : 'text-white rounded-br-md'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: accent } : undefined}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-slate-400 font-black text-sm uppercase tracking-[0.18em]">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: accent, animationDelay: `${dot * 0.12}s` }}
                      />
                    ))}
                  </div>
                  Traitement...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-6 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div className="flex items-center bg-slate-50 rounded-[1.75rem] p-3 border border-slate-200 focus-within:border-slate-300 focus-within:bg-white shadow-inner">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez une question"
                    className="flex-1 min-w-0 bg-transparent px-4 text-2xl sm:text-3xl font-black text-slate-800 outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Envoyer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-white disabled:opacity-35 disabled:shadow-none shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    <Send size={30} fill="currentColor" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-slate-400">
                  <ShieldCheck size={22} className="text-emerald-600" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] italic">
                    Chiffrement AES-256
                  </span>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
