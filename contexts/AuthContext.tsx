'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  fullname: string;
  role_id: number;
  role_name: string;
}

interface AuthContextType {
  user: User | null;
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      // Check if user is logged in (from localStorage or session)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Load permissions
        await loadPermissions(userData.role_id);
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (roleId: number) => {
    try {
      const response = await fetch(`/api/permissions/role/${roleId}`);
      const data = await response.json();
      
      if (data.success) {
        const permSet = new Set<string>(data.data.map((p: any) => p.permission_key as string));
        setPermissions(permSet);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Load permissions
        await loadPermissions(data.user.role_id);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions(new Set());
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    // Super Admin has all permissions
    if (user?.role_id === 1) return true;
    
    return permissions.has(permission);
  };

  const isSuperAdmin = (): boolean => {
    return user?.role_id === 1;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        hasPermission,
        isSuperAdmin,
        login,
        logout,
      }}
    >
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
