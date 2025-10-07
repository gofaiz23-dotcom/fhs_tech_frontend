"use client";

/**
 * Authentication Context Provider
 * 
 * This context manages the global authentication state throughout the application.
 * It provides user data, authentication status, and authentication actions to all components.
 * Uses Zustand for state management with React Context for dependency injection.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { User, UserProfile } from './types';
import { AuthService, ensureValidToken, AuthApiError } from './api';
import { HttpClient } from './httpClient';
import { useAuthStore } from '../stores/authStore';
import { activityLogger } from '../activity-logger';

// No reducer needed - using Zustand store directly

// Context type definition
interface AuthContextType {
  // Actions (state is accessed directly via Zustand hooks)
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, role: 'ADMIN' | 'USER') => Promise<void>;
  refreshAuth: () => Promise<void>;
  restoreSession: () => Promise<void>;
  testSessionRestoration: () => Promise<void>;
  testCookieConfiguration: () => Promise<void>;
  
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



  /**
   * Initialize authentication on app start
   * 
   * Always attempts to restore session using refresh token cookie.
   * This handles page refresh scenarios where in-memory state is lost.
   */
  useEffect(() => {
    async function initializeAuth() {
      try {
        console.log('🔄 Auth: Starting initialization...', { 
          hasToken: !!accessToken, 
          hasUser: !!user,
          isLoading 
        });

        setLoading(true);

        // Try to restore session using stored access token or refresh token
        if (accessToken) {
          console.log('🔄 Auth: Found stored access token, validating...');
          
          try {
            // Validate stored token and refresh if needed
            const validToken = await ensureValidToken(accessToken);
            
            if (validToken) {
              // Update token if it was refreshed
              if (validToken !== accessToken) {
                console.log('✅ Auth: Token was refreshed, updating store');
                setAccessToken(validToken);
              }

              // Get user profile with the valid token
              console.log('👤 Auth: Fetching user profile...');
              const profileResponse = await AuthService.getProfile(validToken);
              console.log('✅ Auth: Profile fetched successfully');
              
              updateAuthState({
                user: profileResponse.user,
                accessToken: validToken,
              });
              console.log('✅ Auth: Session restored successfully with stored token');
              return;
            } else {
              console.log('⚠️ Auth: Stored token is invalid, trying refresh token...');
            }
          } catch (error) {
            console.log('⚠️ Auth: Stored token validation failed, trying refresh token...');
          }
        }

        // No stored token or stored token is invalid - user needs to login
        console.log('⚠️ Auth: No valid access token found, user needs to login');
        setLoading(false);
        return;
      } catch (error) {
        console.error('❌ Auth: Failed to initialize:', error);
        console.log('❌ Auth: Setting loading to false');
        setLoading(false);
      }
    }

    // Initialize auth when component mounts
    if (isLoading) {
      console.log('🚀 Auth: Initializing...');
      initializeAuth();
    }
  }, [isLoading, setLoading, updateAuthState]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Auth initialization timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, setLoading]);

  // Automatic token refresh disabled for now - using localStorage persistence instead
  // Token will be validated on each API call and user can login again if token expires
  useEffect(() => {
    console.log('🔄 Auth: Automatic token refresh is disabled - using localStorage persistence');
    
    // Just log the current state for debugging
    if (isAuthenticated && accessToken) {
      console.log('✅ Auth: User is authenticated with persisted token');
      // Don't try to get token expiration since that might cause errors
    }
  }, [isAuthenticated, accessToken]);


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

      // Perform login and get access token
      const loginResponse = await AuthService.login({ email, password });
      console.log('✅ Login: Received access token');
      
      // Get detailed user profile using the access token
      const profileResponse = await AuthService.getProfile(loginResponse.accessToken);
      console.log('🔍 Login: Profile response:', profileResponse);
      console.log('🔍 Login: User from response:', profileResponse.user);
      console.log('🔍 Login: User role:', profileResponse.user?.role);

      updateAuthState({
        user: profileResponse.user,
        accessToken: loginResponse.accessToken,
      });

      // Log the login activity
      if (profileResponse.user) {
        activityLogger.logUserLogin(
          profileResponse.user.email,
          profileResponse.user.username
        );
      }
    } catch (error) {
      console.error('❌ Login error in context:', error);
      
      let errorMessage = 'Login failed';
      
      if (error instanceof AuthApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Provide fallback error message if none is available
      if (!errorMessage || errorMessage === 'Login failed') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      
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
      // Logout with access token
      if (accessToken) {
        await AuthService.logout(accessToken);
        console.log('✅ Logout: Server tokens invalidated');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Continue with logout even if server call fails
    } finally {
      logoutStore();
      // Redirect to login page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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

      // Registration with admin token if available
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
      if (!accessToken) {
        console.log('❌ Auth: No access token available, logging out');
        logoutStore();
        return;
      }

      // Validate and refresh token if needed
      const validToken = await ensureValidToken(accessToken);
      
      if (!validToken) {
        console.log('❌ Auth: Token validation failed, logging out');
        logoutStore();
        return;
      }

      // Update token if it was refreshed
      if (validToken !== accessToken) {
        setAccessToken(validToken);
      }

      // Get fresh user profile
      const profileResponse = await AuthService.getProfile(validToken);
      
      updateAuthState({
        user: profileResponse.user,
        accessToken: validToken,
      });
      
      console.log('✅ Auth: Authentication refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      logoutStore();
      throw error;
    }
  };

  /**
   * Test session restoration
   * 
   * Useful for debugging session restoration issues
   */
  const testSessionRestoration = async (): Promise<void> => {
    console.log('🧪 Auth: Testing session restoration...');
    console.log('🧪 Auth: Current auth state:', {
      hasUser: !!user,
      hasToken: !!accessToken,
      isAuthenticated,
      isLoading
    });
    
    try {
      // Try refresh token first
      console.log('🧪 Auth: Testing refresh token...');
      const refreshResponse = await AuthService.refreshToken();
      console.log('✅ Auth: Refresh token test successful');
      
      // Get profile
      const profileResponse = await AuthService.getProfile(refreshResponse.accessToken);
      console.log('✅ Auth: Profile test successful');
      
      updateAuthState({
        user: profileResponse.user,
        accessToken: refreshResponse.accessToken,
      });
      
      console.log('✅ Auth: Session restoration test completed successfully');
    } catch (error) {
      console.error('❌ Auth: Session restoration test failed:', error);
      throw error;
    }
  };

  /**
   * Test cookie configuration and CORS setup
   */
  const testCookieConfiguration = async (): Promise<void> => {
    console.log('🧪 Testing cookie configuration...');
    try {
      const result = await HttpClient.testCookieConfiguration();
      console.log('🍪 Cookie Test Results:', result);
      
      if (!result.cookiesAvailable) {
        console.warn('⚠️ No cookies available - this might be why refresh token is not working');
      }
      
      if (result.corsTest.error) {
        console.error('❌ CORS Test Failed:', result.corsTest.error);
        console.log('💡 This suggests a CORS configuration issue on the backend');
        console.log('💡 Backend needs to allow credentials from your frontend domain');
      }
    } catch (error) {
      console.error('❌ Cookie configuration test failed:', error);
    }
  };

  /**
   * Restore session from stored token
   * 
   * Useful for manually restoring session after page refresh or network issues
   */
  const restoreSession = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔄 Auth: Manually restoring session...');
      
      if (!accessToken) {
        console.log('❌ Auth: No access token available, cannot restore session');
        logoutStore();
        return;
      }

      // Validate and refresh token if needed
      const validToken = await ensureValidToken(accessToken);
      
      if (!validToken) {
        console.log('❌ Auth: Token validation failed, cannot restore session');
        logoutStore();
        return;
      }

      // Update token if it was refreshed
      if (validToken !== accessToken) {
        setAccessToken(validToken);
      }

      // Get fresh user profile
      const profileResponse = await AuthService.getProfile(validToken);
      
      updateAuthState({
        user: profileResponse.user,
        accessToken: validToken,
      });
      
      console.log('✅ Auth: Session restored manually with valid token');
    } catch (error) {
      console.error('❌ Auth: Failed to restore session:', error);
      setLoading(false);
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
   * Note: Profile endpoint no longer returns permissions.
   * Use admin APIs to check detailed user permissions.
   * 
   * @param type - Permission type (brands, marketplaces, or shipping)
   * @param name - Permission name to check
   * @returns boolean - Always returns false (use admin APIs for permission checks)
   */
  const hasPermission = (
    type: 'brands' | 'marketplaces' | 'shipping',
    name: string
  ): boolean => {
    // Profile endpoint no longer includes permissions
    // Use AdminService.getSpecificUser() for detailed permission checks
    return false;
  };

  // Context value
  const contextValue: AuthContextType = {
    login,
    logout,
    register,
    refreshAuth,
    restoreSession,
    testSessionRestoration,
    testCookieConfiguration,
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
