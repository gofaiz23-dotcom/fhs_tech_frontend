/**
 * Authentication API Service
 * 
 * This service handles all authentication-related API calls using HttpOnly cookies.
 * The backend manages refresh tokens automatically via HttpOnly cookies.
 * 
 * Features:
 * - HttpOnly cookie-based aut
 * hentication
 * - Automatic refresh token handling by backend
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
import { HttpClient } from './httpClient';

// Base API configuration
// const API_BASE_URL = 'https://fhs-tech-backend.onrender.com/api';
const API_BASE_URL = 'http://localhost:5000/api';
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
 * Legacy API request handler - now uses HttpClient internally
 * @deprecated Use HttpClient directly instead
 */
async function apiRequest<T>(url: string, options: any = {}): Promise<T> {
  // Convert full URL to endpoint path for HttpClient
  const endpoint = url.replace(API_BASE_URL, '');
  return HttpClient.request<T>(endpoint, options);
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
  details?: any;
}> {
  try {
    console.log('🔍 Testing API connectivity to:', API_BASE_URL);
    
      const responseData = await HttpClient.get('/health');
    
    console.log('✅ API connectivity test successful');
    console.log('🔍 Health check data:', responseData);
    
    return {
      isReachable: true,
      status: 200,
      details: {
        data: responseData
      }
    };
  } catch (error) {
    console.error('🔍 API connectivity test failed:', error);
    return {
      isReachable: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorType: error?.constructor?.name || 'Unknown',
        isNetworkError: error instanceof TypeError,
        isCorsError: error instanceof TypeError && error.message.includes('CORS')
      }
    };
  }
}

/**
 * Test cookie availability and domain configuration
 */
export async function testCookieConfiguration(): Promise<{
  cookiesAvailable: boolean;
  cookieString: string;
  domain: string;
  isSecure: boolean;
}> {
  const result = {
    cookiesAvailable: false,
    cookieString: '',
    domain: '',
    isSecure: false,
  };

  if (typeof window === 'undefined') {
    return result;
  }

  try {
    result.cookiesAvailable = !!document.cookie;
    result.cookieString = document.cookie;
    result.domain = window.location.hostname;
    result.isSecure = window.location.protocol === 'https:';
    
    console.log('🍪 Cookie test results:', result);
    return result;
  } catch (error) {
    console.error('🍪 Cookie test failed:', error);
    return result;
  }
}

