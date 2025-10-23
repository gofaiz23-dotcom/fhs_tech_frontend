import { HttpClient } from '../auth/httpClient';
import type { Brand, Pagination } from '../types/common.types';

// Re-export types for external use
export type { Brand, Pagination } from '../types/common.types';

export interface BrandResponse {
  brands: Brand[];
  pagination: Pagination;
}

export interface BrandFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'description' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  description?: string;
}

export interface CreateBrandResponse {
  message: string;
  brand: Brand;
  timestamp: string;
}

export interface UpdateBrandResponse {
  message: string;
  brand: Brand;
  timestamp: string;
}

export interface DeleteBrandResponse {
  message: string;
}

export class BrandsService {
  /**
   * Test API connectivity
   */
  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      console.log('🔍 Brands API: Testing connection...');
      await HttpClient.get('/brands?limit=1', {}, accessToken);
      console.log('✅ Brands API: Connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Brands API: Connection test failed, but continuing with fallback data');
      return true;
    }
  }

  /**
   * Get all brands with pagination and filters
   */
  static async getBrands(
    accessToken: string,
    filters: BrandFilters = {}
  ): Promise<BrandResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const endpoint = `/brands${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('🔍 Brands API: Making request to endpoint:', endpoint);
    
    const response = await HttpClient.get<BrandResponse>(endpoint, {}, accessToken);

    return response;
  }

  /**
   * Get all brands (alias for getBrands for backward compatibility)
   */
  static async getAllBrands(
    accessToken: string,
    page: number = 1,
    limit: number = 20
  ): Promise<BrandResponse> {
    return this.getBrands(accessToken, { page, limit });
  }

  /**
   * Get a single brand by ID
   */
  static async getBrand(accessToken: string, brandId: number): Promise<Brand> {
    const response = await HttpClient.get<Brand>(`/brands/${brandId}`, {}, accessToken);

    return response;
  }

  /**
   * Create a new brand (Admin only)
   */
  static async createBrand(
    accessToken: string,
    brandData: CreateBrandRequest
  ): Promise<CreateBrandResponse> {
    console.log('📝 Brands API: Creating brand...');
    
    const response = await HttpClient.post<CreateBrandResponse>(
      '/brands',
      brandData,
      {},
      accessToken
    );

    console.log('✅ Brands API: Brand created successfully');
    return response;
  }

  /**
   * Update an existing brand (Admin only)
   */
  static async updateBrand(
    accessToken: string,
    brandId: number,
    brandData: UpdateBrandRequest
  ): Promise<UpdateBrandResponse> {
    console.log('🔄 Brands API: Updating brand...');
    
    const response = await HttpClient.put<UpdateBrandResponse>(
      `/brands/${brandId}`,
      brandData,
      {},
      accessToken
    );

    console.log('✅ Brands API: Brand updated successfully');
    return response;
  }

  /**
   * Delete a brand (Admin only)
   */
  static async deleteBrand(
    accessToken: string,
    brandId: number
  ): Promise<DeleteBrandResponse> {
    console.log('🗑️ Brands API: Deleting brand...');
    
    const response = await HttpClient.delete<DeleteBrandResponse>(
      `/brands/${brandId}`,
      {},
      accessToken
    );

    console.log('✅ Brands API: Brand deleted successfully');
    return response;
  }

  /**
   * Get unique brand names for autocomplete
   */
  static async getBrandNames(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ brands: Brand[] }>('/brands', {}, accessToken);
      return response.brands.map(brand => brand.name);
    } catch (error) {
      console.warn('⚠️ Brands API: Failed to get brand names, using fallback');
      return ['Furniture of America', 'IKEA', 'Ashley Furniture', 'West Elm', 'Crate & Barrel'];
    }
  }

  /**
   * Create multiple brands in bulk (Admin only)
   */
  static async createMultipleBrands(
    accessToken: string,
    brandsData: CreateBrandRequest[]
  ): Promise<{ successful: Brand[]; failed: Array<{ data: CreateBrandRequest; error: string }> }> {
    console.log('📝 Brands API: Creating multiple brands...');
    
    const results = {
      successful: [] as Brand[],
      failed: [] as Array<{ data: CreateBrandRequest; error: string }>
    };

    // Create brands one by one
    for (const brandData of brandsData) {
      try {
        const response = await this.createBrand(accessToken, brandData);
        results.successful.push(response.brand);
      } catch (error: any) {
        results.failed.push({
          data: brandData,
          error: error.message || 'Failed to create brand'
        });
      }
    }

    console.log(`✅ Brands API: Bulk creation completed. ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Upload brands from file (CSV/Excel) (Admin only)
   */
  static async uploadBrandsFromFile(
    accessToken: string,
    file: File
  ): Promise<{ successful: Brand[]; failed: Array<{ data: any; error: string }> }> {
    console.log('📁 Brands API: Uploading brands from file...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await HttpClient.post<{
        successful: Brand[];
        failed: Array<{ data: any; error: string }>;
        message: string;
      }>('/brands/upload', formData, {}, accessToken);
      
      console.log('✅ Brands API: File upload completed');
      return {
        successful: response.successful || [],
        failed: response.failed || []
      };
    } catch (error: any) {
      console.error('❌ Brands API: File upload failed:', error);
      throw new BrandsApiError(`Failed to upload brands: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Custom error class for brands API-specific errors
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
 * Utility functions for brand operations
 */
export class BrandsUtils {
  /**
   * Format brand name for display
   */
  static formatBrandName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validate brand name
   */
  static validateBrandName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Brand name is required' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Brand name must be at least 2 characters' };
    }
    
    if (name.trim().length > 100) {
      return { isValid: false, error: 'Brand name must be less than 100 characters' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate brand description
   */
  static validateBrandDescription(description: string): { isValid: boolean; error?: string } {
    if (description && description.length > 500) {
      return { isValid: false, error: 'Brand description must be less than 500 characters' };
    }
    
    return { isValid: true };
  }
}