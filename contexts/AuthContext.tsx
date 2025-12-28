'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      // Only redirect if we're in admin area
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        router.push('/login');
      }
      setLoading(false);
      return;
    }

    if (session?.user) {
      loadUserFromSession();
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  const loadUserFromSession = async () => {
    try {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
      
      // First, ensure admin user exists
      try {
        await fetch('/api/admin/ensure-user', { method: 'POST' });
      } catch (error) {
        console.warn('Could not ensure admin user exists:', error);
      }
      
      // Fetch user details from database using session email
      const response = await fetch(`/api/users/by-email?email=${encodeURIComponent(session.user.email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        // Load permissions
        await loadPermissions(data.user.role_id);
      } else {
        console.warn('User not found in database:', data.error);
        // Set a default user to prevent errors
        setUser({
          id: 1,
          email: session.user.email,
          fullname: session.user.name || 'Admin',
          role_id: 1,
          role_name: 'Super Admin'
        });
        setPermissions(new Set(['*'])); // Grant all permissions as fallback
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
      // Set a fallback user to prevent crashes
      if (session?.user?.email) {
        setUser({
          id: 1,
          email: session.user.email,
          fullname: session.user.name || 'Admin',
          role_id: 1,
          role_name: 'Super Admin'
        });
        setPermissions(new Set(['*'])); // Grant all permissions as fallback
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (roleId: number) => {
    try {
      const response = await fetch(`/api/permissions/role/${roleId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const permSet = new Set<string>(data.data.map((p: any) => p.permission_key as string));
        setPermissions(permSet);
      } else {
        // Fallback permissions for super admin
        if (roleId === 1) {
          setPermissions(new Set(['*']));
        }
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      // Fallback permissions for super admin
      if (roleId === 1) {
        setPermissions(new Set(['*']));
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setPermissions(new Set());
    await signOut({ callbackUrl: '/login' });
  };

  const hasPermission = (permission: string): boolean => {
    // Super Admin has all permissions
    if (user?.role_id === 1) return true;
    
    // If permissions include '*', grant all access
    if (permissions.has('*')) return true;
    
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
