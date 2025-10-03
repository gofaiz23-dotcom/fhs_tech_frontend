/**
 * Authentication API Service
 * 
 * This service handles all authentication-related API calls including login,
 * registration, token refresh, logout, and profile management. It provides
 * a clean interface for the frontend to interact with the authentication backend.
 * 
 * Features:
 * - Automatic token refresh every 13 minutes
 * - Network type detection for login tracking
 * - Comprehensive error handling
 */

import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  RefreshResponse,
  LogoutResponse,
  AuthError,
  NetworkType
} from './types';

// Base API configuration
const API_BASE_URL = 'https://fhs-tech-backend.onrender.com/api';
const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
} as const;

/**
 * Custom error class for authentication-specific errors
 */
export class AuthApiError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(
    message: string,
    statusCode: number,
    code?: string
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Generic API request handler with error handling
 * 
 * @param url - The endpoint URL
 * @param options - Fetch options
 * @returns Promise with parsed JSON response
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    console.log('🌐 API: Making request to:', url);
    console.log('🌐 API: Request options:', {
      method: options.method,
      headers: options.headers,
      hasBody: !!options.body
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for HttpOnly cookies
    });

    console.log('🌐 API: Response status:', response.status);
    console.log('🌐 API: Response headers:', Object.fromEntries(response.headers.entries()));

    let data: any;
    try {
      data = await response.json();
      console.log('🌐 API: Response data:', data);
    } catch (parseError) {
      console.error('❌ API: Failed to parse JSON response:', parseError);
      // If JSON parsing fails, create a fallback error object
      data = {
        error: `Invalid JSON response from server (${response.status})`,
        code: 'INVALID_JSON'
      };
    }

    if (!response.ok) {
      const error = data as AuthError;
      const errorMessage = error?.error || `API error: ${response.statusText}`;
      const errorCode = error?.code?.toString() || response.status.toString();
      
      console.error('❌ API: Request failed:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        code: errorCode,
        fullError: error,
        url: url
      });
      
      throw new AuthApiError(
        errorMessage,
        response.status,
        errorCode
      );
    }

    console.log('✅ API: Request successful');
    return data as T;
  } catch (error) {
    console.error('❌ API: Network/parsing error:', error);
    
    if (error instanceof AuthApiError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new AuthApiError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Detect network type for login tracking
 * 
 * @returns NetworkType - The detected network type
 */
function detectNetworkType(): NetworkType {
  // Check if navigator.connection is available (Chrome/Edge)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType) {
      // Map connection types to our enum
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
        case '3g':
        case '4g':
          return 'cellular';
        default:
          return 'wifi';
      }
    }
  }
  
  // Fallback detection
  return 'unknown';
}

/**
 * User Authentication Service
 */
/**
 * Test API connectivity and server status
 */
