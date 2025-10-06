/**
 * Authentication Store using Zustand
 * 
 * This store manages authentication state including user data, tokens,
 * and authentication status. It replaces localStorage with a more
 * robust state management solution.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../auth/types';

interface AuthState {
  // Core auth data
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Authentication actions
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
  
  // Convenience methods
  updateAuthState: (data: { user: User; accessToken: string }) => void;
  clearAuthState: () => void;
}

type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Authentication store with persistence
 * 
 * Uses localStorage to persist authentication state across page refreshes.
 * Access tokens are stored securely and restored on app initialization.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Set authenticated user
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: true, 
      isLoading: false,
      error: null 
    });
  },

  // Set access token
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  // Set authentication status
  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },

  // Set loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Set error message
  setError: (error) => {
    set({ error, isLoading: false });
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Logout user
  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Update authentication state (login success)
  updateAuthState: ({ user, accessToken }) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  // Clear all authentication state
  clearAuthState: () => {
    set(initialState);
  },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selectors for commonly used state combinations
 */
export const authSelectors = {
  // Check if user is authenticated
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  
  // Get current user
  getUser: () => useAuthStore.getState().user,
  
  // Get access token
  getAccessToken: () => useAuthStore.getState().accessToken,
  
  // Check if user is admin
  isAdmin: () => {
    const user = useAuthStore.getState().user;
    return user?.role === 'ADMIN';
  },
  
  // Check if user has specific permission
  // Note: Basic profile doesn't include permissions, use admin API for detailed access info
  hasPermission: (type: 'brands' | 'marketplaces' | 'shipping', name: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;
    // For basic user profile, permissions need to be fetched from admin API
    console.warn('hasPermission called with basic profile - use admin API for permission details');
    return false;
  },
  
  // Get authentication state summary
  getAuthSummary: () => {
    const state = useAuthStore.getState();
    return {
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasError: !!state.error,
      userRole: state.user?.role || null,
      userName: state.user?.username || null,
      userEmail: state.user?.email || null,
    };
  },
};
