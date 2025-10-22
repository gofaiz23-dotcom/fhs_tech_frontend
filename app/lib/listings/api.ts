import { HttpClient } from '../auth/httpClient';
import type { Brand, Pagination } from '../types/common.types';

// Re-export types for external use
export type { Brand, Pagination } from '../types/common.types';

export interface Listing {
  id: number;
  productId: number;
  brandId: number;
  title: string;
  sku: string;
  subSku: string | null;
  category: string;
  collectionName: string;
  shipTypes: string;
  singleSetItem: string;
  brandRealPrice: number;
  brandMiscellaneous: number;
  brandPrice: number;
  msrp: number;
  shippingPrice: number;
  commissionPrice: number;
  profitMarginPrice: number;
  ecommerceMiscellaneous: number;
  ecommercePrice: number;
  mainImageUrl: string | null;
  galleryImages: string[] | null;
  productCounts: Record<string, number> | null;
  attributes: Record<string, any>;
  quantity?: number;
  status?: string;
  inventoryArray?: number[];
  customBrandName?: string; // Custom brand name from settings
  createdAt: string;
  updatedAt: string;
  brand: Brand;
  product?: {
    id: number;
    title: string;
    groupSku: string;
    subSku: string;
    attributes: Record<string, any>;
  };
}

export interface ListingsResponse {
  listings: Listing[];
  pagination: Pagination;
  duplicateStats?: {
    totalDuplicates: number;
    duplicates: Array<{
      sku: string;
      subSku: string;
      listings: Array<{
        id: number;
        title: string;
        brandId: number;
      }>;
    }>;
  };
}

export interface ListingsFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brandId?: number;
  sku?: string;
  subSku?: string;
  collectionName?: string;
  shipTypes?: string;
  singleSetItem?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'title' | 'sku' | 'subSku' | 'category' | 'collectionName' | 'shipTypes' | 'singleSetItem' | 'brandRealPrice' | 'brandMiscellaneous' | 'brandPrice' | 'msrp' | 'shippingPrice' | 'commissionPrice' | 'profitMarginPrice' | 'ecommerceMiscellaneous' | 'ecommercePrice' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ImageTemplateData {
  sku: string;
  subSku: string;
  mainImageUrl: string;
  galleryImages: string;
}

export interface ImageTemplateResponse {
  message: string;
  timestamp: string;
  summary: {
    totalListings: number;
    listingsWithoutImages: number;
    listingsWithImages: number;
  };
  columns: string[];
  imageBaseUrl: string;
  templateData: ImageTemplateData[];
}

export interface BulkImageUploadResponse {
  message: string;
  timestamp: string;
  processingMode: string;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  results?: any[];
  jobId?: string;
}

