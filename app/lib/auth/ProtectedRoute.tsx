"use client";

/**
 * Protected Route Component
 * 
 * This component provides route protection based on authentication status and user roles.
 * It can be used to wrap pages or components that require authentication or specific permissions.
 */

import React, { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from './context';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Required role to access the route
   * If not specified, any authenticated user can access
   */
  requiredRole?: UserRole;
  /**
   * Required permissions for access
   * User must have at least one of the specified permissions
   */
  requiredPermissions?: {
    type: 'brands' | 'marketplaces' | 'shipping';
    names: string[];
  }[];
  /**
   * Redirect path for unauthenticated users
   * Defaults to '/login'
   */
  redirectTo?: string;
  /**
   * Custom loading component while checking authentication
   */
  loadingComponent?: ReactNode;
  /**
   * Custom unauthorized component
   */
  unauthorizedComponent?: ReactNode;
}

/**
 * Default loading component
 */
const DefaultLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  </div>
);

/**
 * Default unauthorized component
 */
const DefaultUnauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page. Please contact your administrator 
        if you believe this is an error.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

/**
 * Protected Route Wrapper Component
 * 
 * @param props - ProtectedRoute props
 * @returns Protected content or redirect/unauthorized component
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
  redirectTo = '/login',
  loadingComponent = <DefaultLoader />,
  unauthorizedComponent = <DefaultUnauthorized />,
}: ProtectedRouteProps) {
  const { state, hasPermission } = useAuth();

  // Show loading while checking authentication
  if (state.isLoading) {
    return <>{loadingComponent}</>;
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated || !state.user) {
    redirect(redirectTo);
    return null;
  }

  // Check role requirement
  if (requiredRole && state.user.role !== requiredRole) {
    return <>{unauthorizedComponent}</>;
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(requirement =>
      requirement.names.some(name =>
        hasPermission(requirement.type, name)
      )
    );

    if (!hasRequiredPermission) {
      return <>{unauthorizedComponent}</>;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

/**
 * HOC for protecting pages
 * 
 * Usage:
 * ```tsx
 * export default withAuth(MyPage, { requiredRole: 'ADMIN' });
 * ```
 * 
 * @param Component - The component to protect
 * @param options - Protection options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Admin-only route wrapper
 * 
 * Convenience component for admin-only pages
 */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="ADMIN" {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Hook to check if current user can access a route
 * 
 * Useful for conditionally rendering navigation items or content
 * 
 * @param requiredRole - Required role
 * @param requiredPermissions - Required permissions
 * @returns boolean - True if user can access
 */
export function useCanAccess(
  requiredRole?: UserRole,
  requiredPermissions?: {
    type: 'brands' | 'marketplaces' | 'shipping';
    names: string[];
  }[]
): boolean {
  const { state, hasPermission } = useAuth();

  // Must be authenticated
  if (!state.isAuthenticated || !state.user) {
    return false;
  }

  // Check role requirement
  if (requiredRole && state.user.role !== requiredRole) {
    return false;
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(requirement =>
      requirement.names.some(name =>
        hasPermission(requirement.type, name)
      )
    );

    if (!hasRequiredPermission) {
      return false;
    }
  }

  return true;
}
