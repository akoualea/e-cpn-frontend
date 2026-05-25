import React, { useState, useEffect } from 'react';
import { api } from '../../contexts/AuthContext';
import { Calendar, Clock, Video, MapPin, Plus, CheckCircle2 } from 'lucide-react';

export default function MesRendezVousPatient({ patientId, onOpenUrgence }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchRDV();
  }, []);

  const fetchRDV = async () => {
    try {
      const res = await api.get('/patient/mon-suivi-cpn');
      setAppointments(res.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-800">Mon Suivi Médical</h2>
          <p className="text-[10px] font-bold text-[#E46A4B] uppercase tracking-widest mt-1">Calendrier des 8 CPN (Protocole OMS)</p>
        </div>
        <button 
          onClick={onOpenUrgence}
          className="flex items-center gap-2 bg-rose-500 text-white px-6 py-4 rounded-[24px] font-black text-[10px] uppercase shadow-lg shadow-rose-200 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Signaler un souci
        </button>
      </div>

      <div className="grid gap-4">
        {appointments.map((apt, index) => (
          <div key={index} className={`p-6 rounded-[32px] border flex items-center gap-6 shadow-sm transition-all ${apt.status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-100'}`}>
            <div className={`p-4 rounded-2xl text-center min-w-[80px] ${apt.status === 'completed' ? 'bg-emerald-100' : 'bg-gray-50'}`}>
              <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(apt.date_theorique).toLocaleDateString('fr-FR', {month: 'short'})}</p>
              <p className="text-2xl font-black text-gray-800">{new Date(apt.date_theorique).getDate()}</p>
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-black text-gray-800 uppercase text-sm">Consultation Prénatale n°{apt.cpn_number}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Statut : {apt.status === 'completed' ? 'Validée' : 'À venir'}</p>
            </div>
            {apt.status === 'completed' ? (
                <CheckCircle2 className="text-emerald-500" size={24} />
            ) : (
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                    Visioconférence
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}