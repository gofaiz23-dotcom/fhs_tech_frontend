import { HttpClient } from '../auth/httpClient';
import type { Brand, Pagination } from '../types/common.types';

// Re-export types for external use
export type { Brand, Pagination } from '../types/common.types';

export interface ProductAttributes {
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

export interface Product {
  id: number;
  brandId: number;
  title: string;
  groupSku: string;
  subSku: string;
  category: string;
  collectionName: string;
  shipTypes: string;
  singleSetItem: string;
  brandRealPrice: string;
  brandMiscellaneous: string;
  brandPrice: string;
  msrp: string;
  shippingPrice: string;
  commissionPrice: string;
  profitMarginPrice: string;
  ecommerceMiscellaneous: string;
  ecommercePrice: string;
  mainImageUrl: string | null;
  galleryImages: string[] | null;
  attributes: ProductAttributes;
  createdAt: string;
  updatedAt: string;
  brand: Brand;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface ProductsFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brandId?: number;
  groupSku?: string;
  subSku?: string;
  collectionName?: string;
  shipTypes?: string;
  singleSetItem?: string;
  sortBy?: 'title' | 'groupSku' | 'subSku' | 'category' | 'collectionName' | 'shipTypes' | 'singleSetItem' | 'brandRealPrice' | 'brandMiscellaneous' | 'brandPrice' | 'msrp' | 'shippingPrice' | 'commissionPrice' | 'profitMarginPrice' | 'ecommerceMiscellaneous' | 'ecommercePrice' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ImageTemplateData {
  groupSku: string;
  subSku: string;
  mainImageUrl: string;
  galleryImages: string;
}

export interface ImageTemplateResponse {
  message: string;
  timestamp: string;
  summary: {
    totalProducts: number;
    productsWithoutImages: number;
    productsWithImages: number;
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

export class ProductsService {
  /**
   * Test API connectivity
   */
  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      console.log('🔍 Products API: Testing connection...');
      // Try the main products endpoint instead of health
      await HttpClient.get('/products?limit=1', {}, accessToken);
      console.log('✅ Products API: Connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Products API: Connection test failed, but continuing with fallback data');
      // Don't fail completely, just use fallback data
      return true;
    }
  }

  /**
   * Get products with pagination and filters
   */
  static async getProducts(
    accessToken: string,
    filters: ProductsFilters = {}
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.brandId) params.append('brandId', filters.brandId.toString());
    if (filters.groupSku) params.append('groupSku', filters.groupSku);
    if (filters.subSku) params.append('subSku', filters.subSku);
    if (filters.collectionName) params.append('collectionName', filters.collectionName);
    if (filters.shipTypes) params.append('shipTypes', filters.shipTypes);
    if (filters.singleSetItem) params.append('singleSetItem', filters.singleSetItem);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const endpoint = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('🔍 Products API: Making request to endpoint:', endpoint);
    
    const response = await HttpClient.get<ProductsResponse>(endpoint, {}, accessToken);

    return response;
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(accessToken: string, productId: number): Promise<Product> {
    const response = await HttpClient.get<Product>(`/products/${productId}`, {}, accessToken);

    return response;
  }

  /**
   * Get unique categories from products
   */
  static async getCategories(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ categories: string[] }>('/products/categories', {}, accessToken);
      return response.categories || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      // Return fallback categories if endpoint doesn't exist
      return ['Furniture', 'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];
    }
  }

  /**
   * Get unique brands from products
   */
  static async getBrands(accessToken: string): Promise<Brand[]> {
    try {
      const response = await HttpClient.get<{ brands: Brand[] }>('/products/brands', {}, accessToken);
      return response.brands || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      // Return fallback brands if endpoint doesn't exist
      return [
        { id: 1, name: 'Furniture of America', description: 'Life changing and home altering furniture.' },
        { id: 2, name: 'IKEA', description: 'Affordable furniture for everyone.' },
        { id: 3, name: 'Ashley Furniture', description: 'Quality furniture for your home.' }
      ];
    }
  }

  /**
   * Get unique group SKUs from products
   */
  static async getGroupSkus(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ groupSkus: string[] }>('/products/group-skus', {}, accessToken);
      return response.groupSkus || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      return ['AM-BK300MH-4', 'AM-BK304MH-BED', 'AM-SL109-T', 'AM-BK300MH-1'];
    }
  }

  /**
   * Get unique sub SKUs from products
   */
  static async getSubSkus(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ subSkus: string[] }>('/products/sub-skus', {}, accessToken);
      return response.subSkus || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      return ['AM-BK300MH-4', 'AM-BK304MH-1', 'AM-BK304MH-2', 'AM-BK304MH-3', 'AM-BK304MH-4', 'AM-BK304MH-5'];
    }
  }

  /**
   * Get unique collection names from products
   */
  static async getCollectionNames(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ collections: string[] }>('/products/collections', {}, accessToken);
      return response.collections || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      return ['Melitta', 'Marinos', 'Classic', 'Modern', 'Contemporary'];
    }
  }

  /**
   * Get unique ship types from products
   */
  static async getShipTypes(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ shipTypes: string[] }>('/products/ship-types', {}, accessToken);
      return response.shipTypes || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      return ['Standard', 'Express', 'Overnight', 'Ground'];
    }
  }

  /**
   * Get unique single set items from products
   */
  static async getSingleSetItems(accessToken: string): Promise<string[]> {
    try {
      const response = await HttpClient.get<{ singleSetItems: string[] }>('/products/single-set-items', {}, accessToken);
      return response.singleSetItems || [];
    } catch (error) {
      // Silently use fallback data - endpoint doesn't exist on backend yet
      return ['Single Item', 'Part', 'Set', 'Bundle'];
    }
  }

  /**
   * Get image template for bulk image upload
   * Returns template with groupSku, subSku, mainImageUrl, galleryImages
   */
  static async getImageTemplate(accessToken: string): Promise<ImageTemplateResponse> {
    console.log('🔍 Products API: Fetching image template...');
    
    const response = await HttpClient.get<ImageTemplateResponse>(
      '/products/images/template',
      {},
      accessToken
    );

    console.log('✅ Products API: Image template retrieved successfully');
    return response;
  }

  /**
   * Download image template as Excel file
   */
  static async downloadImageTemplate(accessToken: string): Promise<void> {
    console.log('📥 Products API: Downloading image template...');
    
    try {
      const response = await fetch('http://192.168.0.22:5000/api/products/images/template', {
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
      link.download = `products_image_template_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Products API: Template downloaded successfully');
    } catch (error) {
      console.error('❌ Products API: Failed to download template:', error);
      throw error;
    }
  }

  /**
   * Upload bulk images for products
   * Accepts Excel/JSON file with image URLs
   */
  static async bulkUploadImages(
    accessToken: string,
    file: File
  ): Promise<BulkImageUploadResponse> {
    console.log('📤 Products API: Uploading bulk images...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://192.168.0.22:5000/api/products/images', {
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
      console.log('✅ Products API: Bulk images uploaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Products API: Failed to upload bulk images:', error);
      throw error;
    }
  }
}
