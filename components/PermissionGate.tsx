'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface PermissionGateProps {
  permission?: string;
  superAdminOnly?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  permission,
  superAdminOnly = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  // Super Admin only check
  if (superAdminOnly && !isSuperAdmin()) {
    return <>{fallback}</>;
  }

  // Permission check
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
