import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('resqnet_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('resqnet_token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (e) {
          console.warn('Session expired, clearing token');
          localStorage.removeItem('resqnet_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      // Default dev credentials matching database seed
      const passwordMap: Record<string, string> = {
        'admin@resqnet.org': 'admin123',
        'operator@resqnet.org': 'operator123',
        'responder@resqnet.org': 'responder123',
        'analyst@resqnet.org': 'analyst123',
      };
      const pwd = passwordMap[email] || 'operator123';
      const data = await api.login(email, pwd);
      localStorage.setItem('resqnet_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('resqnet_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
