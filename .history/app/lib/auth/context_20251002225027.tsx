"use client";

/**
 * Authentication Context Provider
 * 
 * This context manages the global authentication state throughout the application.
 * It provides user data, authentication status, and authentication actions to all components.
 * Uses Zustand for state management with React Context for dependency injection.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { User } from './types';
import { AuthService, ensureValidToken, TokenRefreshManager } from './api';
import { useAuthStore } from '../stores/authStore';

// No reducer needed - using Zustand store directly

// Context type definition
interface AuthContextType {
  // Actions (state is accessed directly via Zustand hooks)
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, role: 'ADMIN' | 'USER') => Promise<void>;
  refreshAuth: () => Promise<void>;
  
  // Utilities
  isAdmin: () => boolean;
  hasPermission: (type: 'brands' | 'marketplaces' | 'shipping', name: string) => boolean;
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication context to all child components.
 * Automatically checks for existing authentication on mount and handles token refresh.
 * 
 * @param children - Child components to wrap
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Access Zustand store methods
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    setLoading,
    setError,
    updateAuthState,
    logout: logoutStore,
    clearError,
    setAccessToken,
  } = useAuthStore();

  // Token refresh manager instance
  const tokenRefreshManager = TokenRefreshManager.getInstance();

  /**
   * Start automatic token refresh when user is authenticated
   */
  const startTokenRefresh = () => {
    if (!tokenRefreshManager.isRunning()) {
      tokenRefreshManager.start(
        (newToken: string) => {
          // Update token in store when automatically refreshed
          setAccessToken(newToken);
        },
        (error: Error) => {
          // Handle refresh error - logout user
          console.error('❌ Automatic refresh failed, logging out:', error);
          logoutStore();
        }
      );
    }
  };

  /**
   * Stop automatic token refresh when user logs out
   */
  const stopTokenRefresh = () => {
    tokenRefreshManager.stop();
  };

  /**
   * Initialize authentication on app start
   * 
   * Checks for stored tokens and validates them with the server.
   * Automatically loads user profile if valid token exists.
   */
  useEffect(() => {
    async function initializeAuth() {
      try {
        setLoading(true);

        // Check if we have a valid stored token
        const token = await ensureValidToken(accessToken);
        
        if (!token) {
          logoutStore();
          return;
        }

        // Get user profile with the valid token
        const profileResponse = await AuthService.getProfile(token);
        
        updateAuthState({
          user: profileResponse.user,
          accessToken: token,
        });
        
        // Start automatic token refresh
        startTokenRefresh();
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        logoutStore();
      }
    }

    // Only initialize if we haven't already loaded user data
    if (!user && isLoading) {
      initializeAuth();
    }
  }, [user, isLoading, accessToken, setLoading, logoutStore, updateAuthState]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Auth initialization timeout - forcing logout');
        logoutStore();
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, logoutStore]);

  // Automatic token refresh every 13 minutes
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    if (isAuthenticated && accessToken) {
      refreshInterval = setInterval(async () => {
        try {
          const refreshResponse = await AuthService.refreshToken();
          
          // Update the token in the store
          updateAuthState({
            user: user!,
            accessToken: refreshResponse.accessToken,
          });
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // If refresh fails, logout the user
          logoutStore();
        }
      }, 13 * 60 * 1000); // 13 minutes in milliseconds
    }

    // Cleanup interval on unmount or when authentication state changes
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, accessToken, user, updateAuthState, logoutStore]);


  /**
   * Login user with email and password
   * 
   * @param email - User's email address
   * @param password - User's password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      // Perform login
      const loginResponse = await AuthService.login({ email, password });
      
      // Get detailed user profile
      const profileResponse = await AuthService.getProfile(loginResponse.accessToken);

      updateAuthState({
        user: profileResponse.user,
        accessToken: loginResponse.accessToken,
      });
      
      // Start automatic token refresh after successful login
      startTokenRefresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    }
  };

  /**
   * Logout current user
   * 
   * Clears all authentication data and invalidates server tokens
   */
  const logout = async (): Promise<void> => {
    try {
      // Stop token refresh before logout
      stopTokenRefresh();
      
      if (accessToken) {
        await AuthService.logout(accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if server call fails
    } finally {
      logoutStore();
    }
  };

  /**
   * Register a new user
   * 
   * Note: Only admins can register new users (except for the first admin)
   * 
   * @param email - New user's email
   * @param password - New user's password
   * @param role - User role (ADMIN or USER)
   */
  const register = async (
    username: string,
    email: string,
    password: string,
    role: 'ADMIN' | 'USER'
  ): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      await AuthService.register(
        { username, email, password, role },
        accessToken || undefined
      );

      // Registration successful - reset loading state
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    }
  };

  /**
   * Refresh authentication state
   * 
   * Useful for manually refreshing user data or recovering from auth errors
   */
  const refreshAuth = async (): Promise<void> => {
    try {
      const token = await ensureValidToken(accessToken);
      
      if (!token) {
        logoutStore();
        return;
      }

      const profileResponse = await AuthService.getProfile(token);
      
      updateAuthState({
        user: profileResponse.user,
        accessToken: token,
      });
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      logoutStore();
      throw error;
    }
  };

  /**
   * Check if current user is an admin
   * 
   * @returns boolean - True if user has admin role
   */
  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  /**
   * Check if user has specific permission
   * 
   * @param type - Permission type (brands, marketplaces, or shipping)
   * @param name - Permission name to check
   * @returns boolean - True if user has the permission
   */
  const hasPermission = (
    type: 'brands' | 'marketplaces' | 'shipping',
    name: string
  ): boolean => {
    if (!user) return false;

    const accessMap = {
      brands: user.brandAccess,
      marketplaces: user.marketplaceAccess,
      shipping: user.shippingAccess,
    };

    const permissions = accessMap[type];
    return permissions.some(permission => permission.name === name);
  };

  // Context value
  const contextValue: AuthContextType = {
    login,
    logout,
    register,
    refreshAuth,
    isAdmin,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * 
 * Must be used within an AuthProvider component tree.
 * Combines Zustand store state with context actions.
 * 
 * @returns Combined auth state and actions
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const authState = useAuthStore();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Combine Zustand state with context actions
  return {
    // State from Zustand store
    state: {
      user: authState.user,
      accessToken: authState.accessToken,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      error: authState.error,
    },
    // Actions from context
    ...context,
    // Store actions for direct access
    clearError: authState.clearError,
  };
}

/**
 * Hook to get current user data
 * 
 * Convenience hook that returns just the user data
 * 
 * @returns UserProfile | null - Current user data or null if not authenticated
 */
export function useUser(): UserProfile | null {
  return useAuthStore(state => state.user);
}

/**
 * Hook to check authentication status
 * 
 * Convenience hook for checking if user is logged in
 * 
 * @returns boolean - True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore(state => state.isAuthenticated);
}
