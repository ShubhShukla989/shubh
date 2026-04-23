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
  const [authLoaded, setAuthLoaded] = useState(false); // Track if auth was loaded

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

    // Only load auth once per session
    if (session?.user && !authLoaded) {
      loadUserFromSession();
    } else if (authLoaded) {
      setLoading(false);
    }
  }, [session, status, authLoaded]);

  const loadUserFromSession = async () => {
    const startTime = performance.now();
    console.log('🔄 Auth: Loading (once per session)');
    
    try {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
      
      // Parallelize all auth operations
      console.time('⏱️ Auth: Total (Parallel)');
      
      const [ensureResult, userResponse] = await Promise.all([
        // Ensure user exists (can fail silently)
        fetch('/api/admin/ensure-user', { method: 'POST' }).catch(() => null),
        // Fetch user details
        fetch(`/api/users/by-email?email=${encodeURIComponent(session.user.email)}`)
      ]);
      
      if (!userResponse.ok) {
        throw new Error(`HTTP error! status: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      
      if (userData.success && userData.user) {
        setUser(userData.user);
        
        // Load permissions for this role
        const permResponse = await fetch(`/api/permissions/role/${userData.user.role_id}`);
        
        if (permResponse.ok) {
          const permData = await permResponse.json();
          if (permData.success) {
            const permSet = new Set<string>(permData.data.map((p: any) => p.permission_key as string));
            setPermissions(permSet);
          }
        }
      } else {
        // Set a default user to prevent errors
        setUser({
          id: 1,
          email: session.user.email,
          fullname: session.user.name || 'Admin',
          role_id: 1,
          role_name: 'Super Admin'
        });
        setPermissions(new Set(['*']));
      }
      
      console.timeEnd('⏱️ Auth: Total (Parallel)');
      const totalTime = performance.now() - startTime;
      console.log(`✅ Auth: Loaded in ${totalTime.toFixed(2)}ms (cached for session)`);
      
    } catch (error) {
      console.error('❌ Auth: Load failed', error);
      // Set a fallback user to prevent crashes
      if (session?.user?.email) {
        setUser({
          id: 1,
          email: session.user.email,
          fullname: session.user.name || 'Admin',
          role_id: 1,
          role_name: 'Super Admin'
        });
        setPermissions(new Set(['*']));
      }
    } finally {
      setAuthLoaded(true); // Mark as loaded
      setLoading(false);
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
