import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldAlert, Lock, Circle } from 'lucide-react';

export default function Teleconsultation({ currentUser, targetId, doctorName, isCaller, logId, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [remoteStream, setRemoteStream] = useState(null);
  const [pipPosition, setPipPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteDescSet = useRef(false);
  const offerSent = useRef(false);
  const processedSignals = useRef(new Set());
  const answerReceived = useRef(false);

  const dateCapture = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long', timeStyle: 'short'
  }).format(new Date());

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: 'turn:a.relay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:a.relay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turns:a.relay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:a.relay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all'
  };

  // ─── Nettoyer les anciens signaux ───────────────────────────
  const cleanOldSignals = async () => {
    try {
      await supabase
        .from('telecom_signals')
        .delete()
        .eq('receiver_id', currentUser.id)
        .lt('created_at', new Date(Date.now() - 60000).toISOString());
    } catch (e) {
      console.warn('Clean signals error:', e);
    }
  };

  const isSignalForCurrentCall = (signal) => {
    const signalLogId = signal.data?.logId;
    return !logId || !signalLogId || signalLogId === logId;
  };

  const sendSignal = async (type, data) => {
    try {
      const payload = typeof data?.toJSON === 'function' ? data.toJSON() : (data || {});
      const { error } = await supabase.from('telecom_signals').insert({
        sender_id: currentUser.id,
        receiver_id: targetId,
        type,
        data: {
          ...payload,
          logId
        }
      });
      if (error) console.error('sendSignal error:', error);
      else console.log('✅ Signal envoyé:', type);
    } catch (e) {
      console.error('Signal error:', e);
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('candidate', e.candidate.toJSON());
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔵 ICE state:', pc.iceConnectionState);
      setConnectionState(pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log('🟢 Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('🟡 Signaling state:', pc.signalingState);
    };

    pc.ontrack = (e) => {
      console.log('🎥 Track received:', e.track.kind);
      if (e.streams && e.streams[0]) {
        const stream = e.streams[0];
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(err => console.warn('Remote play error:', err));
        }
      }
    };

    return pc;
  };

  // ✅ Re-attacher le stream si la ref change après ontrack
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => console.warn('Re-attach error:', err));
      }
    }
  }, [remoteStream]);

  // ─── Setup principal ────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => setIsWindowFocused(!document.hidden);
    const handleBlur = () => setIsWindowFocused(false);
    const handleFocus = () => setIsWindowFocused(true);
    const preventContext = (e) => e.preventDefault();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', preventContext);

    const setup = async () => {
      try {
        // 1. Nettoyer anciens signaux
        await cleanOldSignals();

        // 2. Obtenir le stream local
        console.log('📷 Demande caméra/micro...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log('✅ Stream local obtenu');

        // 3. Créer la connexion peer
        const pc = createPeerConnection();
        pcRef.current = pc;

        // 4. Ajouter les tracks locaux
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
          console.log('➕ Track ajouté:', track.kind);
        });

        // 5. S'abonner au canal Supabase
        const channelName = `call_${[currentUser.id, targetId].sort().join('_')}`;
        console.log('📡 Abonnement canal:', channelName);

        const processSignal = async (signal) => {
          if (!isSignalForCurrentCall(signal)) return;
          if (signal.id && processedSignals.current.has(signal.id)) return;
          if (signal.id) processedSignals.current.add(signal.id);

          try {
            if (signal.type === 'offer' && !isCaller) {
              if (remoteDescSet.current) return;
              await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
              remoteDescSet.current = true;

              for (const c of pendingCandidates.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn('Candidate flush error:', e);
                }
              }
              pendingCandidates.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal('answer', answer);
            } else if (signal.type === 'answer' && isCaller) {
              answerReceived.current = true;
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                remoteDescSet.current = true;

                for (const c of pendingCandidates.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch (e) {
                    console.warn('Candidate flush error:', e);
                  }
                }
                pendingCandidates.current = [];
              }
            } else if (signal.type === 'candidate') {
              if (remoteDescSet.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                } catch (e) {
                  console.warn('addIceCandidate error:', e);
                }
              } else {
                pendingCandidates.current.push(signal.data);
              }
            }
          } catch (err) {
            console.error('Signal handling error:', err);
          }
        };

        const fetchMissedSignals = async () => {
          const since = new Date(Date.now() - 120000).toISOString();
          const { data, error } = await supabase
            .from('telecom_signals')
            .select('*')
            .eq('receiver_id', currentUser.id)
            .gte('created_at', since)
            .order('created_at', { ascending: true });

          if (error) {
            console.warn('Missed signals fetch error:', error);
            return;
          }

          for (const signal of data || []) {
            await processSignal(signal);
          }
        };

        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'telecom_signals',
            filter: `receiver_id=eq.${currentUser.id}`
          }, async (payload) => {
            const signal = payload.new;
            if (!isSignalForCurrentCall(signal)) return;
            if (signal.id && processedSignals.current.has(signal.id)) return;
            if (signal.id) processedSignals.current.add(signal.id);
            console.log('📨 Signal reçu:', signal.type, '| isCaller:', isCaller);

            try {
              if (signal.type === 'offer' && !isCaller) {
                if (remoteDescSet.current) return;
                console.log('📥 Traitement offer...');
                await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                remoteDescSet.current = true;
                console.log('✅ Remote description (offer) settée');

                // Flush pending candidates
                for (const c of pendingCandidates.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch (e) {
                    console.warn('Candidate flush error:', e);
                  }
                }
                pendingCandidates.current = [];

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await sendSignal('answer', answer);
                console.log('✅ Answer envoyé');

              } else if (signal.type === 'answer' && isCaller) {
                answerReceived.current = true;
                console.log('📥 Traitement answer...');
                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                  remoteDescSet.current = true;
                  console.log('✅ Remote description (answer) settée');

                  // Flush pending candidates
                  for (const c of pendingCandidates.current) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {
                      console.warn('Candidate flush error:', e);
                    }
                  }
                  pendingCandidates.current = [];
                } else {
                  console.warn('⚠️ Answer reçu mais signalingState:', pc.signalingState);
                }

              } else if (signal.type === 'candidate') {
                if (remoteDescSet.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                  } catch (e) {
                    console.warn('addIceCandidate error:', e);
                  }
                } else {
                  console.log('📦 Candidate mis en buffer');
                  pendingCandidates.current.push(signal.data);
                }
              }
            } catch (err) {
              console.error('❌ Signal handling error:', err);
            }
          });

        // 6. ✅ Envoyer l'offer DANS le callback subscribe, quand SUBSCRIBED
        channel.subscribe(async (status) => {
          console.log('📡 Canal status:', status);

          if (status === 'SUBSCRIBED') {
            await fetchMissedSignals();
          }

          if (status === 'SUBSCRIBED' && isCaller && !offerSent.current) {
            offerSent.current = true;
            // Petit délai pour laisser l'appelé s'abonner aussi
            setTimeout(async () => {
              try {
                console.log('📤 Création offer...');
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });
                await pc.setLocalDescription(offer);
                await sendSignal('offer', offer);
                setTimeout(() => {
                  if (!answerReceived.current && pc.localDescription) {
                    sendSignal('offer', pc.localDescription);
                  }
                }, 3000);
                setTimeout(() => {
                  if (!answerReceived.current && pc.localDescription) {
                    sendSignal('offer', pc.localDescription);
                  }
                }, 7000);
                console.log('✅ Offer envoyé');
              } catch (err) {
                console.error('❌ Offer error:', err);
              }
            }, 1500);
          }
        });

        channelRef.current = channel;

      } catch (err) {
        console.error('❌ Setup error:', err);
        if (err.name === 'NotAllowedError') {
          alert('Permission caméra/micro refusée. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
        }
        setConnectionState('failed');
      }
    };

    setup();

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', preventContext);
    };
  }, []);

  // ─── Drag PiP ───────────────────────────────────────────────
  const onPipMouseDown = (e) => {
    e.preventDefault();
    const pip = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - pip.left, y: e.clientY - pip.top };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const pw = window.innerWidth < 768 ? 144 : 208;
      const ph = window.innerWidth < 768 ? 208 : 288;
      const x = Math.min(Math.max(e.clientX - dragOffset.current.x, 8), window.innerWidth - pw - 8);
      const y = Math.min(Math.max(e.clientY - dragOffset.current.y, 8), window.innerHeight - ph - 8);
      setPipPosition({ x, y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const handleClose = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    onClose?.();
  };

  const getConnectionColor = () => {
    if (connectionState === 'connected') return 'text-emerald-400';
    if (['connecting', 'checking', 'new'].includes(connectionState)) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getConnectionLabel = () => {
    const labels = {
      new: 'Initialisation...',
      connecting: 'Connexion...',
      checking: 'Vérification...',
      connected: 'Connexion établie',
      completed: 'Connexion établie',
      failed: 'Échec connexion',
      disconnected: 'Déconnecté',
      closed: 'Appel terminé',
    };
    return labels[connectionState] || 'Connexion...';
  };

  const pipStyle = pipPosition.x !== null
    ? { position: 'absolute', left: pipPosition.x, top: pipPosition.y, right: 'auto', bottom: 'auto' }
    : { position: 'absolute', right: '1.5rem', bottom: '7rem' };

  return (
    <div className="fixed inset-0 bg-black z-[10000] flex flex-col overflow-hidden select-none">

      {/* ANTI-CAPTURE */}
      {!isWindowFocused && (
        <div className="absolute inset-0 z-[100] backdrop-blur-3xl bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
          <Lock size={48} className="mb-4 text-emerald-500 animate-bounce" />
          <h2 className="text-xl font-bold">Session Sécurisée</h2>
          <p className="text-sm opacity-70">Capture d'écran désactivée.</p>
        </div>
      )}

      {/* ─── VIDÉO REMOTE plein écran ─── */}
      <div className="absolute inset-0 z-0 bg-gray-950 flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          disablePictureInPicture
          className={`w-full h-full object-cover transition-all duration-500 ${!isWindowFocused ? 'blur-2xl' : ''}`}
        />

        {/* Placeholder avatar quand pas encore connecté */}
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-28 h-28 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-5xl font-bold text-gray-400">
              {(currentUser.role === 'PRO'
                ? 'P'
                : (doctorName || 'D')[0]
              ).toUpperCase()}
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {connectionState === 'failed'
                ? '❌ Échec de connexion — rechargez la page'
                : 'En attente de connexion...'}
            </p>
            {connectionState === 'checking' && (
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filigrane */}
        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-2 grid-rows-3 opacity-[0.07] overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-center rotate-[-25deg] text-white text-[10px] md:text-sm font-bold whitespace-nowrap uppercase tracking-widest">
              Dr. {doctorName} — {dateCapture}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* HEADER */}
      <div className="relative z-20 p-5 flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
          <ShieldAlert size={18} />
        </div>
        <div className="text-white">
          <h2 className="font-black uppercase italic tracking-tighter text-base leading-none">
            {currentUser.role === 'PRO' ? 'Patiente en ligne' : `Dr. ${doctorName}`}
          </h2>
          <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5 ${getConnectionColor()}`}>
            <Circle size={7} fill="currentColor" className="animate-pulse" />
            {getConnectionLabel()}
          </p>
        </div>
      </div>

      {/* ─── PiP locale draggable ─── */}
      <div
        onMouseDown={onPipMouseDown}
        style={{ ...pipStyle, zIndex: 30, cursor: dragging ? 'grabbing' : 'grab' }}
        className="w-36 h-52 lg:w-52 lg:h-72"
      >
        <div className="w-full h-full rounded-[20px] overflow-hidden border-2 border-white/30 shadow-2xl bg-gray-900 relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {isCamOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff size={28} className="text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <span className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Vous</span>
          </div>
        </div>
      </div>

      {/* ─── BARRE DE CONTRÔLE ─── */}
      <div className="absolute bottom-8 left-0 w-full flex items-center justify-center gap-6 z-40">

        <button
          onClick={() => {
            const track = localStreamRef.current?.getAudioTracks()[0];
            if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
          }}
          className={`p-4 rounded-full backdrop-blur-md transition-all border shadow-lg ${isMuted ? 'bg-rose-500 text-white border-rose-400' : 'bg-black/40 text-white border-white/20'}`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={handleClose}
          className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(225,29,72,0.5)] hover:scale-110 active:scale-95 transition-all"
        >
          <PhoneOff size={28} />
        </button>

        <button
          onClick={() => {
            const track = localStreamRef.current?.getVideoTracks()[0];
            if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled); }
          }}
          className={`p-4 rounded-full backdrop-blur-md transition-all border shadow-lg ${isCamOff ? 'bg-rose-500 text-white border-rose-400' : 'bg-black/40 text-white border-white/20'}`}
        >
          {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>

      </div>
    </div>
  );
}
