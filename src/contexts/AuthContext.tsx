import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { StrapiUser } from '@/types';

interface AuthContextValue {
  user: StrapiUser | null;
  jwt: string | null;
  loading: boolean;
  login: (jwt: string, user: StrapiUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedJwt = localStorage.getItem('strapi_jwt');
    const storedUser = localStorage.getItem('strapi_user');
    if (storedJwt && storedUser) {
      try {
        setJwt(storedJwt);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('strapi_jwt');
        localStorage.removeItem('strapi_user');
      }
    }
    setLoading(false);
  }, []);

  function login(newJwt: string, newUser: StrapiUser) {
    localStorage.setItem('strapi_jwt', newJwt);
    localStorage.setItem('strapi_user', JSON.stringify(newUser));
    setJwt(newJwt);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('strapi_jwt');
    localStorage.removeItem('strapi_user');
    setJwt(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, jwt, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