export async function testApiConnectivity(): Promise<{
  isReachable: boolean;
  status: number;
  error?: string;
}> {
  try {
    console.log('🔍 Testing API connectivity to:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 Health check response:', response.status);
    
    return {
      isReachable: true,
      status: response.status,
    };
  } catch (error) {
    console.error('🔍 API connectivity test failed:', error);
    return {
      isReachable: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export class AuthService {
  /**
   * Authenticate user with email and password
   * 
   * @param credentials - User login credentials
   * @returns Promise<LoginResponse> - Login response with tokens and user data
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const loginData = {
      ...credentials,
      networkType: credentials.networkType || detectNetworkType(),
    };

    // Debug logging
    console.log('🔐 Auth: Attempting login...');
    console.log('🔐 Auth: Login endpoint:', AUTH_ENDPOINTS.LOGIN);
    console.log('🔐 Auth: Login data:', {
      email: loginData.email,
      networkType: loginData.networkType,
      hasPassword: !!loginData.password
    });

    try {
      const response = await apiRequest<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      console.log('✅ Auth: Login successful');
      return response;
    } catch (error) {
      console.error('❌ Auth: Login failed:', error);
      console.error('❌ Auth: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: error instanceof AuthApiError ? error.statusCode : 'Unknown',
        code: error instanceof AuthApiError ? error.code : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Register a new user
   * 
   * Note: First user becomes admin automatically (no token required).
   * Subsequent registrations require admin token.
   * 
   * @param userData - User registration data
   * @param adminToken - Admin access token (required for non-first user)
   * @returns Promise<RegisterResponse> - Registration response
   */
  static async register(
    userData: RegisterRequest,
    adminToken?: string
  ): Promise<RegisterResponse> {
    const headers: Record<string, string> = {};
    
    // Add authorization header if admin token is provided
    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }

    return apiRequest<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
  }

  /**
   * Refresh access token using the HttpOnly refresh token
   * 
   * @returns Promise<RefreshResponse> - New access token
   */
  static async refreshToken(): Promise<RefreshResponse> {
    const response = await apiRequest<RefreshResponse>(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
    });

    // Access token will be updated by the auth store

    return response;
  }

  /**
   * Logout user and invalidate tokens
   * 
   * @param accessToken - Current access token
   * @returns Promise<LogoutResponse> - Logout confirmation
   */
  static async logout(accessToken: string): Promise<LogoutResponse> {
    try {
      const response = await apiRequest<LogoutResponse>(AUTH_ENDPOINTS.LOGOUT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response;
    } catch (error) {
      // Error will be handled by calling code
      throw error;
    }
  }

  /**
   * Get current user profile and permissions
   * 
   * @param accessToken - Current access token
   * @returns Promise<ProfileResponse> - User profile with permissions
   */
  static async getProfile(accessToken: string): Promise<ProfileResponse> {
    return apiRequest<ProfileResponse>(AUTH_ENDPOINTS.PROFILE, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Make authenticated API request to any endpoint
   * 
   * @param url - The endpoint URL
   * @param options - Fetch options
   * @param accessToken - Current access token
   * @returns Promise with response data
   */
  static async authenticatedRequest<T>(
    url: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    if (!accessToken) {
      throw new AuthApiError('No access token provided', 401, 'NO_TOKEN');
    }

    return apiRequest<T>(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  }

  /**
   * Check if a token is valid (not expired)
   * 
   * @param token - JWT token to validate
   * @returns boolean - True if valid token
   */
  static isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch {
      // If token parsing fails, consider it invalid
      return false;
    }
  }
}

/**
 * Automatic token refresh interceptor
 * 
 * This function can be used to automatically refresh tokens when they expire.
 * It should be called before making API requests.
 */
export async function ensureValidToken(currentToken: string | null): Promise<string | null> {
  try {
    if (!currentToken) {
      console.log('⚠️ No current token available');
      return null;
    }

    // Check if token is expired or will expire in the next 3 minutes (appropriate for 15-min tokens)
    const payload = JSON.parse(atob(currentToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const bufferTime = 180; // 3 minutes buffer (appropriate for 15-minute token expiration)
    
    if (payload.exp <= currentTime + bufferTime) {
      // Token is expired or will expire soon, refresh it
      console.log('🔄 Token expiring soon, refreshing...');
      try {
        const refreshResponse = await AuthService.refreshToken();
        console.log('✅ Token refreshed successfully');
        return refreshResponse.accessToken;
      } catch (refreshError: any) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Check if it's a refresh token issue
        if (refreshError.message?.includes('Refresh token not provided') || 
            refreshError.message?.includes('refresh') ||
            refreshError.statusCode === 401) {
          console.log('🔄 Refresh token expired or invalid, user needs to login again');
          // Return null to force re-authentication
          return null;
        }
        
        // For other errors, return the current token
        console.log('⚠️ Returning current token despite refresh failure');
        return currentToken;
      }
    }
    
    return currentToken;
  } catch (error) {
    console.error('❌ Token validation failed:', error);
    // If token parsing fails, return null to force re-authentication
    console.log('⚠️ Token validation failed, forcing re-authentication');
    return null;
  }
}


