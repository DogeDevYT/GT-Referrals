import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gt_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('gt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gt_user');
    }
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const registerJobseeker = async (name, gtEmail, password) => {
    const { data } = await api.post('/auth/register/jobseeker', { name, gtEmail, password });
    localStorage.setItem('gt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const registerEmployee = async (name, companyEmail, password) => {
    const { data } = await api.post('/auth/register/employee', { name, companyEmail, password });
    localStorage.setItem('gt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithToken = (token, userData) => {
    localStorage.setItem('gt_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'employee' ? '/employees/me' : '/jobseekers/me';
      const { data } = await api.get(endpoint);
      setUser(data);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerJobseeker, registerEmployee, loginWithToken, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
