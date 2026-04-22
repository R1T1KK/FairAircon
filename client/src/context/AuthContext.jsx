import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('airfix_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('airfix_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const verifyOtp = async (userId, otp) => {
    const res = await api.post('/auth/verify-otp', { userId, otp });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('airfix_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('airfix_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    return res.data.user;
  };

  const updateAvatar = async (formData) => {
    const res = await api.put('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setUser(res.data.user);
    return res.data.user;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await api.put(`/auth/reset-password/${token}`, { password });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyOtp, logout, updateProfile, updateAvatar, forgotPassword, resetPassword, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
