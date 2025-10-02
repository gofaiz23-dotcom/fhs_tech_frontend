/**
 * Store Index
 * 
 * Centralized exports for all Zustand stores and their utilities
 */

// Authentication store
export { useAuthStore, authSelectors } from './authStore';

// Admin store  
export { useAdminStore, adminSelectors } from './adminStore';

// Re-export Zustand utilities for convenience
export { create } from 'zustand';
export { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
