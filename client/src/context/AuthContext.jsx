import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tadka_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/auth/me');
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    if (data.success) {
      localStorage.setItem('tadka_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
    }
    return data;
  };

  const register = async (name, email, password, confirmPassword) => {
    const data = await apiRequest('/auth/register', 'POST', {
      name,
      email,
      password,
      confirmPassword
    });
    if (data.success) {
      localStorage.setItem('tadka_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('tadka_token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const updateUserCoins = (newBalance) => {
    if (user) {
      setUser(prev => ({ ...prev, coin_balance: newBalance }));
    }
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        register,
        logout,
        fetchMe,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        updateUserCoins
        ,updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
