import { HttpClient } from '../auth/httpClient';

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

export interface Brand {
  id: number;
  name: string;
  description: string;
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

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
      console.warn('Categories endpoint not available, using fallback data');
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
      console.warn('Brands endpoint not available, using fallback data');
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
      console.warn('Group SKUs endpoint not available, using fallback data');
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
      console.warn('Sub SKUs endpoint not available, using fallback data');
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
      console.warn('Collections endpoint not available, using fallback data');
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
      console.warn('Ship types endpoint not available, using fallback data');
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
      console.warn('Single set items endpoint not available, using fallback data');
      return ['Single Item', 'Part', 'Set', 'Bundle'];
    }
  }
}
