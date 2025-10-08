/**
 * HTTP Client with Automatic HttpOnly Cookie Authentication
 * 
 * This client automatically handles authentication using HttpOnly cookies.
 * The backend manages refresh tokens via HttpOnly cookies, so the frontend
 * doesn't need to manage tokens directly.
 */

import { AuthApiError } from './api';

// Base API configuration
const API_BASE_URL = 'https://fhs-tech-backend.onrender.com/api';

/**
 * HTTP Client with automatic cookie-based authentication
 */
export class HttpClient {
  private static baseURL = API_BASE_URL;

  /**
   * Make an authenticated HTTP request with automatic token refresh on 401
   * 
   * @param endpoint - API endpoint (without base URL)
   * @param options - Fetch options
   * @param accessToken - Optional access token for Authorization header
   * @returns Promise with parsed JSON response
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log('🌐 HTTP: Making request to:', url);
      console.log('🌐 HTTP: Request options:', {
        method: options.method || 'GET',
        hasBody: !!options.body,
        hasHeaders: !!options.headers,
        credentials: 'include'
      });
      
      // Additional debugging for cookie issues
      console.log('🌐 HTTP: Current domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
      console.log('🌐 HTTP: Current cookies:', typeof document !== 'undefined' ? document.cookie : 'server-side');
      
      // Prepare headers with optional Authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Check if this is a refresh token request and log additional details
      if (endpoint.includes('/auth/refresh')) {
        console.log('🔄 REFRESH: This is a refresh token request');
        console.log('🔄 REFRESH: Request URL:', url);
        console.log('🔄 REFRESH: Current domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
        console.log('🔄 REFRESH: Using cross-domain cookies (sameSite: none)');
        console.log('🔄 REFRESH: Request will include credentials:', true);
        console.log('🔄 REFRESH: CORS mode:', 'cors');
        console.log('🔄 REFRESH: Headers being sent:', headers);
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Always include HttpOnly cookies
        mode: 'cors', // Explicitly set CORS mode for cross-domain requests
      });

      console.log('🌐 HTTP: Response status:', response.status);

      // Handle 401 Unauthorized - attempt token refresh and retry
      if (response.status === 401 && accessToken) {
        console.log('🔄 HTTP: Received 401, attempting token refresh...');
        console.log('🔄 HTTP: Access token expired, using refresh token to get new one');
        
        try {
          // Import AuthService dynamically to avoid circular dependency
          const { AuthService } = await import('./api');
          const refreshResponse = await AuthService.refreshToken();
          
          console.log('✅ HTTP: Token refreshed successfully, retrying original request...');
          console.log('🔑 HTTP: New access token received, retrying with fresh token');
          
          // Retry the original request with new token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${refreshResponse.accessToken}`,
            },
            credentials: 'include',
            mode: 'cors',
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            console.error('❌ HTTP: Retry request failed even with fresh token:', {
              status: retryResponse.status,
              statusText: retryResponse.statusText,
              error: errorData
            });
            throw new AuthApiError(
              errorData?.message || `Request failed with status ${retryResponse.status}`,
              retryResponse.status,
              'REQUEST_FAILED'
            );
          }
          
          const retryData = await retryResponse.json().catch(() => retryResponse.text());
          console.log('✅ HTTP: Request successful after token refresh');
          console.log('🔄 HTTP: Token refresh and retry completed successfully');
          
          // Return both the data and the new token for the caller to update their state
          return {
            ...retryData,
            _newAccessToken: refreshResponse.accessToken
          } as T;
          
        } catch (refreshError) {
          console.log('❌ HTTP: Token refresh failed:', refreshError);
          
          // Handle specific refresh token errors based on API documentation
          if (refreshError instanceof AuthApiError) {
            if (refreshError.code === 'REFRESH_TOKEN_MISSING') {
              console.log('🍪 HTTP: Refresh token not provided (403)');
              console.log('💡 HTTP: This usually means sameSite="strict" blocks cross-domain cookies');
              throw new AuthApiError(
                'No refresh token available, please log in again',
                403,
                'REFRESH_TOKEN_MISSING'
              );
            } else if (refreshError.code === 'REFRESH_TOKEN_EXPIRED') {
              console.log('🍪 HTTP: Invalid refresh token (401)');
              console.log('💡 HTTP: Refresh token is expired or invalid');
              throw new AuthApiError(
                'Refresh token expired, please log in again',
                401,
                'REFRESH_TOKEN_EXPIRED'
              );
            }
          }
          
          // For any other refresh errors, treat as session expired
          console.log('❌ HTTP: Session expired, user needs to login again');
          throw new AuthApiError(
            'Session expired, please log in again',
            401,
            'TOKEN_REFRESH_FAILED'
          );
        }
      }

      let data: any;
      try {
        data = await response.json();
        console.log('🌐 HTTP: Response data:', data);
      } catch (parseError) {
        console.error('❌ HTTP: Failed to parse JSON response:', parseError);
        data = {
          error: `Invalid JSON response from server (${response.status})`,
          code: 'INVALID_JSON'
        };
      }

      if (!response.ok) {
        const error = data;
        const errorMessage = error?.error || error?.message || `HTTP error: ${response.statusText}`;
        const errorCode = error?.code?.toString() || response.status.toString();
        
        console.error('❌ HTTP: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          code: errorCode,
          fullError: error,
          url: url,
          requestMethod: options.method || 'GET',
          requestHeaders: options.headers,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseData: data
        });

        // Additional debugging for refresh token requests
        if (endpoint.includes('/auth/refresh')) {
          console.error('🍪 REFRESH ERROR: Detailed analysis:');
          console.error('🍪 REFRESH ERROR: Status:', response.status);
          console.error('🍪 REFRESH ERROR: Error message:', errorMessage);
          console.error('🍪 REFRESH ERROR: This usually means:');
          console.error('🍪 REFRESH ERROR: 1. Backend sameSite is "strict" (blocks cross-domain)');
          console.error('🍪 REFRESH ERROR: 2. HttpOnly cookie expired or not set');
          console.error('🍪 REFRESH ERROR: 3. CORS not allowing credentials');
          console.error('🍪 REFRESH ERROR: 4. Backend not receiving the cookie');
          console.error('🍪 REFRESH ERROR: 🔧 SOLUTION: Backend must set cookie with sameSite: "none"');
          console.error('🍪 REFRESH ERROR: 🔧 SOLUTION: Backend CORS must allow credentials from localhost:3000');
        }
        
        // Log additional debugging info
        console.error('❌ HTTP: Additional debugging info:', {
          isNetworkError: false,
          isServerError: response.status >= 500,
          isClientError: response.status >= 400 && response.status < 500,
          isAuthError: response.status === 401 || response.status === 403,
          contentType: response.headers.get('content-type'),
          cookies: typeof document !== 'undefined' ? document.cookie : 'server-side',
          responseText: data,
          errorObject: error
        });
        
        throw new AuthApiError(
          errorMessage,
          response.status,
          errorCode
        );
      }

      console.log('✅ HTTP: Request successful');
      return data as T;
    } catch (error) {
      console.error('❌ HTTP: Network/parsing error:', error);
      
      if (error instanceof AuthApiError) {
        throw error;
      }
      
      // Enhanced network error debugging
      console.error('❌ HTTP: Network error details:', {
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        url: url,
        method: options.method || 'GET',
        isFetchError: error instanceof TypeError,
        isAbortError: error instanceof DOMException,
        networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
        timestamp: new Date().toISOString()
      });
      
      throw new AuthApiError(
        'Network error or server unavailable',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, accessToken);
  }

  /**
   * POST request
   */
  static async post<T>(
    endpoint: string, 
    data?: any, 
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, accessToken);
  }

  /**
   * PUT request
   */
  static async put<T>(
    endpoint: string, 
    data?: any, 
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, accessToken);
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' }, accessToken);
  }

  /**
   * Test cookie configuration and CORS setup
   */
  static async testCookieConfiguration(): Promise<{
    cookiesAvailable: boolean;
    cookiesList: string[];
    domainInfo: any;
    corsTest: any;
  }> {
    const result = {
      cookiesAvailable: false,
      cookiesList: [] as string[],
      domainInfo: {},
      corsTest: {}
    };

    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        result.domainInfo = { error: 'Not in browser environment' };
        return result;
      }

      // Get current domain info
      result.domainInfo = {
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port
      };

      // Check available cookies
      result.cookiesAvailable = document.cookie.length > 0;
      result.cookiesList = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0);

      // Test CORS with credentials
      console.log('🧪 Testing CORS configuration...');
      try {
        const testResponse = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        result.corsTest = {
          status: testResponse.status,
          headers: Object.fromEntries(testResponse.headers.entries()),
          success: true
        };
      } catch (corsError) {
        result.corsTest = {
          error: corsError instanceof Error ? corsError.message : 'Unknown CORS error',
          success: false
        };
      }

    } catch (error) {
      console.error('❌ Cookie configuration test failed:', error);
    }

    return result;
  }

  /**
   * Test API connectivity with detailed debugging
   */
  static async testConnectivity(): Promise<{
    isReachable: boolean;
    status: number;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('🔍 HTTP: Testing connectivity to:', this.baseURL);
      console.log('🔍 HTTP: Current domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side');
      console.log('🔍 HTTP: Cookies available:', typeof document !== 'undefined' ? document.cookie : 'server-side');
      
      const testUrl = `${this.baseURL}/health`;
      console.log('🔍 HTTP: Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 HTTP: Health check response status:', response.status);
      console.log('🔍 HTTP: Health check response headers:', Object.fromEntries(response.headers.entries()));
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('🔍 HTTP: Health check response data:', responseData);
      } catch (parseError) {
        console.log('🔍 HTTP: Could not parse health check response as JSON');
      }
      
      return {
        isReachable: true,
        status: response.status,
        details: {
          url: testUrl,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        }
      };
    } catch (error) {
      console.error('🔍 HTTP: Connectivity test failed:', error);
      
      const errorDetails = {
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        isNetworkError: error instanceof TypeError,
        isCorsError: error instanceof TypeError && error.message.includes('CORS'),
        url: `${this.baseURL}/health`,
        timestamp: new Date().toISOString()
      };
      
      console.error('🔍 HTTP: Error details:', errorDetails);
      
      return {
        isReachable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails
      };
    }
  }
}