export class AuthService {
  /**
   * Authenticate user with email and password
   * 
   * @param credentials - User login credentials
   * @returns Promise<LoginResponse> - Login response with access token and user data
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const loginData = {
      ...credentials,
      networkType: credentials.networkType || detectNetworkType(),
    };

    // Debug logging
    console.log('🔐 Auth: Attempting login...');
    console.log('🔐 Auth: Login data:', {
      email: loginData.email,
      networkType: loginData.networkType,
      hasPassword: !!loginData.password
    });

    try {
      const response = await HttpClient.post<LoginResponse>('/auth/login', loginData);
      console.log('✅ Auth: Login successful - received access token');
      console.log('🔑 Auth: Access token received:', response.accessToken ? 'Yes' : 'No');
      
      // Check if refresh token cookie was set by backend
      console.log('🍪 Auth: Checking if refresh token cookie was set...');
      console.log('🍪 Auth: Current cookies after login:', typeof document !== 'undefined' ? document.cookie : 'server-side');
      
      // Parse and log all cookies
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0);
        console.log('🍪 Auth: Parsed cookies:', cookies);
        
        // Check for refresh token specifically
        const refreshTokenCookie = cookies.find(c => 
          c.toLowerCase().includes('refresh') || 
          c.toLowerCase().includes('token')
        );
        console.log('🍪 Auth: Refresh token cookie found:', refreshTokenCookie || 'None');
      }
      
      return response;
    } catch (error) {
      console.log('⚠️ Auth: Login failed:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof AuthApiError) {
        console.log('⚠️ Auth: Error details:', {
          statusCode: error.statusCode,
          code: error.code,
        });
      }
      
      // Provide more user-friendly error messages
      if (error instanceof AuthApiError) {
        if (error.statusCode === 401) {
          throw new AuthApiError('Invalid email or password. Please check your credentials and try again.', 401, 'INVALID_CREDENTIALS');
        } else if (error.statusCode === 403) {
          throw new AuthApiError('Access denied. Please contact your administrator.', 403, 'ACCESS_DENIED');
        } else if (error.statusCode >= 500) {
          throw new AuthApiError('Server error. Please try again later.', error.statusCode, 'SERVER_ERROR');
        }
      }
      
      throw error;
    }
  }

  /**
   * Register a new user
   * 
   * Note: First user becomes admin automatically (no token required).
   * Subsequent registrations require admin access token.
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

    return HttpClient.post<RegisterResponse>('/auth/register', userData, {
      headers,
    });
  }

  /**
   * Refresh access token using the refresh token
   * 
   * This endpoint uses HttpOnly cookies for refresh token authentication.
   * No request body is needed as the refresh token is sent automatically via cookie.
   * 
   * @returns Promise<RefreshResponse> - New access token
   */
  static async refreshToken(): Promise<RefreshResponse> {
    try {
      console.log('🔄 Auth: Attempting token refresh...');
      console.log('🔄 Auth: Sending POST request to /auth/refresh');
      console.log('🔄 Auth: Request body: None (refresh token sent via HttpOnly cookie)');
      console.log('🔄 Auth: Current domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
      console.log('🔄 Auth: Backend domain:', API_BASE_URL);
      console.log('🔄 Auth: Note: HttpOnly cookies are not visible to JavaScript');
      
      // Make POST request to /auth/refresh with no body
      // The refresh token is automatically sent via HttpOnly cookie
      const response = await HttpClient.post<RefreshResponse>('/auth/refresh');

      console.log('✅ Auth: Token refresh successful');
      console.log('🔑 Auth: Received new access token:', response.accessToken ? 'Yes' : 'No');
      console.log('📝 Auth: Response message:', response.message || 'No message');
      console.log('🍪 Auth: HttpOnly cookie was sent with request (not visible to JS)');
      
      return response;
    } catch (error) {
      console.log('⚠️ Auth: Token refresh failed:', error);
      
      // Provide more specific error messages for refresh token failures
      if (error instanceof AuthApiError) {
        if (error.statusCode === 401) {
          console.log('🍪 Auth: Invalid refresh token (401)');
          console.log('💡 Auth: This means the refresh token is expired or invalid');
          console.log('💡 Auth: User needs to login again');
          throw new AuthApiError('Invalid refresh token', 401, 'REFRESH_TOKEN_EXPIRED');
        } else if (error.statusCode === 403) {
          console.log('🍪 Auth: Refresh token not provided (403)');
          console.log('💡 Auth: This usually means sameSite="strict" blocks cross-domain cookies');
          console.log('💡 Auth: Or the HttpOnly cookie was not set properly');
          throw new AuthApiError('Refresh token not provided', 403, 'REFRESH_TOKEN_MISSING');
        }
      } else if (error instanceof Error && error.message.includes('Invalid refresh token')) {
        console.log('🍪 Auth: Backend reports "Invalid refresh token"');
        console.log('💡 Auth: This means the refresh token is expired or malformed');
        throw new AuthApiError('Invalid refresh token', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      
      // For network errors or other issues, provide a more user-friendly message
      throw new AuthApiError('Unable to refresh session', 0, 'REFRESH_FAILED');
    }
  }

  /**
   * Logout user and invalidate tokens
   * 
   * This endpoint requires the access token in the Authorization header
   * and sends the refresh token via HttpOnly cookie to invalidate both tokens.
   * 
   * @param accessToken - Current access token
   * @returns Promise<LogoutResponse> - Logout confirmation
   */
  static async logout(accessToken: string): Promise<LogoutResponse> {
    try {
      console.log('🚪 Auth: Attempting logout...');
      console.log('🚪 Auth: Sending POST request to /auth/logout');
      console.log('🚪 Auth: Authorization header: Bearer token provided');
      console.log('🚪 Auth: Refresh token: Sent via HttpOnly cookie');
      console.log('🚪 Auth: Request body: None');
      
      const response = await HttpClient.post<LogoutResponse>('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      console.log('✅ Auth: Logout successful');
      console.log('📝 Auth: Response message:', response.message || 'No message');
      console.log('🔒 Auth: Both access and refresh tokens invalidated on server');
      
      return response;
    } catch (error) {
      console.error('❌ Auth: Logout error:', error);
      
      // Provide more specific error messages for logout failures
      if (error instanceof AuthApiError) {
        if (error.statusCode === 401) {
          console.log('🚪 Auth: Invalid access token (401)');
          console.log('💡 Auth: Access token may be expired or invalid');
        } else if (error.statusCode === 403) {
          console.log('🚪 Auth: Access denied (403)');
          console.log('💡 Auth: User may not have permission to logout');
        }
      }
      
      // Continue with logout even if server call fails
      // The client-side state should still be cleared
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
    const result = await HttpClient.get<ProfileResponse>('/auth/profile', {}, accessToken);
    
    // Check if a new token was returned and extract it
    if (result && typeof result === 'object' && '_newAccessToken' in result) {
      const { _newAccessToken, ...actualResult } = result as any;
      // Return the actual profile data
      return actualResult as ProfileResponse;
    }
    
    return result;
  }

  /**
   * Make authenticated API request to any endpoint
   * 
   * @param endpoint - The endpoint path (without base URL)
   * @param options - Fetch options
   * @param accessToken - Current access token
   * @returns Promise with response data
   */
  static async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    if (!accessToken) {
      throw new AuthApiError('No access token provided', 401, 'NO_TOKEN');
    }

    return HttpClient.get<T>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Check if user is authenticated by testing profile endpoint
   * 
   * @param accessToken - Current access token
   * @returns Promise<boolean> - True if user is authenticated
   */
  static async isAuthenticated(accessToken: string | null): Promise<boolean> {
    if (!accessToken) {
      return false;
    }
    
    try {
      await this.getProfile(accessToken);
      return true;
    } catch (error) {
      console.log('🔍 Auth: Profile check failed, user not authenticated');
      return false;
    }
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

  /**
   * Test if refresh token is available by attempting a refresh
   * 
   * @returns Promise<boolean> - True if refresh token is available and valid
   */
  static async hasValidRefreshToken(): Promise<boolean> {
    try {
      console.log('🔍 Auth: Testing if refresh token is available...');
      await this.refreshToken();
      console.log('✅ Auth: Refresh token is available and valid');
      return true;
    } catch (error) {
      console.log('❌ Auth: Refresh token not available or invalid:', error);
      return false;
    }
  }
}

/**
 * Ensure token is valid and refresh if needed
 * 
 * This function checks if the current token is valid and refreshes it if it's expired.
 * This is the core function for token management in Zustand.
 */
export async function ensureValidToken(currentToken: string | null): Promise<string | null> {
  try {
    if (!currentToken) {
      // No current token - try to get new token using refresh token
      console.log('⚠️ No current token available, attempting refresh...');
      try {
        const refreshResponse = await AuthService.refreshToken();
        console.log('✅ Successfully refreshed token from HttpOnly cookie');
        return refreshResponse.accessToken;
      } catch (error) {
        console.log('⚠️ No refresh token available, user needs to login');
        return null;
      }
    }

    // For lazy refresh approach, we don't proactively check expiration
    // The HttpClient will handle 401 responses and refresh tokens automatically
    console.log('✅ Token available, will be validated on API call');
    return currentToken;
  } catch (error) {
    console.log('⚠️ Token validation failed, attempting refresh...');
    // If token parsing fails, try to refresh
    try {
      const refreshResponse = await AuthService.refreshToken();
      console.log('✅ Successfully refreshed after validation failure');
      return refreshResponse.accessToken;
    } catch (refreshError) {
      console.log('⚠️ Refresh failed after validation error, forcing re-authentication');
      return null;
    }
  }
}


