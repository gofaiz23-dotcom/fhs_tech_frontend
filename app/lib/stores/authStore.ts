/**
 * Authentication Store using Zustand
 * 
 * This store manages authentication state including user data, tokens,
 * and authentication status. It replaces localStorage with a more
 * robust state management solution.
 */

import { create } from 'zustand';
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
 * Authentication store with localStorage persistence for access token
 * 
 * Stores access token in localStorage for persistence across page refreshes.
 * Authentication state is restored on app initialization using stored token
 * or HttpOnly cookies via the refresh token API.
 */
export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Initialize with stored token if available
  ...initialState,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('fhsfbe625') : null,

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
    // Store in localStorage for persistence across page refreshes
    if (typeof window !== 'undefined') {
      if (accessToken) {
        localStorage.setItem('fhsfbe625', accessToken);
      } else {
        localStorage.removeItem('fhsfbe625');
      }
    }
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
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fhsfbe625');
    }
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
    // Store access token in localStorage for persistence
    if (typeof window !== 'undefined' && accessToken) {
      localStorage.setItem('fhsfbe625', accessToken);
    }
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
    // Clear localStorage - only remove fhsfbe625
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fhsfbe625');
    }
    set(initialState);
  },
}));

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
