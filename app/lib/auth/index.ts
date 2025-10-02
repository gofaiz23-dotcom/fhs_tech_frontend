/**
 * Authentication Module Index
 * 
 * This file provides a centralized export for all authentication-related
 * functionality, making it easy to import what you need throughout the app.
 */

// Core authentication service
export { AuthService, AuthApiError, ensureValidToken } from './api';

// Authentication context and hooks
export { AuthProvider, useAuth, useUser, useIsAuthenticated } from './context';

// Route protection components and utilities
export { ProtectedRoute, withAuth, AdminRoute, useCanAccess } from './ProtectedRoute';

// TypeScript types and interfaces
export type {
  User,
  UserProfile,
  UserRole,
  NetworkType,
  Permission,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  RefreshResponse,
  LogoutResponse,
  AuthError,
  AuthState,
  AuthAction,
} from './types';
