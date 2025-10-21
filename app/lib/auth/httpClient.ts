/**
 * HTTP Client with Automatic HttpOnly Cookie Authentication
 * 
 * Clean, efficient HTTP client that handles authentication using HttpOnly cookies.
 * The backend manages refresh tokens via HttpOnly cookies, so the frontend
 * doesn't need to manage tokens directly.
 */

import { AuthApiError } from './api';
import { API_CONFIG } from '../config/api.config';

/**
 * HTTP Client with automatic cookie-based authentication
 */
export class HttpClient {
  private static baseURL = API_CONFIG.BASE_URL;

  /**
   * Make an authenticated HTTP request with automatic token refresh on 401
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      console.log('🌐 HTTP Request:', {
        method: options.method || 'GET',
        url,
        hasToken: !!accessToken
      });

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
      });
      
      console.log('📥 HTTP Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Handle 401 Unauthorized - attempt token refresh and retry
      if (response.status === 401 && accessToken) {
        try {
          const { AuthService } = await import('./api');
          const refreshResponse = await AuthService.refreshToken();
          
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
          
          const retryData = await retryResponse.json().catch(() => retryResponse.text());
          
          // Return data with new token for state updates
          return {
            ...retryData,
            _newAccessToken: refreshResponse.accessToken
          } as T;
          
        } catch (refreshError) {
          if (refreshError instanceof AuthApiError) {
            if (refreshError.code === 'REFRESH_TOKEN_MISSING') {
              throw new AuthApiError(
                'No refresh token available, please log in again',
                403,
                'REFRESH_TOKEN_MISSING'
              );
            } else if (refreshError.code === 'REFRESH_TOKEN_EXPIRED') {
              throw new AuthApiError(
                'Refresh token expired, please log in again',
                401,
                'REFRESH_TOKEN_EXPIRED'
              );
            }
          }
          
          throw new AuthApiError(
            'Session expired, please log in again',
            401,
            'TOKEN_REFRESH_FAILED'
          );
        }
      }

      // Parse response
      let data: any;
      try {
        data = await response.json();
        console.log('📦 Response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        data = {
          error: `Invalid JSON response from server (${response.status})`,
          code: 'INVALID_JSON'
        };
      }

      if (!response.ok) {
        const error = data || {};
        const errorMessage = error?.error || error?.message || `HTTP error: ${response.statusText}` || 'Unknown error';
        const errorCode = error?.code?.toString() || response.status.toString();
        
        // Suppress error logging for expected errors
        const isExpected404 = response.status === 404 && (
          endpoint.includes('/products/categories') ||
          endpoint.includes('/products/brands') ||
          endpoint.includes('/products/group-skus') ||
          endpoint.includes('/products/sub-skus') ||
          endpoint.includes('/products/collections') ||
          endpoint.includes('/products/ship-types') ||
          endpoint.includes('/products/single-set-items')
        );
        
        // Suppress refresh token errors (expected when no refresh token cookie exists)
        const isExpectedRefreshError = endpoint.includes('/auth/refresh') && 
          (response.status === 401 || response.status === 403);
        
        if (!isExpected404 && !isExpectedRefreshError) {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorCode,
            fullError: error
          });
        }
        
        throw new AuthApiError(errorMessage, response.status, errorCode);
      }

      return data as T;
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }
      
      console.error('❌ Network Error:', error);
      console.error('Request details:', { url, method: options.method || 'GET' });
      
      throw new AuthApiError(
        `Network error or server unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Test API connectivity
   */
  static async testConnectivity(): Promise<{
    isReachable: boolean;
    status: number;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Testing API connectivity to:', `${this.baseURL}/health`);
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json().catch(() => ({}));
      
      console.log('✅ API connectivity test result:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      return {
        isReachable: true,
        status: response.status,
        message: data?.message || 'API is reachable'
      };
    } catch (error) {
      console.error('❌ API connectivity test failed:', error);
      
      return {
        isReachable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get the current base URL
   */
  static getBaseURL(): string {
    return this.baseURL;
  }
}

/**
 * Convenience functions for common API calls
 */
export const api = {
  auth: {
    login: (credentials: any) => HttpClient.post('/auth/login', credentials),
    register: (userData: any, adminToken?: string) => 
      HttpClient.post('/auth/register', userData, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      }),
    logout: (accessToken: string) => HttpClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    refresh: () => HttpClient.post('/auth/refresh'),
    profile: (accessToken: string) => HttpClient.get('/auth/profile', {}, accessToken),
  },

  admin: {
    users: (accessToken: string) => HttpClient.get('/admin/users', {}, accessToken),
    createUser: (userData: any, accessToken: string) => 
      HttpClient.post('/admin/users', userData, {}, accessToken),
    updateUser: (id: number, userData: any, accessToken: string) => 
      HttpClient.put(`/admin/users/${id}`, userData, {}, accessToken),
    deleteUser: (id: number, accessToken: string) => 
      HttpClient.delete(`/admin/users/${id}`, {}, accessToken),
  },

  health: () => HttpClient.get('/health'),
};

export default HttpClient;