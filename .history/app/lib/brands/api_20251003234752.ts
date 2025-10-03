/**
 * Brands API Service
 * 
 * This service handles all brand-related API calls including CRUD operations
 * and file uploads for bulk brand creation.
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
 * Brand creation request
 */
export interface CreateBrandRequest {
  name: string;
  description?: string;
}

/**
 * Multiple brands creation request
 */
export interface CreateMultipleBrandsRequest {
  brands: CreateBrandRequest[];
}

/**
 * Brand update request
 */
export interface UpdateBrandRequest {
  name?: string;
  description?: string;
}

/**
 * API response for brands list
 */
export interface BrandsResponse {
  message: string;
  brands: Brand[];
}

/**
 * API response for single brand
 */
export interface BrandResponse {
  message: string;
  brand: Brand;
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
    created: Brand[];
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
 * Custom error class for brands API
 */
export class BrandsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'BrandsApiError';
  }
}

/**
 * Generic brands API request handler with authentication and token refresh
 */
async function brandsApiRequest<T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  try {
    if (!accessToken) {
      throw new BrandsApiError('Authentication required', 401, 'NO_TOKEN');
    }

    // Ensure token is valid and refresh if needed
    const validToken = await ensureValidToken(accessToken);
    if (!validToken) {
      throw new BrandsApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
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
      console.error('❌ Brands API: Failed to parse JSON response:', parseError);
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
            throw new BrandsApiError(
              retryData.error || 'Request failed after token refresh',
              retryResponse.status,
              retryData.code?.toString()
            );
          }
          
          return retryData as T;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          throw new BrandsApiError(
            'Session expired. Please log in again.',
            401,
            'TOKEN_REFRESH_FAILED'
          );
        }
      }
      
      console.error('❌ Brands API: Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: error?.error || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      });
      
      throw new BrandsApiError(
        error.error || 'A brands API error occurred',
        response.status,
        error.code?.toString()
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof BrandsApiError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new BrandsApiError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Brands Service
 */
export class BrandsService {
  /**
   * Get all brands
   * 
   * @param accessToken - User access token
   * @returns Promise<BrandsResponse> - List of brands
   */
  static async getAllBrands(accessToken: string): Promise<BrandsResponse> {
    console.log('🔍 Fetching brands from: /api/brands');
    
    return brandsApiRequest<BrandsResponse>(`${API_BASE_URL}/brands`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get a specific brand by ID
   * 
   * @param brandId - Brand ID
   * @param accessToken - User access token
   * @returns Promise<BrandResponse> - Brand details
   */
  static async getBrandById(brandId: number, accessToken: string): Promise<BrandResponse> {
    console.log(`🔍 Fetching brand ${brandId} from: /api/brands/${brandId}`);
    
    return brandsApiRequest<BrandResponse>(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Create a single brand (Admin only)
   * 
   * @param brandData - Brand data
   * @param accessToken - Admin access token
   * @returns Promise<BrandResponse> - Created brand
   */
  static async createBrand(brandData: CreateBrandRequest, accessToken: string): Promise<BrandResponse> {
    console.log('🔍 Creating brand:', brandData);
    
    return brandsApiRequest<BrandResponse>(`${API_BASE_URL}/brands`, {
      method: 'POST',
      body: JSON.stringify(brandData),
    }, accessToken);
  }

  /**
   * Create multiple brands (Admin only)
   * 
   * @param brandsData - Multiple brands data
   * @param accessToken - Admin access token
   * @returns Promise<BulkCreateResponse> - Creation results
   */
  static async createMultipleBrands(brandsData: CreateMultipleBrandsRequest, accessToken: string): Promise<BulkCreateResponse> {
    console.log('🔍 Creating multiple brands:', brandsData);
    
    return brandsApiRequest<BulkCreateResponse>(`${API_BASE_URL}/brands`, {
      method: 'POST',
      body: JSON.stringify(brandsData),
    }, accessToken);
  }

  /**
   * Update a brand (Admin only)
   * 
   * @param brandId - Brand ID
   * @param brandData - Updated brand data
   * @param accessToken - Admin access token
   * @returns Promise<BrandResponse> - Updated brand
   */
  static async updateBrand(brandId: number, brandData: UpdateBrandRequest, accessToken: string): Promise<BrandResponse> {
    console.log(`🔍 Updating brand ${brandId}:`, brandData);
    
    return brandsApiRequest<BrandResponse>(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    }, accessToken);
  }

  /**
   * Delete a brand (Admin only)
   * 
   * @param brandId - Brand ID
   * @param accessToken - Admin access token
   * @returns Promise<{message: string}> - Deletion confirmation
   */
  static async deleteBrand(brandId: number, accessToken: string): Promise<{message: string}> {
    console.log(`🔍 Deleting brand ${brandId}`);
    
    return brandsApiRequest<{message: string}>(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  /**
   * Upload brands from file (Admin only)
   * 
   * @param file - CSV or Excel file
   * @param accessToken - Admin access token
   * @returns Promise<BulkCreateResponse> - Upload results
   */
  static async uploadBrandsFromFile(file: File, accessToken: string): Promise<BulkCreateResponse> {
    console.log('🔍 Uploading brands from file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      if (!accessToken) {
        throw new BrandsApiError('Authentication required', 401, 'NO_TOKEN');
      }

      // Ensure token is valid and refresh if needed
      const validToken = await ensureValidToken(accessToken);
      if (!validToken) {
        throw new BrandsApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
      }

      console.log('📤 Uploading file with multipart/form-data:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(`${API_BASE_URL}/brands`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${validToken}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
          // Browser will automatically set: Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
        },
        credentials: 'include',
      });

      const data = await response.json();

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
            const retryResponse = await fetch(`${API_BASE_URL}/brands`, {
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
              throw new BrandsApiError(
                retryData.error || 'Request failed after token refresh',
                retryResponse.status,
                retryData.code?.toString()
              );
            }
            
            return retryData as BulkCreateResponse;
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            throw new BrandsApiError(
              'Session expired. Please log in again.',
              401,
              'TOKEN_REFRESH_FAILED'
            );
          }
        }
        
        throw new BrandsApiError(
          error.error || 'A brands API error occurred',
          response.status,
          error.code?.toString()
        );
      }

      return data as BulkCreateResponse;
    } catch (error) {
      if (error instanceof BrandsApiError) {
        throw error;
      }
      
      // Handle network or other errors
      throw new BrandsApiError(
        'Network error or server unavailable',
        0,
        'NETWORK_ERROR'
      );
    }
  }
}

/**
 * Utility functions for brands
 */
export class BrandsUtils {
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
