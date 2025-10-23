/**
 * Marketplaces API Service
 * 
 * This service handles all marketplace-related API calls including CRUD operations
 * and file uploads for bulk marketplace creation.
 * 
 * Base URL: http://localhost:5000/api
 */

import { ensureValidToken } from '../auth/api';

// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api';

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
 * Marketplace creation request
 */
export interface CreateMarketplaceRequest {
  name: string;
  description?: string;
}

/**
 * Multiple marketplaces creation request
 */
export interface CreateMultipleMarketplacesRequest {
  marketplaces: CreateMarketplaceRequest[];
}

/**
 * Marketplace update request
 */
export interface UpdateMarketplaceRequest {
  name?: string;
  description?: string;
}

/**
 * API response for marketplaces list
 */
export interface MarketplacesResponse {
  message: string;
  marketplaces: Marketplace[];
}

/**
 * API response for single marketplace
 */
export interface MarketplaceResponse {
  message: string;
  marketplace: Marketplace;
}

/**
 * API response for bulk creation
 */
export interface BulkCreateResponse {
  message: string;
  summary: {
    total: number;
    created: number;
    duplicates: number;
    errors: number;
  };
  results: {
    created: Marketplace[];
    duplicates: Array<{
      name: string;
      error: string;
    }>;
    errors: Array<{
      row: number;
      error: string;
    }>;
  };
}

/**
 * Custom error class for marketplaces API
 */
export class MarketplacesApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'MarketplacesApiError';
  }
}

/**
 * Generic marketplaces API request handler with authentication and token refresh
 */
