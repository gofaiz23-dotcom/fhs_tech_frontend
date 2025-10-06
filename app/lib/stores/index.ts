/**
 * Store Index
 * 
 * Centralized exports for all Zustand stores and their utilities
 */

// Authentication store
export { useAuthStore, authSelectors } from './authStore';

// Admin store  
export { useAdminStore, adminSelectors } from './adminStore';

// Permissions store (in-memory only)
export { usePermissionsStore } from './permissionsStore';

// Re-export Zustand utilities for convenience
export { create } from 'zustand';
export { subscribeWithSelector } from 'zustand/middleware';
export { persist, createJSONStorage } from 'zustand/middleware';

// Re-export HTTP client for API calls
export { HttpClient, api } from '../auth/httpClient';
