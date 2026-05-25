import toast from 'react-hot-toast';
import { XCircle, CheckCircle2, Info } from 'lucide-react';

// --- NOTIFICATION D'ERREUR (Responsive) ---
export const notifyError = (message) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
      w-full max-w-full sm:max-w-xl bg-white shadow-2xl rounded-2xl sm:rounded-[2.5rem] 
      pointer-events-auto flex border-l-8 sm:border-l-[12px] border-rose-500
      p-4 sm:p-10
    `}>
      <div className="flex-1 flex items-center gap-4 sm:gap-6">
        <XCircle className="h-10 w-10 sm:h-16 sm:w-16 text-rose-500 shrink-0" />
        <div className="text-left">
          <p className="text-sm sm:text-lg font-black text-rose-600 uppercase tracking-[0.1em] sm:tracking-[0.2em]">Erreur</p>
          <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-gray-700 leading-tight">{message}</p>
        </div>
      </div>
    </div>
  ), { duration: 5000 });
};

// --- NOTIFICATION DE SUCCÈS (Responsive) ---
export const notifySuccess = (message) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
      w-full max-w-full sm:max-w-xl bg-white shadow-2xl rounded-2xl sm:rounded-[2.5rem] 
      pointer-events-auto flex border-l-8 sm:border-l-[12px] border-emerald-500
      p-4 sm:p-10
    `}>
      <div className="flex-1 flex items-center gap-4 sm:gap-6">
        <CheckCircle2 className="h-10 w-10 sm:h-16 sm:w-16 text-emerald-500 shrink-0" />
        <div className="text-left">
          <p className="text-sm sm:text-lg font-black text-emerald-600 uppercase tracking-[0.1em] sm:tracking-[0.2em]">Succès</p>
          <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-gray-700 leading-tight">{message}</p>
        </div>
      </div>
    </div>
  ), { duration: 4000 });
};

// --- NOTIFICATION D'INFORMATION (Responsive) ---
export const notifyInfo = (message) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
      w-full max-w-full sm:max-w-xl bg-white shadow-2xl rounded-2xl sm:rounded-[2.5rem] 
      pointer-events-auto flex border-l-8 sm:border-l-[12px] border-blue-500
      p-4 sm:p-10
    `}>
      <div className="flex-1 flex items-center gap-4 sm:gap-6">
        <Info className="h-10 w-10 sm:h-16 sm:w-16 text-blue-500 shrink-0" />
        <div className="text-left">
          <p className="text-sm sm:text-lg font-black text-blue-600 uppercase tracking-[0.1em] sm:tracking-[0.2em]">Information</p>
          <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-gray-700 leading-tight">{message}</p>
        </div>
      </div>
    </div>
  ), { duration: 4000 });
};