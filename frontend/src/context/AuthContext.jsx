/**
 * Authentication context — provides user state and auth actions app-wide.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

const storedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = Boolean(getToken() && user);
  const isAdmin = user?.role === 'admin';

  const persistSession = useCallback((userData, token) => {
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.register(formData);
      persistSession(data.user, data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(formData);
      persistSession(data.user, data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, loading, error, register, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