/**
 * Convenience functions for common API calls
 * 
 * These functions provide easy access to common API endpoints.
 * For authentication endpoints, use AuthService methods instead for better error handling.
 */
export const api = {
  // Auth endpoints (use AuthService methods for better error handling)
  auth: {
    login: (credentials: any) => HttpClient.post('/auth/login', credentials),
    register: (userData: any, adminToken?: string) => 
      HttpClient.post('/auth/register', userData, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      }),
    logout: (accessToken: string) => HttpClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    refresh: () => HttpClient.post('/auth/refresh'), // No body, uses HttpOnly cookie
    profile: (accessToken: string) => HttpClient.get('/auth/profile', {}, accessToken),
  },

  // Admin endpoints
  admin: {
    users: (accessToken: string) => HttpClient.get('/admin/users', {}, accessToken),
    createUser: (userData: any, accessToken: string) => 
      HttpClient.post('/admin/users', userData, {}, accessToken),
    updateUser: (id: number, userData: any, accessToken: string) => 
      HttpClient.put(`/admin/users/${id}`, userData, {}, accessToken),
    deleteUser: (id: number, accessToken: string) => 
      HttpClient.delete(`/admin/users/${id}`, {}, accessToken),
  },

  // Other endpoints can be added here
  health: () => HttpClient.get('/health'),
};

export default HttpClient;
