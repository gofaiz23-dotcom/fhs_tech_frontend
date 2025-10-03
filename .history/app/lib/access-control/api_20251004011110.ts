/**
 * Access Control API Service
 * 
 * This service handles all access control related API calls including
 * fetching brands, marketplaces, shipping platforms, and toggling user access.
 * 
 * Base URL: http://192.168.0.23:5000/api
 */

import { ensureValidToken } from '../auth/api';

// Base API configuration
const API_BASE_URL = 'http://192.168.0.23:5000/api';

/**
 * Brand interface
 */
export interface Brand {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Marketplace interface
 */
export interface Marketplace {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shipping Platform interface
 */
export interface ShippingPlatform {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response for brands list
 */
export interface BrandsResponse {
  message: string;
  brands: Brand[];
}

/**
 * API response for marketplaces list
 */
export interface MarketplacesResponse {
  message: string;
  marketplaces: Marketplace[];
}

/**
 * API response for shipping platforms list
 */
export interface ShippingPlatformsResponse {
  message: string;
  shipping: ShippingPlatform[];
}

/**
 * Toggle response
 */
export interface ToggleResponse {
  message: string;
  success: boolean;
}

/**
 * Custom error class for access control API
 */
export class AccessControlApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AccessControlApiError';
  }
}

/**
 * Generic access control API request handler with authentication and token refresh
 */
async function accessControlApiRequest<T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  try {
    if (!accessToken) {
      throw new AccessControlApiError('Authentication required', 401, 'NO_TOKEN');
    }

    // Ensure token is valid and refresh if needed
    const validToken = await ensureValidToken(accessToken);
    if (!validToken) {
      throw new AccessControlApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`,
        ...options.headers,
      },
      credentials: 'include',
    });

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Access Control API: Failed to parse JSON response:', parseError);
      data = {
        error: `Invalid JSON response from server (${response.status})`,
        code: 'INVALID_JSON'
      };
    }

    if (!response.ok) {
      const error = data as any;
      
      // Handle token expiration specifically
      if (response.status === 401 && (error.error?.includes('expired') || error.error?.includes('invalid'))) {
        console.log('🔄 Token expired, attempting refresh...');
        
        try {
          // Try to refresh the token
          const { AuthService } = await import('../auth/api');
          const refreshResponse = await AuthService.refreshToken();
          console.log('✅ Token refreshed successfully, retrying request...');
          
          // Retry the request with the new token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshResponse.accessToken}`,
              ...options.headers,
            },
            credentials: 'include',
          });

          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new AccessControlApiError(
              retryData.error || 'Request failed after token refresh',
              retryResponse.status,
              retryData.code?.toString()
            );
          }
          
          return retryData as T;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          throw new AccessControlApiError(
            'Session expired. Please log in again.',
            401,
            'TOKEN_REFRESH_FAILED'
          );
        }
      }
      
      console.error('❌ Access Control API: Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: error?.error || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      });
      
      throw new AccessControlApiError(
        error.error || 'An access control API error occurred',
        response.status,
        error.code?.toString()
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof AccessControlApiError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new AccessControlApiError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Access Control Service
 */
export class AccessControlService {
  /**
   * Get all brands
   * 
   * @param accessToken - User access token
   * @returns Promise<BrandsResponse> - List of brands
   */
  static async getBrands(accessToken: string): Promise<BrandsResponse> {
    console.log('🔍 Fetching brands from: /api/brands');
    
    return accessControlApiRequest<BrandsResponse>(`${API_BASE_URL}/brands`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get all marketplaces
   * 
   * @param accessToken - User access token
   * @returns Promise<MarketplacesResponse> - List of marketplaces
   */
  static async getMarketplaces(accessToken: string): Promise<MarketplacesResponse> {
    console.log('🔍 Fetching marketplaces from: /api/marketplaces');
    
    return accessControlApiRequest<MarketplacesResponse>(`${API_BASE_URL}/marketplaces`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get all shipping platforms
   * 
   * @param accessToken - User access token
   * @returns Promise<ShippingPlatformsResponse> - List of shipping platforms
   */
  static async getShippingPlatforms(accessToken: string): Promise<ShippingPlatformsResponse> {
    console.log('🔍 Fetching shipping platforms from: /api/shipping');
    
    return accessControlApiRequest<ShippingPlatformsResponse>(`${API_BASE_URL}/shipping`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Toggle marketplace access for a user
   * 
   * @param userId - User ID
   * @param marketplaceId - Marketplace ID
   * @param accessToken - User access token
   * @returns Promise<ToggleResponse> - Toggle result
   */
  static async toggleMarketplaceAccess(
    userId: string, 
    marketplaceId: number, 
    accessToken: string
  ): Promise<ToggleResponse> {
    console.log(`🔍 Toggling marketplace access for user ${userId}, marketplace ${marketplaceId}`);
    
    return accessControlApiRequest<ToggleResponse>(
      `${API_BASE_URL}/users/${userId}/marketplaces/${marketplaceId}/toggle`, 
      {
        method: 'POST',
      }, 
      accessToken
    );
  }

  /**
   * Toggle brand access for a user
   * 
   * @param userId - User ID
   * @param brandId - Brand ID
   * @param accessToken - User access token
   * @returns Promise<ToggleResponse> - Toggle result
   */
  static async toggleBrandAccess(
    userId: string, 
    brandId: number, 
    accessToken: string
  ): Promise<ToggleResponse> {
    console.log(`🔍 Toggling brand access for user ${userId}, brand ${brandId}`);
    
    return accessControlApiRequest<ToggleResponse>(
      `${API_BASE_URL}/users/${userId}/brands/${brandId}/toggle`, 
      {
        method: 'POST',
      }, 
      accessToken
    );
  }

  /**
   * Toggle shipping platform access for a user
   * 
   * @param userId - User ID
   * @param shippingId - Shipping platform ID
   * @param accessToken - User access token
   * @returns Promise<ToggleResponse> - Toggle result
   */
  static async toggleShippingAccess(
    userId: string, 
    shippingId: number, 
    accessToken: string
  ): Promise<ToggleResponse> {
    console.log(`🔍 Toggling shipping access for user ${userId}, shipping ${shippingId}`);
    
    return accessControlApiRequest<ToggleResponse>(
      `${API_BASE_URL}/users/${userId}/shipping/${shippingId}/toggle`, 
      {
        method: 'POST',
      }, 
      accessToken
    );
  }
}

/**
 * Utility functions for access control
 */
export class AccessControlUtils {
  /**
   * Get brand color based on name
   */
  static getBrandColor(name: string): string {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-gray-600'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Get marketplace color based on name
   */
  static getMarketplaceColor(name: string): string {
    const colors = [
      'bg-orange-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-gray-600'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Get shipping platform color based on name
   */
  static getShippingColor(name: string): string {
    const colors = [
      'bg-purple-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-gray-600'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}
