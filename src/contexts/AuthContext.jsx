import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { notifyError, notifySuccess } from '../utils/notifications';

const AuthContext = createContext({});

const AUTH_REDIRECT_EXCLUDED_URLS = ['/login', '/logout', '/auth/google'];
let isHandlingExpiredSession = false;

const clearStoredSession = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common.Authorization;
};

const shouldHandleUnauthorized = (config = {}) => {
  if (config.skipAuthRedirect) return false;
  const url = config.url || '';
  return !AUTH_REDIRECT_EXCLUDED_URLS.some((excludedUrl) => url.includes(excludedUrl));
};

// --- CONFIGURATION DE L'INSTANCE API ---
export const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'https://e-cpn-backend-production.up.railway.app/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

//  CETTE LIGNE DÉBLOQUE LE 401 (Elle attache le token à chaque appel)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleExpiredSession = () => {
      setToken(null);
      setUser(null);
      setProfile(null);
      clearStoredSession();

      if (!isHandlingExpiredSession) {
        isHandlingExpiredSession = true;
          notifyError("Session expirée. Veuillez vous reconnecter.");

        if (!['/login', '/admin/login'].includes(window.location.pathname)) {
          window.location.href = '/login?session=expired';
        }
      }
    };

    const isCurrentSessionStillValid = async () => {
      try {
        await api.get('/me', { skipAuthRedirect: true });
        return true;
      } catch {
        return false;
      }
    };

    const handleUnauthorizedResponse = async (error) => {
      if (error.response?.status === 401 && shouldHandleUnauthorized(error.config)) {
        const requestUrl = error.config?.url || '';

        if (requestUrl.includes('/me') || !(await isCurrentSessionStillValid())) {
          handleExpiredSession();
        }
      }

      return Promise.reject(error);
    };

    const apiInterceptorId = api.interceptors.response.use(
      (response) => response,
      handleUnauthorizedResponse
    );
    return () => {
      api.interceptors.response.eject(apiInterceptorId);
    };
  }, []);

  // Synchronisation du localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      clearStoredSession();
    }
  }, [token]);

  // Vérification de la session au démarrage
  const initAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const response = await api.get('/me');
        setUser(response.data);
        setProfile(response.data);
        isHandlingExpiredSession = false;
      } catch {
        setToken(null);
        setUser(null);
        setProfile(null);
        clearStoredSession();
      }
    }
    setLoading(false);
  };

  useEffect(() => { initAuth(); }, []);

  // CONNEXION EMAIL/PASSWORD
  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token: newToken, profile: newProfile } = response.data;
      isHandlingExpiredSession = false;
      setToken(newToken);
      setUser(newProfile);
      setProfile(newProfile);
      
      notifySuccess(`Ravi de vous revoir, ${newProfile.prenom} !`);
      return { success: true, profile: newProfile, status: 'SUCCESS' };
    } catch (error) {
      const msg = error.response?.data?.error || "Identifiants incorrects";
      notifyError(msg);
      return { success: false };
    }
  };

  // CONNEXION GOOGLE (CORRIGÉE : Plus d'erreurs de syntaxe)
  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await api.post('/auth/google', { token: googleToken });
      
      if (response.data.status === 'SUCCESS') {
        const { token: newToken, profile: newProfile } = response.data;
        isHandlingExpiredSession = false;
        setToken(newToken);
        setUser(newProfile);
        setProfile(newProfile);
        notifySuccess("Connexion Google réussie !");
      }
      return response.data; 
    } catch (error) {
      const errorMsg = error.response?.data?.error || "";
      
      // GESTION DU DÉCALAGE HORAIRE
      if (errorMsg.includes("nbf") || errorMsg.includes("prior to")) {
        notifyError("Heure système décalée. Veuillez synchroniser l'heure de votre appareil.");
      } else {
        notifyError("Échec de la connexion Google");
      }
      console.error("Erreur Google login:", error);
      return { status: 'ERROR' };
    }
  };

  // DÉCONNEXION
  const signOut = async () => {
    try {
      if (token) await api.post('/logout');
    } catch {
      // Meme si l'appel logout echoue, la session locale doit etre fermee.
    } finally {
      setToken(null);
      setUser(null);
      setProfile(null);
      clearStoredSession();
      notifySuccess("Déconnexion réussie");
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, login, loginWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
