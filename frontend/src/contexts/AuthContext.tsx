import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

interface User {
  username: string;
  voice_model?: string;
  letta_agent_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, voiceModel?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiCall<{
        ok: boolean;
        username: string;
        voice_model?: string;
        letta_agent_id?: string;
      }>(API_ENDPOINTS.accounts.login, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData: User = {
          username: response.username,
          voice_model: response.voice_model,
          letta_agent_id: response.letta_agent_id,
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('user_id', username);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string, voiceModel?: string) => {
    try {
      const response = await apiCall<{
        ok: boolean;
        username: string;
        letta_agent_id: string;
        voice_model?: string;
      }>(API_ENDPOINTS.accounts.register, {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          voice_model: voiceModel,
        }),
      });

      if (response.ok) {
        const userData: User = {
          username: response.username,
          voice_model: response.voice_model,
          letta_agent_id: response.letta_agent_id,
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('user_id', username);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_id');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

