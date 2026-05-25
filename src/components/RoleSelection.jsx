// src/components/RoleSelection.jsx
export default function RoleSelection({ userData, onComplete }) {
  const [role, setRole] = useState(null); // 'PATIENT' ou 'PRO'
  const [specialite, setSpecialite] = useState('');

  const handleFinish = () => {
     // Appel API vers Laravel pour créer le compte final
     onComplete({ ...userData, role, specialite });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-3xl font-black text-gray-800 mb-8 italic uppercase">Bienvenue ! Qui êtes-vous ?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* CARTE PATIENTE */}
        <div 
          onClick={() => setRole('PATIENT')}
          className={`p-10 rounded-[40px] border-4 cursor-pointer transition-all ${role === 'PATIENT' ? 'border-[#E46A4B] bg-white shadow-xl' : 'border-transparent bg-white/50 opacity-60'}`}
        >
          <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-6 text-3xl">🤰</div>
          <h3 className="text-xl font-black uppercase italic">Je suis une Maman</h3>
          <p className="text-gray-500 text-sm mt-2 font-medium">Je souhaite suivre ma grossesse et échanger avec mon médecin.</p>
        </div>

        {/* CARTE MÉDECIN */}
        <div 
          onClick={() => setRole('PRO')}
          className={`p-10 rounded-[40px] border-4 cursor-pointer transition-all ${role === 'PRO' ? 'border-blue-500 bg-white shadow-xl' : 'border-transparent bg-white/50 opacity-60'}`}
        >
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 text-3xl">👨‍⚕️</div>
          <h3 className="text-xl font-black uppercase italic">Je suis un Médecin</h3>
          {role === 'PRO' && (
            <input 
              placeholder="Votre spécialité (ex: Gynécologue)"
              className="mt-4 w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setSpecialite(e.target.value)}
            />
          )}
        </div>
      </div>

      <button 
        onClick={handleFinish}
        className="mt-12 px-12 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
      >
        Finaliser mon inscription
      </button>
    </div>
  );
}