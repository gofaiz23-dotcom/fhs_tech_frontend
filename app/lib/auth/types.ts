/**
 * Authentication Type Definitions
 * 
 * This file contains all TypeScript types and interfaces used throughout
 * the authentication system, ensuring type safety and consistency.
 */

// User role enumeration matching backend
export type UserRole = 'ADMIN' | 'USER';

// Network type for login tracking
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'unknown';

// Base user interface
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// User profile from /profile endpoint (basic info only)
export interface UserProfile extends User {
  // Profile endpoint no longer returns permissions
  // Use admin APIs for detailed access information
}

// Permission interface for brands, marketplaces, and shipping
export interface Permission {
  id: number;
  name: string;
  description: string;
}

// Authentication tokens
export interface AuthTokens {
  accessToken: string;
  // refreshToken is handled automatically via HttpOnly cookies
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
  networkType?: NetworkType;
}

// Registration request payload
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

// API Response types
export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
  isFirstAdmin: boolean;
}

export interface ProfileResponse {
  message: string;
  user: UserProfile;
}

export interface RefreshResponse {
  message: string;
  accessToken: string;
}

export interface LogoutResponse {
  message: string;
}

// Error response type
export interface AuthError {
  error: string;
  code?: number;
}

// Authentication state for context
export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication context actions
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserProfile; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_TOKEN'; payload: string };
