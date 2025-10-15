/**
 * HTTP Client with Automatic HttpOnly Cookie Authentication
 * 
 * Clean, efficient HTTP client that handles authentication using HttpOnly cookies.
 * The backend manages refresh tokens via HttpOnly cookies, so the frontend
 * doesn't need to manage tokens directly.
 */

import { AuthApiError } from './api';

// Base API configuration
const API_BASE_URL = 'http://192.168.0.23:5000/api';

/**
 * HTTP Client with automatic cookie-based authentication
 */
export class HttpClient {
  private static baseURL = API_BASE_URL;

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

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
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
      } catch (parseError) {
        data = {
          error: `Invalid JSON response from server (${response.status})`,
          code: 'INVALID_JSON'
        };
      }

      if (!response.ok) {
        const error = data || {};
        const errorMessage = error?.error || error?.message || `HTTP error: ${response.statusText}` || 'Unknown error';
        const errorCode = error?.code?.toString() || response.status.toString();
        
        throw new AuthApiError(errorMessage, response.status, errorCode);
      }

      return data as T;
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }
      
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
   * Test API connectivity
   */
  static async testConnectivity(): Promise<{
    isReachable: boolean;
    status: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      return {
        isReachable: true,
        status: response.status,
      };
    } catch (error) {
      return {
        isReachable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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