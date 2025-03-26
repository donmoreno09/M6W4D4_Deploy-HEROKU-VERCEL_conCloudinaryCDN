import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurazione di axios con il token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Carica i dati dell'utente all'avvio
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Modifica qui: sostituisci http://localhost:3001 con process.env.REACT_APP_API_BASE_URL
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}users/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Errore nel caricamento dell\'utente:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Gestione del token da Google
  useEffect(() => {
    // Controllo se c'è un token nell'URL (da Google OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Memorizza il token
      localStorage.setItem('token', tokenFromUrl);
      setToken(tokenFromUrl);
      
      // Rimuovi il token dall'URL per sicurezza
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const login = async (email, password) => {
    try {
      // Modifica qui: sostituisci http://localhost:3001 con process.env.REACT_APP_API_BASE_URL
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}users/login`, { email, password });
      
      setToken(res.data.token);
      setUser(res.data.user);
      
      // Salva il token nel localStorage
      localStorage.setItem('token', res.data.token);
      
      return { success: true };
    } catch (err) {
      console.error('Errore durante il login:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Credenziali non valide' 
      };
    }
  };

  const register = async (userData) => {
    try {
      // Modifica qui: sostituisci http://localhost:3001 con process.env.REACT_APP_API_BASE_URL
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}users/register`, userData);
      return { success: true, data: res.data };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Errore durante la registrazione' 
      };
    }
  };

  const logout = () => {
    // Rimuovi il token dal localStorage e resetta lo stato
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Per esportare l'isAuthenticated, poiché è usato in ProtectedRoute.jsx
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      login, 
      logout, 
      register,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;