async function marketplacesApiRequest<T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  try {
    if (!accessToken) {
      throw new MarketplacesApiError('Authentication required', 401, 'NO_TOKEN');
    }

    // Ensure token is valid and refresh if needed
    const validToken = await ensureValidToken(accessToken);
    if (!validToken) {
      throw new MarketplacesApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
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
      console.error('❌ Marketplaces API: Failed to parse JSON response:', parseError);
      // If JSON parsing fails, create a fallback error object
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
            throw new MarketplacesApiError(
              retryData.error || 'Request failed after token refresh',
              retryResponse.status,
              retryData.code?.toString()
            );
          }
          
          return retryData as T;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          throw new MarketplacesApiError(
            'Session expired. Please log in again.',
            401,
            'TOKEN_REFRESH_FAILED'
          );
        }
      }
      
      console.error('❌ Marketplaces API: Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: error?.error || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      });
      
      throw new MarketplacesApiError(
        error.error || 'A marketplaces API error occurred',
        response.status,
        error.code?.toString()
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof MarketplacesApiError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new MarketplacesApiError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Marketplaces Service
 */
export class MarketplacesService {
  /**
   * Get all marketplaces
   * 
   * @param accessToken - User access token
   * @returns Promise<MarketplacesResponse> - List of marketplaces
   */
  static async getAllMarketplaces(accessToken: string): Promise<MarketplacesResponse> {
    console.log('🔍 Fetching marketplaces from: /api/marketplaces');
    
    return marketplacesApiRequest<MarketplacesResponse>(`${API_BASE_URL}/marketplaces`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get a specific marketplace by ID
   * 
   * @param marketplaceId - Marketplace ID
   * @param accessToken - User access token
   * @returns Promise<MarketplaceResponse> - Marketplace details
   */
  static async getMarketplaceById(marketplaceId: number, accessToken: string): Promise<MarketplaceResponse> {
    console.log(`🔍 Fetching marketplace ${marketplaceId} from: /api/marketplaces/${marketplaceId}`);
    
    return marketplacesApiRequest<MarketplaceResponse>(`${API_BASE_URL}/marketplaces/${marketplaceId}`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Create a single marketplace (Admin only)
   * 
   * @param marketplaceData - Marketplace data
   * @param accessToken - Admin access token
   * @returns Promise<MarketplaceResponse> - Created marketplace
   */
  static async createMarketplace(marketplaceData: CreateMarketplaceRequest, accessToken: string): Promise<MarketplaceResponse> {
    console.log('🔍 Creating marketplace:', marketplaceData);
    
    return marketplacesApiRequest<MarketplaceResponse>(`${API_BASE_URL}/marketplaces`, {
      method: 'POST',
      body: JSON.stringify(marketplaceData),
    }, accessToken);
  }

  /**
   * Create multiple marketplaces (Admin only)
   * 
   * @param marketplacesData - Multiple marketplaces data
   * @param accessToken - Admin access token
   * @returns Promise<BulkCreateResponse> - Creation results
   */
  static async createMultipleMarketplaces(marketplacesData: CreateMultipleMarketplacesRequest, accessToken: string): Promise<BulkCreateResponse> {
    console.log('🔍 Creating multiple marketplaces:', marketplacesData);
    
    return marketplacesApiRequest<BulkCreateResponse>(`${API_BASE_URL}/marketplaces`, {
      method: 'POST',
      body: JSON.stringify(marketplacesData),
    }, accessToken);
  }

  /**
   * Update a marketplace (Admin only)
   * 
   * @param marketplaceId - Marketplace ID
   * @param marketplaceData - Updated marketplace data
   * @param accessToken - Admin access token
   * @returns Promise<MarketplaceResponse> - Updated marketplace
   */
  static async updateMarketplace(marketplaceId: number, marketplaceData: UpdateMarketplaceRequest, accessToken: string): Promise<MarketplaceResponse> {
    console.log(`🔍 Updating marketplace ${marketplaceId}:`, marketplaceData);
    
    return marketplacesApiRequest<MarketplaceResponse>(`${API_BASE_URL}/marketplaces/${marketplaceId}`, {
      method: 'PUT',
      body: JSON.stringify(marketplaceData),
    }, accessToken);
  }

  /**
   * Delete a marketplace (Admin only)
   * 
   * @param marketplaceId - Marketplace ID
   * @param accessToken - Admin access token
   * @returns Promise<{message: string}> - Deletion confirmation
   */
  static async deleteMarketplace(marketplaceId: number, accessToken: string): Promise<{message: string}> {
    console.log(`🔍 Deleting marketplace ${marketplaceId}`);
    
    return marketplacesApiRequest<{message: string}>(`${API_BASE_URL}/marketplaces/${marketplaceId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  /**
   * Upload marketplaces from file (Admin only)
   * 
   * @param file - CSV or Excel file
   * @param accessToken - Admin access token
   * @returns Promise<BulkCreateResponse> - Upload results
   */
  static async uploadMarketplacesFromFile(file: File, accessToken: string): Promise<BulkCreateResponse> {
    console.log('🔍 Uploading marketplaces from file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      if (!accessToken) {
        throw new MarketplacesApiError('Authentication required', 401, 'NO_TOKEN');
      }

      // Ensure token is valid and refresh if needed
      const validToken = await ensureValidToken(accessToken);
      if (!validToken) {
        throw new MarketplacesApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
      }

      console.log('📤 Uploading file with multipart/form-data:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(`${API_BASE_URL}/marketplaces`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${validToken}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
          // Browser will automatically set: Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
        },
        credentials: 'include',
      });

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Marketplaces API: Failed to parse JSON response:', parseError);
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
            const retryResponse = await fetch(`${API_BASE_URL}/marketplaces`, {
              method: 'POST',
              body: formData,
              headers: {
                'Authorization': `Bearer ${refreshResponse.accessToken}`,
                // Don't set Content-Type for FormData, let browser set it with boundary
              },
              credentials: 'include',
            });

            const retryData = await retryResponse.json();
            
            if (!retryResponse.ok) {
              throw new MarketplacesApiError(
                retryData.error || 'Request failed after token refresh',
                retryResponse.status,
                retryData.code?.toString()
              );
            }
            
            return retryData as BulkCreateResponse;
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            throw new MarketplacesApiError(
              'Session expired. Please log in again.',
              401,
              'TOKEN_REFRESH_FAILED'
            );
          }
        }
        
        console.error('❌ Marketplaces API: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: `${API_BASE_URL}/marketplaces`,
          error: error?.error || 'Unknown error',
          code: error?.code || 'UNKNOWN'
        });
        
        throw new MarketplacesApiError(
          error.error || 'A marketplaces API error occurred',
          response.status,
          error.code?.toString()
        );
      }

      return data as BulkCreateResponse;
    } catch (error) {
      if (error instanceof MarketplacesApiError) {
        throw error;
      }
      
      // Handle network or other errors
      throw new MarketplacesApiError(
        'Network error or server unavailable',
        0,
        'NETWORK_ERROR'
      );
    }
  }
}

/**
 * Utility functions for marketplaces
 */
export class MarketplacesUtils {
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
