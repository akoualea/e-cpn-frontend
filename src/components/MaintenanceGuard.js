import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Ajustez le chemin vers votre config supabase
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Construction } from 'lucide-react';

export default function MaintenanceGuard({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Optionnel : Écouter les changements en temps réel
    const subscription = supabase
      .channel('public:site_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, 
      (payload) => {
        if (payload.new.key === 'maintenance_mode') {
          setMaintenanceMode(payload.new.value);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const checkMaintenanceStatus = async () => {
    try {
      // 1. Vérifier si la maintenance est active
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (data) setMaintenanceMode(data.value);

      // 2. Vérifier si l'utilisateur actuel est admin
      // On considère l'admin par son email ou un champ "role" dans votre table profiles
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role') // Supposant que vous avez une colonne 'role'
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin' || user.email === 'votre-email-admin@test.com') {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      console.error("Erreur maintenance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDF8F3]">
        <Loader2 className="animate-spin text-[#E46A4B]" size={40} />
      </div>
    );
  }

  // Si maintenance active ET que l'utilisateur n'est PAS admin -> Bloquer
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FDF8F3] p-10 text-center font-poppins">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Construction size={48} className="text-[#E46A4B]" />
        </div>
        <h1 className="text-4xl font-black text-gray-800 uppercase italic mb-4">Site en Maintenance</h1>
        <p className="text-gray-500 max-w-md font-bold leading-relaxed">
          Nous effectuons actuellement des mises à jour pour améliorer votre expérience sur <span className="text-[#E46A4B]">e-CPN Bénin</span>. 
          <br /><br />
          Merci de votre patience, nous serons de retour très bientôt !
        </p>
        <div className="mt-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          Administration e-CPN
        </div>
      </div>
    );
  }

  // Sinon, afficher l'application normalement
  return children;
}