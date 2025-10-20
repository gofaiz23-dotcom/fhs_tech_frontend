import { HttpClient } from '../auth/httpClient';

export interface Brand {
  id: number;
  name: string;
}

export interface Listing {
  id: number;
  sku: string;
  title: string;
}

export interface InventoryItem {
  id: number;
  listingId: number;
  brandId: number;
  subSku: string;
  quantity: number;
  eta: string | null;
  createdAt: string;
  updatedAt: string;
  brand: Brand;
  listing: Listing;
}

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InventoryResponse {
  inventory: InventoryItem[];
  totalItems: number;
  userAccess?: {
    userId: number;
    role: string;
    email: string;
  };
  timestamp: string;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  eta?: string | null;
}

export interface BulkUpdateInventoryRequest {
  inventoryData: Array<{
    subSku: string;
    quantity?: number;
    eta?: string | null;
  }>;
}

export interface BulkUpdateInventoryResponse {
  message: string;
  summary: {
    total: number;
    updated: number;
    notFound: number;
    errors: number;
  };
  results: {
    updated: Array<any>;
    notFound: Array<any>;
    errors: Array<any>;
  };
  timestamp: string;
}

export interface BulkUpdateInventoryJobResponse {
  message: string;
  jobId: string;
  status: string;
  totalItems: number;
  estimatedTime: string;
  note: string;
  timestamp: string;
  fileInfo?: {
    originalName: string;
    storedName: string;
    path: string;
    size: number;
  };
}

export class InventoryService {
  /**
   * Get all inventory items (based on user access)
   */
  static async getInventory(accessToken: string): Promise<InventoryResponse> {
    try {
      console.log('🔍 Inventory API: Fetching inventory...');
      const response = await HttpClient.get<InventoryResponse>('/inventory', {}, accessToken);
      console.log('✅ Inventory API: Retrieved inventory successfully');
      return response;
    } catch (error) {
      console.error('❌ Inventory API: Error fetching inventory:', error);
      throw error;
    }
  }

  /**
   * Update a single inventory item
   */
  static async updateInventory(
    id: number,
    data: UpdateInventoryRequest,
    accessToken: string
  ): Promise<{ message: string; inventory: InventoryItem; timestamp: string }> {
    try {
      console.log('🔄 Inventory API: Updating inventory item:', id);
      const response = await HttpClient.put<{ message: string; inventory: InventoryItem; timestamp: string }>(
        `/inventory/${id}`,
        data,
        {},
        accessToken
      );
      console.log('✅ Inventory API: Updated inventory item successfully');
      return response;
    } catch (error) {
      console.error('❌ Inventory API: Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Bulk update inventory - JSON format
   */
  static async bulkUpdateInventory(
    data: BulkUpdateInventoryRequest,
    accessToken: string
  ): Promise<BulkUpdateInventoryResponse | BulkUpdateInventoryJobResponse> {
    try {
      console.log('📦 Inventory API: Bulk updating inventory...');
      const response = await HttpClient.post<BulkUpdateInventoryResponse | BulkUpdateInventoryJobResponse>(
        '/inventory/bulk/inventory/updates',
        data,
        {},
        accessToken
      );
      console.log('✅ Inventory API: Bulk update successful');
      return response;
    } catch (error) {
      console.error('❌ Inventory API: Error bulk updating inventory:', error);
      throw error;
    }
  }

  /**
   * Bulk update inventory - File upload (CSV/Excel)
   */
  static async bulkUpdateInventoryFile(
    file: File,
    accessToken: string,
    onProgress?: (progress: number) => void
  ): Promise<BulkUpdateInventoryResponse | BulkUpdateInventoryJobResponse> {
    try {
      console.log('📦 Inventory API: Uploading inventory file...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://192.168.0.22:5000/api/inventory/bulk/inventory/updates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Inventory API: File upload successful');
      return result;
    } catch (error) {
      console.error('❌ Inventory API: Error uploading file:', error);
      throw error;
    }
  }
}

