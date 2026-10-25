import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate auth state on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('payroll_admin_token');
      const storedAdmin = localStorage.getItem('payroll_admin_user');

      if (storedToken && storedAdmin) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));

        // Optionally verify token freshness against backend
        try {
          const profile = await authService.getProfile();
          if (profile.success && profile.admin) {
            setAdmin(profile.admin);
            localStorage.setItem('payroll_admin_user', JSON.stringify(profile.admin));
          }
        } catch (error) {
          console.warn('Session verification failed, logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success && data.token) {
      setToken(data.token);
      setAdmin(data.admin);
      localStorage.setItem('payroll_admin_token', data.token);
      localStorage.setItem('payroll_admin_user', JSON.stringify(data.admin));
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
