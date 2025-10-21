import { HttpClient } from '../auth/httpClient';
import type { Pagination } from '../types/common.types';

// Re-export types for external use
export type { Pagination } from '../types/common.types';

export interface ListingAttributes {
  origin?: string;
  weight_lb?: number;
  sub_category?: string;
  volume_cuft?: number;
  short_description?: string;
  shipping_width_in?: number;
  shipping_height_in?: number;
  shipping_length_in?: number;
  color?: string;
  style?: string;
  material?: string;
  feature_1?: string;
  feature_2?: string;
  feature_3?: string;
  feature_4?: string;
  feature_5?: string;
  feature_6?: string;
  feature_7?: string;
  product_dimension_inch?: string;
  [key: string]: any; // Allow any additional attributes
}

export interface Listing {
  id: number;
  brandId: number;
  brandName?: string;
  title: string;
  sku: string;
  subSku: string | null;
  category: string | null;
  collectionName: string | null;
  shipTypes: string | null;
  singleSetItem: string | null;
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
  productCounts: number | null;
  attributes: ListingAttributes;
  quantity?: number;
  status?: string;
  inventoryArray?: number[];
  brand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingsResponse {
  listings: Listing[];
  pagination: Pagination;
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
  sortBy?: string;
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
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const endpoint = `/listings${params.toString() ? `?${params.toString()}` : ''}`;
    
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
}

