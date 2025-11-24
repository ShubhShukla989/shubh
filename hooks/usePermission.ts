'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function usePermission(requiredPermission: string) {
  const { hasPermission, isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isSuperAdmin() && !hasPermission(requiredPermission)) {
        alert('❌ You do not have permission to access this page');
        router.push('/admin');
      }
    }
  }, [loading, requiredPermission, hasPermission, isSuperAdmin, router]);

  return {
    hasPermission: (permission: string) => isSuperAdmin() || hasPermission(permission),
    isSuperAdmin: isSuperAdmin(),
    loading,
  };
}
