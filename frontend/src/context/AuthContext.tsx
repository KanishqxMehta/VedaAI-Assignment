'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  schoolName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = Cookies.get('token');
      if (storedToken) {
        try {
          const res = await fetch('http://localhost:4000/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            Cookies.remove('token');
          }
        } catch (error) {
          console.error('Auth verification failed', error);
          Cookies.remove('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Route protection logic
    if (!loading) {
      if (!user && pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/assignments');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    Cookies.set('token', newToken, { expires: 30 }); // 30 days
    router.push('/assignments');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
