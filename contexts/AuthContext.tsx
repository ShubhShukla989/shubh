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
      router.push('/login');
      return;
    }

    if (session?.user) {
      loadUserFromSession();
    }
  }, [session, status, router]);

  const loadUserFromSession = async () => {
    try {
      if (!session?.user?.email) return;
      
      // Fetch user details from database using session email
      const response = await fetch(`/api/users/by-email?email=${session.user.email}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        // Load permissions
        await loadPermissions(data.user.role_id);
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

  const logout = async () => {
    setUser(null);
    setPermissions(new Set());
    await signOut({ callbackUrl: '/login' });
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
