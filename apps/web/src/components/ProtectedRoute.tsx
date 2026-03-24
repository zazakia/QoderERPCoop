'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePermissions } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/auth/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { hasPermission, userRole } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      // Check role requirement (super_admin bypasses role checks)
      if (requiredRole && userRole !== requiredRole && userRole !== 'super_admin') {
        router.push('/dashboard'); // Redirect to dashboard if wrong role
        return;
      }

      // Check permission requirement
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/dashboard'); // Redirect to dashboard if no permission
        return;
      }
    }
  }, [user, loading, userRole, requiredRole, requiredPermission, router, hasPermission, fallbackPath]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  // super_admin bypasses role checks
  if (!user || (requiredRole && userRole !== requiredRole && userRole !== 'super_admin') || (requiredPermission && !hasPermission(requiredPermission))) {
    return null;
  }

  return <>{children}</>;
}