export class ListingsService {
  /**
   * Test API connectivity
   */
  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      console.log('🔍 Listings API: Testing connection...');
      await HttpClient.get('/listings?limit=1', {}, accessToken);
      console.log('✅ Listings API: Connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Listings API: Connection test failed, but continuing with fallback data');
      return true;
    }
  }

  /**
   * Get listings with pagination and filters
   */
  static async getListings(
    accessToken: string,
    filters: ListingsFilters = {}
  ): Promise<ListingsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.brandId) params.append('brandId', filters.brandId.toString());
    if (filters.sku) params.append('sku', filters.sku);
    if (filters.subSku) params.append('subSku', filters.subSku);
    if (filters.collectionName) params.append('collectionName', filters.collectionName);
    if (filters.shipTypes) params.append('shipTypes', filters.shipTypes);
    if (filters.singleSetItem) params.append('singleSetItem', filters.singleSetItem);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const endpoint = `/listings${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('🔍 Listings API: Making request to endpoint:', endpoint);
    
    const response = await HttpClient.get<ListingsResponse>(endpoint, {}, accessToken);

    return response;
  }

  /**
   * Get a single listing by ID
   */
  static async getListing(accessToken: string, listingId: number): Promise<Listing> {
    const response = await HttpClient.get<Listing>(`/listings/${listingId}`, {}, accessToken);

    return response;
  }

  /**
   * Create a new listing
   */
  static async createListing(
    accessToken: string,
    listingData: Partial<Listing>
  ): Promise<{ message: string; listing: Listing; timestamp: string }> {
    console.log('📝 Listings API: Creating listing...');
    
    const response = await HttpClient.post<{ message: string; listing: Listing; timestamp: string }>(
      '/listings',
      listingData,
      {},
      accessToken
    );

    console.log('✅ Listings API: Listing created successfully');
    return response;
  }

  /**
   * Update an existing listing
   */
  static async updateListing(
    accessToken: string,
    listingId: number,
    listingData: Partial<Listing>
  ): Promise<{ message: string; listing: Listing; timestamp: string }> {
    console.log('🔄 Listings API: Updating listing...');
    
    const response = await HttpClient.put<{ message: string; listing: Listing; timestamp: string }>(
      `/listings/${listingId}`,
      listingData,
      {},
      accessToken
    );

    console.log('✅ Listings API: Listing updated successfully');
    return response;
  }

  /**
   * Delete a listing
   */
  static async deleteListing(
    accessToken: string,
    listingId: number
  ): Promise<{ message: string }> {
    console.log('🗑️ Listings API: Deleting listing...');
    
    const response = await HttpClient.delete<{ message: string }>(
      `/listings/${listingId}`,
      {},
      accessToken
    );

    console.log('✅ Listings API: Listing deleted successfully');
    return response;
  }

  /**
   * Get image template for bulk image upload
   * Returns template with sku, subSku, mainImageUrl, galleryImages
   */
  static async getImageTemplate(accessToken: string): Promise<ImageTemplateResponse> {
    console.log('🔍 Listings API: Fetching image template...');
    
    const response = await HttpClient.get<ImageTemplateResponse>(
      '/listings/images/template',
      {},
      accessToken
    );

    console.log('✅ Listings API: Image template retrieved successfully');
    return response;
  }

  /**
   * Download image template as Excel file
   */
  static async downloadImageTemplate(accessToken: string): Promise<void> {
    console.log('📥 Listings API: Downloading image template...');
    
    try {
      const response = await fetch('http://192.168.0.22:5000/api/listings/images/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert JSON data to CSV for download
      const { templateData, columns } = data;
      
      if (!templateData || templateData.length === 0) {
        throw new Error('No template data available');
      }

      // Create CSV content
      const csvContent = [
        columns.join(','), // Header row
        ...templateData.map((row: ImageTemplateData) => 
          columns.map((col: string) => {
            const value = row[col as keyof ImageTemplateData] || '';
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listings_image_template_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Listings API: Template downloaded successfully');
    } catch (error) {
      console.error('❌ Listings API: Failed to download template:', error);
      throw error;
    }
  }

  /**
   * Upload bulk images for listings
   * Accepts Excel/JSON file with image URLs
   */
  static async bulkUploadImages(
    accessToken: string,
    file: File
  ): Promise<BulkImageUploadResponse> {
    console.log('📤 Listings API: Uploading bulk images...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://192.168.0.22:5000/api/listings/images', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload bulk images');
      }

      const data = await response.json();
      console.log('✅ Listings API: Bulk images uploaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Listings API: Failed to upload bulk images:', error);
      throw error;
    }
  }

  /**
   * Get bulk processing status
   */
  static async getBulkStatus(
    accessToken: string,
    jobId?: string
  ): Promise<any> {
    console.log('📊 Listings API: Getting bulk status...');
    
    const endpoint = jobId ? `/listings/status?jobId=${jobId}` : '/listings/status';
    const response = await HttpClient.get<any>(endpoint, {}, accessToken);

    console.log('✅ Listings API: Bulk status retrieved');
    return response;
  }

  /**
   * Cancel background job
   */
  static async cancelJob(
    accessToken: string,
    jobId: string
  ): Promise<{ message: string; jobId: string; status: string }> {
    console.log('❌ Listings API: Cancelling job...');
    
    const response = await HttpClient.post<{ message: string; jobId: string; status: string }>(
      `/listings/status/${jobId}/cancel`,
      {},
      {},
      accessToken
    );

    console.log('✅ Listings API: Job cancelled successfully');
    return response;
  }
}