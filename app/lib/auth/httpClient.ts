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
   * Make an authenticated HTTP request using HttpOnly cookies
   * 
   * @param endpoint - API endpoint (without base URL)
   * @param options - Fetch options
   * @returns Promise with parsed JSON response
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
      
      // Check if this is a refresh token request and log additional details
      if (endpoint.includes('/auth/refresh')) {
        console.log('🔄 REFRESH: This is a refresh token request');
        console.log('🔄 REFRESH: Document cookies:', typeof document !== 'undefined' ? document.cookie : 'server-side');
        console.log('🔄 REFRESH: All cookies parsed:', typeof document !== 'undefined' ? 
          document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0) : 'server-side');
        
        // Check for refresh token specifically
        const hasRefreshToken = typeof document !== 'undefined' && 
          (document.cookie.includes('refreshToken') || 
           document.cookie.includes('refresh_token'));
        console.log('🔄 REFRESH: Has refresh token cookie:', hasRefreshToken);
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Always include HttpOnly cookies
      });

      console.log('🌐 HTTP: Response status:', response.status);
      console.log('🌐 HTTP: Response headers:', Object.fromEntries(response.headers.entries()));

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
  static async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T>(
    endpoint: string, 
    data?: any, 
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T>(
    endpoint: string, 
    data?: any, 
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
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
 */
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: any) => HttpClient.post('/auth/login', credentials),
    register: (userData: any) => HttpClient.post('/auth/register', userData),
    logout: () => HttpClient.post('/auth/logout'),
    refresh: () => HttpClient.post('/auth/refresh'),
    profile: () => HttpClient.get('/auth/profile'),
  },

  // Admin endpoints
  admin: {
    users: () => HttpClient.get('/admin/users'),
    createUser: (userData: any) => HttpClient.post('/admin/users', userData),
    updateUser: (id: number, userData: any) => HttpClient.put(`/admin/users/${id}`, userData),
    deleteUser: (id: number) => HttpClient.delete(`/admin/users/${id}`),
  },

  // Other endpoints can be added here
  health: () => HttpClient.get('/health'),
};

export default HttpClient;
